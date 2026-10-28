import { MemberProfile, CommunityAnnouncement } from './types';

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
let cachedSystemUsers: { firstName: string; lastName: string }[] | null = null;

export async function fetchNeonSystemUsers(): Promise<{ firstName: string; lastName: string }[]> {
  if (cachedSystemUsers) return cachedSystemUsers;
  try {
    const res = await fetch(`${NEON_PROXY_URL}/api/v2/properties/systemUsers`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        cachedSystemUsers = data
          .filter((u: any) => !u.lastName?.includes('(Deactivated User)'))
          .map((u: any) => ({
            firstName: (u.firstName || '').trim().toLowerCase(),
            lastName: (u.lastName || '').trim().toLowerCase(),
          }));
        return cachedSystemUsers;
      }
    }
  } catch (_) {}

  // Fallback to active makerspace system users if network unavailable
  return [
    { firstName: 'ben', lastName: 'braunstein' },
    { firstName: 'chelsea', lastName: 'union' },
    { firstName: 'dj', lastName: 'harrigan' },
    { firstName: 'ilana', lastName: 'jaffe-lewis' },
    { firstName: 'max', lastName: 'ben-dror' },
    { firstName: 'starline', lastName: 'hodge' },
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
        u.lastName === checkLast &&
        (u.firstName === checkFirst || (checkPref && u.firstName === checkPref))
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
 * Searches Neon One for a member by their exact "Tap Card" custom field,
 * then retrieves their complete account profile and custom fields.
 */
export async function searchMemberByTapCard(tapCard: string): Promise<NeonLookupResult> {
  const cleanCard = tapCard.trim();
  if (!cleanCard) {
    return { success: false, error: 'Tap Card cannot be empty.' };
  }

  try {
    // 1. Search for account by Tap Card custom field
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
            value: cleanCard,
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

    if (!searchResponse.ok || (Array.isArray(searchData) && searchData[0]?.message)) {
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
    return await fetchMemberProfileByAccountId(String(accountId), cleanCard);
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
