'use client';

import { CertificationRequest, CertificationRequestStatus } from './types';
import { INITIAL_SANDBOX_CERTIFICATION_REQUESTS, isSandboxAccount } from './sandbox';
import {
  fetchGlobalAppSettings,
  updateGlobalAppSettings,
  updateMemberCertificationsInNeon,
  createNeonActivity,
} from './neon';

const CERT_REQUESTS_STORAGE_KEY = 'sm_certification_requests';

/**
 * Loads all certification requests from localStorage, falling back to initial demo seeds.
 */
export function loadCertificationRequests(): CertificationRequest[] {
  if (typeof window === 'undefined') {
    return [...INITIAL_SANDBOX_CERTIFICATION_REQUESTS];
  }

  try {
    const raw = localStorage.getItem(CERT_REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Certifications] Failed to parse local certification requests:', err);
  }

  // Fallback to initial seeds
  return [...INITIAL_SANDBOX_CERTIFICATION_REQUESTS];
}

/**
 * Persists certification requests to localStorage, notifies reactive listeners,
 * and background-syncs to the Neon cloud settings proxy.
 */
export function saveCertificationRequests(requests: CertificationRequest[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CERT_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(
      new CustomEvent('sm_cert_requests_updated', { detail: requests })
    );

    // Sync to global app settings proxy in background
    updateGlobalAppSettings({ certificationRequests: requests }).catch((err) => {
      console.warn('[Certifications] Background cloud sync notice:', err);
    });
  } catch (err) {
    console.error('[Certifications] Failed saving certification requests:', err);
  }
}

/**
 * Cloud refresh: fetches live certification requests from Neon cloud settings proxy
 * and merges any new or updated requests into local storage.
 */
export async function refreshCertificationRequests(): Promise<CertificationRequest[]> {
  const current = loadCertificationRequests();

  try {
    const settings = await fetchGlobalAppSettings();
    if (settings && Array.isArray(settings.certificationRequests)) {
      const cloudRequests: CertificationRequest[] = settings.certificationRequests;

      // Merge: cloud updates win if reviewedAt is newer or new ID
      const mergedMap = new Map<string, CertificationRequest>();
      current.forEach((r) => mergedMap.set(r.id, r));
      cloudRequests.forEach((cr) => {
        const existing = mergedMap.get(cr.id);
        if (!existing) {
          mergedMap.set(cr.id, cr);
        } else {
          // If cloud has review timestamp and existing doesn't, or cloud is newer
          const cloudDate = cr.reviewedAt ? new Date(cr.reviewedAt).getTime() : 0;
          const localDate = existing.reviewedAt ? new Date(existing.reviewedAt).getTime() : 0;
          if (cloudDate >= localDate) {
            mergedMap.set(cr.id, cr);
          }
        }
      });

      const mergedList = Array.from(mergedMap.values());
      // Sort newest requested first
      mergedList.sort(
        (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );

      saveCertificationRequests(mergedList);
      return mergedList;
    }
  } catch (err) {
    console.warn('[Certifications] Failed refreshing certification requests:', err);
  }

  return current;
}

export interface SubmitCertRequestInput {
  accountId: string;
  memberName: string;
  memberEmail?: string;
  tapCard?: string;
  toolId: string;
  toolName: string;
  category?: string;
  level?: 'Beginner' | 'Advanced';
  certificationString?: string;
  memberNote?: string;
}

/**
 * Submits a new tool certification request for a member.
 */
export async function submitCertificationRequest(
  input: SubmitCertRequestInput
): Promise<{ success: boolean; request?: CertificationRequest; error?: string }> {
  if (!input.accountId || !input.toolName) {
    return { success: false, error: 'Member account and tool name are required.' };
  }

  const current = loadCertificationRequests();
  const level = input.level || 'Beginner';
  const certString =
    input.certificationString ||
    (level === 'Advanced' ? `${input.toolName} (Advanced)` : input.toolName);

  // Check if member already has a pending request for this exact tool and level
  const existingPending = current.find(
    (r) =>
      r.accountId.toLowerCase() === input.accountId.toLowerCase() &&
      r.toolId.toLowerCase() === input.toolId.toLowerCase() &&
      r.level === level &&
      r.status === 'pending'
  );

  if (existingPending) {
    return {
      success: false,
      error: `You already have a pending request for ${certString}. Staff will review it shortly!`,
    };
  }

  const newRequest: CertificationRequest = {
    id: `cert_req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    accountId: input.accountId,
    memberName: input.memberName,
    memberEmail: input.memberEmail,
    tapCard: input.tapCard,
    toolId: input.toolId,
    toolName: input.toolName,
    category: input.category || 'General',
    level,
    certificationString: certString,
    memberNote: input.memberNote?.trim() || '',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  const updated = [newRequest, ...current];
  saveCertificationRequests(updated);

  return { success: true, request: newRequest };
}

/**
 * Approves a certification request:
 * 1. Appends the tool certification to the member's profile & Neon CRM Field 116.
 * 2. Automatically logs an "Equipment Safety Walkthrough" constituent activity in Neon.
 * 3. Awards XP / Buddy Bucks for leveling.
 * 4. Updates request status to 'approved'.
 */
export async function approveCertificationRequest(
  requestId: string,
  reviewerName: string,
  reviewerId?: string,
  adminFeedback?: string
): Promise<{ success: boolean; request?: CertificationRequest; error?: string }> {
  const current = loadCertificationRequests();
  const index = current.findIndex((r) => r.id === requestId);

  if (index === -1) {
    return { success: false, error: 'Certification request not found.' };
  }

  const req = current[index];
  if (req.status === 'approved') {
    return { success: false, error: 'This request is already approved.' };
  }

  const updatedReq: CertificationRequest = {
    ...req,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
    adminFeedback: adminFeedback || 'Certification reviewed and approved for independent operation.',
  };

  current[index] = updatedReq;
  saveCertificationRequests(current);

  // 1. Grant Certification to Member Account
  try {
    let existingCerts: string[] = [];
    if (typeof window !== 'undefined') {
      const storedMember = localStorage.getItem(`sm_member_${req.accountId}`);
      if (storedMember) {
        const parsed = JSON.parse(storedMember);
        existingCerts = Array.isArray(parsed.certifications) ? parsed.certifications : [];
      } else if (isSandboxAccount(req.accountId)) {
        const sandboxRaw = localStorage.getItem('sm_sandbox_member');
        if (sandboxRaw) {
          const parsed = JSON.parse(sandboxRaw);
          existingCerts = Array.isArray(parsed.certifications) ? parsed.certifications : [];
        }
      }
    }

    // Add if not already present
    const cleanCert = updatedReq.certificationString;
    const certAlreadyGranted = existingCerts.some(
      (c) => c.toLowerCase() === cleanCert.toLowerCase()
    );

    if (!certAlreadyGranted) {
      const newCerts = [...existingCerts, cleanCert];
      await updateMemberCertificationsInNeon(req.accountId, newCerts);
    }
  } catch (err) {
    console.warn('[Certifications] Error updating member certifications:', err);
  }

  // 2. Automatically Log Activity to Neon CRM Constituent Ledger
  try {
    await createNeonActivity({
      subject: `Tool Certification Approved: ${updatedReq.certificationString}`,
      typeId: '6', // Safety / Certification
      statusId: '4', // Completed
      priority: 'Normal',
      systemUserIds: reviewerId ? [reviewerId] : undefined,
      accountId: req.accountId,
      accountIds: [req.accountId],
      note: `Approved by ${reviewerName}. Member verification note: "${req.memberNote || 'Self-reported training completed.'}"${adminFeedback ? ` | Staff Feedback: "${adminFeedback}"` : ''}`,
    });
  } catch (err) {
    console.warn('[Certifications] Notice: Could not record Neon CRM audit activity:', err);
  }

  // 3. Award Leveling XP & Buddy Bucks
  try {
    const { awardBuddyBucks } = await import('./buddy');
    await awardBuddyBucks(
      req.accountId,
      10,
      `Tool certification earned: ${updatedReq.certificationString}`
    );
  } catch (err) {
    console.warn('[Certifications] Reward notice:', err);
  }

  return { success: true, request: updatedReq };
}

/**
 * Rejects a certification request with staff feedback.
 */
export async function rejectCertificationRequest(
  requestId: string,
  reviewerName: string,
  reviewerId?: string,
  adminFeedback?: string
): Promise<{ success: boolean; request?: CertificationRequest; error?: string }> {
  const current = loadCertificationRequests();
  const index = current.findIndex((r) => r.id === requestId);

  if (index === -1) {
    return { success: false, error: 'Certification request not found.' };
  }

  const req = current[index];
  const updatedReq: CertificationRequest = {
    ...req,
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
    adminFeedback: adminFeedback || 'Certification could not be approved at this time. Please speak with a shop lead.',
  };

  current[index] = updatedReq;
  saveCertificationRequests(current);

  return { success: true, request: updatedReq };
}

/**
 * Returns all certification requests submitted by a specific member account.
 */
export function getMemberCertificationRequests(accountId?: string | null): CertificationRequest[] {
  if (!accountId) return [];
  const cleanId = accountId.trim().toLowerCase();
  const all = loadCertificationRequests();
  return all
    .filter((r) => r.accountId.trim().toLowerCase() === cleanId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

/**
 * Returns count of currently unresolved (pending) requests for the staff badge.
 */
export function getPendingCertificationRequestsCount(): number {
  const all = loadCertificationRequests();
  return all.filter((r) => r.status === 'pending').length;
}
