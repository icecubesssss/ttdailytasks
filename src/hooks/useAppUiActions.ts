import { useCallback } from 'react';
import { UserData } from '../utils/helpers';

interface UseAppUiActionsProps {
  playSound: (sound: string) => void;
  setHasUserSelectedTab: (val: boolean) => void;
  setCurrentTab: (tab: string) => void;
  setFilterMode: (mode: string) => void;
  userData: UserData;
  setUserData: (data: UserData) => void;
  handleUpdateSettings: (updates: Partial<UserData>) => void;
}

interface UseAppUiActionsReturn {
  handleTabChange: (tab: string) => void;
  handleFilterModeChange: (mode: string) => void;
  handleToggleDarkMode: () => void;
  handleRenameMascot: () => void;
  handleChangeMascotAvatar: () => void;
}

export const useAppUiActions = ({
  playSound,
  setHasUserSelectedTab,
  setCurrentTab,
  setFilterMode,
  userData,
  setUserData,
  handleUpdateSettings
}: UseAppUiActionsProps): UseAppUiActionsReturn => {
  const handleTabChange = useCallback((tab: string) => {
    playSound('click');
    setHasUserSelectedTab(true);
    setCurrentTab(tab);
  }, [playSound, setHasUserSelectedTab, setCurrentTab]);

  const handleFilterModeChange = useCallback((mode: string) => {
    playSound('click');
    setFilterMode(mode);
  }, [playSound, setFilterMode]);

  const handleToggleDarkMode = useCallback(() => {
    setUserData({ ...userData, isDarkMode: !userData.isDarkMode });
  }, [setUserData, userData]);

  const handleRenameMascot = useCallback(() => {
    const nextName = window.prompt('Đặt tên mới cho Mascot AI:', userData.mascotName || 'Mochi');
    if (!nextName?.trim()) return;
    handleUpdateSettings({ mascotName: nextName.trim() });
  }, [handleUpdateSettings, userData.mascotName]);

  const handleChangeMascotAvatar = useCallback(() => {
    const nextAvatar = window.prompt('Đổi avatar mascot (emoji hoặc URL):', userData.mascotAvatar || '🤖');
    if (!nextAvatar?.trim()) return;
    handleUpdateSettings({ mascotAvatar: nextAvatar.trim() });
  }, [handleUpdateSettings, userData.mascotAvatar]);

  return {
    handleTabChange,
    handleFilterModeChange,
    handleToggleDarkMode,
    handleRenameMascot,
    handleChangeMascotAvatar
  };
};
