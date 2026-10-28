'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MemberProfile } from '@/lib/types';
import { searchMemberByTapCard, fetchMemberProfileByAccountId } from '@/lib/neon';

interface AuthContextType {
  activeCardId: string | null;
  member: MemberProfile | null;
  isLoading: boolean;
  loginError: string | null;
  login: (cardId: string) => Promise<boolean>;
  loginWithProfile: (profile: MemberProfile) => void;
  logout: () => void;
  updateMember: (updates: Partial<MemberProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  activeCardId: null,
  member: null,
  isLoading: true,
  loginError: null,
  login: async () => false,
  loginWithProfile: () => {},
  logout: () => {},
  updateMember: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load active session from URL query param, or localStorage (account ID / tap card)
  useEffect(() => {
    const initAuth = async () => {
      try {
        let initialCard: string | null = null;
        let initialAccountId: string | null = null;

        // 1. Check for URL deep link query param (?card=... or ?tapCard=...)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const urlCard = urlParams.get('card') || urlParams.get('tapCard');
          if (urlCard && urlCard.trim()) {
            initialCard = urlCard.trim();
          }
        }

        // 2. Check localStorage
        if (typeof window !== 'undefined') {
          if (!initialCard) {
            initialCard = localStorage.getItem('sm_active_tap_card');
          }
          initialAccountId = localStorage.getItem('sm_active_account_id');
        }

        // 3. Try to authenticate via Account ID first (from OAuth) or Tap Card
        if (initialAccountId) {
          const savedProfile = localStorage.getItem(`sm_profile_${initialAccountId}`);
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            setMember(parsed);
            setActiveCardId(parsed.tapCard || initialAccountId);
          }

          const res = await fetchMemberProfileByAccountId(initialAccountId);
          if (res.success && res.member) {
            setMember(res.member);
            setActiveCardId(res.member.tapCard || initialAccountId);
            localStorage.setItem('sm_active_account_id', initialAccountId);
            if (res.member.tapCard) {
              localStorage.setItem('sm_active_tap_card', res.member.tapCard);
            }
            localStorage.setItem(`sm_profile_${initialAccountId}`, JSON.stringify(res.member));
          }
        } else if (initialCard) {
          // Load cached member profile first for instant UI response
          const savedProfile = localStorage.getItem(`sm_profile_${initialCard}`);
          if (savedProfile) {
            setMember(JSON.parse(savedProfile));
            setActiveCardId(initialCard);
          }

          // Then refresh from Neon One in background
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

  const loginWithProfile = (profile: MemberProfile) => {
    const primaryId = profile.tapCard || profile.accountId || null;
    setActiveCardId(primaryId);
    setMember(profile);
    setLoginError(null);
    setIsLoading(false);
    try {
      if (profile.accountId) {
        localStorage.setItem('sm_active_account_id', profile.accountId);
        localStorage.setItem(`sm_profile_${profile.accountId}`, JSON.stringify(profile));
      }
      if (profile.tapCard) {
        localStorage.setItem('sm_active_tap_card', profile.tapCard);
        localStorage.setItem(`sm_profile_${profile.tapCard}`, JSON.stringify(profile));
      }
    } catch (_) {}
  };

  const login = async (cardId: string): Promise<boolean> => {
    const cleanId = cardId.trim();
    if (!cleanId) return false;
    setLoginError(null);
    setIsLoading(true);

    // Call live Neon One proxy
    const res = await searchMemberByTapCard(cleanId);

    if (res.success && res.member) {
      loginWithProfile(res.member);
      return true;
    } else {
      // If error or not found, check if there is a local cached profile
      try {
        const savedProfile = localStorage.getItem(`sm_profile_${cleanId}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          loginWithProfile(parsed);
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
      localStorage.removeItem('sm_active_account_id');
    } catch (_) {}
    setActiveCardId(null);
    setMember(null);
    setLoginError(null);
  };

  const updateMember = (updates: Partial<MemberProfile>) => {
    if (!member) return;
    const updated: MemberProfile = {
      ...member,
      ...updates,
    };
    setMember(updated);
    try {
      if (updated.accountId) {
        localStorage.setItem(`sm_profile_${updated.accountId}`, JSON.stringify(updated));
      }
      if (activeCardId) {
        localStorage.setItem(`sm_profile_${activeCardId}`, JSON.stringify(updated));
      }
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
        loginWithProfile,
        logout,
        updateMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
