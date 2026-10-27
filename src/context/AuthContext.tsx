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

  // Load active card ID from URL query param (e.g. from Portal Door QR scan) or localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        let initialCard: string | null = null;

        // 1. Check for URL deep link query param (?card=... or ?tapCard=...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const urlCard = urlParams.get('card') || urlParams.get('tapCard');
          if (urlCard && urlCard.trim()) {
            initialCard = urlCard.trim();
          }
        }

        // 2. Fallback to localStorage if no URL parameter
        if (!initialCard) {
          initialCard = localStorage.getItem('sm_active_tap_card');
        }

        if (initialCard) {
          // Load cached member profile first for instant UI response
          const savedProfile = localStorage.getItem(`sm_profile_${initialCard}`);
          if (savedProfile) {
            setMember(JSON.parse(savedProfile));
            setActiveCardId(initialCard);
          }

          // Then refresh from Neon One in background (or log in directly if from URL)
          const res = await searchMemberByTapCard(initialCard);
          if (res.success && res.member) {
            setMember(res.member);
            setActiveCardId(initialCard);
            localStorage.setItem('sm_active_tap_card', initialCard);
            localStorage.setItem(`sm_profile_${initialCard}`, JSON.stringify(res.member));
          } else if (!savedProfile && res.error) {
            setLoginError(res.error);
          }
        }
      } catch (_) {}
      setIsLoading(false);
    };

    initAuth();
  }, []);

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
      ...updates,
    };
    setMember(updated);
    try {
      localStorage.setItem(`sm_profile_${activeCardId}`, JSON.stringify(updated));
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        activeCardId,
        member,
        isLoading,
        loginError,
        login,
        logout,
        updateMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
