import { appDownloadTemplate } from './appDownloadTemplate.js';
export function downloadEmailConfig(env = process.env) {
  const downloadUrl = new URL(env.APP_DOWNLOAD_URL || 'https://example.com/clothme-download');
  const logoUrl = new URL(env.EMAIL_LOGO_URL || 'https://clothme.io/email/clothme-logo.png');
  if (env.APP_DOWNLOAD_EMAIL_ENABLED !== 'true' || !env.RESEND_API_KEY ||
      downloadUrl.protocol !== 'https:' || logoUrl.protocol !== 'https:' ||
      /(^|\.)example\.(com|org|net)$/.test(downloadUrl.hostname)) {
    throw new Error('DOWNLOAD_EMAIL_UNAVAILABLE');
  }
  const address = env.EMAIL_FROM || 'noreply@clothme.io';
  return { key: env.RESEND_API_KEY, from: address.includes('<') ? address : `ClothME <${address}>`, downloadUrl: downloadUrl.href, logoUrl: logoUrl.href };
}
export async function sendAppDownload({ email, requestId, config, fetcher = fetch }) {
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `app-download/${requestId}` },
    body: JSON.stringify({ from: config.from, to: [email], ...appDownloadTemplate(config) }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.id) throw new Error('DOWNLOAD_EMAIL_SEND_FAILED');
  return body.id;
}
