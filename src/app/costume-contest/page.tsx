'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Sparkles,
  Heart,
  Trash2,
  Play,
  RotateCcw,
  RefreshCw,
  ZoomIn,
  X,
  Check,
  Crown,
  Users,
  Vote,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Award,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';
import {
  fetchCostumeContest,
  setCostumeContestStatus,
  castCostumeContestVote,
  deleteCostumeContestEntry,
  resetCostumeContest,
  CostumeContestState,
  CostumeContestEntry,
} from '@/lib/neon';

export default function CostumeContestPage() {
  const { activeCardId, member } = useAuth();
  const { mode, isDevMode } = useDevMode();

  // Contest State
  const [contest, setContest] = useState<CostumeContestState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Voting state
  const [votedEntryId, setVotedEntryId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  // Lightbox Modal
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<CostumeContestEntry | null>(null);

  // Developer Delete Confirmation Modal
  const [entryToDelete, setEntryToDelete] = useState<CostumeContestEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Developer Reset Confirmation Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Developer Action Spinner
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Get stable voter ID (Active Tap Card > Member Account ID > Persistent Browser Guest UUID)
  const voterId = useMemo(() => {
    if (activeCardId) return `card_${activeCardId}`;
    if (member?.accountId) return `member_${member.accountId}`;
    if (member?.tapCard) return `card_${member.tapCard}`;
    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('sm_contest_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('sm_contest_guest_id', guestId);
      }
      return guestId;
    }
    return 'guest_unknown';
  }, [activeCardId, member]);

  // Load contest data
  const loadContest = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const data = await fetchCostumeContest(isDevMode, voterId);
        if (data && data.success) {
          setContest(data);
          if (data.userVotedEntryId) {
            setVotedEntryId(data.userVotedEntryId);
          }
          setErrorMessage(null);
        } else {
          // If server returned null, fallback to empty initialized object
          setContest((prev) => prev || { success: true, status: 'submissions', entries: [], totalVotes: 0 });
        }
      } catch (err: any) {
        console.error('Error loading costume contest:', err);
        setErrorMessage('Unable to reach contest server. Retrying...');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isDevMode, voterId]
  );

  // Initial load
  useEffect(() => {
    loadContest();
  }, [loadContest]);

  // Auto-poll every 6 seconds so party attendees see photos stream in live
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !activeLightboxPhoto) {
        loadContest(false);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [loadContest, activeLightboxPhoto]);

  // Cast or change vote
  const handleVote = async (entry: CostumeContestEntry) => {
    if (contest?.status !== 'voting' || isVoting) return;

    setIsVoting(true);
    // Optimistic UI update
    const previousVote = votedEntryId;
    setVotedEntryId(entry.id);

    try {
      const res = await castCostumeContestVote(voterId, entry.id);
      if (!res.success) {
        setVotedEntryId(previousVote);
        alert(res.error || 'Failed to submit vote. Please try again.');
      } else {
        // Refresh to sync vote counts
        loadContest(false);
      }
    } catch {
      setVotedEntryId(previousVote);
      alert('Network error casting vote.');
    } finally {
      setIsVoting(false);
    }
  };

  // Developer Phase Transitions
  const handleSetStatus = async (newStatus: 'submissions' | 'voting' | 'ended') => {
    if (!isDevMode || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const ok = await setCostumeContestStatus(newStatus);
      if (ok) {
        await loadContest(true);
      } else {
        alert('Failed to update contest status.');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Developer Delete Entry
  const confirmDeleteEntry = async () => {
    if (!entryToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const ok = await deleteCostumeContestEntry(entryToDelete.id);
      if (ok) {
        if (votedEntryId === entryToDelete.id) {
          setVotedEntryId(null);
        }
        setEntryToDelete(null);
        await loadContest(true);
      } else {
        alert('Failed to delete contest entry.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Developer Reset Contest
  const confirmResetContest = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      const ok = await resetCostumeContest();
      if (ok) {
        setShowResetModal(false);
        setVotedEntryId(null);
        await loadContest(true);
      } else {
        alert('Failed to reset contest.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const status = contest?.status || 'submissions';
  const entries = contest?.entries || [];
  const totalVotes = contest?.totalVotes || 0;

  // Podium computation for concluded contest or dev leaderboard
  const podium = useMemo(() => {
    if (!contest?.leaderboard && status !== 'ended') return [];
    const list = contest?.leaderboard || [...entries].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
    return list.slice(0, 3);
  }, [contest?.leaderboard, entries, status]);

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-[#1c1228] to-stone-900 text-white border-b border-purple-500/20 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Home
                </Link>
                <span className="text-stone-600">•</span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Halloween 🎃
                </span>
                {status === 'submissions' && (
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-orange-400" /> Submissions Open
                  </span>
                )}
                {status === 'voting' && (
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Voting Live
                  </span>
                )}
                {status === 'ended' && (
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-300 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-yellow-400" /> Winners Revealed
                  </span>
                )}
              </div>
              <h1 className="font-fredoka text-2xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Trophy className="w-7 h-7 sm:w-9 h-9 text-amber-400 shrink-0" />
                Costume Contest
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
                Photos taken at the interactive Portal Door kiosk enter here automatically. Pick your favorite costume and vote!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadContest(true)}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-stone-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                title="Refresh Contest Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Developer Management Bar (Visible only in Developer Mode) */}
        {isDevMode && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-stone-900 to-indigo-950/80 border-2 border-purple-500/40 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-bold">
                  🧑‍💻
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-purple-200 flex items-center gap-2">
                    Developer Contest Command Center
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 uppercase">
                      Dev Active
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Control contest stages, view live vote statistics, and manage photo entries.
                  </p>
                </div>
              </div>

              {/* Contest Phase Toggle Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {status !== 'voting' && (
                  <button
                    onClick={() => handleSetStatus('voting')}
                    disabled={isUpdatingStatus}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Voting</span>
                  </button>
                )}

                {status === 'voting' && (
                  <>
                    <button
                      onClick={() => handleSetStatus('ended')}
                      disabled={isUpdatingStatus}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>End Voting (Show Winners)</span>
                    </button>
                    <button
                      onClick={() => handleSetStatus('submissions')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen Submissions</span>
                    </button>
                  </>
                )}

                {status === 'ended' && (
                  <button
                    onClick={() => handleSetStatus('voting')}
                    disabled={isUpdatingStatus}
                    className="px-3 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen Voting</span>
                  </button>
                )}

                <button
                  onClick={() => setShowResetModal(true)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700/50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Clear all entries and reset contest to start"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-300" />
                  <span>Reset Contest</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Entries</span>
                <span className="text-lg font-bold text-white font-fredoka">{entries.length}</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Votes Cast</span>
                <span className="text-lg font-bold text-emerald-400 font-fredoka">{totalVotes}</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Phase</span>
                <span className="text-sm font-bold capitalize text-amber-300 font-fredoka mt-0.5 block">
                  {status}
                </span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Voter Identification</span>
                <span className="text-xs font-mono text-cyan-300 truncate block mt-1" title={voterId}>
                  {voterId}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Callout Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              {status === 'voting' ? <Vote className="w-5 h-5 text-emerald-600" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                {status === 'submissions' && '🎃 Submissions are Open! Step into the Portal Door to enter.'}
                {status === 'voting' && '🗳️ Voting is LIVE! Choose your favorite costume below.'}
                {status === 'ended' && '🏆 Contest Concluded! Here are the winning costumes.'}
              </h2>
              <p className="text-xs text-stone-600">
                {status === 'submissions' &&
                  'All photos taken at the Portal Door kiosk will appear here live. Voting will begin shortly!'}
                {status === 'voting' &&
                  'Tap "Vote for This Costume" on your top pick. You have 1 vote (changeable at any time).'}
                {status === 'ended' && 'Thank you to everyone who entered and voted! Amazing costumes all around.'}
              </p>
            </div>
          </div>

          {votedEntryId && status === 'voting' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>You cast your vote!</span>
            </div>
          )}
        </div>

        {/* Podium Top 3 Winners (Visible if contest is concluded or in dev leaderboard) */}
        {status === 'ended' && podium.length > 0 && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-b from-stone-900 via-[#1c1426] to-stone-950 text-white border-2 border-amber-500/40 shadow-xl relative overflow-hidden">
            <div className="text-center mb-6">
              <span className="text-xs font-extrabold tracking-widest text-amber-400 uppercase bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-full inline-block mb-2">
                Hall of Champions
              </span>
              <h2 className="font-fredoka text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
                <Crown className="w-7 h-7 text-amber-400" /> Top Costume Winners
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 2nd Place */}
              {podium[1] && (
                <div className="order-2 md:order-1 bg-stone-900/90 rounded-2xl p-4 border border-stone-400/30 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-stone-300 text-stone-900 font-bold text-lg flex items-center justify-center mb-2 shadow-md">
                    🥈
                  </div>
                  <span className="text-xs font-bold text-stone-300 uppercase">2nd Place</span>
                  <div
                    className="relative w-full h-44 rounded-xl overflow-hidden my-2.5 cursor-pointer group"
                    onClick={() => setActiveLightboxPhoto(podium[1])}
                  >
                    <img
                      src={podium[1].photoUrl}
                      alt="2nd Place Costume"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm truncate w-full">
                    {podium[1].participantNames?.join(', ') || 'Contestant'}
                  </h3>
                  <span className="text-xs text-amber-300 font-bold mt-1">
                    {podium[1].votesCount || 0} votes ({podium[1].votePercentage || 0}%)
                  </span>
                </div>
              )}

              {/* 1st Place */}
              {podium[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 to-stone-900 rounded-2xl p-5 border-2 border-amber-400 text-center flex flex-col items-center shadow-lg -translate-y-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-900 font-bold text-2xl flex items-center justify-center mb-2 shadow-lg">
                    👑
                  </div>
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                    🏆 1st Place Champion
                  </span>
                  <div
                    className="relative w-full h-52 rounded-xl overflow-hidden my-3 cursor-pointer group border-2 border-amber-400/40"
                    onClick={() => setActiveLightboxPhoto(podium[0])}
                  >
                    <img
                      src={podium[0].photoUrl}
                      alt="1st Place Costume"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-fredoka text-lg font-bold text-white truncate w-full">
                    {podium[0].participantNames?.join(', ') || 'Contestant'}
                  </h3>
                  <span className="text-sm text-yellow-300 font-extrabold mt-1">
                    {podium[0].votesCount || 0} votes ({podium[0].votePercentage || 0}%)
                  </span>
                </div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <div className="order-3 md:order-3 bg-stone-900/90 rounded-2xl p-4 border border-amber-700/40 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-700 text-amber-100 font-bold text-lg flex items-center justify-center mb-2 shadow-md">
                    🥉
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase">3rd Place</span>
                  <div
                    className="relative w-full h-44 rounded-xl overflow-hidden my-2.5 cursor-pointer group"
                    onClick={() => setActiveLightboxPhoto(podium[2])}
                  >
                    <img
                      src={podium[2].photoUrl}
                      alt="3rd Place Costume"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-bold text-white text-sm truncate w-full">
                    {podium[2].participantNames?.join(', ') || 'Contestant'}
                  </h3>
                  <span className="text-xs text-amber-300 font-bold mt-1">
                    {podium[2].votesCount || 0} votes ({podium[2].votePercentage || 0}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500">Loading costume entries...</p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs mb-6 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => loadContest(true)} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 text-3xl">
              🎃
            </div>
            <h3 className="font-fredoka text-xl font-bold text-stone-900 mb-1">No Costumes Submitted Yet</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-5">
              Be the first to enter! Head over to the Portal Door kiosk, switch on &ldquo;Contest Mode&rdquo;, take your photo, and click &ldquo;Upload to Contest&rdquo;.
            </p>
            <button
              onClick={() => loadContest(true)}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Check for New Entries
            </button>
          </div>
        )}

        {/* Entries Grid */}
        {!isLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry, idx) => {
              const isSelectedVote = votedEntryId === entry.id;
              const names = entry.participantNames?.join(', ') || 'Costume Contestant';

              return (
                <div
                  key={entry.id}
                  className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between relative ${
                    isSelectedVote
                      ? 'border-2 border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-400/20'
                      : 'border-stone-200 hover:border-amber-400 hover:shadow-md'
                  }`}
                >
                  {/* Photo Preview Card */}
                  <div>
                    <div className="relative aspect-[3/4] bg-stone-900 overflow-hidden cursor-pointer">
                      <img
                        src={entry.photoUrl}
                        alt={names}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        onClick={() => setActiveLightboxPhoto(entry)}
                      />

                      {/* Zoom Hint Icon */}
                      <button
                        onClick={() => setActiveLightboxPhoto(entry)}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 text-white/90 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 cursor-pointer"
                        title="View Full Size"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs text-white">
                          #{entries.length - idx}
                        </span>
                        {isSelectedVote && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-md animate-bounce">
                            <Check className="w-3 h-3" /> My Pick
                          </span>
                        )}
                      </div>

                      {/* Developer Delete Button (🗑️) */}
                      {isDevMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEntryToDelete(entry);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-700 shadow-md transition-transform hover:scale-105 cursor-pointer z-10"
                          title="Delete this entry (Mistake / Redo)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Card Content Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-amber-700 transition-colors">
                          {entry.costumeTitle || names}
                        </h3>
                      </div>

                      {/* Live Vote Count for Developer or when ended */}
                      {(isDevMode || status === 'ended') && typeof entry.votesCount === 'number' && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-500">Votes:</span>
                          <span className="font-bold text-amber-600">
                            {entry.votesCount} {entry.votesCount === 1 ? 'vote' : 'votes'} ({entry.votePercentage || 0}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voting Action Button (During Voting Phase) */}
                  {status === 'voting' && (
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleVote(entry)}
                        disabled={isVoting}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isSelectedVote
                            ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-500'
                            : 'bg-stone-900 hover:bg-amber-600 text-white'
                        }`}
                      >
                        {isSelectedVote ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>Voted Favorite ⭐</span>
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 text-amber-400 fill-transparent group-hover:fill-current" />
                            <span>Vote for This Costume</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Fullscreen Photo Modal */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeLightboxPhoto.photoUrl}
              alt="Full Size Costume"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 text-center text-white">
              <h3 className="font-bold text-lg">
                {activeLightboxPhoto.participantNames?.join(', ') || 'Costume Contestant'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Developer Delete Confirmation Modal */}
      {entryToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEntryToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-fredoka text-xl font-bold text-stone-900 mb-2">Delete Contest Photo?</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
              Are you sure you want to remove the photo for{' '}
              <strong>{entryToDelete.participantNames?.join(', ') || 'this contestant'}</strong>? Any votes cast for
              this entry will also be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEntry}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Reset Contest Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-fredoka text-xl font-bold text-stone-900 mb-2">Reset Entire Contest?</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
              This will delete all current photo entries, clear all votes, and return the contest to the initial
              submissions state. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetContest}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Contest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
