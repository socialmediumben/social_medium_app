'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppMode = 'user' | 'staff' | 'developer';

export interface DevModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  cycleMode: () => void;
  isDevMode: boolean;
  isStaffMode: boolean;
  toggleDevMode: () => void;
  isChangelogOpen: boolean;
  openChangelog: () => void;
  closeChangelog: () => void;
  isIconManagerOpen: boolean;
  openIconManager: () => void;
  closeIconManager: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  mode: 'user',
  setMode: () => {},
  cycleMode: () => {},
  isDevMode: false,
  isStaffMode: false,
  toggleDevMode: () => {},
  isChangelogOpen: false,
  openChangelog: () => {},
  closeChangelog: () => {},
  isIconManagerOpen: false,
  openIconManager: () => {},
  closeIconManager: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('user');
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('sm_app_mode');
      if (savedMode === 'staff' || savedMode === 'developer' || savedMode === 'user') {
        setModeState(savedMode);
      } else {
        const savedDev = localStorage.getItem('sm_dev_mode');
        if (savedDev === 'true') {
          setModeState('developer');
        }
      }
    } catch (_) {}
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('sm_app_mode', newMode);
      localStorage.setItem('sm_dev_mode', newMode === 'developer' ? 'true' : 'false');
    } catch (_) {}
  };

  const cycleMode = () => {
    if (mode === 'user') setMode('staff');
    else if (mode === 'staff') setMode('developer');
    else setMode('user');
  };

  const toggleDevMode = () => {
    setMode(mode === 'developer' ? 'user' : 'developer');
  };

  const isDevMode = mode === 'developer';
  const isStaffMode = mode === 'staff' || mode === 'developer';

  const openChangelog = () => setIsChangelogOpen(true);
  const closeChangelog = () => setIsChangelogOpen(false);

  const openIconManager = () => setIsIconManagerOpen(true);
  const closeIconManager = () => setIsIconManagerOpen(false);

  return (
    <DevModeContext.Provider
      value={{
        mode,
        setMode,
        cycleMode,
        isDevMode,
        isStaffMode,
        toggleDevMode,
        isChangelogOpen,
        openChangelog,
        closeChangelog,
        isIconManagerOpen,
        openIconManager,
        closeIconManager,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
export const useAppMode = () => useContext(DevModeContext);
