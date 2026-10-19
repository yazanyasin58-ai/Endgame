---
name: usage-projection
description: Projects a planned task's usage BEFORE it runs. Gives tokens per step, the total share of the 5-hour plan limit (calibrated to the user's live usage meter), and whether it fits the remaining window. Assigns each step a rigor tier and recommends the cheapest model and effort that keep quality. Use after a planning phase, or when the user says "project usage", "how much will this cost", "will this fit my limit", "estimate tokens for this plan", "which model/effort should I use", or /usage-projection.
---

# Usage Projection

Run this **after a plan exists and before executing it**. It outputs:

1. A per-step table: rigor tier, recommended model and effort, turns, input/output tokens, and % of the 5-hour window.
2. The total, as a range, and whether it fits what's left in the current window (with a split point if not).
3. A comparison with running everything on the session's current model and effort, so the saving is visible.

The script does all the arithmetic, so don't do the sums in your head. Your job is to break the plan into steps and estimate each one honestly.

Script: `node ~/.claude/skills/usage-projection/scripts/project.mjs` (Node 18+). Data is kept in `~/.claude/usage-projection/`.

## Step 1: Get the plan

Use the plan from this conversation: the task list, plan-mode output, or a plan file. If there isn't one, ask the user for it, or draft a short plan and confirm it. Don't invent scope.

## Step 2: Refresh calibration (each time, it takes seconds)

1. If `get_usage` (`mcp__ccd_session_mgmt__get_usage`) is available (load it with ToolSearch if it's deferred), read the plan's `5-hour limit` `percentUsed` and `resetsAt`, plus the weekly ones. Outside the desktop app, ask the user for the numbers `/usage` shows.
2. Run:
   `node …/project.mjs calibrate --percent <5h %> --resets-at <ISO> [--weekly-percent <%> --weekly-resets-at <ISO>]`
   Samples under 5% are skipped as too noisy. The median of the last 20 samples is used, so accuracy improves with use.
3. If `~/.claude/usage-projection/profile.json` is missing or more than 7 days old, run `node …/project.mjs history`. It learns your typical output per turn, your effort multipliers, your session's starting context, and tool-output sizes from your transcripts.

**Cloud sessions / other machines:** the skill ships a copy of the profile and calibration in `data/`. When `~/.claude/usage-projection/` is empty, the script uses that copy, so don't run `history` there (it would learn from an empty machine). With no `get_usage`, ask for the `/usage` numbers and pass `currentPercent`/`resetsAt` in the plan JSON, but skip `calibrate`, because the cloud machine can't see your other sessions. To refresh the copy, run `node …/project.mjs bundle` on the Mac and commit `data/` again.

**Calibration caveat (tell the user once):** it only counts Claude Code transcripts on this machine. Usage from claude.ai chat, the phone, or another computer in the same window makes the limit look bigger than it is. If the user says they used other surfaces in this window, skip the calibration sample.

## Step 3: Break the plan into steps and rate the rigor

Read `references/rigor.md`. For each step, decide:

- `rigor` 1–5. Rate by the hardest decision in the step, not its size, and apply the guardrails there. **Never downgrade R4/R5.**
- `turns`: assistant API calls (see the heuristics table in rigor.md).
- `readTokens`: everything new that enters context during the step (tool outputs, files read, pasted text). Use the `tools` medians in profile.json.
- `subagent: true` when an R1–R2 step can be delegated with the Agent tool's `model` parameter. This is usually the best saving, because the subagent starts from a small context instead of the full conversation.
- Leave `model`/`effort` empty so the tier default applies. Set them only to override with a reason (for example, the user wants Opus throughout).

Write the plan to the scratchpad (or a temp file) as JSON:

```json
{
  "sessionModel": "claude-opus-5-5",
  "sessionEffort": "high",
  "currentPercent": 37,
  "resetsAt": "2026-10-18T05:20:00Z",
  "steps": [
    { "name": "Map the codebase", "rigor": 1, "turns": 6, "readTokens": 25000, "subagent": true },
    { "name": "Design the data model", "rigor": 4, "turns": 4, "readTokens": 4000 },
    { "name": "Implement endpoints", "rigor": 3, "turns": 14, "readTokens": 20000 },
    { "name": "Write tests", "rigor": 2, "turns": 8, "readTokens": 6000, "subagent": true },
    { "name": "Run tests & fix", "rigor": 3, "turns": 9, "readTokens": 8000 },
    { "name": "Final review", "rigor": 4, "turns": 4, "readTokens": 5000 }
  ]
}
```

Optional per step: `outputTokens` (otherwise profile output per turn × effort multiplier), `reportTokens` (a subagent's summary back to the main context, default up to 3k). At plan level, `startContext` defaults to the current context size if you know it (get_usage `context.tokensUsed`), or else the profile's median session start.

## Step 4: Run it and present it

`node …/project.mjs project <plan.json>`. Add `--json` if you need the raw numbers.

Show the user:

1. The table (keep the script's columns).
2. One line each for: total % of the 5-hour window with its range, whether it fits, and the saving versus the baseline.
3. **Model routing**: which steps go to a subagent or a separate session, and on what model. Flag any `*` model-switch rows and say whether the switch pays off.
4. If it doesn't fit: the split point the script gives ("run through step N, then continue after the reset at T"). Offer to defer the rest. Never offer to downgrade R4/R5 steps.
5. Rigor notes: one short reason for any step rated R4/R5, and for any step you put below where the user might expect.

Keep it short. The table carries the detail.

## Step 5: Execute (if the user approves)

Follow the routing. Delegate R1–R2 subagent steps with `model: "haiku"` / `"sonnet"`. Escalate a step one tier only if it fails its check twice. At the end, offer to run `calibrate` again so the next projection gets more accurate. Compare projected with actual if the user wants.

## Assumptions to be honest about

- Plan-limit burn is assumed to scale with API list prices (references/prices.json). Calibration fixes the overall scale, not the relative weights between models.
- Turn counts are estimates, which is why the total is shown as a 0.7×–1.5× range.
- Context grows with every turn, so late steps in a long session cost more than the same step in a fresh one. The script models this; mention it when a fresh session would be clearly cheaper.
