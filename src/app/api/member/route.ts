import { NextResponse } from 'next/server';
import { DEFAULT_MEMBER } from '@/lib/member-data';

// Persistent in-memory storage for current runtime
let currentMember = { ...DEFAULT_MEMBER };

export async function GET() {
  // If NEON_API_KEY and NEON_ORG_ID are present, we could proxy to Neon CRM:
  // const auth = Buffer.from(`${process.env.NEON_ORG_ID}:${process.env.NEON_API_KEY}`).toString('base64');
  // const res = await fetch(`https://api.neoncrm.com/v2/accounts/${currentMember.id}`, { headers: { 'Authorization': `Basic ${auth}` } });
  return NextResponse.json(currentMember);
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    currentMember = {
      ...currentMember,
      ...updates,
      emergencyContact: {
        ...currentMember.emergencyContact,
        ...(updates.emergencyContact || {})
      }
    };
    return NextResponse.json({ success: true, member: currentMember });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
  }
}
