'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
  isChangelogOpen: boolean;
  openChangelog: () => void;
  closeChangelog: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {},
  isChangelogOpen: false,
  openChangelog: () => {},
  closeChangelog: () => {},
});

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState<boolean>(false);

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

  return (
    <DevModeContext.Provider
      value={{
        isDevMode,
        toggleDevMode,
        isChangelogOpen,
        openChangelog,
        closeChangelog,
      }}
    >
      {children}
    </DevModeContext.Provider>
  );
}

export const useDevMode = () => useContext(DevModeContext);
