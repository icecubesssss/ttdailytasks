import React from 'react';
import { TaskProvider } from '../../contexts/TaskContext';
import { UserProvider } from '../../contexts/UserContext';
import { TaskActionProvider } from '../../contexts/TaskActionContext';
import type { TaskActionReturn } from '../../hooks/useTaskActions';

interface AppProvidersProps {
  children: React.ReactNode;
  taskActions: TaskActionReturn;
}

export function AppProviders({ children, taskActions }: AppProvidersProps): React.ReactElement {
  return (
    <TaskProvider>
      <UserProvider>
        <TaskActionProvider actions={taskActions}>
          {children}
        </TaskActionProvider>
      </UserProvider>
    </TaskProvider>
  );
}
