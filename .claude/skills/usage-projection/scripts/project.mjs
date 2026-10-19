#!/usr/bin/env node
// usage-projection: project a plan's token use and 5-hour-limit burn before running it.
//
//   node project.mjs history                 build ~/.claude/usage-projection/profile.json from transcripts
//   node project.mjs calibrate --percent 37 --resets-at 2026-10-18T05:20:00Z [--weekly-percent 56 --weekly-resets-at ...]
//   node project.mjs project <plan.json>     print the projection (JSON with --json)
//   node project.mjs bundle                  copy this machine's profile + calibration into the skill's data/ folder
//
// Cost is priced at API list rates and used only as a relative weight. Calibration turns
// "API-equivalent dollars" into "% of your 5-hour window" using the app's live usage meter.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PRICES = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'references', 'prices.json'), 'utf8'))
const CLAUDE = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
const PROJECTS = path.join(CLAUDE, 'projects')
const DATA = path.join(CLAUDE, 'usage-projection')
const PROFILE = path.join(DATA, 'profile.json')
const CALIB = path.join(DATA, 'calibration.json')
// Bundled copy shipped with the skill, used when this machine has no data yet (e.g. cloud sessions).
const SEED = path.join(HERE, '..', 'data')
const FIVE_H = 5 * 3600e3
const WEEK = 7 * 24 * 3600e3

const RIGOR = {
  1: { label: 'Mechanical', model: 'claude-haiku-5-5', effort: 'low' },
  2: { label: 'Routine', model: 'claude-sonnet-5-5', effort: 'medium' },
  3: { label: 'Substantive', model: 'claude-sonnet-5-5', effort: 'high' },
  4: { label: 'Judgment-critical', model: 'claude-opus-5-5', effort: 'high' },
  5: { label: 'Frontier', model: 'claude-fable-5-1', effort: 'high' },
}

const ORDER = ['haiku', 'sonnet', 'opus', 'fable']
const RANK = m => ORDER.findIndex(k => (m || '').includes(k))
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']
const lowerEffort = e => EFFORTS[Math.max(0, EFFORTS.indexOf(e) - 1)] || 'low'

// ---------- helpers ----------
const args = process.argv.slice(2)
const flag = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
const has = name => args.includes(`--${name}`)
const readJSON = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return def } }
const readData = (f, def) => readJSON(f, null) ?? readJSON(path.join(SEED, path.basename(f)), def)
const writeJSON = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v, null, 2)) }
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
const fmtK = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n))

function priceFor(model, promptTokens = 0) {
  const m = PRICES.models.find(p => new RegExp(p.match).test(model || '')) || PRICES.models[1]
  if (m.tierAt) return { ...(promptTokens > m.tierAt ? m.high : m.low), name: m.name, id: m.id }
  return m
}
function costOf(model, u) {
  const w1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0
  const w5 = (u.cache_creation_input_tokens ?? 0) - w1h // 5-minute writes, plus any write without a breakdown
  const inp = u.input_tokens ?? 0, read = u.cache_read_input_tokens ?? 0, out = u.output_tokens ?? 0
  const p = priceFor(model, inp + read + w1h + w5)
  return (inp * p.in + Math.max(w5, 0) * p.w5 + w1h * p.w1h + read * p.read + out * p.out) / 1e6
}
function resolveModel(name) {
  if (!name) return null
  const p = PRICES.models.find(m => new RegExp(m.match, 'i').test(name))
  return p ? p.id : name
}

function* transcriptFiles(dir) {
  let ents = []
  try { ents = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of ents) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* transcriptFiles(p)
    else if (e.name.endsWith('.jsonl')) yield p
  }
}

// One record per API call (transcripts repeat usage on every content block of a message).
function loadCalls() {
  const calls = new Map()
  const toolNames = new Map()
  const toolResults = []
  for (const f of transcriptFiles(PROJECTS)) {
    let text
    try { text = fs.readFileSync(f, 'utf8') } catch { continue }
    for (const line of text.split('\n')) {
      if (!line) continue
      let d
      try { d = JSON.parse(line) } catch { continue }
      const m = d.message
      if (!m) continue
      if (d.type === 'assistant' && m.usage) {
        for (const c of m.content || []) if (c.type === 'tool_use') toolNames.set(c.id, c.name)
        const key = (m.id || '') + '|' + (d.requestId || '')
        const prev = calls.get(key)
        const toolCount = (m.content || []).filter(c => c.type === 'tool_use').length
        if (prev) { prev.tools += toolCount; continue }
        calls.set(key, {
          t: Date.parse(d.timestamp), model: m.model, effort: d.effort || d.perTurnEffort || 'unknown',
          sidechain: !!d.isSidechain || f.includes(`${path.sep}subagents${path.sep}`), session: d.sessionId,
          u: m.usage, cost: costOf(m.model, m.usage), tools: toolCount,
        })
      } else if (d.type === 'user' && Array.isArray(m.content)) {
        for (const c of m.content) {
          if (c.type !== 'tool_result') continue
          const body = typeof c.content === 'string' ? c.content : JSON.stringify(c.content ?? '')
          toolResults.push({ id: c.tool_use_id, tokens: body.length / 4 })
        }
      }
    }
  }
  for (const r of toolResults) r.name = toolNames.get(r.id) || 'unknown'
  return { calls: [...calls.values()].filter(c => Number.isFinite(c.t)), toolResults }
}

// ---------- history ----------
function history() {
  const { calls, toolResults } = loadCalls()
  const byME = {}
  for (const c of calls) {
    const k = `${resolveModel(c.model)}|${c.effort}`
    ;(byME[k] ||= []).push(c)
  }
  const groups = Object.entries(byME).map(([k, cs]) => {
    const [model, effort] = k.split('|')
    return {
      model, effort, calls: cs.length,
      outPerCall: Math.round(median(cs.map(c => c.u.output_tokens || 0))),
      outPerCallMean: Math.round(mean(cs.map(c => c.u.output_tokens || 0))),
      writePerCall: Math.round(median(cs.map(c => c.u.cache_creation_input_tokens || 0))),
      contextPerCall: Math.round(median(cs.map(c => (c.u.cache_read_input_tokens || 0) + (c.u.cache_creation_input_tokens || 0) + (c.u.input_tokens || 0)))),
      costPerCall: +mean(cs.map(c => c.cost)).toFixed(4),
    }
  }).sort((a, b) => b.calls - a.calls)

  const byTool = {}
  for (const r of toolResults) (byTool[r.name] ||= []).push(r.tokens)
  const tools = Object.fromEntries(Object.entries(byTool)
    .map(([n, a]) => [n, { results: a.length, medianTokens: Math.round(median(a)), meanTokens: Math.round(mean(a)) }])
    .sort((a, b) => b[1].results - a[1].results))

  // Session start context: smallest prompt of the first main-thread call per session.
  const firstBySession = {}
  for (const c of calls) if (!c.sidechain && (!firstBySession[c.session] || c.t < firstBySession[c.session].t)) firstBySession[c.session] = c
  const baseContext = Math.round(median(Object.values(firstBySession).map(c =>
    (c.u.cache_read_input_tokens || 0) + (c.u.cache_creation_input_tokens || 0) + (c.u.input_tokens || 0))))
  const subFirst = {}
  for (const c of calls) if (c.sidechain) { const k = c.session + c.model; if (!subFirst[k] || c.t < subFirst[k].t) subFirst[k] = c }
  const subagentBase = Math.round(median(Object.values(subFirst).map(c =>
    (c.u.cache_read_input_tokens || 0) + (c.u.cache_creation_input_tokens || 0) + (c.u.input_tokens || 0)))) || 15000

  // Effort multipliers from your own data (output/call vs medium, same model), when there is enough.
  const effortMult = { ...PRICES.effortOutputMultiplier }
  delete effortMult.note
  const learned = {}
  for (const model of new Set(groups.map(g => g.model))) {
    const med = groups.find(g => g.model === model && g.effort === 'medium')
    if (!med || med.calls < 30) continue
    for (const g of groups) if (g.model === model && g.effort !== 'medium' && g.calls >= 30 && effortMult[g.effort])
      learned[g.effort] = +(g.outPerCallMean / Math.max(med.outPerCallMean, 1)).toFixed(2)
  }
  Object.assign(effortMult, learned)

  const profile = {
    built: new Date().toISOString(), calls: calls.length,
    sessions: Object.keys(firstBySession).length,
    baseContext: baseContext || 40000, subagentBase,
    outPerCall: Math.round(median(calls.filter(c => !c.sidechain).map(c => c.u.output_tokens || 0))) || 400,
    effortMult, effortLearnedFromHistory: Object.keys(learned),
    groups, tools,
  }
  writeJSON(PROFILE, profile)
  return profile
}

// ---------- calibrate ----------
function windowCost(calls, end, span) {
  const start = end - span, now = Date.now()
  return calls.filter(c => c.t >= start && c.t <= Math.min(end, now)).reduce((s, c) => s + c.cost, 0)
}
function calibrate() {
  const pct = +flag('percent'), resets = Date.parse(flag('resets-at'))
  if (!(pct > 0) || !Number.isFinite(resets)) throw new Error('need --percent <n> (>0) and --resets-at <ISO time>')
  const { calls } = loadCalls()
  const cal = readData(CALIB, { samples: [], weeklySamples: [] })
  const spent = windowCost(calls, resets, FIVE_H)
  const sample = { at: new Date().toISOString(), percent: pct, spentUSD: +spent.toFixed(4), usdPerPercent: +(spent / pct).toFixed(5) }
  if (pct >= 5 && spent > 0) cal.samples.push(sample)
  const wp = +flag('weekly-percent'), wr = Date.parse(flag('weekly-resets-at'))
  let weekly = null
  if (wp >= 5 && Number.isFinite(wr)) {
    const ws = windowCost(calls, wr, WEEK)
    weekly = { at: sample.at, percent: wp, spentUSD: +ws.toFixed(4), usdPerPercent: +(ws / wp).toFixed(5) }
    if (ws > 0) cal.weeklySamples.push(weekly)
  }
  cal.samples = cal.samples.slice(-20)
  cal.weeklySamples = (cal.weeklySamples || []).slice(-20)
  cal.usdPerPercent = cal.samples.length ? +median(cal.samples.map(s => s.usdPerPercent)).toFixed(5) : null
  cal.weeklyUsdPerPercent = cal.weeklySamples.length ? +median(cal.weeklySamples.map(s => s.usdPerPercent)).toFixed(5) : null
  cal.fiveHourCapUSD = cal.usdPerPercent ? +(cal.usdPerPercent * 100).toFixed(2) : null
  writeJSON(CALIB, cal)
  return { sample, weekly, usedSample: pct >= 5 && spent > 0, ...cal, samples: undefined, weeklySamples: undefined, sampleCount: cal.samples.length }
}

// ---------- project ----------
function simulateStep(step, ctx, sessionModel, profile) {
  const model = resolveModel(step.model) || sessionModel
  const effort = step.effort || 'medium'
  const turns = Math.max(1, Math.round(step.turns || 1))
  const mult = profile.effortMult[effort] ?? 1
  const outTotal = step.outputTokens ?? Math.round(turns * profile.outPerCall * mult)
  const newTotal = step.readTokens ?? 0
  const sub = !!step.subagent
  let c = sub ? (step.subagentBase ?? profile.subagentBase) : ctx
  let read = 0, write = 0, cost = 0, peak = 0
  // Switching the main session's model throws away the prompt cache: the whole context is rewritten once.
  const rebuild = !sub && model !== sessionModel
  if (rebuild) { const p = priceFor(model, c); cost += c * p.w1h / 1e6; write += c }
  if (sub) { const p = priceFor(model, c); cost += c * p.w1h / 1e6; write += c }
  const perTurnNew = newTotal / turns, perTurnOut = outTotal / turns
  for (let i = 0; i < turns; i++) {
    const p = priceFor(model, c)
    const w = perTurnNew + (i ? perTurnOut : 0)
    cost += (c * p.read + w * p.w1h + perTurnOut * p.out) / 1e6
    read += c; write += w
    c += perTurnNew + perTurnOut
    peak = Math.max(peak, c)
  }
  // A subagent's report lands in the main context.
  const report = sub ? (step.reportTokens ?? Math.min(3000, perTurnOut * 2 + 500)) : 0
  return {
    name: step.name, rigor: step.rigor, model, effort, turns, subagent: sub, rebuild,
    inputTokens: Math.round(read + write), outputTokens: outTotal, peakContext: Math.round(peak),
    cost, ctxAfter: sub ? ctx + report : c, sessionModel: sub ? sessionModel : model,
  }
}
function runPlan(plan, profile, mode) {
  let ctx = plan.startContext ?? profile.baseContext
  let sessionModel = resolveModel(plan.sessionModel) || 'claude-opus-5-5'
  const steps = []
  for (const s of plan.steps) {
    let step = { ...s }
    if (mode === 'baseline') step = { ...s, model: plan.sessionModel, effort: plan.sessionEffort || 'high', subagent: false }
    if (mode === 'recommended' && s.rigor && !s.model) step = { ...s, ...RIGOR[s.rigor], effort: s.effort || RIGOR[s.rigor].effort }
    let r = simulateStep(step, ctx, sessionModel, profile)
    // In the main thread a model switch re-caches the whole context. If the session model is at
    // least as capable, also try staying on it one effort level lower and keep whichever is cheaper.
    if (mode === 'recommended' && r.rebuild && !s.model && RANK(sessionModel) > RANK(step.model)) {
      const stay = simulateStep({ ...step, model: sessionModel, effort: s.effort || lowerEffort(step.effort) }, ctx, sessionModel, profile)
      if (stay.cost <= r.cost) r = { ...stay, stayed: true }
    }
    ctx = r.ctxAfter; sessionModel = r.sessionModel
    steps.push(r)
  }
  return steps
}
function project(file) {
  const plan = readJSON(file, null)
  if (!plan?.steps?.length) throw new Error(`no steps in ${file}`)
  const profile = readData(PROFILE, null) || history()
  const cal = readData(CALIB, {})
  const usdPerPct = plan.usdPerPercent ?? cal.usdPerPercent ?? null
  const steps = runPlan(plan, profile, 'recommended')
  const base = runPlan(plan, profile, 'baseline')
  const pct = c => usdPerPct ? +(c / usdPerPct).toFixed(1) : null
  const total = steps.reduce((s, r) => s + r.cost, 0), baseTotal = base.reduce((s, r) => s + r.cost, 0)
  const tokens = steps.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0)
  const lo = 0.7, hi = 1.5 // turn counts are guesses: show a range
  const out = {
    calibrated: !!usdPerPct, usdPerPercent: usdPerPct,
    steps: steps.map(r => ({ ...r, cost: +r.cost.toFixed(4), percent5h: pct(r.cost), ctxAfter: undefined, sessionModel: undefined })),
    total: { inputTokens: steps.reduce((s, r) => s + r.inputTokens, 0), outputTokens: steps.reduce((s, r) => s + r.outputTokens, 0), tokens, costUSD: +total.toFixed(4),
      percent5h: pct(total), percent5hRange: usdPerPct ? [pct(total * lo), pct(total * hi)] : null },
    baseline: { model: resolveModel(plan.sessionModel) || 'claude-opus-5-5', effort: plan.sessionEffort || 'high', costUSD: +baseTotal.toFixed(4), percent5h: pct(baseTotal),
      savingPercent: baseTotal ? Math.round((1 - total / baseTotal) * 100) : 0,
      underpoweredSteps: steps.filter(r => r.rigor && RANK(resolveModel(plan.sessionModel) || 'claude-opus-5-5') < RANK(RIGOR[r.rigor].model) && r.rigor >= 4).map(r => r.name) },
  }
  if (plan.currentPercent != null && usdPerPct) {
    const left = 100 - plan.currentPercent
    out.window = { currentPercent: plan.currentPercent, remainingPercent: left, resetsAt: plan.resetsAt ?? null,
      fits: out.total.percent5hRange[1] <= left ? 'yes' : out.total.percent5h <= left ? 'tight' : 'no',
      splitAfterStep: null }
    if (out.window.fits !== 'yes') {
      let acc = 0
      for (const s of out.steps) { acc += s.percent5h * hi; if (acc > left) break; out.window.splitAfterStep = s.name }
    }
  }
  return out
}
function printTable(o) {
  const unit = o.calibrated ? '% of 5h' : 'API $'
  const rows = o.steps.map((s, i) => [String(i + 1), s.name, s.rigor ? `R${s.rigor}` : '-',
    s.model.replace('claude-', '') + (s.subagent ? ' (sub)' : '') + (s.rebuild ? ' *' : '') + (s.stayed ? ' †' : ''), s.effort, String(s.turns),
    fmtK(s.inputTokens), fmtK(s.outputTokens), o.calibrated ? s.percent5h + '%' : '$' + s.cost.toFixed(3)])
  const head = ['#', 'Step', 'Rigor', 'Model', 'Effort', 'Turns', 'In tok', 'Out tok', unit]
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)))
  const line = r => r.map((c, i) => c.padEnd(w[i])).join('  ')
  console.log(line(head)); console.log(w.map(n => '-'.repeat(n)).join('  '))
  rows.forEach(r => console.log(line(r)))
  const t = o.total
  console.log(`\nTotal: ${fmtK(t.tokens)} tokens (${fmtK(t.inputTokens)} in / ${fmtK(t.outputTokens)} out), API-equivalent $${t.costUSD.toFixed(3)}`)
  if (o.calibrated) console.log(`5-hour window: ~${t.percent5h}% (range ${t.percent5hRange[0]}–${t.percent5hRange[1]}%)`)
  else console.log('5-hour window: not calibrated yet — run `calibrate` with the app\'s live 5-hour percent.')
  const b = o.baseline, bCost = o.calibrated ? b.percent5h + '%' : '$' + b.costUSD.toFixed(3)
  if (b.savingPercent >= 0) console.log(`Versus everything on ${b.model.replace('claude-', '')} / ${b.effort}: ${bCost} (saves ${b.savingPercent}%)`)
  else console.log(`Versus everything on ${b.model.replace('claude-', '')} / ${b.effort}: ${bCost}. This plan costs ${-b.savingPercent}% more` +
    (b.underpoweredSteps.length ? ` because ${b.underpoweredSteps.length} judgment-critical step(s) need a stronger model than the session's: ${b.underpoweredSteps.join(', ')}. Cheaper option: start the task on that model and delegate the routine steps down.` : '.'))
  if (o.window) console.log(`Window now ${o.window.currentPercent}% used, ${o.window.remainingPercent}% left → fits: ${o.window.fits}` +
    (o.window.splitAfterStep ? `; safe to run through "${o.window.splitAfterStep}" then wait for reset${o.window.resetsAt ? ' (' + o.window.resetsAt + ')' : ''}` : ''))
  if (o.steps.some(s => s.stayed)) console.log('† stays on the stronger session model at one effort lower: cheaper than switching models and re-caching the context, and quality is equal or better.')
  if (o.steps.some(s => s.rebuild)) console.log('* model switch in the main session: the full context is re-cached once at the new model\'s write price.')
}

// ---------- main ----------
try {
  const cmd = args[0]
  if (cmd === 'history') { const p = history(); console.log(JSON.stringify({ ...p, groups: p.groups.slice(0, 12), tools: Object.fromEntries(Object.entries(p.tools).slice(0, 15)) }, null, 2)) }
  else if (cmd === 'calibrate') console.log(JSON.stringify(calibrate(), null, 2))
  else if (cmd === 'bundle') {
    fs.mkdirSync(SEED, { recursive: true })
    for (const f of [PROFILE, CALIB]) if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(SEED, path.basename(f))); console.log('bundled', path.basename(f)) }
  }
  else if (cmd === 'project') { const o = project(args[1]); has('json') ? console.log(JSON.stringify(o, null, 2)) : printTable(o) }
  else { console.error('usage: project.mjs history | bundle | calibrate --percent N --resets-at ISO | project plan.json [--json]'); process.exit(2) }
} catch (e) { console.error('error:', e.message); process.exit(1) }
