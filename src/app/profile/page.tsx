'use client';

import { useState, useEffect } from 'react';
import { CreditCard, User, Phone, Mail, CheckCircle2, Edit2, Save, X, Wrench, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TapCardLogin } from '@/components/TapCardLogin';

export default function ProfilePage() {
  const { activeCardId, member, updateMember, isLoading } = useAuth();
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState('');
  const [emergencyNameInput, setEmergencyNameInput] = useState('');
  const [emergencyRelationInput, setEmergencyRelationInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (member) {
      setNameInput(member.name || '');
      setEmailInput(member.email || '');
      setPhoneInput(member.phone || '');
      setEmergencyNameInput(member.emergencyContact?.name || '');
      setEmergencyPhoneInput(member.emergencyContact?.phone || '');
      setEmergencyRelationInput(member.emergencyContact?.relation || '');
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
    updateMember({
      name: nameInput,
      email: emailInput,
      phone: phoneInput,
      emergencyContact: {
        name: emergencyNameInput,
        phone: emergencyPhoneInput,
        relation: emergencyRelationInput
      }
    });
    setIsEditingContact(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
            Member Profile
          </h1>
          <p className="text-stone-600 text-sm">
            Account details and equipment certifications for Tap Card <strong>{member.tapCardId}</strong>.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Contact information successfully saved!</span>
        </div>
      )}

      {/* Main Digital Pass & Tap Card Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-[#3bc0cd]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected Member Pass
            </div>
            <div>
              <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {member.name || "Member"}
              </h2>
              <p className="text-stone-300 text-sm font-medium">
                {member.membershipTier || "Active Member"}
              </p>
            </div>
          </div>

          {/* Physical Tap Card Badge */}
          <div className="p-4 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#f16622]" />
                Tap Card ID (Neon One)
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
              {member.tapCardId}
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

      {/* Grid: Equipment Certifications & Contact Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Equipment Certifications */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900">
                  Equipment Certifications
                </h2>
                <p className="text-stone-500 text-xs">
                  Tools and machinery authorized for independent operation.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                {member.certifications.length} Certified
              </span>
            </div>

            {member.certifications.length === 0 ? (
              <div className="p-8 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center">
                <Wrench className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <h3 className="font-semibold text-stone-800 text-sm mb-1">
                  No Equipment Certifications Recorded Yet
                </h3>
                <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Attend an equipment safety walkthrough at the makerspace to receive certifications on your Neon One account.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {member.certifications.map((cert) => (
                  <div key={cert.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-stone-800">{cert.name}</div>
                      {cert.date && <div className="text-xs text-stone-500">Certified: {cert.date}</div>}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Authorized
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Member Information & Emergency Contact */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-fredoka text-lg font-bold text-stone-900">
                Contact & Details
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
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-stone-500 font-medium block mb-1">Full Name</label>
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.name || "Not set"}</span>
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

                <div className="pt-2 border-t border-stone-100">
                  <label className="text-stone-500 font-medium block mb-1">Emergency Contact</label>
                  {member.emergencyContact?.name ? (
                    <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                      <div className="font-semibold text-stone-800">{member.emergencyContact.name}</div>
                      <div className="text-stone-500">{member.emergencyContact.relation || "Contact"}</div>
                      <div className="text-stone-700 font-mono">{member.emergencyContact.phone}</div>
                    </div>
                  ) : (
                    <div className="text-stone-400 italic bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      No emergency contact registered yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
                <div>
                  <label className="text-stone-600 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
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

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <label className="text-stone-600 font-medium block">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={emergencyNameInput}
                    onChange={(e) => setEmergencyNameInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={emergencyRelationInput}
                    onChange={(e) => setEmergencyRelationInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={emergencyPhoneInput}
                    onChange={(e) => setEmergencyPhoneInput(e.target.value)}
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
