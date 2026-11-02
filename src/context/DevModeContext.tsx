'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CostumeContestVisibility,
  canViewContest,
  fetchCostumeContest,
  setCostumeContestVisibility as updateContestVisibilityApi,
} from '@/lib/neon';

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
  contestVisibility: CostumeContestVisibility;
  setContestVisibility: (vis: CostumeContestVisibility) => Promise<boolean>;
  isContestVisible: boolean;
  brandLogo: string | null;
  setBrandLogo: (logo: string | null) => void;
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
  contestVisibility: 'all',
  setContestVisibility: async () => false,
  isContestVisible: true,
  brandLogo: null,
  setBrandLogo: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const { member, isImpersonating } = useAuth();
  const [mode, setModeState] = useState<AppMode>('user');
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState<boolean>(false);
  const [contestVisibility, setContestVisibilityState] = useState<CostumeContestVisibility>('all');
  const [brandLogo, setBrandLogoState] = useState<string | null>(null);

  // Load custom brand logo on mount
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('sm_brand_logo');
      if (savedLogo) {
        setBrandLogoState(savedLogo);
      }
    } catch (_) {}

    const handleLogoChange = (e: any) => {
      if (e.detail !== undefined) {
        setBrandLogoState(e.detail);
      }
    };
    window.addEventListener('brand_logo_changed', handleLogoChange);
    return () => window.removeEventListener('brand_logo_changed', handleLogoChange);
  }, []);

  const setBrandLogo = (logo: string | null) => {
    setBrandLogoState(logo);
    try {
      if (logo) {
        localStorage.setItem('sm_brand_logo', logo);
      } else {
        localStorage.removeItem('sm_brand_logo');
      }
      window.dispatchEvent(new CustomEvent('brand_logo_changed', { detail: logo }));
    } catch (_) {}
  };

  // Load initial contest visibility & sync with backend/local events
  useEffect(() => {
    try {
      const savedVis = localStorage.getItem('sm_contest_visibility');
      if (savedVis === 'all' || savedVis === 'staff' || savedVis === 'none') {
        setContestVisibilityState(savedVis as CostumeContestVisibility);
      }
    } catch (_) {}

    const syncVisibility = async () => {
      try {
        // If developer has explicitly locked visibility locally, do not let an ephemeral Render reboot overwrite it
        const isLocked = typeof window !== 'undefined' && localStorage.getItem('sm_contest_visibility_locked') === 'true';
        if (isLocked) {
          return;
        }

        const data = await fetchCostumeContest();
        if (data?.visibility) {
          setContestVisibilityState(data.visibility);
          try {
            localStorage.setItem('sm_contest_visibility', data.visibility);
          } catch (_) {}
        }
      } catch (_) {}
    };

    syncVisibility();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncVisibility();
      }
    }, 6000);

    const handleVisChange = (e: any) => {
      if (e.detail && (e.detail === 'all' || e.detail === 'staff' || e.detail === 'none')) {
        setContestVisibilityState(e.detail);
      }
    };
    window.addEventListener('contest_visibility_changed', handleVisChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('contest_visibility_changed', handleVisChange);
    };
  }, []);

  const setContestVisibility = async (vis: CostumeContestVisibility): Promise<boolean> => {
    setContestVisibilityState(vis);
    try {
      localStorage.setItem('sm_contest_visibility', vis);
      localStorage.setItem('sm_contest_visibility_locked', 'true');
    } catch (_) {}
    return await updateContestVisibilityApi(vis);
  };

  // Neon One CRM Role Permissions:
  // - canAccessDev: Checked custom field 118 ("App Developer" = TRUE) or Active Developer Impersonation
  // - canAccessStaff: Neon One CRM System User OR App Developer or Active Developer Impersonation
  const canAccessDev = member?.isAppDeveloper === true || isImpersonating;
  const canAccessStaff = member?.isSystemUser === true || member?.isAppDeveloper === true || isImpersonating;

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
  const isContestVisible = canViewContest(contestVisibility, isDevMode, isStaffMode);

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
        contestVisibility,
        setContestVisibility,
        isContestVisible,
        brandLogo,
        setBrandLogo,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
export const useAppMode = () => useContext(DevModeContext);
