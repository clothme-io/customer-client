import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getAdminKey() {
  const cookieStore = cookies();
  return cookieStore.get('cm-admin-key')?.value;
}

export async function GET(request) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const { searchParams } = new URL(request.url);

  const upstream = new URL(`${apiUrl}/creator-applications`);
  for (const [key, value] of searchParams.entries()) {
    upstream.searchParams.set(key, value);
  }

  try {
    const res = await fetch(upstream.toString(), {
      headers: { 'x-admin-key': adminKey },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[admin/creator-applications] fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 502 });
  }
}
