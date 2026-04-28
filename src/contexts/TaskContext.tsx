/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '../utils/helpers';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTask: (updated: Partial<Task> & { id: string }) => void;
  onSubTaskToggle: (parentId: string, subId: string) => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const useTaskContext = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return ctx;
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const findTask = useCallback((id: string): Task | null => tasks.find((t) => t.id === id) || null, [tasks]);

  const onStart = useCallback((id: string) => {
    const task = findTask(id);
    if (task) {
      task.status = 'running';
      setTasks([...tasks]);
    }
  }, [tasks, findTask]);

  const onPause = useCallback((id: string) => {
    const task = findTask(id);
    if (task) {
      task.status = 'paused';
      setTasks([...tasks]);
    }
  }, [tasks, findTask]);

  const onDelete = useCallback((id: string) => {
    const remove = (list: Task[]): Task[] =>
      list.filter((t) => {
        if (t.id === id) return false;
        return true;
      });
    setTasks(remove(tasks));
  }, [tasks]);

  const onUpdateTask = useCallback((updated: Partial<Task> & { id: string }) => {
    const update = (list: Task[]): Task[] =>
      list.map((t) => {
        if (t.id === updated.id) return { ...t, ...updated };
        return t;
      });
    setTasks(update(tasks));
  }, [tasks]);

  const onSubTaskToggle = useCallback((parentId: string, subId: string) => {
    const parent = findTask(parentId);
    if (!parent || !parent.subTasks) return;
    parent.subTasks = parent.subTasks.map((st) =>
      st.id === subId ? { ...st, isDone: !st.isDone } : st
    );
    setTasks([...tasks]);
  }, [tasks, findTask]);

  const value: TaskContextType = {
    tasks,
    setTasks,
    onStart,
    onPause,
    onDelete,
    onUpdateTask,
    onSubTaskToggle,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
