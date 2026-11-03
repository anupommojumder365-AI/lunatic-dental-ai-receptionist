import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // This endpoint mints credentials only for our fixed avatar, never arbitrary caller configurations.
  const origin = request.headers.get('origin');
  let originHost: string | null = null;
  try { originHost = origin ? new URL(origin).host : null; } catch { /* Invalid origin. */ }
  if (!originHost || originHost !== request.headers.get('host') || request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Request not allowed.' }, { status: 403 });
  }
  const apiKey = process.env.SIMLI_API_KEY;
  const faceId = process.env.NEXT_PUBLIC_SIMLI_AVATAR_ID;
  if (!apiKey || !faceId) return NextResponse.json({ error: 'Live avatar is not configured.' }, { status: 503 });
  try {
    // Official Simli token API. Only the short-lived session token reaches the browser.
    const response = await fetch('https://api.simli.ai/compose/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-simli-api-key': apiKey },
      body: JSON.stringify({ faceId, maxSessionLength: 600, maxIdleTime: 120, audioInputFormat: 'pcm16' }),
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return NextResponse.json({ error: 'Live avatar session unavailable. Please try again later.' }, { status: 502 });
    const data = await response.json();
    if (typeof data.session_token !== 'string' || !data.session_token) throw new Error('Missing session token');
    return NextResponse.json({ session_token: data.session_token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to connect to the live avatar service.' }, { status: 502 });
  }
}
