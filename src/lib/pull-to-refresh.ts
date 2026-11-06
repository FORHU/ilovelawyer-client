/** How far the pull indicator travels at most, and how far a pull has to go to count as a refresh. */
export const PULL_MAX = 96;
export const PULL_THRESHOLD = 64;

const RESISTANCE = 0.5;

/** The indicator's travel for a finger that has moved `dy` px down: it follows the finger at half
 * speed and stops at PULL_MAX. Upward or zero movement is no pull. */
export function pullDistance(dy: number): number {
  if (!(dy > 0)) return 0;
  return Math.min(PULL_MAX, dy * RESISTANCE);
}

/** A pull only starts from the very top of the scroller, so a normal scroll back up never refreshes. */
export function canStartPull(scrollTop: number): boolean {
  return scrollTop <= 0;
}

export function reachedThreshold(distance: number): boolean {
  return distance >= PULL_THRESHOLD;
}
