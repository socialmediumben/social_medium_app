'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Wrench,
  RefreshCw,
  AlertCircle,
  Plus,
  Check,
  Sparkles,
  Trophy,
  Star,
  Gift,
  ChevronRight,
  History,
  Award,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { getGreetingName, XpLevelTier, XpAuditRecord } from '@/lib/types';
import {
  calculateLevelFromXp,
  fetchXpLevelTiers,
  fetchXpActivityRules,
  getXpAuditHistory,
} from '@/lib/gamification';
import {
  updateMemberInterestsInNeon,
  updateMemberContactInNeon,
  NEON_INTEREST_OPTIONS,
  NEON_GENDER_OPTIONS,
} from '@/lib/neon';

// Single Source of Truth for tool icons and certification deduplication
// @ts-ignore
import SMCertifications from '../../../public/shared/sm-certifications.js';

export default function ProfilePage() {
  const { activeCardId, member, updateMember, isLoading } = useAuth();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [preferredNameInput, setPreferredNameInput] = useState('');
  const [genderCodeInput, setGenderCodeInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable Interests state
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterestsInput, setCustomInterestsInput] = useState('');
  const [isSavingInterests, setIsSavingInterests] = useState(false);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [interestsSuccess, setInterestsSuccess] = useState(false);

  // Gamification state
  const [levelTiers, setLevelTiers] = useState<XpLevelTier[]>([]);
  const [xpAuditHistory, setXpAuditHistory] = useState<XpAuditRecord[]>([]);
  const [showAllTiersModal, setShowAllTiersModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setLevelTiers(fetchXpLevelTiers());
    if (member?.accountId) {
      setXpAuditHistory(getXpAuditHistory(member.accountId));
    }

    const handleXpUpdate = () => {
      setLevelTiers(fetchXpLevelTiers());
      if (member?.accountId) {
        setXpAuditHistory(getXpAuditHistory(member.accountId));
      }
    };
    window.addEventListener('sm_xp_awarded', handleXpUpdate);
    return () => window.removeEventListener('sm_xp_awarded', handleXpUpdate);
  }, [member?.accountId]);

  const levelInfo = calculateLevelFromXp(member?.xp, levelTiers);

  useEffect(() => {
    if (member) {
      setFirstNameInput(member.firstName || '');
      setLastNameInput(member.lastName || '');
      setPreferredNameInput(member.preferredName || '');
      const code =
        member.genderCode ||
        NEON_GENDER_OPTIONS.find(
          (g) => g.name.toLowerCase() === (member.pronouns || member.gender || '').toLowerCase()
        )?.code ||
        '';
      setGenderCodeInput(code);
      setEmailInput(member.email || '');
      setPhoneInput(member.phone || '');
      setSelectedInterests(member.interests || []);
      setCustomInterestsInput(member.customInterests || '');
    }
  }, [member]);

  if (isLoading) {
    return <div className="py-20 text-center text-stone-500 font-mono text-sm">Loading...</div>;
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstNameInput.trim();
    const cleanLast = lastNameInput.trim();
    const cleanPreferred = preferredNameInput.trim();
    const fullName = `${cleanFirst} ${cleanLast}`.trim() || 'Member';
    const chosenGender = NEON_GENDER_OPTIONS.find((g) => g.code === genderCodeInput);
    const resolvedPronouns = chosenGender?.name || member.pronouns || '';

    setIsSavingContact(true);
    setContactError(null);

    // Sync changes to Neon One CRM if accountId is available
    if (member?.accountId) {
      const res = await updateMemberContactInNeon(member.accountId, {
        firstName: cleanFirst,
        lastName: cleanLast,
        preferredName: cleanPreferred || undefined,
        genderCode: genderCodeInput || undefined,
        email: emailInput.trim(),
        phone: phoneInput.trim(),
      });
      if (!res.success) {
        setContactError(res.error || 'Failed to sync contact with Neon One.');
      }
    }

    updateMember({
      firstName: cleanFirst,
      lastName: cleanLast,
      preferredName: cleanPreferred || undefined,
      gender: chosenGender?.name || undefined,
      genderCode: genderCodeInput || undefined,
      pronouns: resolvedPronouns || undefined,
      name: fullName,
      email: emailInput.trim(),
      phone: phoneInput.trim(),
    });

    setIsSavingContact(false);
    setIsEditingContact(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleInterest = (interestName: string) => {
    setSelectedInterests((prev) => {
      const exists = prev.some((i) => i.toLowerCase() === interestName.toLowerCase());
      if (exists) {
        return prev.filter((i) => i.toLowerCase() !== interestName.toLowerCase());
      } else {
        return [...prev, interestName];
      }
    });
  };

  const handleSaveInterests = async () => {
    if (!member?.accountId) return;
    setIsSavingInterests(true);
    setInterestsError(null);

    const res = await updateMemberInterestsInNeon(
      member.accountId,
      selectedInterests,
      customInterestsInput
    );

    setIsSavingInterests(false);

    if (res.success) {
      updateMember({
        interests: selectedInterests,
        customInterests: customInterestsInput.trim(),
      });
      setIsEditingInterests(false);
      setInterestsSuccess(true);
      setTimeout(() => setInterestsSuccess(false), 4000);
    } else {
      setInterestsError(res.error || 'Failed to save interests to Neon One.');
    }
  };

  const handleCancelInterests = () => {
    if (member) {
      setSelectedInterests(member.interests || []);
      setCustomInterestsInput(member.customInterests || '');
    }
    setInterestsError(null);
    setIsEditingInterests(false);
  };

  const certifications = member.certifications || [];
  const deduplicatedCerts = SMCertifications.dedupeAndGroup(certifications);
  const greetingName = getGreetingName(member);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
            Member Profile
          </h1>
          <p className="text-stone-600 text-sm">
            Account details and authorized tool Certifications for Tap Card <strong>{member.tapCard}</strong>.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile information successfully updated!</span>
        </div>
      )}

      {/* Main Digital Pass & Tap Card Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-[#3bc0cd]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected Member Pass • Neon One Synced
              </div>
              {member.isAppDeveloper && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-bold">
                  <span>💻 App Developer</span>
                </div>
              )}
              {member.isSystemUser && !member.isAppDeveloper && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/50 text-indigo-200 text-xs font-bold">
                  <span>🛡️ Staff User</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {greetingName}
              </h2>
              {member.preferredName && (member.firstName || member.lastName) && (
                <p className="text-stone-300 text-xs font-medium">
                  Legal Name: {member.firstName} {member.lastName}
                </p>
              )}
              <p className="text-stone-300 text-sm font-medium mt-0.5">
                {member.membershipTier || "Active Member"}
              </p>
            </div>
          </div>

          {/* Physical Tap Card Badge */}
          <div className="p-4 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#f16622]" />
                Tap Card
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
              {member.tapCard}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Synchronized with kiosk check-in and portal door.
            </div>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#3bc0cd]/20 blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#f16622]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Makerspace Level & Gamification Card */}
      <div id="xp" className="p-6 sm:p-7 rounded-2xl bg-white border border-stone-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-300 flex items-center justify-center text-3xl shadow-sm shrink-0">
              {levelInfo.badgeEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Level {levelInfo.level}
                </span>
                <span className="text-xs font-semibold text-stone-500">Makerspace Rank</span>
              </div>
              <h2 className="font-fredoka text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                {levelInfo.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <button
              type="button"
              onClick={() => setShowAllTiersModal(true)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/50 text-stone-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>All 10 Ranks & Perks</span>
            </button>
            {xpAuditHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showHistory
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History ({xpAuditHistory.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong>{levelInfo.xp}</strong> Total XP
              </span>
            </span>
            <span className="text-stone-500">
              {levelInfo.isMaxLevel ? (
                <span className="text-amber-700 font-bold">Max Rank Achieved!</span>
              ) : (
                <>
                  <span className="text-stone-800 font-bold">{levelInfo.xpNeededForNextTier} XP</span> to Level{' '}
                  {levelInfo.nextTier?.level} ({levelInfo.nextTier?.title})
                </>
              )}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden border border-stone-200/80 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-500 shadow-xs"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Level Perks Unlocked Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {/* Current Unlocked Perk */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <span>Current Level Perk</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-200/70 text-amber-900 text-[10px]">Active</span>
              </div>
              <div className="text-sm font-bold text-stone-900 mt-0.5">
                {levelInfo.reward || 'Welcome to Social Medium & Community Access'}
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Mention this perk at the front desk or snack shack to redeem.
              </p>
            </div>
          </div>

          {/* Next Level Perk Preview */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-stone-200 text-stone-600 shrink-0 mt-0.5">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                {levelInfo.nextTier ? `Unlocks at Level ${levelInfo.nextTier.level}` : 'Legendary Mastery'}
              </div>
              <div className="text-sm font-bold text-stone-800 mt-0.5">
                {levelInfo.nextTier ? levelInfo.nextTier.reward : 'All perks and achievements unlocked!'}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {levelInfo.nextTier
                  ? `Earn ${levelInfo.xpNeededForNextTier} more XP to claim this reward.`
                  : 'You have reached the pinnacle of makerspace mastery.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Guide: How to Earn XP */}
        <div className="pt-2 border-t border-stone-100">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
            Ways to Level Up in the Space
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">📍</div>
              <div className="text-xs font-bold text-stone-800">+20 XP</div>
              <div className="text-[10px] text-stone-500">Kiosk Check-In</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">👥</div>
              <div className="text-xs font-bold text-stone-800">+25 XP</div>
              <div className="text-[10px] text-stone-500">Club Check-In</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">📸</div>
              <div className="text-xs font-bold text-stone-800">+15 XP</div>
              <div className="text-[10px] text-stone-500">Portal Snapshot</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">🛒</div>
              <div className="text-xs font-bold text-stone-800">+10 XP + $1/pt</div>
              <div className="text-[10px] text-stone-500">Store Checkout</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">🎟️</div>
              <div className="text-xs font-bold text-stone-800">+30 XP</div>
              <div className="text-[10px] text-stone-500">Event / Class</div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center">
              <div className="text-lg mb-1">📱</div>
              <div className="text-xs font-bold text-stone-800">+10 XP</div>
              <div className="text-[10px] text-stone-500">Daily App Visit</div>
            </div>
          </div>
        </div>

        {/* Expandable History Drawer */}
        {showHistory && (
          <div className="mt-4 pt-4 border-t border-stone-200 space-y-2">
            <div className="text-xs font-bold text-stone-700 mb-2">Recent XP Activity Log</div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {xpAuditHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      +{item.xpEarned} XP
                    </span>
                    <div>
                      <div className="font-semibold text-stone-800">{item.activityName}</div>
                      {item.note && <div className="text-[11px] text-stone-500">{item.note}</div>}
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()}{' '}
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: All 10 Levels & Rewards Hierarchy */}
      {showAllTiersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-xl font-bold text-stone-900">
                    Makerspace Ranks & Perks
                  </h3>
                  <p className="text-xs text-stone-500">
                    Earn XP across physical visits and app interactions to unlock each milestone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllTiersModal(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              {levelTiers.map((tier) => {
                const isCurrent = tier.level === levelInfo.level;
                const isUnlocked = (member?.xp || 0) >= tier.minXp;
                return (
                  <div
                    key={tier.level}
                    className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400 shadow-xs'
                        : isUnlocked
                        ? 'bg-stone-50 border-stone-200'
                        : 'bg-stone-50/50 border-stone-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-xl shadow-xs shrink-0">
                        {tier.badgeEmoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">
                            Level {tier.level}: {tier.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase">
                              Current
                            </span>
                          )}
                          {!isCurrent && isUnlocked && (
                            <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Unlocked
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-medium text-stone-700 flex items-center gap-1.5 mt-0.5">
                          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{tier.reward}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-stone-800">
                        {tier.minXp} XP
                      </div>
                      <div className="text-[10px] text-stone-400">Required</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllTiersModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Certifications & Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Certifications & Developer Mode */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900">
                  Certifications
                </h2>
                <p className="text-stone-500 text-xs">
                  Tools and machinery authorized for independent operation (Neon One "Certifications" list).
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                {deduplicatedCerts.length} Certified {deduplicatedCerts.length === 1 ? 'Tool' : 'Tools'}
              </span>
            </div>

            {deduplicatedCerts.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-2">
                <Wrench className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                <h3 className="font-semibold text-stone-800 text-sm">
                  No Tool Certifications Recorded Yet
                </h3>
                <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Attend an equipment safety walkthrough at the makerspace to receive certifications on your Neon One account.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {deduplicatedCerts.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center p-4 rounded-2xl border transition-all hover:scale-105 hover:shadow-md group relative"
                    style={{
                      backgroundColor: `${item.color}08`,
                      borderColor: `${item.color}35`,
                    }}
                  >
                    <div className="relative mb-3">
                      <div
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 shadow-xs"
                        style={{
                          backgroundColor: `${item.color}15`,
                          borderColor: `${item.color}60`,
                          color: item.color,
                          boxShadow: `0 4px 16px ${item.color}25`,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (item.iconSvg || '')
                            .replace(/stroke="currentColor"/g, `stroke="${item.color}"`)
                            .replace(/width="24" height="24"/g, 'width="44" height="44"'),
                        }}
                      />
                      {item.isAdvanced && (
                        <span
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full font-black text-sm text-white flex items-center justify-center border-2 border-white shadow-sm leading-none"
                          style={{ backgroundColor: item.color }}
                          title="Advanced Certification (+)"
                        >
                          +
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                      {item.name}
                    </div>
                    <div
                      className="text-[11px] font-semibold mt-0.5 uppercase tracking-wide"
                      style={{ color: item.color }}
                    >
                      {item.level}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interests & Passions Card (Neon One Fields 81 & 83 - Editable) */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>Interests & Passions</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f16622]/10 text-[#f16622] uppercase tracking-wider">
                    Neon One Synced
                  </span>
                </h2>
                <p className="text-stone-500 text-xs mt-0.5">
                  Printed on your Check-In Kiosk nametag under &quot;I&apos;m Nerdy for...&quot;
                </p>
              </div>

              {!isEditingInterests ? (
                <button
                  type="button"
                  onClick={() => setIsEditingInterests(true)}
                  className="text-xs font-semibold text-[#344ea2] hover:text-[#f16622] flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer border border-stone-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Interests</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelInterests}
                    disabled={isSavingInterests}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInterests}
                    disabled={isSavingInterests}
                    className="text-xs font-bold text-white bg-[#344ea2] hover:bg-[#2a3f85] disabled:opacity-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isSavingInterests ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Alerts */}
            {interestsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Interests successfully updated and synced with Neon One!</span>
              </div>
            )}

            {interestsError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{interestsError}</span>
              </div>
            )}

            {/* VIEW MODE */}
            {!isEditingInterests ? (
              <div className="space-y-4 pt-1">
                {/* Field 81: General Interests */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Interests (Field 81)
                  </label>
                  {member.interests && member.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.interests.map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-[#3bc0cd]/15 text-[#24818a] border border-[#3bc0cd]/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3bc0cd]" />
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-xs text-stone-400 italic">
                      No general interests selected yet. Click &quot;Edit Interests&quot; above to choose your passions!
                    </div>
                  )}
                </div>

                {/* Field 83: Custom Interests */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                    Custom Interests (Field 83)
                  </label>
                  {member.customInterests ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800">
                      {member.customInterests}
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 italic">No custom interests specified.</div>
                  )}
                </div>
              </div>
            ) : (
              /* EDIT MODE */
              <div className="space-y-5 pt-1">
                {/* Field 81 Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                      Choose Interests (Field 81)
                    </label>
                    <span className="text-[11px] text-stone-500 font-medium">
                      {selectedInterests.length} selected
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mb-3">
                    Click each passion to toggle it on or off for your profile and check-in nametag:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {NEON_INTEREST_OPTIONS.map((opt) => {
                      const isSelected = selectedInterests.some(
                        (i) => i.toLowerCase() === opt.name.toLowerCase() || i === opt.id
                      );

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleInterest(opt.name)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-[#3bc0cd] text-white border-[#2fb0bd] shadow-xs'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                          )}
                          <span>{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Field 83 Custom Interests Input */}
                <div className="pt-3 border-t border-stone-100 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                    Custom Interests (Field 83)
                  </label>
                  <p className="text-xs text-stone-500">
                    Have a specific niche passion or unique craft? Enter it here to appear alongside your interests:
                  </p>
                  <input
                    type="text"
                    value={customInterestsInput}
                    onChange={(e) => setCustomInterestsInput(e.target.value)}
                    placeholder="e.g. Animatronics, Wooden Automata, Prop Making..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-[#3bc0cd] text-xs font-medium outline-none transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Member Information with First, Last, Preferred Name matching Neon One */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-fredoka text-lg font-bold text-stone-900">
                Member Information
              </h2>
              {!isEditingContact ? (
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="text-xs font-medium text-[#344ea2] hover:text-[#f16622] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingContact(false)}
                  className="text-xs font-medium text-stone-500 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            {!isEditingContact ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-stone-500 font-medium block mb-1">Preferred Name</label>
                  <div className="flex items-center gap-2 text-stone-800 font-semibold bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <User className="w-3.5 h-3.5 text-[#f16622]" />
                    <span>{member.preferredName || "Not set (uses First Name)"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">First Name</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.firstName || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">Last Name</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.lastName || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">Pronouns</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{member.pronouns || member.gender || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">Email Address</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span className="truncate">{member.email || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">Phone Number</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.phone || "Not set"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-stone-500 font-medium block mb-1">Tap Card</label>
                  <div className="flex items-center gap-2 text-stone-800 font-mono font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.tapCard}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
                <div>
                  <label className="text-stone-600 font-medium block mb-1">Preferred Name</label>
                  <input
                    type="text"
                    value={preferredNameInput}
                    onChange={(e) => setPreferredNameInput(e.target.value)}
                    placeholder="e.g. Ben"
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#f16622] focus:outline-hidden text-xs"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">Used to address you across the app.</span>
                </div>

                <div>
                  <label className="text-stone-600 font-medium block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-600 font-medium block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-600 font-medium block mb-1">Pronouns</label>
                  <select
                    value={genderCodeInput}
                    onChange={(e) => setGenderCodeInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs cursor-pointer"
                  >
                    <option value="">Not specified</option>
                    {NEON_GENDER_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Synchronized with your Neon One CRM account &quot;Gender&quot; field.
                  </span>
                </div>

                <div>
                  <label className="text-stone-600 font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                </div>

                <div>
                  <label className="text-stone-600 font-medium block mb-1">Phone</label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                </div>

                {contactError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingContact ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Neon One...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Details</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
