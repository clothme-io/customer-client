import { useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
export function AppDownloadForm() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const pending = useRef(false);
  const attempt = useRef(null);
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '').trim().toLowerCase();
    if (!attempt.current || attempt.current.email !== email)
      attempt.current = { email, requestId: crypto.randomUUID() };
    pending.current = true;
    setStatus('sending'); setError('');
    try {
      await apiFetch('/api/app-download', {method:'POST',body:JSON.stringify({...attempt.current,company:data.get('company') || ''})});
      setStatus('sent');
    } catch (err) { setStatus('idle'); setError(err.message || 'Could not send the email. Please try again.'); }
    finally { pending.current = false; }
  }
  if (status === 'sent') return <p role="status">Your download-link email has been sent. Check your inbox or spam folder.</p>;
  return <div className="waitlist-block">
    <form className="waitlist-form waitlist-form--mock" onSubmit={submit} aria-busy={status === 'sending'}>
      <label className="sr-only" htmlFor="app-download-email">Email address</label>
      <input id="app-download-email" name="email" type="email" autoComplete="email" placeholder="Email address" maxLength={254} required disabled={status === 'sending'} aria-describedby={error ? 'app-download-error' : 'app-download-note'} />
      <div hidden aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
      <button type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send me a download link'}</button>
    </form>
    {error ? <p className="waitlist-error" id="app-download-error" role="alert">{error}</p> : null}
    <p className="waitlist-note" id="app-download-note">We’ll use your email to send the app download link.</p>
  </div>;
}
