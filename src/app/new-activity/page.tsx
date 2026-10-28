'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  User,
  Users,
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  X,
  ExternalLink,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import {
  fetchActivityTypes,
  fetchActivityStatuses,
  fetchNeonSystemUsers,
  searchNeonAccounts,
  createNeonActivity,
} from '@/lib/neon';
import { NeonPropertyItem, NeonSystemUser } from '@/lib/types';

interface MemberSearchResult {
  accountId: string;
  name: string;
  email?: string;
}

const COMMON_PRESETS = [
  'Equipment Safety Walkthrough',
  'Member Orientation & Intake',
  'Incident / Safety Report',
  'Tool Maintenance / Servicing',
  'Workshop Check-In',
  'General Staff Note',
];

export default function NewActivityPage() {
  const { member, isLoading: isAuthLoading } = useAuth();
  const { canAccessStaff } = useDevMode();

  // Reference data
  const [types, setTypes] = useState<NeonPropertyItem[]>([]);
  const [statuses, setStatuses] = useState<NeonPropertyItem[]>([]);
  const [systemUsers, setSystemUsers] = useState<NeonSystemUser[]>([]);
  const [isLoadingRefData, setIsLoadingRefData] = useState(true);

  // Form Fields
  const [subject, setSubject] = useState('');
  const [typeId, setTypeId] = useState('');
  const [statusId, setStatusId] = useState('4'); // Default: Completed (id 4)
  const [priority, setPriority] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Multiple Assigned Staff Members
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // Notes
  const [note, setNote] = useState('');

  // Multiple Associated Members
  const [memberQuery, setMemberQuery] = useState('');
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<MemberSearchResult[]>([]);

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdActivityId, setCreatedActivityId] = useState<string | null>(null);

  // Fetch types, statuses, and system users
  useEffect(() => {
    let isMounted = true;
    const loadRefData = async () => {
      setIsLoadingRefData(true);
      try {
        const [t, s, u] = await Promise.all([
          fetchActivityTypes(),
          fetchActivityStatuses(),
          fetchNeonSystemUsers(),
        ]);
        if (isMounted) {
          setTypes(t);
          setStatuses(s);
          setSystemUsers(u);

          // Default assigned staff to the currently logged in staff member if matched
          if (member?.firstName && member?.lastName) {
            const first = member.firstName.toLowerCase();
            const last = member.lastName.toLowerCase();
            const matchedUser = u.find(
              (usr) =>
                usr.lastName?.toLowerCase() === last &&
                (usr.firstName?.toLowerCase() === first || usr.name.toLowerCase().includes(first))
            );
            if (matchedUser) {
              setSelectedStaffIds([matchedUser.id]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load activity reference data:', err);
      } finally {
        if (isMounted) setIsLoadingRefData(false);
      }
    };

    loadRefData();
    return () => {
      isMounted = false;
    };
  }, [member]);

  // Toggle staff member selection
  const toggleStaffMember = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllStaff = () => {
    setSelectedStaffIds(systemUsers.map((u) => u.id));
  };

  const handleClearStaff = () => {
    setSelectedStaffIds([]);
  };

  // Handle member search
  const handleSearchMembers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memberQuery.trim()) return;

    setIsSearchingMembers(true);
    try {
      const results = await searchNeonAccounts(memberQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  // Add member to selected list
  const handleAddMember = (m: MemberSearchResult) => {
    if (!selectedMembers.some((item) => item.accountId === m.accountId)) {
      setSelectedMembers((prev) => [...prev, m]);
    }
    setSearchResults([]);
    setMemberQuery('');
  };

  // Remove member from selected list
  const handleRemoveMember = (accountId: string) => {
    setSelectedMembers((prev) => prev.filter((item) => item.accountId !== accountId));
  };

  const handleClearAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setSubmitError('Please enter an activity subject.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await createNeonActivity({
      subject: subject.trim(),
      statusId: statusId || '4',
      priority,
      startDate: startDate || new Date().toISOString().split('T')[0],
      startTime: startTime || undefined,
      typeId: typeId || undefined,
      systemUserIds: selectedStaffIds.length > 0 ? selectedStaffIds : undefined,
      accountIds: selectedMembers.map((m) => m.accountId),
      note: note.trim() || undefined,
    });

    if (res.success && res.activityId) {
      setCreatedActivityId(res.activityId);
    } else {
      setSubmitError(res.error || 'Failed to create activity in Neon CRM.');
    }
    setIsSubmitting(false);
  };

  const handleResetForm = () => {
    setSubject('');
    setTypeId('');
    setStatusId('4');
    setPriority('Normal');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setSelectedMembers([]);
    setCreatedActivityId(null);
    setSubmitError(null);
  };

  if (isAuthLoading) {
    return (
      <div className="py-20 text-center text-stone-500 font-mono text-sm">
        Verifying staff credentials...
      </div>
    );
  }

  // Permission Guard
  if (!canAccessStaff) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="font-fredoka text-2xl font-bold text-stone-900">
          Staff Permission Required
        </h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          The <strong>Activity Logger</strong> module is restricted to authorized Social Medium Makerspace staff and administrators.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32 sm:pb-16">
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Link href="/" className="hover:text-stone-900 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-purple-600 font-semibold">Staff Mode</span>
            <span>/</span>
            <span className="text-stone-800">New Activity</span>
          </div>
          <h1 className="font-fredoka text-2xl sm:text-3xl font-bold text-stone-900 flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-purple-600" />
            <span>Log CRM Activity</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm">
            Record safety walkthroughs, multiple member interactions, and staff notes directly into Neon CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/neon-dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 font-semibold text-xs transition-colors shadow-xs"
          >
            <span>Neon Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </div>
      </div>

      {/* SUCCESS SCREEN */}
      {createdActivityId ? (
        <div className="p-8 rounded-2xl bg-white border border-emerald-200 shadow-md text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
              Activity #{createdActivityId}
            </span>
            <h2 className="font-fredoka text-2xl font-bold text-stone-900">
              Activity Recorded Successfully!
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              &quot;<strong>{subject}</strong>&quot; has been synchronized in real-time with Neon One CRM and linked to all specified members and staff.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Another Activity</span>
            </button>
            <Link
              href="/neon-dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors shadow-xs"
            >
              <span>View in Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors"
            >
              <span>Home</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ACTIVITY CREATION FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Card 1: Subject & Quick Presets */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block mb-1">
                Activity Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Safety Walkthrough: 3D Printing & Laser Cutter"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 font-medium text-sm outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block mb-1.5 uppercase tracking-wider">
                Quick Subject Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {COMMON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSubject(preset)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Classification, Status & Date/Time */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-5">
            <h2 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Details & Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Activity Type
                </label>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="">General / Other</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Status
                </label>
                <select
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none cursor-pointer"
                >
                  {statuses.length === 0 ? (
                    <>
                      <option value="4">Completed</option>
                      <option value="3">In Progress</option>
                      <option value="2">Not Started</option>
                      <option value="6">Deferred</option>
                    </>
                  ) : (
                    statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Activity Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Activity Time (Optional)</span>
                  </label>
                  {startTime && (
                    <button
                      type="button"
                      onClick={() => setStartTime('')}
                      className="text-[10px] text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      Clear Time
                    </button>
                  )}
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Automatically converted to Pacific Time 12-hour AM/PM for Neon CRM.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Assigned Staff Members (Multi-Select) */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Assigned Staff Members</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {selectedStaffIds.length} Selected
                  </span>
                </h2>
                <p className="text-stone-500 text-xs">
                  Tap to add or remove staff members involved in this activity.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllStaff}
                  className="text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-stone-300">•</span>
                <button
                  type="button"
                  onClick={handleClearStaff}
                  className="text-stone-400 hover:text-stone-600 font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {systemUsers.map((usr) => {
                const isSelected = selectedStaffIds.includes(usr.id);
                return (
                  <button
                    key={usr.id}
                    type="button"
                    onClick={() => toggleStaffMember(usr.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate leading-tight">
                        {usr.name || `${usr.firstName} ${usr.lastName}`}
                      </div>
                      <div
                        className={`text-[10px] mt-0.5 font-mono ${
                          isSelected ? 'text-purple-200' : 'text-stone-400'
                        }`}
                      >
                        #{usr.id}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white text-purple-600 border-white'
                          : 'border-stone-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Associated Constituent Accounts (Multiple Members) */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Associated Members (Optional)</span>
                  {selectedMembers.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3bc0cd]/15 text-[#344ea2]">
                      {selectedMembers.length} {selectedMembers.length === 1 ? 'Member' : 'Members'} Linked
                    </span>
                  )}
                </h2>
                <p className="text-stone-500 text-xs">
                  Search and link one or multiple constituent accounts to this activity.
                </p>
              </div>

              {selectedMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllMembers}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* List of currently selected members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                {selectedMembers.map((m) => (
                  <div
                    key={m.accountId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-purple-200 shadow-xs text-xs"
                  >
                    <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                      #{m.accountId}
                    </span>
                    <span className="font-semibold text-stone-900">{m.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.accountId)}
                      className="text-stone-400 hover:text-red-600 p-0.5 rounded-md transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Member search bar */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMembers(e)}
                    placeholder="Search member by first name, last name, or account ID..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs outline-none"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchMembers()}
                  disabled={isSearchingMembers || !memberQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSearchingMembers ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>

              {/* Search Results Dropdown List */}
              {searchResults.length > 0 && (
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 bg-white shadow-md max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Search Results</span>
                    <span>Click to add</span>
                  </div>
                  {searchResults.map((res) => {
                    const isAlreadyAdded = selectedMembers.some(
                      (item) => item.accountId === res.accountId
                    );
                    return (
                      <button
                        key={res.accountId}
                        type="button"
                        onClick={() => handleAddMember(res)}
                        disabled={isAlreadyAdded}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isAlreadyAdded
                            ? 'bg-stone-50 text-stone-400 cursor-default'
                            : 'hover:bg-purple-50/70 text-stone-800'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-stone-900">
                            {res.name}
                          </span>
                          {res.email && (
                            <span className="text-stone-400 text-[11px] ml-2">
                              {res.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-stone-400">
                            #{res.accountId}
                          </span>
                          {isAlreadyAdded ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Added ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                              + Add
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Activity Notes */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wide block">
              Activity Notes & Summary
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter notes, safety walkthrough details, equipment certified, member questions, or incident summary..."
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-purple-600 text-xs font-medium outline-none leading-relaxed placeholder:text-stone-400"
            />
            <span className="text-[11px] text-stone-400 block">
              Notes are saved in the Neon CRM activity timeline and visible on staff activity reports.
            </span>
          </div>

          {/* Form Actions - Optimized for Mobile Clearance */}
          <div className="pt-4 border-t border-stone-200 mb-12 sm:mb-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <Link
              href="/"
              className="py-3 px-4 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors text-center order-2 sm:order-1"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingRefData}
              className="py-3 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm sm:text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Activity in CRM...</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-4 h-4" />
                  <span>Create Activity in Neon CRM</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
