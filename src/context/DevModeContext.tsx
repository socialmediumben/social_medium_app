'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export type AppMode = 'user' | 'staff' | 'developer';

export interface DevModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  cycleMode: () => void;
  isDevMode: boolean;
  isStaffMode: boolean;
  canAccessStaff: boolean;
  canAccessDev: boolean;
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
  canAccessStaff: false,
  canAccessDev: false,
  toggleDevMode: () => {},
  isChangelogOpen: false,
  openChangelog: () => {},
  closeChangelog: () => {},
  isIconManagerOpen: false,
  openIconManager: () => {},
  closeIconManager: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const [mode, setModeState] = useState<AppMode>('user');
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState<boolean>(false);

  // Neon One CRM Role Permissions:
  // - canAccessDev: Checked custom field 118 ("App Developer" = TRUE)
  // - canAccessStaff: Neon One CRM System User OR App Developer
  const canAccessDev = member?.isAppDeveloper === true;
  const canAccessStaff = member?.isSystemUser === true || member?.isAppDeveloper === true;

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

  // Enforce permissions when member profile loads/updates
  useEffect(() => {
    if (!member) return;

    if (mode === 'developer' && !canAccessDev) {
      if (canAccessStaff) {
        setMode('staff');
      } else {
        setMode('user');
      }
    } else if (mode === 'staff' && !canAccessStaff) {
      setMode('user');
    }
  }, [member, canAccessDev, canAccessStaff, mode]);

  const setMode = (newMode: AppMode) => {
    // Prevent unauthorized mode escalation if member is loaded
    if (member) {
      if (newMode === 'developer' && !canAccessDev) {
        return;
      }
      if (newMode === 'staff' && !canAccessStaff) {
        return;
      }
    }

    setModeState(newMode);
    try {
      localStorage.setItem('sm_app_mode', newMode);
      localStorage.setItem('sm_dev_mode', newMode === 'developer' ? 'true' : 'false');
    } catch (_) {}
  };

  const cycleMode = () => {
    if (canAccessDev) {
      // Full 3-mode cycle for Developers
      if (mode === 'user') setMode('staff');
      else if (mode === 'staff') setMode('developer');
      else setMode('user');
    } else if (canAccessStaff) {
      // 2-mode toggle for Staff
      if (mode === 'user') setMode('staff');
      else setMode('user');
    } else {
      setMode('user');
    }
  };

  const toggleDevMode = () => {
    if (canAccessDev) {
      setMode(mode === 'developer' ? 'user' : 'developer');
    }
  };

  const isDevMode = mode === 'developer' && (!member || canAccessDev);
  const isStaffMode = (mode === 'staff' || mode === 'developer') && (!member || canAccessStaff);

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
        canAccessStaff,
        canAccessDev,
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
