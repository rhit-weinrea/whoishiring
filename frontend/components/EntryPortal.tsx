'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { authenticateViaCredentials } from '@/lib/api';

type EntryPortalProps = {
  onAuthenticated: () => void;
  toggleMode: () => void;
};

export default function EntryPortal({ onAuthenticated, toggleMode }: EntryPortalProps) {
  const [mailField, setMailField] = useState('');
  const [secretField, setSecretField] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const processAuthentication = async (evt: FormEvent) => {
    evt.preventDefault();
    setAlertMessage('');
    setIsVerifying(true);

    try {
      await authenticateViaCredentials(mailField, secretField);
      onAuthenticated();
    } catch (fault) {
      setAlertMessage(fault instanceof Error ? fault.message : 'Authentication rejected');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl border-2 border-slate-grey-200">
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2 text-slate-grey-900">
          Access Portal
        </h2>
        <p className="text-sm text-gray-600">Enter credentials to proceed</p>
      </div>
      
      {alertMessage && (
        <div className="mb-5 p-4 bg-white border-2 border-red-500 rounded text-red-800 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <i className="bi bi-exclamation-triangle text-black" aria-hidden="true" />
            {alertMessage}
          </span>
        </div>
      )}

      <form onSubmit={processAuthentication} className="space-y-5">
        <div className="relative">
          <label htmlFor="mail-entry" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Username
          </label>
          <input
            id="mail-entry"
            type="text"
            value={mailField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setMailField(evt.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="Your username"
          />
        </div>

        <div className="relative">
          <label htmlFor="secret-entry" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Password
          </label>
          <input
            id="secret-entry"
            type="password"
            value={secretField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setSecretField(evt.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="Your secret passphrase"
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full bg-smoky-rose-500 text-white py-3 px-6 rounded-lg transition-all font-bold border-2 border-smoky-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? 'Verifying identity...' : 'Launch dashboard'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        <button
          onClick={toggleMode}
          className="w-full text-center text-sm font-bold transition-colors underline decoration-2 underline-offset-4 text-smoky-rose-600"
        >
          First visit? Create account
        </button>
      </div>
    </div>
  );
}
