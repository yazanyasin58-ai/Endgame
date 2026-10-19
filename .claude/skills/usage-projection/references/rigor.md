# Rigor tiers: matching model and effort to each step

The principle: **quality is set by the hardest decision in a step, not by its size.** Rate every step
by the judgment it needs, then give it the cheapest model/effort that still reliably gets that
judgment right. Big-but-easy work goes down; small-but-subtle work stays up.

| Tier | Name | What the step needs | Default model / effort | Typical steps |
|---|---|---|---|---|
| R1 | Mechanical | No judgment: the instructions are complete and the output is easy to check | Haiku 5.5 / low | Grep/glob sweeps, listing files, renames, formatting, running tests or builds and reporting results, copying a known pattern 1:1 |
| R2 | Routine | Light judgment, inside a pattern that is already set | Sonnet 5.5 / medium | Boilerplate, docs and READMEs, simple scripts, CRUD endpoints that follow an existing one, writing tests for a spec you already have |
| R3 | Substantive | Real reasoning, but the problem is well bounded | Sonnet 5.5 / high | Multi-file features with a clear design, debugging a localized failure, refactors, code review for correctness |
| R4 | Judgment-critical | Mistakes are expensive or subtle; ambiguity has to be resolved | Opus 5.5 / high (xhigh when it's very subtle) | Architecture and design, security/auth/payments/data migrations, concurrency, ambiguous requirements, the final check of R3+ work |
| R5 | Frontier | Opus has already failed at it, or it's genuinely novel or hard | Fable 5.1 / high (max only on retry) | Hard algorithms, deep cross-system debugging after an Opus attempt failed, research-grade reasoning |

## Guardrails (these protect quality)

1. **Never downgrade R4/R5** to save usage. If a projection doesn't fit the window, split the work across windows rather than downgrade.
2. **When unsure between two tiers, take the higher one.**
3. **Verification is at least the tier of the riskiest step it checks.** The exception is purely mechanical checks (do the tests pass, does it build), which can stay R1.
4. **Planning and design always run at the plan's highest tier.** A cheap model executing a good plan beats an expensive one executing a bad one.
5. **Effort before model.** Within a model, dropping effort one level usually costs less quality than dropping a model tier. For R3, try Sonnet/high before Opus/medium.
6. **Escalate on failure, don't pre-pay.** Run R3 work on Sonnet. If it fails a check twice, rerun that one step on Opus.

## How to actually route a step in Claude Code

- **Subagent (preferred for R1–R2 inside an Opus/Fable session):** delegate with the Agent tool's `model` parameter (`haiku` / `sonnet`). It starts from a small fresh context and returns only a short report, which also keeps the main context from growing.
- **Separate session:** for a long R1–R3 stretch, start a new session on the cheaper model with a self-contained brief.
- **Switching the main session's model mid-task** re-caches the whole context at the new model's price once. It's only worth it when the remaining work on the cheaper model is long; the projection marks these with `*`.
- **Effort** can be changed for the session (`/effort`, or the desktop app's model picker), or set per subagent when the harness supports it.

## Turn-count heuristics (assistant API calls per step)

| Step kind | Turns |
|---|---|
| Single targeted edit | 2–3 |
| Read 3–5 files + edit | 5–8 |
| Multi-file feature | 10–25 |
| Debug loop (run → read → fix) | 3 per iteration × expected iterations (usually 2–4) |
| Web research (per question) | 3–6 |
| Browser-driven check | 4–10 (screenshots and page dumps are 10–20k tokens each) |
| Review / verification pass | 3–6 |

Use the `tools` medians from `profile.json` for `readTokens`, e.g. Bash output, Read of a file
(≈ lines × 12 tokens), or a browser batch (≈ 15k). Add the user's pasted content and any docs you'll read.
