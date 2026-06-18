export interface XpGainResult {
  xp: number;
  level: number;
  leveledUp: boolean;
}

/**
 * Nalicza XP i obsługuje awanse poziomów. Próg na kolejny poziom = level * 100.
 * Wydzielone z kontrolera, żeby dało się to pokryć testami jednostkowymi.
 */
export function processXpGain(
  currentXp: number,
  currentLevel: number,
  xpGained: number,
): XpGainResult {
  let xp = currentXp + xpGained;
  let level = currentLevel;
  let leveledUp = false;

  let xpNeeded = level * 100;
  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
    leveledUp = true;
    xpNeeded = level * 100;
  }

  return { xp, level, leveledUp };
}
