'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { useTheme } from '@/lib/theme';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!token) {
      setErrorMessage('Missing reset token. Please use the link from your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (fault: any) {
      setErrorMessage(fault.message || 'Invalid or expired reset token.');
    } finally {
      setIsSubmitting(false);
    }
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
            <i className="bi bi-shield-lock text-4xl" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
            <h1 className="text-3xl font-black mt-2" style={{ color: 'var(--foreground)' }}>New Password</h1>
            <p className="mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Enter your new password below
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--outline)', background: 'var(--background)' }}>
                <i className="bi bi-check-circle text-2xl mb-2" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Password reset successfully. You can now sign in with your new password.
                </p>
              </div>
              <a
                href="/"
                className="inline-block text-sm font-semibold transition-all hover:underline"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Go to login
              </a>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg border-2 text-sm font-medium" style={{ borderColor: 'red', color: 'red', background: 'var(--background)' }}>
                  <span className="inline-flex items-center gap-2">
                    <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                    {errorMessage}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(evt) => setNewPassword(evt.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all"
                    style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(evt) => setConfirmPassword(evt.target.value)}
                    placeholder="Re-enter your password"
                    required
                    minLength={8}
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
                    <i className={`bi ${isSubmitting ? 'bi-hourglass' : 'bi-check-lg'}`} aria-hidden="true" />
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/"
                  className="text-sm font-semibold transition-all hover:underline"
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  Back to login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
