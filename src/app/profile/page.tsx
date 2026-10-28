'use client';

import { useState, useEffect } from 'react';
import { CreditCard, User, Phone, Mail, CheckCircle2, Edit2, Save, X, Wrench, Code2, BookOpen, Sliders } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import { TapCardLogin } from '@/components/TapCardLogin';
import { getGreetingName } from '@/lib/types';
import { APP_VERSION } from '@/lib/version';

// Single Source of Truth for tool icons and certification deduplication
// @ts-ignore
import SMCertifications from '../../../public/shared/sm-certifications.js';

export default function ProfilePage() {
  const { activeCardId, member, updateMember, isLoading } = useAuth();
  const { isDevMode, toggleDevMode, openChangelog, openIconManager } = useDevMode();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [preferredNameInput, setPreferredNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (member) {
      setFirstNameInput(member.firstName || '');
      setLastNameInput(member.lastName || '');
      setPreferredNameInput(member.preferredName || '');
      setEmailInput(member.email || '');
      setPhoneInput(member.phone || '');
    }
  }, [member]);

  if (isLoading) {
    return <div className="py-20 text-center text-stone-500 font-mono text-sm">Loading...</div>;
  }

  if (!activeCardId || !member) {
    return <TapCardLogin />;
  }

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstNameInput.trim();
    const cleanLast = lastNameInput.trim();
    const cleanPreferred = preferredNameInput.trim();
    const fullName = `${cleanFirst} ${cleanLast}`.trim() || 'Member';

    updateMember({
      firstName: cleanFirst,
      lastName: cleanLast,
      preferredName: cleanPreferred || undefined,
      name: fullName,
      email: emailInput.trim(),
      phone: phoneInput.trim(),
    });
    setIsEditingContact(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-[#3bc0cd]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected Member Pass • Neon One Synced
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

          {/* Interests & Custom Interests Card (Neon One Fields 81 & 83) */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900">
                  Interests & Passions
                </h2>
                <p className="text-stone-500 text-xs">
                  Printed on your Check-In Kiosk nametag under &quot;I&apos;m Nerdy for...&quot;
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f16622]/10 text-[#f16622]">
                Neon One Synced
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {/* Field 81: Interests */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Interests (Field 81)
                </label>
                {member.interests && member.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {member.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-[#3bc0cd]/15 text-[#24818a] border border-[#3bc0cd]/30 text-xs font-bold"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-stone-400 italic">No general interests selected yet.</div>
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
          </div>

          {/* Developer Mode Card (Always available to toggle ON/OFF) */}
          <div className={`p-6 rounded-2xl border transition-colors shadow-xs ${isDevMode ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-stone-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isDevMode ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-600'}`}>
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-base font-bold text-stone-900">
                    Developer Mode
                  </h3>
                  <p className="text-xs text-stone-500 font-roboto">
                    {isDevMode ? (
                      <span className="text-amber-900 font-mono font-semibold">Active • Version v{APP_VERSION}</span>
                    ) : (
                      'Shows release versioning, icon manager, and full deployment changelog.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isDevMode && (
                  <>
                    <button
                      type="button"
                      onClick={openIconManager}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Icon Manager</span>
                    </button>
                    <button
                      type="button"
                      onClick={openChangelog}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Changelog</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleDevMode}
                  className={`px-3.5 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-xs ${
                    isDevMode
                      ? 'bg-amber-200 hover:bg-amber-300 text-amber-950'
                      : 'bg-[#344ea2] hover:bg-[#2a3f85] text-white'
                  }`}
                >
                  {isDevMode ? 'Turn OFF' : 'Turn ON Developer Mode'}
                </button>
              </div>
            </div>
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

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Save Details
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
