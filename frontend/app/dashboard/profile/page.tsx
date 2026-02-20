'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBeam from '@/components/NavigationBeam';
import { verifyIdentity, terminateSession, updateEmail } from '@/lib/api';

export default function ProfileManager() {
  const [isRetrieving, setIsRetrieving] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailBuffer, setEmailBuffer] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const routeController = useRouter();

  useEffect(() => {
    verifyAndRetrieve();
  }, []);

  const verifyAndRetrieve = async () => {
    const sessionTicket = typeof window !== 'undefined' ? localStorage.getItem('hn_session_vault') : null;

    if (!sessionTicket) {
      routeController.push('/');
      return;
    }

    try {
      const profile = await verifyIdentity();
      setDisplayName(profile.username || '');
      setCurrentEmail(profile.email_address || '');
      setEmailBuffer(profile.email_address || '');
    } catch {
      // Token may be invalid
    } finally {
      setIsRetrieving(false);
    }
  };

  const executeLogout = () => {
    terminateSession();
    routeController.push('/');
  };

  const executeEmailSave = async () => {
    const trimmed = emailBuffer.trim();
    if (!trimmed || trimmed === currentEmail) {
      setIsEditingEmail(false);
      setEmailBuffer(currentEmail);
      return;
    }
    try {
      setIsSavingEmail(true);
      setStatusMessage('');
      const updated = await updateEmail(trimmed);
      setCurrentEmail(updated.email_address);
      setEmailBuffer(updated.email_address);
      setIsEditingEmail(false);
      setStatusMessage('Email updated.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (fault: any) {
      setStatusMessage(fault.message || 'Failed to update email.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  if (isRetrieving) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <NavigationBeam />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">
              <i className="bi bi-hourglass" aria-hidden="true" />
            </div>
            <p className="text-[var(--muted)] font-bold">Retrieving profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NavigationBeam />

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-black text-[var(--foreground)] mb-2 flex items-center gap-2">
              <i className="bi bi-gear" aria-hidden="true" />
              Profile Manager
            </h2>
            {displayName && (
              <p className="text-[var(--muted)] flex items-center gap-2">
                <i className="bi bi-person-circle" aria-hidden="true" />
                {displayName}
              </p>
            )}
            {!displayName && (
              <p className="text-[var(--muted)]">Customize your experience</p>
            )}
            {currentEmail && !isEditingEmail && (
              <p className="text-[var(--muted)] text-sm flex items-center gap-2 mt-1">
                <i className="bi bi-envelope" aria-hidden="true" />
                {currentEmail}
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="text-smoky-rose-500 hover:text-smoky-rose-700 font-semibold text-xs"
                >
                  Change
                </button>
              </p>
            )}
            {isEditingEmail && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="email"
                  value={emailBuffer}
                  onChange={(evt) => setEmailBuffer(evt.target.value)}
                  onKeyDown={(evt) => { if (evt.key === 'Enter') executeEmailSave(); }}
                  placeholder="you@example.com"
                  className="px-3 py-1 text-sm border-2 border-[var(--outline)] rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-[var(--surface)] text-[var(--foreground)]"
                  autoFocus
                />
                <button
                  onClick={executeEmailSave}
                  disabled={isSavingEmail}
                  className="text-sm font-semibold text-white bg-smoky-rose-500 px-3 py-1 rounded-lg disabled:opacity-50"
                >
                  {isSavingEmail ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditingEmail(false); setEmailBuffer(currentEmail); }}
                  className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <button
            onClick={executeLogout}
            className="mt-2 bg-[var(--surface)] text-[var(--foreground)] px-4 py-2 rounded-lg font-semibold border-2 border-[var(--outline)] hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all flex items-center gap-2"
          >
            <i className="bi bi-box-arrow-right" aria-hidden="true" />
            Log out
          </button>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-[var(--surface)] border-2 border-green-500 rounded text-green-800 font-medium">
            {statusMessage}
          </div>
        )}
      </main>
    </div>
  );
}
