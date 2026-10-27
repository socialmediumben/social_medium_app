'use client';

import { useState } from 'react';
import { CreditCard, ShieldCheck, Clock, User, Phone, Mail, CheckCircle2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { DEFAULT_MEMBER } from '@/lib/member-data';
import { MemberProfile } from '@/lib/types';

export default function ProfilePage() {
  const [member, setMember] = useState<MemberProfile>(DEFAULT_MEMBER);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [phoneInput, setPhoneInput] = useState(member.phone);
  const [emergencyPhoneInput, setEmergencyPhoneInput] = useState(member.emergencyContact.phone);
  const [emergencyNameInput, setEmergencyNameInput] = useState(member.emergencyContact.name);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveContact = () => {
    setMember({
      ...member,
      phone: phoneInput,
      emergencyContact: {
        ...member.emergencyContact,
        name: emergencyNameInput,
        phone: emergencyPhoneInput
      }
    });
    setIsEditingContact(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900">
          Member Profile
        </h1>
        <p className="text-stone-600 text-sm">
          Your official membership details, registered physical tap card, and equipment certifications.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Contact information successfully updated and synced!</span>
        </div>
      )}

      {/* Main Digital Pass & Tap Card Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#344ea2] via-[#2a3f85] to-[#1e2e66] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-[#3bc0cd]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Member Pass • Neon One Synced
            </div>
            <div>
              <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {member.name}
              </h2>
              <p className="text-stone-300 text-sm font-medium">
                {member.membershipTier} • Member since {member.joinedDate}
              </p>
            </div>
          </div>

          {/* Physical Tap Card Badge */}
          <div className="p-4 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 max-w-xs w-full">
            <div className="flex items-center justify-between text-xs text-stone-300 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#f16622]" />
                Physical Tap Card (NFC)
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Linked
              </span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-white">
              {member.tapCardId}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">
              Used at Check-in Kiosk and Portal Door.
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
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#3bc0cd]/15 text-[#344ea2]">
                {member.certifications.filter(c => c.active).length} / {member.certifications.length} Certified
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {member.certifications.map((cert) => (
                <div key={cert.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 ${
                        cert.active
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {cert.active ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-stone-800">
                        {cert.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium text-[11px]">
                          {cert.category}
                        </span>
                        <span>•</span>
                        <span>{cert.active ? `Certified: ${cert.certifiedDate}` : 'Pending training walkthrough'}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                      cert.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cert.active ? 'Authorized' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
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
                  onClick={() => setIsEditingContact(true)}
                  className="text-xs font-medium text-[#344ea2] hover:text-[#f16622] flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingContact(false)}
                  className="text-xs font-medium text-stone-500 hover:text-stone-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-stone-500 font-medium block mb-1">Email Address</label>
                <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <Mail className="w-3.5 h-3.5 text-stone-400" />
                  <span className="truncate">{member.email}</span>
                </div>
              </div>

              <div>
                <label className="text-stone-500 font-medium block mb-1">Phone Number</label>
                {!isEditingContact ? (
                  <div className="flex items-center gap-2 text-stone-800 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{member.phone}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                  />
                )}
              </div>

              <div className="pt-2 border-t border-stone-100">
                <label className="text-stone-500 font-medium block mb-1">Emergency Contact</label>
                {!isEditingContact ? (
                  <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <div className="font-semibold text-stone-800">{member.emergencyContact.name}</div>
                    <div className="text-stone-500">{member.emergencyContact.relation}</div>
                    <div className="text-stone-700 font-mono">{member.emergencyContact.phone}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={emergencyNameInput}
                      onChange={(e) => setEmergencyNameInput(e.target.value)}
                      className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone"
                      value={emergencyPhoneInput}
                      onChange={(e) => setEmergencyPhoneInput(e.target.value)}
                      className="w-full text-stone-800 font-medium bg-white p-2.5 rounded-xl border border-[#3bc0cd] focus:outline-hidden text-xs"
                    />
                  </div>
                )}
              </div>

              {isEditingContact && (
                <button
                  onClick={handleSaveContact}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#3bc0cd] hover:bg-[#344ea2] text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
