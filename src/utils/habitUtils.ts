/**
 * Calculates the current streak for a habit based on its logs
 * @param logs Array of ISO date strings representing completed days
 * @returns The current streak count
 */
export function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;

  // Sort logs in descending order
  const sortedLogs = [...logs].sort((a, b) => b.localeCompare(a));
  
  // Get today and yesterday's dates
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // If neither today nor yesterday is logged, streak is 0
  if (!logs.includes(todayStr) && !logs.includes(yesterdayStr)) {
    return 0;
  }
  
  let streak = 0;
  let currentDate = new Date(sortedLogs[0]);
  
  // Count consecutive days
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i]);
    
    if (i === 0) {
      streak = 1;
      continue;
    }
    
    const dayDiff = Math.floor(
      (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (dayDiff === 1) {
      streak++;
      currentDate = logDate;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Calculates the completion percentage for a set of habits
 * @param habits Array of habits to calculate completion for
 * @returns Percentage of habits completed today
 */
export function calculateCompletionPercentage(habits: { logs: string[] }[]): number {
  if (!habits.length) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(habit => 
    habit.logs.includes(today)
  ).length;
  
  return Math.round((completedToday / habits.length) * 100);
}

/**
 * Formats a date as a readable string
 * @param date Date to format
 * @returns Formatted date string (e.g., "Monday, January 1")
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculates the level based on total XP
 * @param xp Total XP
 * @returns Current level
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculates XP required for the next level
 * @param currentLevel Current level
 * @returns XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * Calculates progress towards next level
 * @param xp Current XP
 * @param currentLevel Current level
 * @returns Progress percentage towards next level
 */
export function calculateLevelProgress(xp: number, currentLevel: number): number {
  const nextLevelXP = xpForNextLevel(currentLevel);
  const currentLevelXP = xpForNextLevel(currentLevel - 1);
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  
  return Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
} 