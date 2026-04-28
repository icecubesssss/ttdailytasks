/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, ReactNode } from 'react';
import { Task } from '../utils/helpers';

export interface TaskActionContextType {
  aiLoading: boolean;
  toggleTaskStatus: (
    id: string,
    action: 'start' | 'pause' | 'complete',
    options?: { completionSource?: 'manual' | 'auto_schedule' }
  ) => Promise<void>;
  handlePriorityChange: (id: string, currentPriority?: string) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  handleRenameTask: (taskId: string, newTitle: string) => Promise<void>;
  handleUpdateDeadline: (taskId: string, newDate: string | Date) => Promise<void>;
  handleSubTaskAction: (
    taskId: string,
    subId: string | null,
    type: 'add' | 'toggle' | 'rename' | 'delete',
    val?: string
  ) => Promise<void>;
  handleAiSubtasks: (taskId: string, title: string) => Promise<void>;
  handleUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

const TaskActionContext = createContext<TaskActionContextType | null>(null);

export function TaskActionProvider({ children, actions }: { children: ReactNode, actions: TaskActionContextType }) {
  return (
    <TaskActionContext.Provider value={actions}>
      {children}
    </TaskActionContext.Provider>
  );
}

export function useTaskActionContext() {
  const context = useContext(TaskActionContext);
  if (!context) {
    console.warn('useTaskActionContext called outside of TaskActionProvider');
    throw new Error('useTaskActionContext must be used within a TaskActionProvider');
  }
  return context;
}
