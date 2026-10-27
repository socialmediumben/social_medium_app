'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MemberProfile } from '@/lib/types';
import { searchMemberByTapCard } from '@/lib/neon';

interface AuthContextType {
  activeCardId: string | null;
  member: MemberProfile | null;
  isLoading: boolean;
  loginError: string | null;
  login: (cardId: string) => Promise<boolean>;
  logout: () => void;
  updateMember: (updates: Partial<MemberProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  activeCardId: null,
  member: null,
  isLoading: true,
  loginError: null,
  login: async () => false,
  logout: () => {},
  updateMember: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load active card ID from localStorage on mount
  useEffect(() => {
    try {
      const storedCardId = localStorage.getItem('sm_active_tap_card');
      if (storedCardId) {
        // Load cached member profile first for instant UI
        const savedProfile = localStorage.getItem(`sm_profile_${storedCardId}`);
        if (savedProfile) {
          setMember(JSON.parse(savedProfile));
          setActiveCardId(storedCardId);
        }
        // Then refresh from Neon One in background
        refreshFromNeon(storedCardId);
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const refreshFromNeon = async (cardId: string) => {
    const res = await searchMemberByTapCard(cardId);
    if (res.success && res.member) {
      setMember(res.member);
      setActiveCardId(cardId);
      try {
        localStorage.setItem(`sm_profile_${cardId}`, JSON.stringify(res.member));
      } catch (_) {}
    }
  };

  const login = async (cardId: string): Promise<boolean> => {
    const cleanId = cardId.trim();
    if (!cleanId) return false;
    setLoginError(null);
    setIsLoading(true);

    // Call live Neon One proxy
    const res = await searchMemberByTapCard(cleanId);

    if (res.success && res.member) {
      setActiveCardId(cleanId);
      setMember(res.member);
      try {
        localStorage.setItem('sm_active_tap_card', cleanId);
        localStorage.setItem(`sm_profile_${cleanId}`, JSON.stringify(res.member));
      } catch (_) {}
      setIsLoading(false);
      return true;
    } else {
      // If error or not found, also check if there is a local cached profile
      try {
        const savedProfile = localStorage.getItem(`sm_profile_${cleanId}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setActiveCardId(cleanId);
          setMember(parsed);
          localStorage.setItem('sm_active_tap_card', cleanId);
          setIsLoading(false);
          return true;
        }
      } catch (_) {}

      setLoginError(res.error || 'Failed to find account in Neon One.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('sm_active_tap_card');
    } catch (_) {}
    setActiveCardId(null);
    setMember(null);
    setLoginError(null);
  };

  const updateMember = (updates: Partial<MemberProfile>) => {
    if (!member || !activeCardId) return;
    const updated: MemberProfile = {
      ...member,
      ...updates
    };
    setMember(updated);
    try {
      localStorage.setItem(`sm_profile_${activeCardId}`, JSON.stringify(updated));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ activeCardId, member, isLoading, loginError, login, logout, updateMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
