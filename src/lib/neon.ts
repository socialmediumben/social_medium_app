import {
  MemberProfile,
  CommunityAnnouncement,
  CreateActivityInput,
  NeonPropertyItem,
  NeonSystemUser,
  PortalPhotoRecord,
  GameRoomMediaItem,
  StoreItem,
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
    let parsedStoreBalance = 0.00;

    const customFields: any[] = ind.accountCustomFields || [];
    for (const field of customFields) {
      const fieldId = String(field.id);
      const fieldName = (field.name || '').toLowerCase();

      // Store Balance / Wallet / Tab (Field matching name or configured ID)
      const configuredBalanceFieldId = typeof window !== 'undefined' ? localStorage.getItem('sm_neon_balance_field_id') : null;
      if (
        (configuredBalanceFieldId && fieldId === configuredBalanceFieldId) ||
        fieldName.includes('store balance') ||
        fieldName.includes('wallet') ||
        fieldName.includes('store_balance') ||
        fieldName.includes('tab balance') ||
        fieldName === 'balance'
      ) {
        if (field.value !== undefined && field.value !== null) {
          const num = parseFloat(String(field.value).replace(/[^0-9.-]/g, ''));
          if (!isNaN(num)) {
            parsedStoreBalance = num;
          }
        }
      }

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

    // If no custom field exists in CRM yet, check local cache fallback
    if (typeof window !== 'undefined' && accountId) {
      const localCachedBal = localStorage.getItem(`sm_balance_${accountId}`);
      if (localCachedBal !== null) {
        const num = parseFloat(localCachedBal);
        if (!isNaN(num)) {
          parsedStoreBalance = num;
        }
      }
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
      storeBalance: parsedStoreBalance,
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

export const GOOGLE_SHEET_PHOTOBOOTH_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1vwXuw-TBYxUXKXUSipa2drArRNXZuKNwbXFhxcVbIc0/gviz/tq?tqx=out:csv&sheet=Photobooth_Photos';

export const APPS_SCRIPT_PHOTOBOOTH_URL =
  'https://script.google.com/macros/s/AKfycbw8sI54Tsza9NwwLd-Id3DgGBg69L4N0VxwSp9d3_dryLdSB5CvmPGtPpzt2uymKRjwcQ/exec';

/**
 * Parses CSV text into rows and columns handling quotes and escapes.
 */
function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Fetches member photos directly from the permanent Google Sheet "Photobooth_Photos" tab.
 * This guarantees 24/7 availability even when the kiosk is off and Render is asleep.
 */
export async function fetchPhotoboothPhotosFromSheet(cardId?: string): Promise<PortalPhotoRecord[]> {
  try {
    const res = await fetch(`${GOOGLE_SHEET_PHOTOBOOTH_CSV_URL}&t=${Date.now()}`);
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCsv(text);
    if (!rows || rows.length < 2) return [];

    // Header index detection
    const header = rows[0];
    let timeIdx = 0;
    let cardIdx = 1;
    let titleIdx = 2;
    let urlIdx = 4;
    let fileIdx = 5;

    let isPhotoboothSheet = false;
    for (let i = 0; i < header.length; i++) {
      const norm = String(header[i] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (norm.includes('time') || norm.includes('date')) timeIdx = i;
      else if (norm.includes('card') || norm === 'id') cardIdx = i;
      else if (norm.includes('title') || norm.includes('name')) titleIdx = i;
      else if (norm.includes('url') || norm.includes('image') || norm.includes('link')) {
        urlIdx = i;
        isPhotoboothSheet = true;
      } else if (norm.includes('file')) {
        fileIdx = i;
        isPhotoboothSheet = true;
      }
    }

    // If Google Sheet returned default first tab rather than Photobooth_Photos, skip
    if (!isPhotoboothSheet && !header.some(h => String(h).toLowerCase().includes('card'))) {
      return [];
    }

    const candidateIds = new Set<string>();
    if (cardId) {
      const clean = String(cardId).trim().toLowerCase();
      candidateIds.add(clean);
      const norm = normalizeNfcTapCard(clean).toLowerCase();
      if (norm) candidateIds.add(norm);
      if (/^\d+$/.test(clean)) {
        try {
          candidateIds.add(Number(clean).toString(16).toLowerCase());
        } catch (_) {}
      } else if (/^[0-9a-fA-F]+$/.test(clean)) {
        try {
          const parsed = parseInt(clean, 16);
          if (!isNaN(parsed)) candidateIds.add(parsed.toString());
        } catch (_) {}
      }
    }

    const photos: PortalPhotoRecord[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      let rawUrl = String(row[urlIdx] || '').trim();
      let fileId = String(row[fileIdx] || '').trim();

      const driveMatch = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        if (!fileId) fileId = driveMatch[1];
        rawUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
      } else if (!rawUrl.startsWith('http') && fileId) {
        rawUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      }

      if (!rawUrl || !rawUrl.startsWith('http')) continue;

      const rawCardField = String(row[cardIdx] || '').trim();
      // Split multiple card IDs by comma, semicolon, pipe, slash, or space
      const cardTokens = rawCardField.split(/[,;|\/\s]+/).map(t => t.trim()).filter(Boolean);

      if (candidateIds.size > 0) {
        let match = false;
        for (const token of cardTokens) {
          const tClean = token.toLowerCase();
          const tNorm = normalizeNfcTapCard(tClean).toLowerCase();
          let tHex = '';
          let tDec = '';
          if (/^\d+$/.test(tClean)) {
            try {
              tHex = Number(tClean).toString(16).toLowerCase();
            } catch (_) {}
            tDec = tClean;
          } else if (/^[0-9a-fA-F]+$/.test(tClean)) {
            tHex = tClean;
            try {
              const parsed = parseInt(tClean, 16);
              if (!isNaN(parsed)) tDec = parsed.toString();
            } catch (_) {}
          }
          if (
            candidateIds.has(tClean) ||
            candidateIds.has(tNorm) ||
            (tHex && candidateIds.has(tHex)) ||
            (tDec && candidateIds.has(tDec))
          ) {
            match = true;
            break;
          }
        }
        if (!match) continue;
      }

      const rawTime = row[timeIdx];
      const timeMs = rawTime ? new Date(rawTime).getTime() : Date.now();

      photos.push({
        id: fileId || `sheet_${r}_${Date.now()}`,
        cardId: rawCardField,
        url: rawUrl,
        fileId: fileId,
        downloadUrl: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : rawUrl,
        timestamp: !isNaN(timeMs) ? new Date(timeMs).toISOString() : new Date().toISOString(),
      });
    }

    return photos;
  } catch {
    return [];
  }
}

/**
 * Fetches recent photobooth photos taken at the Portal Door kiosk, optionally filtered by card ID.
 * Multi-source query: combines Google Sheets database with Render proxy and local cache.
 */
export async function fetchPortalPhotos(cardId?: string): Promise<PortalPhotoRecord[]> {
  try {
    const photoMap = new Map<string, PortalPhotoRecord>();

    // 1. Fetch from Google Sheet permanent database (primary ground truth)
    const sheetPhotos = await fetchPhotoboothPhotosFromSheet(cardId);
    sheetPhotos.forEach((p) => {
      if (p && p.url) photoMap.set(p.url, p);
    });

    // 2. Fetch from Render proxy / in-memory cache
    try {
      const url = cardId
        ? `${NEON_PROXY_URL}/api/portal-photos?cardId=${encodeURIComponent(cardId)}`
        : `${NEON_PROXY_URL}/api/portal-photos`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.photos)) {
          data.photos.forEach((p: PortalPhotoRecord) => {
            if (p && p.url && !photoMap.has(p.url)) {
              photoMap.set(p.url, p);
            }
          });
        }
      }
    } catch (_) {}

    const all = Array.from(photoMap.values());
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const recent = all.filter((p) => {
      if (!p.timestamp) return true;
      const t = new Date(p.timestamp).getTime();
      return isNaN(t) || (now - t <= THIRTY_DAYS_MS);
    });

    recent.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    return recent;
  } catch {
    return [];
  }
}

/**
 * Saves a new portal photo record to the backend proxy and persistent datastores.
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

export type CostumeContestVisibility = 'all' | 'staff' | 'none';

export interface CostumeContestState {
  success: boolean;
  status: 'submissions' | 'voting' | 'ended';
  visibility?: CostumeContestVisibility;
  updatedAt?: string;
  entries: CostumeContestEntry[];
  totalVotes: number;
  userVotedEntryId?: string | null;
  leaderboard?: CostumeContestEntry[] | null;
}

/**
 * Helper to determine if a user with the given dev/staff status can view the contest.
 */
export function canViewContest(
  visibility: CostumeContestVisibility = 'all',
  isDev = false,
  isStaff = false
): boolean {
  if (isDev) return true; // Developers can always view and manage it
  if (visibility === 'all') return true;
  if (visibility === 'staff') return isStaff;
  return false; // 'none'
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
    params.set('_t', String(Date.now()));

    const qs = params.toString();
    const url = `${NEON_PROXY_URL}/api/costume-contest${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.success) return null;

    if (data.visibility && typeof window !== 'undefined') {
      try {
        const prev = localStorage.getItem('sm_contest_visibility');
        if (prev !== data.visibility) {
          localStorage.setItem('sm_contest_visibility', data.visibility);
          window.dispatchEvent(new CustomEvent('contest_visibility_changed', { detail: data.visibility }));
        }
      } catch (_) {}
    }

    return data as CostumeContestState;
  } catch (err) {
    console.warn('[Costume Contest] fetch error:', err);
    return null;
  }
}

/**
 * Updates the visibility setting of the Costume Contest ('all' | 'staff' | 'none').
 */
export async function setCostumeContestVisibility(
  visibility: CostumeContestVisibility
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('sm_contest_visibility', visibility);
      window.dispatchEvent(new CustomEvent('contest_visibility_changed', { detail: visibility }));
    } catch (_) {}
  }
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/costume-contest/visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Costume Contest] set visibility error:', err);
    return false;
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

// ============================================================================
// Game Room Media API (Google Drive & "Game_Room_Media" Google Sheets Tab)
// ============================================================================

/**
 * Fetches Game Room custom media items from the cloud database.
 */
export async function fetchGameRoomMedia(
  cardId?: string,
  refresh: boolean = false,
  isDev: boolean = false
): Promise<GameRoomMediaItem[]> {
  try {
    const params = new URLSearchParams();
    if (cardId) params.set('cardId', cardId);
    if (refresh) params.set('refresh', 'true');
    if (isDev) params.set('dev', 'true');
    params.set('_t', String(Date.now()));

    const qs = params.toString();
    const url = `${NEON_PROXY_URL}/api/gameroom-media${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  } catch (err) {
    console.warn('[Game Room Media] fetch error:', err);
    return [];
  }
}

/**
 * Uploads a custom battlemap, scene, or portrait to Google Drive and links it
 * to the user in the "Game_Room_Media" spreadsheet tab.
 */
export async function uploadGameRoomMedia(input: {
  cardId: string;
  uploaderName?: string;
  title: string;
  type: string;
  targetScreen?: string;
  visibility?: 'private' | 'public';
  fileData: string;
  fileName: string;
  mimeType: string;
}): Promise<{ success: boolean; item?: GameRoomMediaItem; error?: string }> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/gameroom-media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: input.cardId,
        uploaderName: input.uploaderName || '',
        title: input.title,
        type: input.type,
        targetScreen: input.targetScreen || 'table',
        visibility: input.visibility || 'public',
        file: input.fileData,
        fileName: input.fileName,
        mimeType: input.mimeType,
      }),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Server error (HTTP ${res.status}): ${text.substring(0, 150)}`,
      };
    }

    if (res.ok && data.success && data.item) {
      return { success: true, item: data.item };
    }
    return { success: false, error: data.error || 'Upload failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during upload' };
  }
}

/**
 * Deletes a Game Room media piece from the cloud database and Google Drive.
 */
export async function deleteGameRoomMedia(idOrFileId: string): Promise<boolean> {
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/gameroom-media/${encodeURIComponent(idOrFileId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==============================================================================
// STORE SELF-CHECKOUT, HYBRID WALLET & DONATIONS SYSTEM
// ==============================================================================

export const MAX_STORE_TAB_LIMIT = 25.00;

export const DEFAULT_STORE_ITEMS: StoreItem[] = [
  {
    id: 'soda-cold',
    name: 'Chilled Soda',
    category: 'drink',
    price: 2.00,
    description: 'Coke, Diet Coke, Sprite, Dr. Pepper, or Sunkist from the fridge',
    icon: '🥤',
  },
  {
    id: 'sparkling-water',
    name: 'Sparkling Water',
    category: 'drink',
    price: 1.50,
    description: 'LaCroix or Bubly chilled can',
    icon: '💧',
  },
  {
    id: 'energy-drink',
    name: 'Monster / Red Bull',
    category: 'drink',
    price: 3.00,
    description: 'High caffeine energy booster for late-night makers',
    icon: '⚡',
  },
  {
    id: 'snack-chips',
    name: 'Chips & Pretzels',
    category: 'snack',
    price: 1.50,
    description: 'Individual snack bags from the pantry',
    icon: '🥨',
  },
  {
    id: 'candy-bar',
    name: 'Candy Bar / Chocolate',
    category: 'snack',
    price: 1.00,
    description: 'Assorted chocolate bars & sweets',
    icon: '🍫',
  },
  {
    id: 'arduino-nano',
    name: 'Arduino Nano Microcontroller',
    category: 'electronics',
    price: 7.00,
    description: 'Breadboard-friendly ATmega328P with USB connection',
    icon: '🤖',
  },
  {
    id: 'pi-pico',
    name: 'Raspberry Pi Pico',
    category: 'electronics',
    price: 6.00,
    description: 'RP2040 dual-core ARM Cortex-M0+ board',
    icon: '🍓',
  },
  {
    id: 'breadboard-half',
    name: 'Solderless Breadboard',
    category: 'electronics',
    price: 3.00,
    description: '400 tie-point prototyping breadboard',
    icon: '🔌',
  },
  {
    id: 'filament-100g',
    name: 'PLA 3D Filament (100g)',
    category: 'materials',
    price: 3.00,
    description: 'High quality 1.75mm PLA filament by weight',
    icon: '🧵',
  },
  {
    id: 'acrylic-sheet',
    name: 'Laser Acrylic Scrap Sheet',
    category: 'materials',
    price: 2.50,
    description: '1/8" cast acrylic scrap sheet for laser cutting',
    icon: '✨',
  },
];

/**
 * Retrieves the store items, merging default catalog with any developer/staff customizations.
 */
export function fetchStoreItems(): StoreItem[] {
  if (typeof window === 'undefined') return DEFAULT_STORE_ITEMS;
  try {
    const saved = localStorage.getItem('sm_store_custom_items');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return DEFAULT_STORE_ITEMS;
}

/**
 * Saves custom store inventory list (editable in Developer Studio).
 */
export function saveCustomStoreItems(items: StoreItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sm_store_custom_items', JSON.stringify(items));
  } catch (_) {}
}

/**
 * Updates a member's store balance in Neon One and local cache.
 * Can be positive (prepaid credit) or negative (active tab up to -$25.00).
 */
export async function updateMemberStoreBalance(
  accountId: string,
  newBalance: number,
  itemsPurchased?: Array<{ name: string; price: number; quantity: number }>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const roundedBal = Math.round(newBalance * 100) / 100;

  // 1. Enforce tab ceiling: Cannot exceed -$25.00 debt
  if (roundedBal < -MAX_STORE_TAB_LIMIT) {
    return {
      success: false,
      newBalance,
      error: `Tab limit exceeded. Maximum allowable tab is $${MAX_STORE_TAB_LIMIT.toFixed(2)}. Please settle your tab via Neon One to continue.`,
    };
  }

  // 2. Always persist locally for instant UI response and offline safety
  if (typeof window !== 'undefined' && accountId) {
    try {
      localStorage.setItem(`sm_balance_${accountId}`, roundedBal.toFixed(2));
      const cachedProf = localStorage.getItem(`sm_profile_${accountId}`);
      if (cachedProf) {
        const parsed = JSON.parse(cachedProf);
        parsed.storeBalance = roundedBal;
        localStorage.setItem(`sm_profile_${accountId}`, JSON.stringify(parsed));
      }
    } catch (_) {}
  }

  // 3. Sync to Neon One if custom field ID is configured
  const configuredFieldId =
    typeof window !== 'undefined'
      ? localStorage.getItem('sm_neon_balance_field_id')
      : null;

  try {
    if (configuredFieldId && accountId) {
      await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          individualAccount: {
            accountCustomFields: [
              {
                id: configuredFieldId,
                value: roundedBal.toFixed(2),
              },
            ],
          },
        }),
      });
    }

    // 4. If items were purchased, log an audit activity in Neon One CRM
    if (itemsPurchased && itemsPurchased.length > 0 && accountId) {
      const summaryList = itemsPurchased
        .map((i) => `${i.quantity}x ${i.name} ($${(i.price * i.quantity).toFixed(2)})`)
        .join(', ');
      const totalSpent = itemsPurchased.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

      createNeonActivity({
        subject: `Store Self-Checkout: $${totalSpent.toFixed(2)}`,
        accountId,
        priority: 'Normal',
        note: `Purchased items: ${summaryList}. New Balance/Tab: $${roundedBal.toFixed(2)}.`,
      }).catch(() => {});
    }

    return { success: true, newBalance: roundedBal };
  } catch (err: any) {
    return { success: true, newBalance: roundedBal, error: 'Saved locally; Neon sync pending.' };
  }
}

/**
 * Returns the official Neon One Donation or Checkout URL.
 */
export function getNeonDonationUrl(
  purpose: 'general' | 'top_up' | 'tab_settle' = 'general',
  amount?: number,
  accountId?: string
): string {
  // Configured custom URL in Developer Studio or official Neon One page
  const customUrl =
    typeof window !== 'undefined'
      ? localStorage.getItem('sm_neon_donation_form_url')
      : null;

  let base =
    customUrl ||
    'https://socialmedium.app.neoncrm.com/forms/donate';

  const params = new URLSearchParams();
  if (amount && amount > 0) {
    params.set('amount', amount.toFixed(2));
  }
  if (accountId) {
    params.set('donor.accountId', accountId);
  }
  if (purpose === 'tab_settle') {
    params.set('purpose', 'Store Tab Settlement');
  } else if (purpose === 'top_up') {
    params.set('purpose', 'Store Gift Card Preload');
  }

  const query = params.toString();
  if (query) {
    base += (base.includes('?') ? '&' : '?') + query;
  }
  return base;
}
