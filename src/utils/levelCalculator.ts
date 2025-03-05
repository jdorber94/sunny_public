/**
 * Calculate user level based on total XP
 * Level progression follows a square root curve to make early levels easier to achieve
 * @param xp Total experience points
 * @returns Current level
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
} 