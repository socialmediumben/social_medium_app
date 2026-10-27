'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MemberProfile } from '@/lib/types';

interface AuthContextType {
  activeCardId: string | null;
  member: MemberProfile | null;
  isLoading: boolean;
  login: (cardId: string) => void;
  logout: () => void;
  updateMember: (updates: Partial<MemberProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  activeCardId: null,
  member: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateMember: () => {},
});

// Known member registry keyed by actual Neon One "Tap Card" numbers
const KNOWN_MEMBERS: Record<string, Partial<MemberProfile>> = {
  "0037283076": {
    name: "Ben Braunstein",
    email: "Ben@socialmedium.space",
    phone: "818-648-1314",
    membershipTier: "Board President",
    portalMedia: "videos/Tron.mp4"
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active card ID from localStorage on mount
  useEffect(() => {
    try {
      const storedCardId = localStorage.getItem('sm_active_tap_card');
      if (storedCardId) {
        loadMemberData(storedCardId);
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const loadMemberData = (cardId: string) => {
    setActiveCardId(cardId);
    try {
      localStorage.setItem('sm_active_tap_card', cardId);
    } catch (_) {}

    // Check if user has updated their profile locally
    try {
      const savedProfile = localStorage.getItem(`sm_profile_${cardId}`);
      if (savedProfile) {
        setMember(JSON.parse(savedProfile));
        return;
      }
    } catch (_) {}

    // Known members or clean empty real profile
    const known = KNOWN_MEMBERS[cardId] || {};
    const initialProfile: MemberProfile = {
      tapCard: cardId,
      name: known.name || "Member",
      email: known.email || "",
      phone: known.phone || "",
      membershipTier: known.membershipTier || "Active Member",
      certifications: known.certifications || [],
      portalMedia: known.portalMedia || ""
    };

    setMember(initialProfile);
  };

  const login = (cardId: string) => {
    const cleanId = cardId.trim();
    if (!cleanId) return;
    loadMemberData(cleanId);
  };

  const logout = () => {
    try {
      localStorage.removeItem('sm_active_tap_card');
    } catch (_) {}
    setActiveCardId(null);
    setMember(null);
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
    <AuthContext.Provider value={{ activeCardId, member, isLoading, login, logout, updateMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
