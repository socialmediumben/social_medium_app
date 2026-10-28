import { MemberProfile } from './types';

export const NEON_PROXY_URL = 'https://neon-kiosk.onrender.com';

// Neon One Constituent OAuth 2.0 Credentials & Endpoints
export const NEON_OAUTH_CLIENT_ID =
  'QBY_hNyRYp1-aVKwOmQ8ELY6tCd6vW2KJ00k57X3hWCY1wsiz87dFfD7IT7hVgqiyjsBkw8VUPJoOuBy0xVnfg==';
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

    // Parse custom fields:
    // Field 116 = Certifications (list / optionValues)
    // Field 117 = Portal Media (string value)
    // Field 114 = Tap Card (string value)
    // Field 81  = Interests (list / optionValues)
    // Field 83  = Custom Interests (string value)
    let certsList: string[] = [];
    let portalMediaUrl = '';
    let foundTapCard = fallbackTapCard || '';
    let interestsList: string[] = [];
    let customInterestsStr = '';

    const customFields: any[] = ind.accountCustomFields || [];
    for (const field of customFields) {
      const fieldId = String(field.id);
      const fieldName = (field.name || '').toLowerCase();

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
    }

    const memberProfile: MemberProfile = {
      accountId: String(accountId),
      tapCard: foundTapCard,
      firstName,
      lastName,
      preferredName: preferredName || undefined,
      name: fullName,
      email,
      phone,
      membershipTier,
      membershipStatus: ind.accountCurrentMembershipStatus || 'Active',
      certifications: certsList,
      portalMedia: portalMediaUrl,
      interests: interestsList,
      customInterests: customInterestsStr,
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

    // Extract Account ID from OAuth token response
    // Neon returns account_id, accountId, sub, or inside data
    const accountId =
      tokenData.account_id ||
      tokenData.accountId ||
      tokenData.sub ||
      tokenData.user_id ||
      tokenData.data?.accountId ||
      tokenData.data?.account_id;

    if (!accountId) {
      return {
        success: false,
        error: 'Authentication succeeded, but no Neon One account ID was returned.',
      };
    }

    return await fetchMemberProfileByAccountId(String(accountId));
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
