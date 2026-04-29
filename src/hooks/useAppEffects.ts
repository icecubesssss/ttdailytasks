import { useEffect, useRef } from 'react';
import { Task, UserData } from '../utils/helpers';
import { DailyQuest } from '../services/dailyQuestService';
import * as dailyQuestService from '../services/dailyQuestService';

interface UseAppEffectsProps {
  userData: UserData;
  tasks: Task[];
  dailyQuest: DailyQuest | null;
  playSound: (sound: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ignoreAsyncError = () => undefined;

export const useAppEffects = ({
  userData,
  tasks,
  dailyQuest,
  playSound,
  setTheme
}: UseAppEffectsProps): void => {
  const streakMilestonesRef = useRef([7, 30]);
  const previousStreakRef = useRef<number | null>(null);

  useEffect(() => {
    setTheme(userData.isDarkMode ? 'dark' : 'light');
  }, [userData.isDarkMode, setTheme]);

  useEffect(() => {
    if (!userData.isLoaded || !tasks.length) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (dailyQuest?.dateKey === todayKey) return;
    dailyQuestService.ensureDailyQuest(tasks).catch(ignoreAsyncError);
  }, [userData.isLoaded, tasks, dailyQuest?.dateKey]);

  useEffect(() => {
    if (!userData.isLoaded) return;
    const currentStreak = userData.streak || 0;
    const previousStreak = previousStreakRef.current;

    if (previousStreak !== null && currentStreak > previousStreak) {
      const hitMilestone = streakMilestonesRef.current.find(
        (milestone) => previousStreak < milestone && currentStreak >= milestone
      );

      if (hitMilestone) {
        import('canvas-confetti').then(({ default: confetti }) => {
          confetti({
            particleCount: 220,
            spread: 85,
            origin: { y: 0.55 },
            colors: ['#f59e0b', '#fb7185', '#a855f7', '#22d3ee']
          });
        });
        playSound('complete');
      }
    }

    previousStreakRef.current = currentStreak;
  }, [userData.isLoaded, userData.streak, playSound]);
};
