import { MemberProfile } from './types';

export const NEON_PROXY_URL = 'https://neon-kiosk.onrender.com';

export interface NeonLookupResult {
  success: boolean;
  member?: MemberProfile;
  error?: string;
}

export interface NeonUpdateResult {
  success: boolean;
  error?: string;
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

    // 2. Fetch full account record to get custom fields and contact info
    const accountResponse = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/${accountId}`);
    const accountData = await accountResponse.json();

    if (!accountResponse.ok || !accountData.individualAccount) {
      return { success: false, error: 'Failed to load full member details from Neon One.' };
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
    let certsList: string[] = [];
    let portalMediaUrl = '';
    let foundTapCard = cleanCard;

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
