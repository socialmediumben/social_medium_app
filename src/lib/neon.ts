import { MemberProfile } from './types';

export const NEON_PROXY_URL = 'https://square-checkin-backend.onrender.com';

export interface NeonLookupResult {
  success: boolean;
  member?: MemberProfile;
  error?: string;
}

/**
 * Searches Neon One for a member by their exact "Tap Card" custom field
 */
export async function searchMemberByTapCard(tapCard: string): Promise<NeonLookupResult> {
  const cleanCard = tapCard.trim();
  if (!cleanCard) {
    return { success: false, error: 'Tap Card cannot be empty.' };
  }

  try {
    const response = await fetch(`${NEON_PROXY_URL}/api/v2/accounts/search`, {
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
        outputFields: [
          'Account ID',
          'First Name',
          'Last Name',
          'Email 1',
          'Phone 1 Number',
          'Membership Name',
          'Membership Status',
          'Tap Card',
          'Certifications',
          'Portal Media',
        ],
      }),
    });

    const data = await response.json();

    // Check if Neon returned an API error (e.g. OrgId is invalid or unauthorized)
    if (!response.ok || (Array.isArray(data) && data[0]?.message)) {
      const msg = data[0]?.message || data?.message || 'Neon One API error.';
      return { success: false, error: msg };
    }

    const results = data.searchResults || [];
    if (results.length === 0) {
      return { success: false, error: `No member found in Neon One with Tap Card "${cleanCard}".` };
    }

    const raw = results[0];
    const firstName = raw['First Name'] || '';
    const lastName = raw['Last Name'] || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Member';

    // Normalize Certifications (can be array or string)
    let certsList: string[] = [];
    if (Array.isArray(raw['Certifications'])) {
      certsList = raw['Certifications'];
    } else if (typeof raw['Certifications'] === 'string' && raw['Certifications'].trim()) {
      certsList = raw['Certifications'].split(',').map((c: string) => c.trim());
    }

    const memberProfile: MemberProfile = {
      tapCard: raw['Tap Card'] || cleanCard,
      name: fullName,
      email: raw['Email 1'] || '',
      phone: raw['Phone 1 Number'] || '',
      membershipTier: raw['Membership Name'] || raw['Membership Status'] || 'Active Member',
      certifications: certsList,
      portalMedia: raw['Portal Media'] || '',
    };

    return { success: true, member: memberProfile };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Neon One backend proxy.',
    };
  }
}
