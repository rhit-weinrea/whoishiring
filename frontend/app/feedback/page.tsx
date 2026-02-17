'use client';

import { useState, FormEvent } from 'react';
import { submitFeedback } from '@/lib/api';
import { useTheme } from '@/lib/theme';

export default function FeedbackPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await submitFeedback(email, subject, message);
      setSubmitted(true);
    } catch (fault: any) {
      setErrorMessage(fault.message || 'Something went wrong. Please try again.');
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
            <i className="bi bi-flag text-4xl" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
            <h1 className="text-3xl font-black mt-2" style={{ color: 'var(--foreground)' }}>Feedback</h1>
            <p className="mt-1" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Report an issue or share your thoughts
            </p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--outline)', background: 'var(--background)' }}>
                <i className="bi bi-check-circle text-2xl mb-2" style={{ color: 'var(--foreground)' }} aria-hidden="true" />
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Thanks for your feedback! We&apos;ll review it shortly.
                </p>
              </div>
              <a
                href="/dashboard"
                className="inline-block text-sm font-semibold transition-all hover:underline"
                style={{ color: 'var(--foreground)', opacity: 0.7 }}
              >
                Back to dashboard
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

                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(evt) => setSubject(evt.target.value)}
                    placeholder="Brief summary"
                    required
                    maxLength={200}
                    className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all"
                    style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(evt) => setMessage(evt.target.value)}
                    placeholder="Describe your issue or feedback..."
                    required
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border-2 outline-none transition-all resize-vertical"
                    style={{ background: 'var(--background)', borderColor: 'var(--outline)', color: 'var(--foreground)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all bg-smoky-rose-500 hover:bg-smoky-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center gap-2">
                    <i className={`bi ${isSubmitting ? 'bi-hourglass' : 'bi-send'}`} aria-hidden="true" />
                    {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                  </span>
                </button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/dashboard"
                  className="text-sm font-semibold transition-all hover:underline"
                  style={{ color: 'var(--foreground)', opacity: 0.7 }}
                >
                  Back to dashboard
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
