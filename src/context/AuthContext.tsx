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
  // Impersonation
  isImpersonating: boolean;
  originalDeveloperUser: MemberProfile | null;
  impersonateUser: (target: MemberProfile | string) => Promise<boolean>;
  stopImpersonating: () => void;
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
  isImpersonating: false,
  originalDeveloperUser: null,
  impersonateUser: async () => false,
  stopImpersonating: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Impersonation State
  const [originalDevMember, setOriginalDevMember] = useState<MemberProfile | null>(null);
  const [originalDevCardId, setOriginalDevCardId] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);

  // Load active session from URL query param, or localStorage (account ID / tap card)
  useEffect(() => {
    const initAuth = async () => {
      try {
        let initialCard: string | null = null;
        let initialAccountId: string | null = null;

        // Check if impersonation was active
        if (typeof window !== 'undefined') {
          const savedOrigMember = localStorage.getItem('sm_impersonation_orig_member');
          const savedOrigCard = localStorage.getItem('sm_impersonation_orig_card');
          if (savedOrigMember) {
            try {
              setOriginalDevMember(JSON.parse(savedOrigMember));
              setOriginalDevCardId(savedOrigCard);
              setIsImpersonating(true);
            } catch (_) {}
          }
        }

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
      localStorage.removeItem('sm_impersonation_orig_member');
      localStorage.removeItem('sm_impersonation_orig_card');
      localStorage.removeItem('sm_impersonation_target');
    } catch (_) {}
    setActiveCardId(null);
    setMember(null);
    setLoginError(null);
    setOriginalDevMember(null);
    setOriginalDevCardId(null);
    setIsImpersonating(false);
  };

  const impersonateUser = async (target: MemberProfile | string): Promise<boolean> => {
    // If not already impersonating, record our original developer account
    if (!isImpersonating && member) {
      setOriginalDevMember(member);
      setOriginalDevCardId(activeCardId);
      try {
        localStorage.setItem('sm_impersonation_orig_member', JSON.stringify(member));
        if (activeCardId) {
          localStorage.setItem('sm_impersonation_orig_card', activeCardId);
        }
      } catch (_) {}
    }

    let targetProfile: MemberProfile | null = null;
    if (typeof target === 'object' && target !== null) {
      targetProfile = target;
    } else {
      const query = String(target).trim();
      if (!query) return false;
      setIsLoading(true);
      // Try searching by tap card first
      const tapRes = await searchMemberByTapCard(query);
      if (tapRes.success && tapRes.member) {
        targetProfile = tapRes.member;
      } else {
        // Try searching by account ID
        const accRes = await fetchMemberProfileByAccountId(query);
        if (accRes.success && accRes.member) {
          targetProfile = accRes.member;
        } else {
          // Check cached local profile
          const cached = localStorage.getItem(`sm_profile_${query}`);
          if (cached) {
            try {
              targetProfile = JSON.parse(cached);
            } catch (_) {}
          }
        }
      }
    }

    if (targetProfile) {
      loginWithProfile(targetProfile);
      setIsImpersonating(true);
      try {
        localStorage.setItem('sm_impersonation_target', JSON.stringify(targetProfile));
      } catch (_) {}
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const stopImpersonating = () => {
    if (originalDevMember) {
      loginWithProfile(originalDevMember);
    }
    setOriginalDevMember(null);
    setOriginalDevCardId(null);
    setIsImpersonating(false);
    try {
      localStorage.removeItem('sm_impersonation_orig_member');
      localStorage.removeItem('sm_impersonation_orig_card');
      localStorage.removeItem('sm_impersonation_target');
      localStorage.setItem('sm_app_mode', 'developer');
      localStorage.setItem('sm_dev_mode', 'true');
    } catch (_) {}
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
        isImpersonating,
        originalDeveloperUser: originalDevMember,
        impersonateUser,
        stopImpersonating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
