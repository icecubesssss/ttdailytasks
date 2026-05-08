import React from 'react';
import { TaskActionProvider } from '../../contexts/TaskActionContext';
import type { TaskActionReturn } from '../../hooks/useTaskActions';

interface AppProvidersProps {
  children: React.ReactNode;
  taskActions: TaskActionReturn;
}

export function AppProviders({ children, taskActions }: AppProvidersProps): React.ReactElement {
  return (
    <TaskActionProvider actions={taskActions}>
      {children}
    </TaskActionProvider>
  );
}
