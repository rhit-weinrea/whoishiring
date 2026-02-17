'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateViaCredentials, forgeNewAccount } from '@/lib/api';
import { useTheme } from '@/lib/theme';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const routeController = useRouter();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const sessionTicket = localStorage.getItem('hn_session_vault');
    if (sessionTicket) {
      routeController.push('/dashboard');
    }
  }, []);

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await forgeNewAccount(email, password, username);
      } else {
        await authenticateViaCredentials(username, password);
      }
      routeController.push('/dashboard');
    } catch (fault: any) {
      setErrorMessage(fault.message || (isRegistering ? 'Registration failed.' : 'Login failed. Check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-lg transition-all hover:bg-[var(--muted-light)]"
          style={{ color: 'var(--foreground)' }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`} aria-hidden="true" />
        </button>
      </div>

      <div className="w-full max-w-md px-6">
        <div className="rounded-xl p-8 border-2" style={{ background: 'var(--surface)', borderColor: 'var(--outline)' }}>
          <div className="text-center mb-8">
            <i className="bi bi-briefcase text-4xl" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
            <h1 className="text-3xl font-black mt-2" style={{ color: 'var(--foreground)' }}>HN Career Hub</h1>
            <p className="mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              {isRegistering ? 'Create a new account' : 'Sign in to your account'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg border-2 text-sm font-medium" style={{ borderColor: 'red', color: 'red', background: 'var(--background)' }}>
              <span className="inline-flex items-center gap-2">
                <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                {errorMessage}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(evt) => setEmail(evt.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all"
                  style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(evt) => setUsername(evt.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all"
                style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(evt) => setPassword(evt.target.value)}
                placeholder={isRegistering ? 'Min 8 characters' : 'Enter your password'}
                required
                minLength={isRegistering ? 8 : undefined}
                className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all"
                style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-bold text-white transition-all bg-smoky-rose-500 hover:bg-smoky-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                <i className={`bi ${isSubmitting ? 'bi-hourglass' : isRegistering ? 'bi-person-plus' : 'bi-box-arrow-in-right'}`} aria-hidden="true" />
                {isSubmitting
                  ? (isRegistering ? 'Creating account...' : 'Signing in...')
                  : (isRegistering ? 'Create Account' : 'Sign In')}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={switchMode}
              className="text-sm font-semibold transition-all hover:underline"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
            <div>
              <a
                href="/dashboard"
                className="text-sm font-semibold transition-all hover:underline"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Continue as guest
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
