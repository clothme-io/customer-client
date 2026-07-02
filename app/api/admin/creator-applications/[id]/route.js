import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendApiUrl } from '../../../_utils.mjs';

function getAdminKey() {
  const cookieStore = cookies();
  return cookieStore.get('cm-admin-key')?.value;
}

export async function GET(request, { params }) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(backendApiUrl(`/creator-applications/${params.id}`), {
      headers: { 'x-admin-key': adminKey },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[admin/creator-applications/[id]] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 502 });
  }
}

export async function PATCH(request, { params }) {
  const adminKey = getAdminKey();
  if (!adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(backendApiUrl(`/creator-applications/${params.id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[admin/creator-applications/[id]] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 502 });
  }
}
