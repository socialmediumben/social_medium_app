'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Code2,
  Eye,
  LogOut,
  Sliders,
  Megaphone,
  EyeOff,
  Trophy,
  Gamepad2,
  DoorOpen,
  Plus,
  Check,
  Copy,
  Search,
  User,
  Shield,
  Sparkles,
  Wrench,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Radio,
  StopCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode, AppMode } from '@/context/DevModeContext';
import { getGreetingName, MemberProfile, CommunityAnnouncement } from '@/lib/types';
import {
  fetchCommunityAnnouncement,
  updateCommunityAnnouncement,
  searchNeonAccounts,
  searchMemberByTapCard,
  fetchMemberProfileByAccountId,
  CostumeContestVisibility,
  setCostumeContestStatus,
} from '@/lib/neon';
import { APP_VERSION } from '@/lib/version';

// Import canonical universal certification registry
// @ts-ignore
import SMCertifications from '../../../public/shared/sm-certifications.js';

interface ToolItem {
  id: string;
  name: string;
  category: string;
  color: string;
  keywords: string[];
  iconSvg: string;
}

type DevSubTab = 'impersonate' | 'announcements' | 'visibility' | 'icons' | 'system';

export default function DeveloperPage() {
  const {
    member,
    activeCardId,
    isImpersonating,
    originalDeveloperUser,
    impersonateUser,
    stopImpersonating,
  } = useAuth();

  const {
    mode,
    setMode,
    isDevMode,
    canAccessDev,
    openChangelog,
    contestVisibility,
    setContestVisibility,
  } = useDevMode();

  const [activeTab, setActiveTab] = useState<DevSubTab>('impersonate');

  // ==========================================
  // 1. IMPERSONATION STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ accountId: string; name: string; email?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualCardId, setManualCardId] = useState('');
  const [impersonateNotice, setImpersonateNotice] = useState<string | null>(null);
  const [isImpersonatingLoading, setIsImpersonatingLoading] = useState(false);

  // Search Neon One accounts debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchNeonAccounts(q);
        setSearchResults(results);
      } catch (_) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleImpersonateAccount = async (accountId: string) => {
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    try {
      const ok = await impersonateUser(accountId);
      if (ok) {
        setImpersonateNotice(`Successfully switched perspective to Account #${accountId}`);
      } else {
        setImpersonateNotice(`Could not load profile for Account #${accountId}`);
      }
    } catch (e: any) {
      setImpersonateNotice(`Error: ${e.message}`);
    }
    setIsImpersonatingLoading(false);
  };

  const handleImpersonateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = manualCardId.trim();
    if (!card) return;
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    try {
      const ok = await impersonateUser(card);
      if (ok) {
        setImpersonateNotice(`Successfully switched perspective to Tap Card ${card}`);
        setManualCardId('');
      } else {
        setImpersonateNotice(`No member found matching Tap Card ${card}`);
      }
    } catch (e: any) {
      setImpersonateNotice(`Error: ${e.message}`);
    }
    setIsImpersonatingLoading(false);
  };

  // Sample quick personas
  const handleQuickPersona = async (persona: { name: string; cardId: string; isDev?: boolean }) => {
    setIsImpersonatingLoading(true);
    setImpersonateNotice(null);
    const ok = await impersonateUser(persona.cardId);
    if (ok) {
      setImpersonateNotice(`Switched perspective to ${persona.name} (${persona.cardId})`);
    } else {
      setImpersonateNotice(`Could not load ${persona.name}`);
    }
    setIsImpersonatingLoading(false);
  };

  // ==========================================
  // 2. COMMUNITY ANNOUNCEMENT STATE
  // ==========================================
  const [announcement, setAnnouncement] = useState<CommunityAnnouncement | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annAuthor, setAnnAuthor] = useState('');
  const [annActive, setAnnActive] = useState(true);
  const [isSavingAnn, setIsSavingAnn] = useState(false);
  const [annSaveMsg, setAnnSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadAnn = async () => {
      try {
        const live = await fetchCommunityAnnouncement();
        if (live) {
          setAnnouncement(live);
          setAnnTitle(live.title || '');
          setAnnMessage(live.message || '');
          setAnnAuthor(live.author || '');
          setAnnActive(live.active !== false);
        }
      } catch (_) {}
    };
    loadAnn();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      setAnnSaveMsg({ type: 'error', text: 'Title and message cannot be empty.' });
      return;
    }
    setIsSavingAnn(true);
    setAnnSaveMsg(null);
    try {
      const res = await updateCommunityAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        author: annAuthor.trim() || getGreetingName(originalDeveloperUser || member),
        active: annActive,
      });
      if (res.success && res.announcement) {
        setAnnouncement(res.announcement);
        setAnnSaveMsg({ type: 'success', text: 'Announcement updated and published live!' });
        try {
          localStorage.setItem('sm_community_announcement', JSON.stringify(res.announcement));
        } catch (_) {}
      } else {
        setAnnSaveMsg({ type: 'error', text: res.error || 'Failed to save announcement' });
      }
    } catch (e: any) {
      setAnnSaveMsg({ type: 'error', text: e.message || 'Error saving announcement' });
    }
    setIsSavingAnn(false);
  };

  // ==========================================
  // 3. MODULE VISIBILITY STATE
  // ==========================================
  const [isUpdatingVis, setIsUpdatingVis] = useState(false);
  const [visNotice, setVisNotice] = useState<string | null>(null);

  const handleContestVisibilityChange = async (vis: CostumeContestVisibility) => {
    setIsUpdatingVis(true);
    setVisNotice(null);
    try {
      const ok = await setContestVisibility(vis);
      if (ok) {
        setVisNotice(`Contest module visibility set to: ${vis.toUpperCase()}`);
      } else {
        setVisNotice(`Failed to save visibility change.`);
      }
    } catch (e: any) {
      setVisNotice(`Error: ${e.message}`);
    }
    setIsUpdatingVis(false);
    setTimeout(() => setVisNotice(null), 4000);
  };

  const handleStopAllGameRoomMirrors = async () => {
    try {
      await fetch('https://192.168.12.108:8088/api/mirror/stop-all', { method: 'POST' });
      setVisNotice('Issued remote STOP-ALL mirrors command to Game Room Mini PC.');
    } catch (_) {
      setVisNotice('Remote command dispatched to Game Room network.');
    }
    setTimeout(() => setVisNotice(null), 4000);
  };

  // ==========================================
  // 4. CERTIFICATION & ICON REGISTRY STATE
  // ==========================================
  const [tools, setTools] = useState<Record<string, ToolItem>>(SMCertifications.TOOLS || {});
  const [selectedToolId, setSelectedToolId] = useState<string | null>('3d-printing');
  const [testInput, setTestInput] = useState('3D Printing (Advanced)');
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Tool form fields
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newId, setNewId] = useState('');

  useEffect(() => {
    if (selectedToolId && tools[selectedToolId]) {
      const t = tools[selectedToolId];
      setEditName(t.name);
      setEditCategory(t.category);
      setEditColor(t.color);
      setEditKeywords((t.keywords || []).join(', '));
      setIsAddingNew(false);
    }
  }, [selectedToolId, tools]);

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    const id = isAddingNew ? newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : selectedToolId;
    if (!id) return;

    const updated: ToolItem = {
      id,
      name: editName.trim(),
      category: editCategory.trim() || 'General',
      color: editColor.trim() || '#3bc0cd',
      keywords: editKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      iconSvg: isAddingNew
        ? SMCertifications.SVG_ICONS['tool-generic']
        : tools[id]?.iconSvg || SMCertifications.SVG_ICONS['tool-generic'],
    };

    const newTools = { ...tools, [id]: updated };
    setTools(newTools);
    setSelectedToolId(id);
    setIsAddingNew(false);
    try {
      localStorage.setItem('sm_custom_tool_mappings', JSON.stringify(newTools));
    } catch (_) {}
  };

  const handleCopyJSON = () => {
    const jsonOutput = JSON.stringify({ tools }, null, 2);
    navigator.clipboard.writeText(jsonOutput);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  const resolvedTest = SMCertifications.resolve(testInput);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                DEVELOPER COMMAND CENTER
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono text-xs">
                v{APP_VERSION}
              </span>
            </div>
            <h1 className="font-fredoka text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Social Medium Developer Studio
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Unified console for user impersonation, live community announcements, module visibility, and SSOT certification icon mappings.
            </p>
          </div>

          {/* Quick Session Status Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isImpersonating ? (
              <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    Active Impersonation
                  </span>
                </div>
                <div className="font-bold text-sm text-white">
                  {getGreetingName(member)}
                  <span className="text-xs font-mono text-purple-200 ml-1.5">({activeCardId})</span>
                </div>
                <button
                  type="button"
                  onClick={stopImpersonating}
                  className="mt-2 w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit Impersonation
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Authenticated Developer
                </div>
                <div className="font-bold text-sm text-amber-300">
                  {getGreetingName(member)}
                </div>
                <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                  Tap Card: {activeCardId || 'Not Bound'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-[#f16622]/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-60 h-60 rounded-full bg-[#3bc0cd]/15 blur-3xl pointer-events-none" />
      </div>

      {/* Sub-Tab Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('impersonate')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'impersonate'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Impersonation</span>
          {isImpersonating && (
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Announcements</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visibility')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'visibility'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Module Visibility</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('icons')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'icons'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Icons & SSOT Registry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#344ea2] text-white shadow-md'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
          <span>System & Cache</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: IMPERSONATION & USER PERSPECTIVE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'impersonate' && (
        <div className="space-y-6">
          {/* Active Impersonation Alert Banner */}
          {isImpersonating && (
            <div className="p-5 rounded-3xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-purple-950 text-sm">
                    Currently Viewing As: {getGreetingName(member)} ({member?.email || 'No email'})
                  </div>
                  <div className="text-xs text-purple-700">
                    Tap Card: <code className="font-mono font-bold bg-purple-100 px-1.5 py-0.5 rounded">{activeCardId}</code> • Certifications: {member?.certifications?.length || 0} tool(s)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Home as User
                </Link>
                <button
                  type="button"
                  onClick={stopImpersonating}
                  className="px-4 py-2 rounded-xl bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold text-xs transition-colors cursor-pointer"
                >
                  Exit Impersonation
                </button>
              </div>
            </div>
          )}

          {impersonateNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{impersonateNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Search & Select Member */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Search Any Member in Neon One
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Type a member name or account ID to load their exact account permissions, certifications, and portal media.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type name (e.g. Ben, Sarah) or Account ID..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-sm bg-stone-50 focus:bg-white focus:border-[#3bc0cd] transition-all"
                  />
                  {isSearching && (
                    <RefreshCw className="w-4 h-4 text-stone-400 animate-spin absolute right-3.5 top-3" />
                  )}
                </div>

                {/* Search Results Dropdown / List */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Matching Neon One Accounts ({searchResults.length})
                    </span>
                    {searchResults.map((acc) => (
                      <div
                        key={acc.accountId}
                        className="p-3 rounded-2xl border border-stone-200 hover:border-[#3bc0cd] bg-stone-50/60 hover:bg-white flex items-center justify-between gap-3 transition-all"
                      >
                        <div>
                          <div className="font-bold text-sm text-stone-900">{acc.name}</div>
                          <div className="text-xs text-stone-500 font-mono">
                            ID: {acc.accountId} {acc.email && `• ${acc.email}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleImpersonateAccount(acc.accountId)}
                          disabled={isImpersonatingLoading}
                          className="px-3 py-1.5 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Impersonate</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Tap Card Lookup */}
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Manual NFC Tap Card ID Lookup
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Enter the exact Tap Card number (e.g. 1423631962, 1234, or a test badge) to view the app as the assigned cardholder.
                  </p>
                </div>

                <form onSubmit={handleImpersonateCard} className="flex gap-2">
                  <input
                    type="text"
                    value={manualCardId}
                    onChange={(e) => setManualCardId(e.target.value)}
                    placeholder="Enter Tap Card ID (e.g. 1423631962)..."
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-stone-200 text-sm bg-stone-50 focus:bg-white focus:border-[#3bc0cd] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isImpersonatingLoading || !manualCardId.trim()}
                    className="px-5 py-2.5 rounded-2xl bg-[#3bc0cd] hover:bg-[#32a8b5] text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Card</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right 5 Cols: Quick Persona Shortcuts */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Quick Persona Presets
                  </h3>
                  <p className="text-stone-500 text-xs">
                    One-click switches to test different user journeys and membership tiers.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Persona 1: Developer Account (Self) */}
                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold shrink-0">
                        💻
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Developer (Self)</div>
                        <div className="text-[11px] text-stone-500">Master dev permissions & studio</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={stopImpersonating}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Reset Self
                    </button>
                  </div>

                  {/* Persona 2: Active Cardholder Ben */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#344ea2]/15 text-[#344ea2] flex items-center justify-center font-bold shrink-0">
                        🛠️
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Ben Braunstein (Card: 1423631962)</div>
                        <div className="text-[11px] text-stone-500">Active member with photobooth media</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickPersona({ name: 'Ben', cardId: '1423631962' })}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>

                  {/* Persona 3: Test Card 1234 */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        🌱
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Test Member (Card: 1234)</div>
                        <div className="text-[11px] text-stone-500">Standard user persona for QA testing</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickPersona({ name: 'Test Member', cardId: '1234' })}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>

                  {/* Persona 4: Clean Slate User */}
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center font-bold shrink-0">
                        👤
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-900">Unregistered Visitor</div>
                        <div className="text-[11px] text-stone-500">No card connected / Onboarding state</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        impersonateUser({
                          tapCard: '',
                          firstName: 'Guest',
                          lastName: 'Visitor',
                          name: 'Guest Visitor',
                          email: '',
                          phone: '',
                          membershipTier: 'Visitor',
                          certifications: [],
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMUNITY ANNOUNCEMENT MANAGER                                     */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Announcement Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Home Page Community Announcement
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Broadcast updates, hours, machinery notices, or events to all members right on the Home tab.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {annActive ? '● Published' : '○ Draft / Inactive'}
                </span>
              </div>

              {annSaveMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    annSaveMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {annSaveMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{annSaveMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Welcome to Social Medium Makerspace!"
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 text-sm font-bold bg-stone-50 focus:bg-white focus:border-[#3bc0cd]"
                  />
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1">Message Body</label>
                  <textarea
                    rows={5}
                    required
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Write the community notice here..."
                    className="w-full p-4 rounded-2xl border border-stone-200 text-xs leading-relaxed bg-stone-50 focus:bg-white focus:border-[#3bc0cd]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Author Byline</label>
                    <input
                      type="text"
                      value={annAuthor}
                      onChange={(e) => setAnnAuthor(e.target.value)}
                      placeholder="e.g. Ben Braunstein"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Status</label>
                    <button
                      type="button"
                      onClick={() => setAnnActive(!annActive)}
                      className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        annActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${annActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      <span>{annActive ? 'Visible on Home Page' : 'Hidden / Disabled'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingAnn}
                    className="w-full py-3 rounded-2xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAnn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Publishing to App...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save & Publish Announcement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right 5 Cols: Live User-Facing Preview */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Live Home Tab Preview
            </span>
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#3bc0cd]/10 to-[#344ea2]/15 border border-[#3bc0cd]/30 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#f16622] text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#344ea2]">
                  Community Announcement
                </span>
              </div>
              <h4 className="font-fredoka text-lg font-bold text-stone-900 leading-snug">
                {annTitle || 'Your Announcement Title'}
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                {annMessage || 'The message you write on the left will appear in this card on the Home page for all members.'}
              </p>
              <div className="pt-2 text-[10px] text-stone-500 font-medium border-t border-stone-200/60 flex items-center justify-between">
                <span>By {annAuthor || 'Social Medium Staff'}</span>
                <span>Preview Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MODULE VISIBILITY & FEATURE TOGGLES                                */}
      {/* ========================================================================= */}
      {activeTab === 'visibility' && (
        <div className="space-y-6">
          {visNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{visNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Costume Contest Visibility */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Costume Contest Module
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Controls whether the Costume Contest appears in the navigation and on the Home page.
                  </p>
                </div>
              </div>

              {/* 3-Way Visibility Radio Toggle */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('all')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'all'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold">Visible to All Users (Public)</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Appears in top navigation and Home page for all visitors & members
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'all' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('staff')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'staff'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">Staff & Developers Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Hidden from general members; visible only to staff and developers
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'staff' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleContestVisibilityChange('none')}
                  disabled={isUpdatingVis}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    contestVisibility === 'none'
                      ? 'bg-red-50 border-red-400 text-red-950 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div>
                      <div className="text-xs font-bold">Disabled / Dev Mode Only</div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        Completely removed from navigation and hidden from all users & staff
                      </div>
                    </div>
                  </div>
                  {contestVisibility === 'none' && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                </button>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <Link
                  href="/costume-contest"
                  className="text-xs font-bold text-[#344ea2] hover:text-[#2a3f85] flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Contest Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[10px] font-mono text-stone-400">Database: Neon CRM</span>
              </div>
            </div>

            {/* Card 2: Game Room Chamber & Projector Remote */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Game Room & Controller
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Overhead table projector, 53" window TV, picture frame, and smart lighting.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Physical Mini PC:</span>
                  <code className="font-mono font-bold text-stone-800">192.168.12.108:8088</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Active Displays:</span>
                  <span className="font-mono text-emerald-700 font-bold">Table • Window • Frame</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Smart Lighting:</span>
                  <span className="font-mono text-emerald-700 font-bold">Hubspace (13 devices)</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStopAllGameRoomMirrors}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <StopCircle className="w-4 h-4 text-red-400" />
                  <span>Stop All Active Screen Mirrors</span>
                </button>
                <Link
                  href="/game-room"
                  className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Full Game Room Remote</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Portal Door & Photobooth Backend */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3bc0cd]/15 text-[#344ea2] flex items-center justify-center font-bold shrink-0">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Portal Door & Photobooth
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Synced with SM App Database spreadsheet and Google Drive photobooth archive.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Database Sheet:</span>
                  <span className="font-mono text-stone-800">SM App Database</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Tabs Connected:</span>
                  <span className="font-mono text-stone-800">Photobooth • Game_Room_Media</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Watermark:</span>
                  <span className="font-mono text-stone-800">@socialmedium.space</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <Link
                  href="/portal-media"
                  className="text-xs font-bold text-[#344ea2] hover:text-[#2a3f85] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Member Portal Media</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="https://neon-kiosk.onrender.com/api/portal-media"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <span>Render API</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Card 4: Neon CRM Staff Dashboard */}
            <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-fredoka text-lg font-bold text-stone-900">
                    Neon CRM Staff Suite
                  </h3>
                  <p className="text-stone-500 text-xs">
                    Member analytics, volunteer hour logging, and system user activities.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">CRM Endpoint:</span>
                  <span className="font-mono text-stone-800">api.neoncrm.com/v2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-600">Permissions:</span>
                  <span className="font-mono text-indigo-700 font-bold">System Users & App Developers</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <Link
                  href="/neon-dashboard"
                  className="flex-1 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs text-center transition-colors"
                >
                  Analytics Dashboard
                </Link>
                <Link
                  href="/new-activity"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center transition-colors"
                >
                  Log CRM Activity
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ICONS & SSOT CERTIFICATION REGISTRY (PREVIOUS "ICONS" MODULE)      */}
      {/* ========================================================================= */}
      {activeTab === 'icons' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xs border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#f16622]/10 text-[#f16622] flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-fredoka text-xl font-bold text-stone-900">
                      Tool Certification & Icon Registry
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-mono font-bold text-xs border border-amber-500/30">
                      SSOT Canonical
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Single Source of Truth shared across Check-In Kiosk thermal printers, Portal Door, and Companion App.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                {copiedJSON ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Export Registry JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Body Grid: Tool List (Left) + Editor & Live Resolver (Right) */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Tool List & Resolver */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Registered Tools ({Object.keys(tools).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setSelectedToolId(null);
                      setNewId('');
                      setEditName('');
                      setEditCategory('Digital Fabrication');
                      setEditColor('#3bc0cd');
                      setEditKeywords('');
                    }}
                    className="text-xs font-semibold text-[#344ea2] hover:text-[#f16622] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tool</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {Object.values(tools).map((tool) => {
                    const isSelected = selectedToolId === tool.id && !isAddingNew;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setIsAddingNew(false);
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : `${tool.color}15`,
                              color: isSelected ? '#ffffff' : tool.color,
                            }}
                            dangerouslySetInnerHTML={{ __html: tool.iconSvg }}
                          />
                          <div>
                            <div className="font-bold text-sm leading-tight">{tool.name}</div>
                            <div className={`text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                              {tool.category}
                            </div>
                          </div>
                        </div>
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                          style={{ backgroundColor: tool.color }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Test Text Resolution Card */}
                <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                    Live Text Resolution Tester
                  </span>
                  <input
                    type="text"
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Type certification string..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium"
                  />
                  {resolvedTest && (
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 flex items-center justify-center shrink-0"
                          style={{ color: resolvedTest.color }}
                          dangerouslySetInnerHTML={{ __html: resolvedTest.iconSvg }}
                        />
                        <div>
                          <div className="text-xs font-bold text-stone-800">
                            {resolvedTest.name}
                            {resolvedTest.isAdvanced && (
                              <span
                                className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-black text-white"
                                style={{ backgroundColor: resolvedTest.color }}
                              >
                                +
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500">{resolvedTest.level}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Slug: {resolvedTest.toolId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editor Form */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-fredoka text-base font-bold text-stone-900">
                      {isAddingNew ? 'Add New Tool Mapping' : `Edit: ${editName || 'Tool'}`}
                    </h3>
                    {!isAddingNew && selectedToolId && (
                      <span className="font-mono text-xs text-stone-500">ID: {selectedToolId}</span>
                    )}
                  </div>

                  <form onSubmit={handleSaveTool} className="space-y-3.5 text-xs">
                    {isAddingNew && (
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Tool ID (slug)</label>
                        <input
                          type="text"
                          required
                          value={newId}
                          onChange={(e) => setNewId(e.target.value)}
                          placeholder="e.g. pottery-wheel"
                          className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-stone-700 font-semibold block mb-1">Tool Display Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. 3D Printing"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Category</label>
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          placeholder="Digital Fabrication"
                          className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-stone-700 font-semibold block mb-1">Brand Color (Hex)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editColor.startsWith('#') ? editColor : '#3bc0cd'}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            placeholder="#3bc0cd"
                            className="flex-1 p-2 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-stone-700 font-semibold block mb-1">
                        Matching Keywords (comma separated)
                      </label>
                      <input
                        type="text"
                        value={editKeywords}
                        onChange={(e) => setEditKeywords(e.target.value)}
                        placeholder="3d printing, fdm, resin, 3d printer"
                        className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        Any Neon One certification string matching these keywords will render this icon.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAddingNew ? 'Create Tool Mapping' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SYSTEM & CACHE TOOLS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Release Notes & Versioning
            </h3>
            <p className="text-stone-500 text-xs">
              View the complete historical change manifest, breaking updates, and SSOT commits.
            </p>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">Active App Version:</span>
                <span className="font-mono font-bold text-amber-700">v{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-600 font-semibold">Branch:</span>
                <span className="font-mono text-stone-800">main / gh-pages</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openChangelog}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Open Release Changelog</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-fredoka text-lg font-bold text-stone-900">
              Browser Cache & Session Reset
            </h3>
            <p className="text-stone-500 text-xs">
              Clear local cached profiles, presets, or announcement state to re-fetch clean data from CRM.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const keys = Object.keys(localStorage);
                    keys.forEach((k) => {
                      if (k.startsWith('sm_profile_') || k.startsWith('sm_community_')) {
                        localStorage.removeItem(k);
                      }
                    });
                    alert('Cached profile and announcement data cleared.');
                  } catch (_) {}
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-stone-400" />
                <span>Clear Member Profile Cache</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  stopImpersonating();
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span>Hard Reload App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
