export type CreditStatus = "normal" | "warning" | "critical"

/**
 * Percentage of a case's included chat credits spent so far, rounded to a whole number. Unlike a
 * subscription plan's usage, this can never read over 100% — there's no way to spend more credits
 * than the case has. A top-up that pushes `remaining` above `included` reads as 0% (a fresh pool),
 * not negative; it doesn't add the top-up on top of the original baseline, since the API has no
 * concept of a case's all-time included total — only its current balance.
 */
export function creditsUsedPercent(remaining: number, included: number): number {
  if (included <= 0) return 0
  const used = Math.max(0, included - remaining)
  return Math.round((used / included) * 100)
}

/** normal under 80%, warning at 80-99%, critical at 100% — exactly when the case is out of
 * credits (ticket #49's thresholds, reinterpreted for per-case credits rather than a plan). */
export function creditsStatus(remaining: number, included: number): CreditStatus {
  const percent = creditsUsedPercent(remaining, included)
  if (percent >= 100) return "critical"
  if (percent >= 80) return "warning"
  return "normal"
}
