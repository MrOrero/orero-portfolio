/** v2's one curve: a long, silky expo-out, like a card sliding off the top of a deck. */
export const EASE_F = [0.16, 1, 0.3, 1] as const;
/** Spring used wherever a card is held and let go. */
export const SPRING_F = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;
