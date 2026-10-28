import { NEON_PROXY_URL } from './neon';

export interface NeonEvent {
  id: number | string;
  name: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM:SS
  endDate?: string;
  endTime?: string;
  thumbnailUrl?: string;
  category?: string[] | string;
  detailsUrl?: string;
  registrationUrl?: string;
  archived?: boolean;
  capacity?: number;
  addressLine1?: string;
  addressCity?: string;
}

export const EVENTS_LIST_FALLBACK_URL =
  'https://socialmedium.app.neoncrm.com/np/constituent/eventList.do?orgId=socialmedium';

/**
 * Returns true if an event belongs to the "workshop" / "workshops" category.
 */
export function isWorkshopEvent(event: NeonEvent): boolean {
  if (!event || !event.category) return false;
  const cat = event.category;
  if (Array.isArray(cat)) {
    return cat.some((c) => {
      const s = String(c).trim().toLowerCase();
      return s === 'workshops' || s === 'workshop';
    });
  }
  if (typeof cat === 'string') {
    const s = cat.trim().toLowerCase();
    return s === 'workshops' || s === 'workshop';
  }
  return false;
}

/**
 * Formats time from "19:00:00" to "7:00 PM"
 */
export function formatEventTime(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
}

/**
 * Formats "2026-11-15" to "Sunday, Nov 15"
 */
export function formatEventDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (_) {
    return dateStr;
  }
}

/**
 * Returns the direct registration URL on Neon One for an event.
 */
export function getEventRegistrationUrl(event: NeonEvent): string {
  if (event.registrationUrl && event.registrationUrl.trim()) {
    return event.registrationUrl;
  }
  return `https://socialmedium.app.neoncrm.com/np/clients/socialmedium/eventRegistration.jsp?event=${event.id}`;
}

/**
 * Fetches all upcoming events from the Neon One proxy.
 * Filters out archived events, past events, and clubs.
 */
export async function fetchUpcomingEvents(): Promise<NeonEvent[]> {
  try {
    let allEvents: NeonEvent[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages && currentPage < 5) {
      const res = await fetch(
        `${NEON_PROXY_URL}/api/v2/events?currentPage=${currentPage}&pageSize=200`,
        { cache: 'no-store' }
      );
      if (!res.ok) break;

      const data = await res.json();
      const events = data.events || data.searchResults || (Array.isArray(data) ? data : []);
      allEvents = allEvents.concat(events);

      if (data.pagination && data.pagination.totalPages) {
        totalPages = data.pagination.totalPages;
      }
      currentPage++;
    }

    // Determine current date in Los Angeles
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === 'year')?.value || '2026';
    const month = parts.find((p) => p.type === 'month')?.value || '01';
    const day = parts.find((p) => p.type === 'day')?.value || '01';
    const todayStr = `${year}-${month}-${day}`;

    const isClub = (e: NeonEvent) => {
      const cat = e.category;
      const hasClubCat = Array.isArray(cat)
        ? cat.some((c) => String(c).toLowerCase().includes('club'))
        : typeof cat === 'string' && cat.toLowerCase().includes('club');
      const hasClubName = e.name && e.name.toLowerCase().includes('club');
      return hasClubCat || hasClubName;
    };

    return allEvents
      .filter((e) => !e.archived && e.startDate >= todayStr && !isClub(e))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch (err) {
    console.error('Error loading events from Neon One proxy:', err);
    return [];
  }
}

/**
 * Fetches the list of event IDs the member is already registered for.
 */
export async function fetchAccountRegistrations(accountId: string): Promise<string[]> {
  if (!accountId) return [];

  try {
    let allEventIds: string[] = [];
    let currentPage = 0;
    let totalPages = 1;

    while (currentPage < totalPages && currentPage < 5) {
      const res = await fetch(
        `${NEON_PROXY_URL}/api/v2/accounts/${accountId}/eventRegistrations?currentPage=${currentPage}&pageSize=100`,
        { cache: 'no-store' }
      );
      if (!res.ok) break;

      const data = await res.json();
      const regs: any[] = data.eventRegistrations || [];
      allEventIds = allEventIds.concat(regs.map((r) => String(r.eventId)));

      if (data.pagination && data.pagination.totalPages) {
        totalPages = data.pagination.totalPages;
      }
      currentPage++;
    }

    return Array.from(new Set(allEventIds));
  } catch (err) {
    console.error('Error loading account event registrations:', err);
    return [];
  }
}

export interface RsvpResult {
  success: boolean;
  fallbackUrl?: string;
  error?: string;
}

/**
 * Performs a free RSVP for an active member directly into Neon One.
 */
export async function rsvpForEvent(
  event: NeonEvent,
  accountId: string
): Promise<RsvpResult> {
  const regUrl = getEventRegistrationUrl(event);

  if (!accountId) {
    return {
      success: false,
      fallbackUrl: regUrl,
      error: 'Please sign in with your Tap Card to RSVP.',
    };
  }

  // Workshops are paid or require custom checkout on Neon One
  if (isWorkshopEvent(event)) {
    return {
      success: false,
      fallbackUrl: regUrl,
      error: 'Workshops require registration directly on Neon One.',
    };
  }

  const now = new Date();
  const dateStr = now.toISOString();

  const payload = {
    eventId: String(event.id),
    registrantAccountId: String(accountId),
    registrationDateTime: dateStr,
    totalCharge: 0,
    registrationAmount: 0,
    tickets: [
      {
        attendees: [{ accountId: String(accountId) }],
      },
    ],
  };

  try {
    const response = await fetch(`${NEON_PROXY_URL}/api/v2/eventRegistrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // If code 1124 or Next-Gen custom event storefront required
      if (
        data &&
        Array.isArray(data) &&
        (data[0]?.code === '1124' || data[0]?.message?.includes('Neon Events'))
      ) {
        return {
          success: false,
          fallbackUrl: regUrl,
          error: 'This event requires completion on Neon One.',
        };
      }
      const msg =
        (Array.isArray(data) && data[0]?.message) ||
        data?.message ||
        'Registration could not be completed.';
      return { success: false, fallbackUrl: regUrl, error: msg };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      fallbackUrl: regUrl,
      error: err.message || 'Network error registering for event.',
    };
  }
}
