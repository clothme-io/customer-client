import { NextResponse } from 'next/server';
import { downloadEmailConfig, sendAppDownload } from '../../../src/lib/email/sendAppDownload.js';
import { claimDownloadRequest } from '../../../src/lib/email/downloadRequestStore.js';
export const runtime = 'nodejs';
export async function POST(request) {
  const reply = (body, status) => NextResponse.json(body, { status, headers: { 'Cache-Control':'no-store' } });
  let body;
  try { body = await request.json(); } catch { return reply({message:'Invalid request.'},400); }
  if (!body || typeof body !== 'object') return reply({message:'Invalid request.'},400);
  if (String(body.company || '').trim()) return reply({ok:true},200);
  const email = String(body.email || '').trim().toLowerCase();
  const requestId = String(body.requestId || '');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))
    return reply({message:'Enter a valid email address and try again.'},400);
  let config;
  try { config = downloadEmailConfig(); } catch { return reply({message:'App download links are not available yet. Please check back soon.'},503); }
  try {
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await claimDownloadRequest({email,requestId,ip});
    await sendAppDownload({email,requestId,config});
    return reply({ok:true},200);
  } catch (error) {
    if (error.message === 'RATE_LIMITED') return reply({message:'Please wait a minute before requesting another email.'},429);
    if (error.message === 'REQUEST_CONFLICT') return reply({message:'Please reload the page and try again.'},409);
    console.error('[app-download] request failed', {requestId, code: error.code || error.name});
    return reply({message:'We couldn’t send the email. Please try again.'},502);
  }
}
