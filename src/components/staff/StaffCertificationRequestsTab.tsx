'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw,
  User,
  Shield,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { MemberProfile, CertificationRequest } from '@/lib/types';
import SMCertifications from '../../../public/shared/sm-certifications.js';
import {
  loadCertificationRequests,
  refreshCertificationRequests,
  approveCertificationRequest,
  rejectCertificationRequest,
} from '@/lib/certifications';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';

interface StaffCertificationRequestsTabProps {
  staffMember: MemberProfile | null | undefined;
}

export function StaffCertificationRequestsTab({
  staffMember,
}: StaffCertificationRequestsTabProps) {
  const toolsDict = (SMCertifications.TOOLS || {}) as Record<string, any>;

  const [requests, setRequests] = useState<CertificationRequest[]>(() =>
    loadCertificationRequests()
  );
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Review Action Modal State
  const [actionTarget, setActionTarget] = useState<{
    request: CertificationRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Sync state with local events and cloud
  useEffect(() => {
    const handleUpdate = () => {
      setRequests(loadCertificationRequests());
    };
    window.addEventListener('sm_cert_requests_updated', handleUpdate);

    // Initial background cloud refresh
    refreshCertificationRequests().then((refreshed) => {
      setRequests(refreshed);
    });

    return () => {
      window.removeEventListener('sm_cert_requests_updated', handleUpdate);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refreshCertificationRequests();
      setRequests(refreshed);
      setActionToast('Certification requests synchronized with Neon cloud.');
      setTimeout(() => setActionToast(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    setIsProcessing(true);

    const { request, action } = actionTarget;
    const reviewerName = staffMember?.preferredName || staffMember?.name || 'Staff Lead';
    const reviewerId = staffMember?.accountId;

    try {
      if (action === 'approve') {
        const res = await approveCertificationRequest(
          request.id,
          reviewerName,
          reviewerId,
          actionFeedback.trim()
        );
        if (res.success) {
          setActionToast(
            `Approved ${request.toolName} certification for ${request.memberName}! Added to Neon CRM.`
          );
        }
      } else {
        const res = await rejectCertificationRequest(
          request.id,
          reviewerName,
          reviewerId,
          actionFeedback.trim() || 'Please complete a hands-on walkthrough with staff before re-requesting.'
        );
        if (res.success) {
          setActionToast(`Declined request for ${request.memberName}. Feedback recorded.`);
        }
      }

      setRequests(loadCertificationRequests());
      setActionTarget(null);
      setActionFeedback('');
      setTimeout(() => setActionToast(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Error processing request.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter and search
  const filteredRequests = requests.filter((r) => {
    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = r.memberName.toLowerCase();
      const tool = r.toolName.toLowerCase();
      const card = (r.tapCard || '').toLowerCase();
      const note = (r.memberNote || '').toLowerCase();
      return name.includes(q) || tool.includes(q) || card.includes(q) || note.includes(q);
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </span>
            <h2 className="font-fredoka text-xl font-bold">Tool Certification Review</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono font-bold text-[10px] uppercase tracking-wider">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-stone-300 max-w-xl">
            Review equipment checkout requests submitted by makers. Approving a request grants the certification in Neon CRM, awards leveling XP, and logs a constituent activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Requests</span>
        </button>
      </div>

      {/* Action Toast Alert */}
      {actionToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Review</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                statusFilter === 'pending'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-200 text-stone-700'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Declined ({rejectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member, tool, or note..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-indigo-500 bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-stone-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-fredoka text-lg font-bold text-stone-800">
              No Certification Requests Found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              {statusFilter === 'pending'
                ? 'All tool certification requests have been reviewed. Outstanding work!'
                : 'No requests match the current filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const toolDef = toolsDict[req.toolId];
            const toolColor = toolDef?.color || '#344ea2';

            return (
              <div
                key={req.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between bg-white ${
                  req.status === 'pending'
                    ? 'border-amber-300 shadow-sm ring-1 ring-amber-300/30'
                    : req.status === 'approved'
                    ? 'border-emerald-200 shadow-2xs'
                    : 'border-stone-200/90 opacity-90'
                }`}
              >
                <div>
                  {/* Card Header: Member Info & Status Pill */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <BuddyAvatarBadge
                        accountId={req.accountId}
                        size={48}
                        borderClassName="border-2 border-stone-200 bg-amber-50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-fredoka text-base font-bold text-stone-900 truncate">
                            {req.memberName}
                          </h4>
                          {req.tapCard && (
                            <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                              {req.tapCard}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                          Requested {new Date(req.requestedAt).toLocaleDateString()} at{' '}
                          {new Date(req.requestedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          <span>Needs Review</span>
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Approved</span>
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Declined</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tool Requested Details Pod */}
                  <div
                    className="p-3 rounded-2xl border mb-3 flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: `${toolColor}08`,
                      borderColor: `${toolColor}30`,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${toolColor}15`,
                          borderColor: `${toolColor}40`,
                          color: toolColor,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (toolDef?.iconSvg || SMCertifications.SVG_ICONS['tool-generic'])
                            .replace(/width="24" height="24"/g, 'width="22" height="22"'),
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-fredoka text-sm font-bold text-stone-900 truncate">
                          {req.toolName}
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {req.category}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                        style={{ backgroundColor: toolColor }}
                      >
                        {req.level === 'Advanced' ? 'Advanced (+)' : 'Beginner'}
                      </span>
                    </div>
                  </div>

                  {/* Member's Training Notes */}
                  {req.memberNote ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 text-xs text-stone-700 mb-3 space-y-1">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-stone-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Member Verification Note:</span>
                      </div>
                      <p className="italic leading-relaxed">&ldquo;{req.memberNote}&rdquo;</p>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-400 italic mb-3">
                      No training note submitted.
                    </div>
                  )}

                  {/* Review Audit Trail (if already reviewed) */}
                  {req.reviewedBy && (
                    <div className="p-2.5 rounded-xl bg-stone-100/70 text-[11px] text-stone-600 mb-3 space-y-0.5">
                      <div>
                        Reviewed by <strong>{req.reviewedBy}</strong> on{' '}
                        {req.reviewedAt && new Date(req.reviewedAt).toLocaleDateString()}
                      </div>
                      {req.adminFeedback && (
                        <div className="text-stone-700 font-medium">
                          Feedback: &ldquo;{req.adminFeedback}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                {req.status === 'pending' ? (
                  <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setActionTarget({
                          request: req,
                          action: 'reject',
                        })
                      }
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActionTarget({
                          request: req,
                          action: 'approve',
                        })
                      }
                      className="flex-2 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept & Grant Cert</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setActionTarget({
                          request: req,
                          action: req.status === 'approved' ? 'reject' : 'approve',
                        })
                      }
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      {req.status === 'approved' ? 'Revoke / Change' : 'Re-Approve'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Action Confirmation Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                actionTarget.action === 'approve'
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
                  : 'bg-gradient-to-r from-rose-800 to-stone-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-white/10 text-white">
                  {actionTarget.action === 'approve' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-300" />
                  )}
                </span>
                <div>
                  <h3 className="font-fredoka text-base sm:text-lg font-bold">
                    {actionTarget.action === 'approve'
                      ? 'Approve Tool Certification'
                      : 'Decline Certification Request'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    {actionTarget.request.memberName} • {actionTarget.request.toolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionTarget(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-stone-600 leading-relaxed">
                {actionTarget.action === 'approve' ? (
                  <>
                    Approving will add <strong>{actionTarget.request.certificationString}</strong> to{' '}
                    <strong>{actionTarget.request.memberName}</strong>&apos;s active certifications in Neon CRM, award +10 Buddy Bucks, and log a permanent constituent safety checkout.
                  </>
                ) : (
                  <>
                    Please provide constructive feedback so{' '}
                    <strong>{actionTarget.request.memberName}</strong> knows what steps or safety checkout they need to complete before re-applying.
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {actionTarget.action === 'approve'
                    ? 'Optional Congratulations Note / Shop Lead Remarks:'
                    : 'Reason / Feedback for Maker:'}
                </label>
                <textarea
                  rows={3}
                  value={actionFeedback}
                  onChange={(e) => setActionFeedback(e.target.value)}
                  placeholder={
                    actionTarget.action === 'approve'
                      ? 'e.g. Demonstrated safe emergency stop procedures and laser lens maintenance.'
                      : 'e.g. Hands-on table saw safety checkout with an instructor required prior to independent operation.'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-teal-500 placeholder-stone-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionTarget(null)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isProcessing}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50 ${
                    actionTarget.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : actionTarget.action === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
