import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CreatorsLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/creators');
      } else {
        setError('Incorrect password.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login — ClothME</title>
      </Head>
      <div className="admin-login-page page-white">
        <div className="admin-login-box">
          <p className="admin-login-brand">ClothME Admin</p>
          <h1 className="admin-login-title">Creator Program</h1>
          <form onSubmit={handleSubmit} className="admin-login-form">
            <label htmlFor="password" className="sr-only">Admin Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              className="admin-login-input"
            />
            {error && <p className="admin-login-error" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="admin-login-btn">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
