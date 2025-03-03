import { formatDate, calculateLevel, calculateLevelProgress } from '@/utils/habitUtils';

interface ProgressDisplayProps {
  habits: { logs: string[] }[];
  totalXP: number;
  dailyXP: number;
  onLevelUp?: (previousLevel: number, currentLevel: number) => void;
}

export default function ProgressDisplay({
  habits,
  totalXP,
  dailyXP,
  onLevelUp
}: ProgressDisplayProps) {
  const today = formatDate(new Date());
  const currentLevel = calculateLevel(totalXP);
  const levelProgress = calculateLevelProgress(totalXP, currentLevel);
  
  const todayHabits = habits.filter(habit => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habit.logs.includes(todayStr);
  });
  
  const progressPercentage = habits.length > 0
    ? Math.round((todayHabits.length / habits.length) * 100)
    : 0;

  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {today}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Level {currentLevel} • {dailyXP} XP today
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {progressPercentage}% Complete
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {todayHabits.length} of {habits.length} habits
              </p>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Level Progress
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {levelProgress}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Today's Progress
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {progressPercentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-black dark:bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 