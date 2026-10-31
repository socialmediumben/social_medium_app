import {
  MemberProfile,
  CommunityAnnouncement,
  CreateActivityInput,
  NeonPropertyItem,
  NeonSystemUser,
  PortalPhotoRecord,
} from './types';

export const NEON_PROXY_URL = 'https://neon-kiosk.onrender.com';

// Neon One Constituent OAuth 2.0 Credentials & Endpoints
export const NEON_OAUTH_CLIENT_ID =
  'QBY_hNyRYp1-aVKwOmQ8ELY6tCd6vW2KJ00k57X3hWCY1wsiz87dFfD7lT7hVgqiyjsBkw8VUPJoOuBy0xVnfg==';
export const NEON_OAUTH_AUTH_URL =
  'https://socialmedium.app.neoncrm.com/nx/auth/oauth/auth';

/**
 * Computes the OAuth callback redirect URI based on the current window origin.
 */
export function getNeonOAuthRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback/`;
  }
  return 'https://app.socialmedium.space/auth/callback/';
}

/**
 * Generates the full Neon One OAuth authorization URL.
 */
export function getNeonOAuthLoginUrl(): string {
  const redirectUri = getNeonOAuthRedirectUri();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: NEON_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
  });
  return `${NEON_OAUTH_AUTH_URL}?${params.toString()}`;
}

export interface NeonLookupResult {
  success: boolean;
  member?: MemberProfile;
  error?: string;
}

export interface NeonUpdateResult {
  success: boolean;
  error?: string;
}

export interface NeonInterestOption {
  id: string;
  name: string;
}

// System Users Cache
let cachedSystemUsers: NeonSystemUser[] | null = null;

export async function fetchNeonSystemUsers(): Promise<NeonSystemUser[]> {
  if (cachedSystemUsers) return cachedSystemUsers;
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/v2/properties/systemUsers`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cachedSystemUsers = data
          .filter((u: any) => !u.lastName?.includes('(Deactivated User)'))
          .map((u: any) => ({
            id: String(u.id || ''),
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
            firstName: (u.firstName || '').trim(),
            lastName: (u.lastName || '').trim(),
          }));
        return cachedSystemUsers;
      }
    }
  } catch (_) {}

  // Fallback to active makerspace system users if network unavailable
  return [
    { id: '3', name: 'Ben Braunstein', firstName: 'Ben', lastName: 'Braunstein' },
    { id: '3585', name: 'Chelsea Union', firstName: 'Chelsea', lastName: 'Union' },
    { id: '3508', name: 'DJ Harrigan', firstName: 'DJ', lastName: 'Harrigan' },
    { id: '3643', name: 'Ilana Jaffe-Lewis', firstName: 'Ilana', lastName: 'Jaffe-Lewis' },
    { id: '3644', name: 'Max Ben-Dror', firstName: 'Max', lastName: 'Ben-Dror' },
    { id: '3645', name: 'Starline Hodge', firstName: 'Starline', lastName: 'Hodge' },
  ];
}

/**
 * Standard Interest options configured in Neon One Custom Field 81 ("Interests").
 */
export const NEON_INTEREST_OPTIONS: NeonInterestOption[] = [
  { id: '12', name: 'Cosplay' },
  { id: '13', name: 'Electronics' },
  { id: '11', name: 'Games' },
  { id: '3', name: 'Process Art' },
  { id: '1', name: 'Film' },
  { id: '2', name: 'Fine Arts' },
  { id: '6', name: 'Miniatures/Model Making' },
  { id: '7', name: 'Puppets' },
  { id: '10', name: 'Digital Fab.' },
  { id: '30', name: 'Fiber Arts' },
  { id: '8', name: 'Show & Tell' },
  { id: '9', name: 'Maker Melee' },
  { id: '4', name: 'Education' },
  { id: '29', name: 'Family Programs' },
];

export interface NeonGenderOption {
  code: string;
  name: string;
}

export const NEON_GENDER_OPTIONS: NeonGenderOption[] = [
  { code: 'HH', name: 'He/Him' },
  { code: 'HT', name: 'He/Them' },
  { code: 'SH', name: 'She//Her' },
  { code: 'ST', name: 'She/Them' },
  { code: 'TT', name: 'They/Them' },
  { code: 'ANY', name: 'Any' },
  { code: 'OTHER', name: 'Other' },
];

/**
 * Fetches an individual member profile and custom fields directly by Neon Account ID.
 */
export async function fetchMemberProfileByAccountId(
  accountId: string,
  fallbackTapCard?: string
): Promise<NeonLookupResult> {
  if (!accountId) {
    return { success: false, error: 'Account ID is required.' };
  }

  try {
    const accountResponse = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`);
    const accountData = await accountResponse.json();

    if (!accountResponse.ok || !accountData.individualAccount) {
      return { success: false, error: 'Failed to load member details from Neon One.' };
    }

    const ind = accountData.individualAccount;
    const contact = ind.primaryContact || {};
    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    const preferredName = contact.preferredName || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Member';
    const email = contact.email1 || '';
    const phone =
      (contact.addresses && contact.addresses[0]?.phone1) ||
      ind.smsNumber ||
      contact.phone1 ||
      '';
    const membershipTier = ind.accountCurrentMembershipStatus
      ? `${ind.accountCurrentMembershipStatus} Member`
      : 'Active Member';

    // Parse Neon One Primary Contact Gender / Pronouns
    const genderObj = contact.gender || {};
    const rawGenderCode = genderObj.code || '';
    const rawGenderName = genderObj.name || genderObj.description || '';
    let legacyPronouns = '';

    // Parse custom fields:
    // Field 116 = Certifications (list / optionValues)
    // Field 117 = Portal Media (string value)
    // Field 114 = Tap Card (string value)
    // Field 81  = Interests (list / optionValues)
    // Field 83  = Custom Interests (string value)
    // Field 118 = App Developer (checkbox option "TRUE")
    // Field 82  = Pronouns (Legacy)
    let certsList: string[] = [];
    let portalMediaUrl = '';
    let foundTapCard = fallbackTapCard || '';
    let interestsList: string[] = [];
    let customInterestsStr = '';
    let isAppDeveloper = false;

    const customFields: any[] = ind.accountCustomFields || [];
    for (const field of customFields) {
      const fieldId = String(field.id);
      const fieldName = (field.name || '').toLowerCase();

      // Pronouns (Legacy Field 82)
      if (fieldId === '82' || fieldName.includes('pronoun')) {
        if (Array.isArray(field.optionValues) && field.optionValues[0]) {
          legacyPronouns = field.optionValues[0].name || String(field.optionValues[0]);
        } else if (field.value) {
          legacyPronouns = String(field.value);
        }
      }

      // Certifications
      if (fieldId === '116' || fieldName === 'certifications') {
        if (Array.isArray(field.optionValues)) {
          certsList = field.optionValues.map((opt: any) => opt.name || String(opt));
        } else if (field.value) {
          certsList = [String(field.value)];
        }
      }

      // Portal Media
      if (fieldId === '117' || fieldName === 'portal media') {
        portalMediaUrl = field.value || '';
      }

      // Tap Card
      if (fieldId === '114' || fieldName === 'tap card') {
        if (field.value) {
          foundTapCard = field.value;
        }
      }

      // Interests (Field 81)
      if (fieldId === '81' || fieldName === 'interests') {
        if (Array.isArray(field.optionValues)) {
          interestsList = field.optionValues.map((opt: any) => opt.name || String(opt));
        } else if (field.value) {
          interestsList = [String(field.value)];
        }
      }

      // Custom Interests (Field 83)
      if (fieldId === '83' || fieldName === 'custom interests') {
        customInterestsStr = field.value || '';
      }

      // App Developer (Field 118)
      if (fieldId === '118' || fieldName === 'app developer') {
        if (Array.isArray(field.optionValues) && field.optionValues.length > 0) {
          isAppDeveloper = field.optionValues.some((opt: any) => {
            const val = (opt.name || opt.value || String(opt)).toUpperCase();
            return val === 'TRUE' || val === 'YES' || val === '1';
          });
        } else if (field.value) {
          const val = String(field.value).toUpperCase();
          isAppDeveloper = val === 'TRUE' || val === 'YES' || val === '1';
        }
      }
    }

    // Determine if constituent is a Neon One System User (Staff access)
    const systemUsers = await fetchNeonSystemUsers();
    const checkFirst = (firstName || '').trim().toLowerCase();
    const checkPref = (preferredName || '').trim().toLowerCase();
    const checkLast = (lastName || '').trim().toLowerCase();

    let isSystemUser = systemUsers.some(
      (u) =>
        u.lastName.toLowerCase() === checkLast &&
        (u.firstName.toLowerCase() === checkFirst || (checkPref && u.firstName.toLowerCase() === checkPref))
    );

    if (isAppDeveloper) {
      isSystemUser = true; // All developers automatically have staff access
    }

    const mappedGenderName = rawGenderCode
      ? NEON_GENDER_OPTIONS.find((g) => g.code.toUpperCase() === rawGenderCode.toUpperCase())?.name
      : undefined;
    const resolvedPronouns = rawGenderName || mappedGenderName || legacyPronouns || '';

    const memberProfile: MemberProfile = {
      accountId: String(accountId),
      tapCard: foundTapCard,
      firstName,
      lastName,
      preferredName: preferredName || undefined,
      gender: rawGenderName || resolvedPronouns || undefined,
      genderCode: rawGenderCode || undefined,
      pronouns: resolvedPronouns || undefined,
      name: fullName,
      email,
      phone,
      membershipTier,
      membershipStatus: ind.accountCurrentMembershipStatus || 'Active',
      certifications: certsList,
      portalMedia: portalMediaUrl,
      interests: interestsList,
      customInterests: customInterestsStr,
      isSystemUser,
      isAppDeveloper,
    };

    return { success: true, member: memberProfile };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Neon One backend proxy.',
    };
  }
}

/**
 * Normalizes any NFC/RFID Tap Card format to canonical decimal ID.
 * Supports:
 * - 8-10 digit decimal: "1423631962"
 * - 8-char hex (e.g. from USB readers): "54dae65a" -> "1423631962"
 * - 7-byte / 4-byte UID from phone (colon/space/dash): "5A:E6:DA:54:25:41:89" -> "1423631962"
 * - 14-char raw hex from phone: "5ae6da54254189" -> "1423631962"
 */
export function normalizeNfcTapCard(raw: string): string {
  if (!raw) return '';
  const clean = String(raw).trim();

  // 1. If it's already an 8-10 digit decimal number, return as-is
  if (/^\d{8,10}$/.test(clean)) {
    return clean;
  }

  // 2. 7-byte (or 4-byte) UID separated by colons, hyphens, or spaces (e.g. from phone "5A:E6:DA:54:25:41:89")
  const byteParts = clean.split(/[:\-\s]+/);
  if (byteParts.length >= 4 && byteParts.every((p) => /^[0-9a-fA-F]{1,2}$/.test(p))) {
    const hex4Reverse = byteParts.slice(0, 4).reverse().map((p) => p.padStart(2, '0')).join('');
    const dec = parseInt(hex4Reverse, 16);
    if (!isNaN(dec)) return dec.toString();
  }

  // 3. 14-hex character unspaced string (7 bytes from phone, e.g. "5AE6DA54254189")
  if (/^[0-9a-fA-F]{14}$/.test(clean)) {
    const b0 = clean.substring(0, 2);
    const b1 = clean.substring(2, 4);
    const b2 = clean.substring(4, 6);
    const b3 = clean.substring(6, 8);
    const dec = parseInt(b3 + b2 + b1 + b0, 16);
    if (!isNaN(dec)) return dec.toString();
  }

  // 4. 8-hex character string (e.g. USB reader "54dae65a")
  if (/^[0-9a-fA-F]{8}$/.test(clean)) {
    const dec = parseInt(clean, 16);
    if (!isNaN(dec)) return dec.toString();
  }

  return clean;
}

/**
 * Searches Neon One for a member by their exact "Tap Card" custom field,
 * then retrieves their complete account profile and custom fields.
 * Automatically normalizes hex ("54dae65a"), 7-byte phone scans, and decimal IDs.
 */
export async function searchMemberByTapCard(tapCard: string): Promise<NeonLookupResult> {
  const cleanCard = tapCard.trim();
  if (!cleanCard) {
    return { success: false, error: 'Tap Card cannot be empty.' };
  }
  const normalizedCard = normalizeNfcTapCard(cleanCard);

  try {
    const executeSearch = async (cardVal: string) => {
      const searchResponse = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchFields: [
            {
              field: 'Tap Card',
              operator: 'EQUAL',
              value: cardVal,
            },
          ],
          outputFields: ['First Name', 'Last Name', 'Preferred Name', 'Account ID'],
          pagination: {
            currentPage: 0,
            pageSize: 10,
          },
        }),
      });

      const searchData = await searchResponse.json();
      return { ok: searchResponse.ok, searchData };
    };

    let { ok, searchData } = await executeSearch(normalizedCard);

    // Fallback: if not found by normalized ID and normalized differs from cleanCard, try raw cleanCard
    if ((!searchData.searchResults || searchData.searchResults.length === 0) && normalizedCard !== cleanCard) {
      const fallback = await executeSearch(cleanCard);
      if (fallback.searchData.searchResults && fallback.searchData.searchResults.length > 0) {
        ok = fallback.ok;
        searchData = fallback.searchData;
      }
    }

    if (!ok || (Array.isArray(searchData) && searchData[0]?.message)) {
      const msg = searchData[0]?.message || searchData?.message || 'Neon One search failed.';
      return { success: false, error: msg };
    }

    const results = searchData.searchResults || [];
    if (results.length === 0) {
      return { success: false, error: `No member found in Neon One with Tap Card "${cleanCard}".` };
    }

    const accountId = results[0]['Account ID'] || results[0].accountId;
    if (!accountId) {
      return { success: false, error: 'Account ID missing from search results.' };
    }

    // 2. Fetch full account record
    return await fetchMemberProfileByAccountId(String(accountId), normalizedCard);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Neon One backend proxy.',
    };
  }
}

/**
 * Exchanges a Neon One OAuth authorization code for an account token,
 * then retrieves the authenticated constituent's complete profile.
 */
export async function authenticateWithNeonOAuth(
  code: string,
  redirectUri: string
): Promise<NeonLookupResult> {
  if (!code) {
    return { success: false, error: 'Authorization code is missing.' };
  }

  try {
    const tokenResponse = await fetch(`${NEON_PROXY_URL}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      const msg =
        tokenData.error_description ||
        tokenData.error ||
        tokenData.message ||
        'OAuth authentication failed.';
      return { success: false, error: msg };
    }

    // Extract Account ID from OAuth token response.
    // In Neon One Constituent OAuth, the "access_token" value is literally the constituent's Account ID!
    let rawId =
      tokenData.access_token ||
      tokenData.account_id ||
      tokenData.accountId ||
      tokenData.sub ||
      tokenData.user_id ||
      tokenData.data?.accountId ||
      tokenData.data?.account_id ||
      tokenData.id;

    if (!rawId && typeof tokenData === 'string' && /^\d+$/.test(tokenData.trim())) {
      rawId = tokenData.trim();
    }

    // If access_token is formatted as a JWT (header.payload.signature), extract ID from payload
    if (typeof rawId === 'string' && rawId.includes('.')) {
      try {
        const payloadBase64 = rawId.split('.')[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(payloadJson);
        rawId = parsed.accountId || parsed.account_id || parsed.sub || parsed.id || rawId;
      } catch (_) {}
    }

    if (!rawId) {
      console.error('Neon One token response payload:', tokenData);
      return {
        success: false,
        error: `Authentication succeeded, but no account ID was identified in token response: ${JSON.stringify(tokenData)}`,
      };
    }

    const cleanAccountId = String(rawId).replace(/^bearer\s+/i, '').trim();
    return await fetchMemberProfileByAccountId(cleanAccountId);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error communicating with Neon One OAuth proxy.',
    };
  }
}

/**
 * Updates the "Portal Media" single-line text field (ID 117) directly in Neon One.
 */
export async function updatePortalMediaInNeon(
  accountId: string,
  mediaUrl: string
): Promise<NeonUpdateResult> {
  if (!accountId) {
    return { success: false, error: 'No account ID provided for update.' };
  }

  try {
    const payload = {
      individualAccount: {
        accountCustomFields: [
          {
            id: '117',
            value: mediaUrl,
          },
        ],
      },
    };

    const response = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg = errData?.message || errData?.[0]?.message || 'Failed to save to Neon One.';
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error updating Portal Media in Neon One.',
    };
  }
}

/**
 * Updates the member's Interests (Field 81) and Custom Interests (Field 83) directly in Neon One.
 */
export async function updateMemberInterestsInNeon(
  accountId: string,
  selectedOptionNames: string[],
  customInterests: string
): Promise<NeonUpdateResult> {
  if (!accountId) {
    return { success: false, error: 'No account ID provided for update.' };
  }

  try {
    // Map selected names or IDs to option value objects
    const optionValues = selectedOptionNames
      .map((item) => {
        const found = NEON_INTEREST_OPTIONS.find(
          (opt) => opt.name.toLowerCase() === item.toLowerCase() || opt.id === item
        );
        return found ? { id: found.id, name: found.name } : null;
      })
      .filter(Boolean);

    const payload = {
      individualAccount: {
        accountCustomFields: [
          {
            id: '81',
            optionValues: optionValues,
          },
          {
            id: '83',
            value: (customInterests || '').trim(),
          },
        ],
      },
    };

    const response = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg =
        errData?.message ||
        errData?.[0]?.message ||
        'Failed to update interests in Neon One.';
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error updating interests in Neon One.',
    };
  }
}

/**
 * Updates primary contact details (first name, last name, preferred name, pronouns/gender, email, phone) in Neon One.
 */
export async function updateMemberContactInNeon(
  accountId: string,
  fields: {
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    genderCode?: string;
    email?: string;
    phone?: string;
  }
): Promise<NeonUpdateResult> {
  if (!accountId) {
    return { success: false, error: 'Account ID is required.' };
  }

  try {
    const contactPayload: any = {};
    if (fields.firstName !== undefined) contactPayload.firstName = fields.firstName;
    if (fields.lastName !== undefined) contactPayload.lastName = fields.lastName;
    if (fields.preferredName !== undefined) contactPayload.preferredName = fields.preferredName;
    if (fields.genderCode !== undefined) {
      contactPayload.gender = fields.genderCode ? { code: fields.genderCode } : null;
    }
    if (fields.email !== undefined) contactPayload.email1 = fields.email;

    const accountPayload: any = {
      primaryContact: contactPayload,
    };
    if (fields.phone !== undefined) {
      accountPayload.smsNumber = fields.phone.replace(/[^0-9]/g, '');
    }

    const response = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ individualAccount: accountPayload }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const msg =
        errData?.message ||
        errData?.[0]?.message ||
        'Failed to update member contact in Neon One.';
      return { success: false, error: msg };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error updating member contact in Neon One.',
    };
  }
}

/**
 * Fetches the active community announcement from the backend proxy.
 */
export async function fetchCommunityAnnouncement(): Promise<CommunityAnnouncement | null> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/announcement`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.announcement || null;
  } catch {
    return null;
  }
}

/**
 * Updates the community announcement via the backend proxy.
 */
export async function updateCommunityAnnouncement(announcement: {
  title: string;
  message: string;
  author?: string;
  active?: boolean;
}): Promise<{ success: boolean; announcement?: CommunityAnnouncement; error?: string }> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/announcement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcement),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update announcement.' };
    }
    return { success: true, announcement: data.announcement };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error updating announcement.' };
  }
}

/**
 * Fetches available Neon One activity types (e.g. Invitation, Ask, Stewardship, Discovery, Other).
 */
export async function fetchActivityTypes(): Promise<NeonPropertyItem[]> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/v2/properties/activityTypes`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [
      { id: '1', name: 'Invitation' },
      { id: '2', name: 'Ask / Solicitation' },
      { id: '3', name: 'Thank You / Stewardship' },
      { id: '4', name: 'Discovery' },
      { id: '5', name: 'Other' },
    ];
  }
}

/**
 * Fetches available Neon One activity statuses (e.g. Not Started, In Progress, Completed, Deferred).
 */
export async function fetchActivityStatuses(): Promise<NeonPropertyItem[]> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/v2/properties/activityStatuses`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [
      { id: '2', name: 'Not Started' },
      { id: '3', name: 'In Progress' },
      { id: '4', name: 'Completed' },
      { id: '5', name: 'Waiting For Others' },
      { id: '6', name: 'Deferred' },
      { id: '7', name: 'Other' },
    ];
  }
}

/**
 * Searches Neon CRM constituent accounts by name or account ID.
 */
export async function searchNeonAccounts(
  query: string
): Promise<Array<{ accountId: string; name: string; email?: string }>> {
  const clean = (query || '').trim();
  if (!clean) return [];

  try {
    // If query is a pure number, search by Account ID, otherwise by First Name or Last Name
    const isNum = /^\d+$/.test(clean);
    const searchFields = isNum
      ? [{ field: 'Account ID', operator: 'EQUAL', value: clean }]
      : [{ field: 'First Name', operator: 'CONTAIN', value: clean }];

    const res = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchFields,
        outputFields: ['Account ID', 'First Name', 'Last Name', 'Email 1'],
        pagination: { currentPage: 0, pageSize: 8 },
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const results = data.searchResults || [];

    return results.map((item: any) => {
      const accountId = String(item['Account ID'] || item.accountId || '');
      const first = item['First Name'] || '';
      const last = item['Last Name'] || '';
      const email = item['Email 1'] || item.email || '';
      const name = `${first} ${last}`.trim() || `Account #${accountId}`;
      return { accountId, name, email };
    });
  } catch {
    return [];
  }
}

/**
 * Converts 24-hour time (e.g. "14:30") to Neon One CRM required 12-hour AM/PM format (e.g. "2:30 PM").
 */
export function formatTimeToNeon12Hour(timeStr?: string): string | null {
  if (!timeStr || !timeStr.trim()) return null;
  const clean = timeStr.trim();
  if (/(am|pm)/i.test(clean)) return clean;

  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return null;

  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;

  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Creates a new Activity record in Neon CRM.
 * Supports multiple client accounts and multiple assigned staff members.
 */
export async function createNeonActivity(
  input: CreateActivityInput
): Promise<{ success: boolean; activityId?: string; error?: string }> {
  if (!input.subject || !input.subject.trim()) {
    return { success: false, error: 'Activity subject is required.' };
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const formattedStartTime = formatTimeToNeon12Hour(input.startTime);
    const formattedEndTime = formatTimeToNeon12Hour(input.endTime);

    const payload: any = {
      subject: input.subject.trim(),
      status: { id: input.statusId || '4' }, // Default to "Completed"
      priority: input.priority || 'Normal',
      activityDates: {
        startDate: input.startDate || todayStr,
        startTime: formattedStartTime,
        endDate: input.endDate || null,
        endTime: formattedEndTime,
        timeZone: {
          id: '82', // (GMT-07:00) Pacific Time - Los Angeles
        },
      },
    };

    if (input.typeId) {
      payload.activityType = { id: input.typeId };
    }

    // Support multiple staff users
    const staffIds: string[] = [];
    if (Array.isArray(input.systemUserIds)) {
      staffIds.push(...input.systemUserIds.filter(Boolean));
    }
    if (input.systemUserId && !staffIds.includes(input.systemUserId)) {
      staffIds.push(input.systemUserId);
    }
    if (staffIds.length > 0) {
      payload.systemUserId = staffIds;
    }

    // Support multiple constituent accounts
    const accountIds: string[] = [];
    if (Array.isArray(input.accountIds)) {
      accountIds.push(...input.accountIds.filter(Boolean));
    }
    if (input.accountId && !accountIds.includes(input.accountId)) {
      accountIds.push(input.accountId);
    }
    if (accountIds.length > 0) {
      payload.clientAccount = accountIds.map((id) => ({ accountId: String(id) }));
    }

    if (input.note && input.note.trim()) {
      payload.note = input.note.trim();
    }

    const response = await fetch(`${NEON_PROXY_URL}/api/v2/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      let errMsg = 'Failed to create activity in Neon One.';
      if (Array.isArray(data) && data[0]?.message) {
        errMsg = data.map((d: any) => d.message).join(' ');
      } else if (data?.message) {
        errMsg = data.message;
      }
      return { success: false, error: errMsg };
    }

    return { success: true, activityId: String(data.id || '') };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error creating Neon CRM activity.' };
  }
}

/**
 * Fetches recent photobooth photos taken at the Portal Door kiosk, optionally filtered by card ID.
 */
export async function fetchPortalPhotos(cardId?: string): Promise<PortalPhotoRecord[]> {
  try {
    const url = cardId
      ? `${NEON_PROXY_URL}/api/portal-photos?cardId=${encodeURIComponent(cardId)}`
      : `${NEON_PROXY_URL}/api/portal-photos`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.photos) ? data.photos : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new portal photo record to the backend proxy.
 */
export async function savePortalPhotoRecord(photo: {
  cardId: string;
  url: string;
  fileId?: string;
  downloadUrl?: string;
  timestamp?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/portal-photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Costume Contest Types & API
// ============================================================================

export interface CostumeContestEntry {
  id: string;
  photoUrl: string;
  fileId?: string;
  cardIds?: string[];
  participantNames?: string[];
  costumeTitle?: string;
  timestamp: string;
  votesCount?: number;
  votePercentage?: number;
}

export interface CostumeContestState {
  success: boolean;
  status: 'submissions' | 'voting' | 'ended';
  updatedAt?: string;
  entries: CostumeContestEntry[];
  totalVotes: number;
  userVotedEntryId?: string | null;
  leaderboard?: CostumeContestEntry[] | null;
}

/**
 * Fetches the current Costume Contest state and entries.
 */
export async function fetchCostumeContest(
  isDev = false,
  voterId?: string
): Promise<CostumeContestState | null> {
  try {
    const params = new URLSearchParams();
    if (isDev) params.set('dev', 'true');
    if (voterId) params.set('voterId', voterId);

    const qs = params.toString();
    const url = `${NEON_PROXY_URL}/api/costume-contest${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.success) return null;
    return data as CostumeContestState;
  } catch (err) {
    console.warn('[Costume Contest] fetch error:', err);
    return null;
  }
}

/**
 * Changes the active status of the Costume Contest ('submissions' | 'voting' | 'ended').
 */
export async function setCostumeContestStatus(
  status: 'submissions' | 'voting' | 'ended'
): Promise<boolean> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/costume-contest/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Casts a vote for an entry in the Costume Contest (1 vote per voterId).
 */
export async function castCostumeContestVote(
  voterId: string,
  entryId: string
): Promise<{ success: boolean; totalVotes?: number; error?: string }> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/costume-contest/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId, entryId }),
    });
    const data = await res.json();
    return {
      success: res.ok && Boolean(data.success),
      totalVotes: data.totalVotes,
      error: data.error,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error voting.' };
  }
}

/**
 * Deletes an entry from the Costume Contest (developer only).
 */
export async function deleteCostumeContestEntry(entryId: string): Promise<boolean> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/costume-contest/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resets the Costume Contest back to blank state (developer only).
 */
export async function resetCostumeContest(): Promise<boolean> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/costume-contest/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}
