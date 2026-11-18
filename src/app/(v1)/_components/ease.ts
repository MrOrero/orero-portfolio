/**
 * v1's one curve: a hard, mechanical in-out, like a stepper motor taking up slack.
 * Paper moves in whole dot rows (see FEED_STEP), never smoothly.
 */
export const EASE_R = [0.76, 0, 0.18, 1] as const;
/** Paper feeds in rows of this many CSS pixels. */
export const FEED_STEP = 3;
