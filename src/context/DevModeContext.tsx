'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CostumeContestVisibility,
  canViewContest,
  fetchCostumeContest,
  setCostumeContestVisibility as updateContestVisibilityApi,
  fetchGlobalAppSettings,
  updateGlobalAppSettings,
  STORE_BALANCE_FIELD_ID,
  BUDDY_AVATAR_FIELD_ID,
  BUDDY_BUCKS_FIELD_ID,
  XP_FIELD_ID,
} from '@/lib/neon';
import { syncGamificationFromGlobalSettings } from '@/lib/gamification';

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
  impactVisibility: 'all' | 'staff' | 'none';
  setImpactVisibility: (vis: 'all' | 'staff' | 'none') => Promise<boolean>;
  isImpactVisible: boolean;
  brandLogo: string | null;
  setBrandLogo: (logo: string | null) => void;
  isBoardMemberPreviewEnabled: boolean;
  setIsBoardMemberPreviewEnabled: (enabled: boolean) => void;
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
  contestVisibility: 'none',
  setContestVisibility: async () => false,
  isContestVisible: false,
  impactVisibility: 'all',
  setImpactVisibility: async () => false,
  isImpactVisible: true,
  brandLogo: null,
  setBrandLogo: () => {},
  isBoardMemberPreviewEnabled: false,
  setIsBoardMemberPreviewEnabled: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const { member, isImpersonating } = useAuth();
  const [mode, setModeState] = useState<AppMode>('user');
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState<boolean>(false);
  const [contestVisibility, setContestVisibilityState] = useState<CostumeContestVisibility>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedVis = localStorage.getItem('sm_contest_visibility');
        if (savedVis === 'all' || savedVis === 'staff' || savedVis === 'none') {
          return savedVis as CostumeContestVisibility;
        }
      } catch (_) {}
    }
    return 'none';
  });
  const [impactVisibility, setImpactVisibilityState] = useState<'all' | 'staff' | 'none'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedImpact = localStorage.getItem('sm_impact_visibility');
        if (savedImpact === 'all' || savedImpact === 'staff' || savedImpact === 'none') {
          return savedImpact as 'all' | 'staff' | 'none';
        }
      } catch (_) {}
    }
    return 'all';
  });
  const [brandLogo, setBrandLogoState] = useState<string | null>(null);
  const [isBoardMemberPreviewEnabled, setIsBoardMemberPreviewEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sm_board_member_preview') === 'true';
    }
    return false;
  });

  const setIsBoardMemberPreviewEnabled = (enabled: boolean) => {
    setIsBoardMemberPreviewEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        if (enabled) {
          localStorage.setItem('sm_board_member_preview', 'true');
        } else {
          localStorage.removeItem('sm_board_member_preview');
        }
      } catch (_) {}
    }
  };

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
        localStorage.removeItem('sm_brand_logo_explicitly_reset');
      } else {
        localStorage.removeItem('sm_brand_logo');
        localStorage.setItem('sm_brand_logo_explicitly_reset', 'true');
      }
      window.dispatchEvent(new CustomEvent('brand_logo_changed', { detail: logo }));
    } catch (_) {}

    // Synchronize to global backend settings so all users see the updated logo
    updateGlobalAppSettings({ brandLogo: logo }).catch(() => {});
  };

  // Synchronize global app & developer settings across all users
  useEffect(() => {
    try {
      const savedVis = localStorage.getItem('sm_contest_visibility');
      if (savedVis === 'all' || savedVis === 'staff' || savedVis === 'none') {
        setContestVisibilityState(savedVis as CostumeContestVisibility);
      }
    } catch (_) {}

    const syncGlobalSettings = async () => {
      try {
        const settings = await fetchGlobalAppSettings();
        if (settings) {
          // 1. Brand Logo (Protected Persistence: server null will never wipe local logo)
          if (settings.brandLogo) {
            setBrandLogoState(settings.brandLogo);
            try {
              localStorage.setItem('sm_brand_logo', settings.brandLogo);
              localStorage.removeItem('sm_brand_logo_explicitly_reset');
            } catch (_) {}
          } else {
            // Server returned null/empty (e.g. server cold-booted with defaults)
            try {
              const localLogo = localStorage.getItem('sm_brand_logo');
              const wasExplicitlyReset = localStorage.getItem('sm_brand_logo_explicitly_reset') === 'true';
              if (localLogo && !wasExplicitlyReset) {
                // Keep local logo active and heal remote server!
                setBrandLogoState(localLogo);
                updateGlobalAppSettings({ brandLogo: localLogo }).catch(() => {});
              } else if (wasExplicitlyReset) {
                setBrandLogoState(null);
              }
            } catch (_) {}
          }

          // 2. Module Visibility (e.g. Costume Contest & Impact)
          if (settings.moduleVisibility?.costumeContest) {
            const vis = settings.moduleVisibility.costumeContest;
            setContestVisibilityState(vis);
            try {
              localStorage.setItem('sm_contest_visibility', vis);
            } catch (_) {}
          }
          if (settings.moduleVisibility?.impact) {
            const vis = settings.moduleVisibility.impact;
            if (vis === 'all' || vis === 'staff' || vis === 'none') {
              setImpactVisibilityState(vis);
              try {
                localStorage.setItem('sm_impact_visibility', vis);
              } catch (_) {}
            }
          }

          // 3. Tool Certifications / Mappings
          if (Array.isArray(settings.toolMappings) && settings.toolMappings.length > 0) {
            try {
              localStorage.setItem('sm_custom_tool_mappings', JSON.stringify(settings.toolMappings));
              window.dispatchEvent(new CustomEvent('sm_tools_updated'));
            } catch (_) {}
          }

          // 4. Store Global Settings & Default Field IDs
          try {
            if (!localStorage.getItem('sm_neon_xp_field_id')) {
              localStorage.setItem('sm_neon_xp_field_id', XP_FIELD_ID);
            }
            if (!localStorage.getItem('sm_neon_buddy_avatar_field_id')) {
              localStorage.setItem('sm_neon_buddy_avatar_field_id', BUDDY_AVATAR_FIELD_ID);
            }
            if (!localStorage.getItem('sm_neon_buddy_bucks_field_id')) {
              localStorage.setItem('sm_neon_buddy_bucks_field_id', BUDDY_BUCKS_FIELD_ID);
            }
            if (!localStorage.getItem('sm_neon_balance_field_id')) {
              localStorage.setItem('sm_neon_balance_field_id', STORE_BALANCE_FIELD_ID);
            }
            if (settings.storeSettings) {
              if (settings.storeSettings.donationFormUrl) {
                localStorage.setItem('sm_neon_store_donation_form_url', settings.storeSettings.donationFormUrl);
              }
              if (settings.storeSettings.balanceFieldId) {
                localStorage.setItem('sm_neon_balance_field_id', settings.storeSettings.balanceFieldId);
              }
              if (settings.storeSettings.xpFieldId) {
                localStorage.setItem('sm_neon_xp_field_id', settings.storeSettings.xpFieldId);
              }
            }
          } catch (_) {}

          // 5. Gamification Activity XP Rules & Level Tiers
          syncGamificationFromGlobalSettings({
            xpRules: settings.xpRules,
            levelTiers: settings.levelTiers,
          });

          // 6. Buddy Builder Category Layer Order (Z-Index SSOT)
          if (settings.buddyLayerOrder && typeof settings.buddyLayerOrder === 'object') {
            try {
              localStorage.setItem('sm_buddy_layer_order', JSON.stringify(settings.buddyLayerOrder));
              window.dispatchEvent(new CustomEvent('sm_buddy_catalog_updated'));
            } catch (_) {}
          }
        } else {
          // Fallback to fetchCostumeContest if app-settings endpoint not available yet
          const data = await fetchCostumeContest();
          if (data?.visibility) {
            setContestVisibilityState(data.visibility);
          }
        }
      } catch (_) {}
    };

    syncGlobalSettings();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncGlobalSettings();
      }
    }, 8000);

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
    } catch (_) {}

    // Update both the costume contest endpoint and global app settings so all users sync
    const res = await updateContestVisibilityApi(vis);
    updateGlobalAppSettings({
      moduleVisibility: { costumeContest: vis },
    }).catch(() => {});
    return res;
  };

  const setImpactVisibility = async (vis: 'all' | 'staff' | 'none'): Promise<boolean> => {
    setImpactVisibilityState(vis);
    try {
      localStorage.setItem('sm_impact_visibility', vis);
    } catch (_) {}

    const res = await updateGlobalAppSettings({
      moduleVisibility: { impact: vis },
    });
    return res.success;
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
  const isImpactVisible =
    impactVisibility === 'all' ||
    (impactVisibility === 'staff' && isStaffMode) ||
    isDevMode;

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
        impactVisibility,
        setImpactVisibility,
        isImpactVisible,
        brandLogo,
        setBrandLogo,
        isBoardMemberPreviewEnabled,
        setIsBoardMemberPreviewEnabled,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
export const useAppMode = () => useContext(DevModeContext);
