import { useState, useCallback, useEffect } from 'react';
import * as dailyQuestService from '../services/dailyQuestService';
import { Task, UserData } from '../utils/helpers';
import { DailyQuest } from '../services/dailyQuestService';
import { Unsubscribe } from 'firebase/firestore';

export interface UseDailyQuestProps {
  tasks: Task[];
  userData: UserData;
  user: { uid: string } | null;
  handleUpdateSettings: (updates: Partial<UserData>) => Promise<void>;
  playSound: (soundName: string) => void;
}

export interface UseDailyQuestReturn {
  dailyQuest: DailyQuest | null;
  handleRefreshDailyQuest: () => void;
  handleCompleteDailyQuest: () => Promise<void>;
}

export const useDailyQuest = ({
  tasks,
  userData,
  user,
  handleUpdateSettings,
  playSound
}: UseDailyQuestProps): UseDailyQuestReturn => {
  const [dailyQuest, setDailyQuest] = useState<DailyQuest | null>(null);

  useEffect(() => {
    const unsubscribe: Unsubscribe = dailyQuestService.subscribeToDailyQuest(setDailyQuest, (err) =>
      console.error('Daily Quest Subscription Error:', err)
    );
    return () => unsubscribe();
  }, []);

  const handleRefreshDailyQuest = useCallback(() => {
    dailyQuestService
      .ensureDailyQuest(tasks, { model: userData.aiModel || userData.aiMode })
      .then(setDailyQuest)
      .catch((err) => console.error('Refresh Quest Error:', err));
  }, [tasks, userData.aiMode, userData.aiModel]);

  const handleCompleteDailyQuest = useCallback(async () => {
    if (!dailyQuest || dailyQuest.isCompleted || !user) return;
    
    playSound('complete');
    const reward = dailyQuest.rewardGold || 500;
    
    // Cập nhật phần thưởng cho user
    await handleUpdateSettings({ 
      ttGold: (userData.ttGold || 0) + reward,
      xp: (userData.xp || 0) + 100 
    });
    
    // Đánh dấu hoàn thành trên server
    await dailyQuestService.completeDailyQuest(dailyQuest, user.uid, userData.displayName || 'Bạn');
  }, [dailyQuest, user, userData, handleUpdateSettings, playSound]);

  return {
    dailyQuest,
    handleRefreshDailyQuest,
    handleCompleteDailyQuest
  };
};
