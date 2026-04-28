import { useState, useCallback } from 'react';
import * as aiService from '../services/aiService';
import { Task, UserData } from '../utils/helpers';

interface UseAiActionsProps {
  tasks: Task[];
  userData: UserData;
}

interface UseAiActionsReturn {
  isSummarizing: boolean;
  aiReport: string;
  handleSummarize: () => Promise<void>;
  setAiReport: React.Dispatch<React.SetStateAction<string>>;
}

export const useAiActions = ({ tasks, userData }: UseAiActionsProps): UseAiActionsReturn => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiReport, setAiReport] = useState("");

  const handleSummarize = useCallback(async () => {
    if (tasks.length === 0) return;
    setIsSummarizing(true);
    try {
      const res = await aiService.generateTaskSummary(tasks, userData);
      setAiReport(res);
    } catch (e) {
      console.error("AI Summarize error:", e);
    } finally {
      setIsSummarizing(false);
    }
  }, [tasks, userData]);

  return {
    isSummarizing,
    aiReport,
    handleSummarize,
    setAiReport
  };
};
