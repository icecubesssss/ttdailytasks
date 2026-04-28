import React from 'react';
import { AnimatePresence } from 'framer-motion';
import FocusView from '../focus/FocusView';
import ClosetView from '../shop/ClosetView.jsx';
import DuoFocusBanner from '../focus/DuoFocusBanner.jsx';
import Modal from '../../shared/Modal.jsx';
import type { Task, UserData, LevelInfo, TeamMember } from '../../utils/helpers';

type PartnerInfo = TeamMember | { displayName: string; email: string; avatarConfig?: unknown };

interface FocusViewProps {
  task?: Task;
  now: number;
  userData: UserData;
  triggerSystemFocus: (shortcutName: string) => void;
  partnerTask?: Task;
  partnerInfo?: PartnerInfo;
}

const FocusViewTyped = FocusView as React.ComponentType<FocusViewProps>;

interface AppOverlaysProps {
  isClosetOpen: boolean;
  setIsClosetOpen: (value: boolean) => void;
  theme: 'dark' | 'light';
  userData: UserData;
  levelInfo: LevelInfo;
  userEmail?: string;
  handleEquipItem: (category: string, val: any) => void;
  focusingTaskId?: string | null;
  tasks: Task[];
  now: number;
  toggleTaskStatus: (id: string, action: 'start' | 'pause' | 'complete') => Promise<void>;
  onSubTaskToggle: (
    taskId: string,
    subId: string,
    type: 'toggle' | 'rename' | 'delete' | 'add',
    val?: string
  ) => Promise<void>;
  onSubTaskAdd: (
    taskId: string,
    subId: string | null,
    type: 'add',
    val: string
  ) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  triggerSystemFocus: (shortcutName: string) => void;
  partnerTask?: Task;
  partnerInfo?: PartnerInfo;
}

function AppOverlays({
  isClosetOpen,
  setIsClosetOpen,
  theme,
  userData,
  levelInfo,
  userEmail,
  handleEquipItem,
  focusingTaskId,
  tasks,
  now,
  toggleTaskStatus,
  onSubTaskToggle,
  onSubTaskAdd,
  onUpdateTask,
  triggerSystemFocus,
  partnerTask,
  partnerInfo
}: AppOverlaysProps): React.ReactElement {
  return (
    <>
      <Modal open={isClosetOpen} onClose={() => setIsClosetOpen(false)} isDark={theme === 'dark'}>
        <ClosetView
          userData={userData}
          levelInfo={levelInfo}
          isDark={theme === 'dark'}
          userEmail={userEmail}
          onEquipItem={handleEquipItem}
          onClose={() => setIsClosetOpen(false)}
        />
      </Modal>

      {focusingTaskId && (
        <FocusViewTyped
          task={tasks.find((t) => t.id === focusingTaskId)}
          now={now}
          userData={userData}
          triggerSystemFocus={triggerSystemFocus}
          partnerTask={partnerTask}
          partnerInfo={partnerInfo}
        />
      )}

      <AnimatePresence>
        {partnerTask && partnerInfo && !focusingTaskId && (
          <DuoFocusBanner
            task={partnerTask}
            partnerInfo={partnerInfo}
            now={now}
            isDark={userData.isDarkMode}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(AppOverlays);
