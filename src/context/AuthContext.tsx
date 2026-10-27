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

const KNOWN_MEMBERS: Record<string, Partial<MemberProfile>> = {
  "3680669188": {
    name: "Ben Braunstein",
    email: "Ben@socialmedium.space",
    phone: "818-648-1314",
    membershipTier: "Board President",
  },
  "0580656900": {
    name: "Ilana Jaffe-Lewis",
    email: "ilana@socialmedium.space",
    phone: "747-322-0689",
    membershipTier: "Manager",
  },
  "1121101828": {
    name: "Social Medium Member",
    email: "",
    phone: "",
    membershipTier: "Active Member",
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active card ID from localStorage on mount
  useEffect(() => {
    try {
      const storedCardId = localStorage.getItem('sm_active_tap_card_id');
      if (storedCardId) {
        loadMemberData(storedCardId);
      }
    } catch (_) {}
    setIsLoading(false);
  }, []);

  const loadMemberData = (cardId: string) => {
    setActiveCardId(cardId);
    try {
      localStorage.setItem('sm_active_tap_card_id', cardId);
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
      tapCardId: cardId,
      name: known.name || "Member",
      email: known.email || "",
      phone: known.phone || "",
      membershipTier: known.membershipTier || "Active Member",
      emergencyContact: {
        name: "",
        phone: "",
        relation: ""
      },
      certifications: [],
      achievements: []
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
      localStorage.removeItem('sm_active_tap_card_id');
    } catch (_) {}
    setActiveCardId(null);
    setMember(null);
  };

  const updateMember = (updates: Partial<MemberProfile>) => {
    if (!member || !activeCardId) return;
    const updated: MemberProfile = {
      ...member,
      ...updates,
      emergencyContact: {
        ...member.emergencyContact,
        ...(updates.emergencyContact || { name: "", phone: "", relation: "" })
      }
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
