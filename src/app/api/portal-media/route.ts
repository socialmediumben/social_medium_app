import { NextResponse } from 'next/server';
import { DEFAULT_PORTAL_MEDIA } from '@/lib/member-data';

// In-memory runtime persistence for personal card media
let personalMedia = { ...DEFAULT_PORTAL_MEDIA };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');

  // If cardId matches or default requested, return the user's personal media mapping
  return NextResponse.json(personalMedia);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.title || !data.filePath) {
      return NextResponse.json({ success: false, error: 'Title and file path are required' }, { status: 400 });
    }

    personalMedia = {
      ...personalMedia,
      title: data.title,
      type: data.type || 'video',
      filePath: data.filePath,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return NextResponse.json({ success: true, media: personalMedia });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update personal media' }, { status: 400 });
  }
}
