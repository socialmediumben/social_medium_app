'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  isChangelogOpen: boolean;
  openChangelog: () => void;
  closeChangelog: () => void;
  isIconManagerOpen: boolean;
  openIconManager: () => void;
  closeIconManager: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {},
  isChangelogOpen: false,
  openChangelog: () => {},
  closeChangelog: () => {},
  isIconManagerOpen: false,
  openIconManager: () => {},
  closeIconManager: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);
  const [isIconManagerOpen, setIsIconManagerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sm_dev_mode');
      if (saved === 'true') {
        setIsDevMode(true);
      }
    } catch (_) {}
  }, []);

  const toggleDevMode = () => {
    setIsDevMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sm_dev_mode', next ? 'true' : 'false');
      } catch (_) {}
      return next;
    });
  };

  const openChangelog = () => setIsChangelogOpen(true);
  const closeChangelog = () => setIsChangelogOpen(false);

  const openIconManager = () => setIsIconManagerOpen(true);
  const closeIconManager = () => setIsIconManagerOpen(false);

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
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
