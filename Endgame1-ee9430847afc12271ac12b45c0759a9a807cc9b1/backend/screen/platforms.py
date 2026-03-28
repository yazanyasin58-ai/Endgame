from __future__ import annotations

# Platform-specific Claude Vision prompt templates.
# Each prompt tells Claude exactly what to look for on that platform's UI.

PLATFORM_PROMPTS: dict[str, str] = {
    "tradovate": """
You are analysing a Tradovate trading platform screenshot.

Look for and extract:
1. Order ticket: Is one open? If yes, what is the quantity/contracts field showing?
2. Account P&L: What is the daily P&L showing? (Look for "Daily P&L", "Day P&L", or similar)
3. Open positions: Are there any open positions? If so, what is the unrealised P&L?
4. Position: Is there an existing open position in the same instrument as the order ticket?

Return ONLY valid JSON:
{
  "order_ticket_open": true/false,
  "detected_order_size": <number or null>,
  "detected_pnl": <number or null>,
  "position_open": true/false,
  "adding_to_position": true/false,
  "confidence": <0.0-1.0>
}
""",

    "tradelocker": """
You are analysing a TradeLocker / HeroFX trading platform screenshot.

Look for and extract:
1. Order panel: Is a buy/sell order being prepared? If yes, what lot size is shown?
2. Account equity/P&L: What is the floating P&L or daily P&L showing?
3. Open trades panel: Are there open trades? Is the user about to add to one?

Return ONLY valid JSON:
{
  "order_ticket_open": true/false,
  "detected_order_size": <lot size as number or null>,
  "detected_pnl": <number or null>,
  "position_open": true/false,
  "adding_to_position": true/false,
  "confidence": <0.0-1.0>
}
""",

    "topstepx": """
You are analysing a TopstepX (Project X) trading platform screenshot.

Look for and extract:
1. Order entry: Is an order ticket visible? What contract quantity is shown?
2. P&L display: What is the current P&L or drawdown showing?
3. Positions: Are there open positions?

Return ONLY valid JSON:
{
  "order_ticket_open": true/false,
  "detected_order_size": <number or null>,
  "detected_pnl": <number or null>,
  "position_open": true/false,
  "adding_to_position": true/false,
  "confidence": <0.0-1.0>
}
""",

    "tradesea": """
You are analysing a Tradesea / Lucid trading platform screenshot.

Look for and extract:
1. Order entry area: Is an order being placed? What size/contracts is shown?
2. Account P&L: What daily P&L or balance is visible?
3. Open positions: Any open positions showing?

Return ONLY valid JSON:
{
  "order_ticket_open": true/false,
  "detected_order_size": <number or null>,
  "detected_pnl": <number or null>,
  "position_open": true/false,
  "adding_to_position": true/false,
  "confidence": <0.0-1.0>
}
""",

    "default": """
You are analysing a trading platform screenshot.

Look for and extract:
1. Order entry: Is there an active order being placed? What size?
2. P&L: What P&L is visible?
3. Open positions: Any visible?

Return ONLY valid JSON:
{
  "order_ticket_open": true/false,
  "detected_order_size": <number or null>,
  "detected_pnl": <number or null>,
  "position_open": true/false,
  "adding_to_position": true/false,
  "confidence": <0.0-1.0>
}
""",
}


def get_prompt(platform: str) -> str:
    return PLATFORM_PROMPTS.get(platform, PLATFORM_PROMPTS["default"])
