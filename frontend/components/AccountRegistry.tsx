'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { forgeNewAccount } from '@/lib/api';

type RegistryProps = {
  onAccountCreated: () => void;
  returnToEntry: () => void;
};

export default function AccountRegistry({ onAccountCreated, returnToEntry }: RegistryProps) {
  const [aliasField, setAliasField] = useState('');
  const [mailField, setMailField] = useState('');
  const [codeField, setCodeField] = useState('');
  const [verifyField, setVerifyField] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [isForging, setIsForging] = useState(false);

  const executeForge = async (evt: FormEvent) => {
    evt.preventDefault();
    setAlertMsg('');

    if (codeField !== verifyField) {
      setAlertMsg('Secret codes must be identical');
      return;
    }

    if (codeField.length < 6) {
      setAlertMsg('Secret code requires 6+ characters');
      return;
    }

    if (aliasField.length < 3) {
      setAlertMsg('Alias needs 3+ characters');
      return;
    }

    setIsForging(true);

    try {
      await forgeNewAccount(mailField, codeField, aliasField);
      onAccountCreated();
    } catch (fault) {
      setAlertMsg(fault instanceof Error ? fault.message : 'Account creation failed');
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl border-2 border-slate-grey-200">
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2 text-slate-grey-900">
          Account Registry
        </h2>
        <p className="text-sm text-gray-600">Craft your identity</p>
      </div>
      
      {alertMsg && (
        <div className="mb-5 p-4 bg-white border-2 border-yellow-500 rounded text-yellow-800 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <i className="bi bi-exclamation-triangle text-black" aria-hidden="true" />
            {alertMsg}
          </span>
        </div>
      )}

      <form onSubmit={executeForge} className="space-y-5">
        <div className="relative">
          <label htmlFor="alias-field" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Your Alias
          </label>
          <input
            id="alias-field"
            type="text"
            value={aliasField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setAliasField(evt.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="cyberhacker99"
          />
        </div>

        <div className="relative">
          <label htmlFor="registry-mail" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Electronic Mail
          </label>
          <input
            id="registry-mail"
            type="email"
            value={mailField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setMailField(evt.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="name@domain.example"
          />
        </div>

        <div className="relative">
          <label htmlFor="secret-code" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Secret Code
          </label>
          <input
            id="secret-code"
            type="password"
            value={codeField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setCodeField(evt.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="Min 6 chars required"
          />
        </div>

        <div className="relative">
          <label htmlFor="verify-code" className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Verify Code
          </label>
          <input
            id="verify-code"
            type="password"
            value={verifyField}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setVerifyField(evt.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-white"
            placeholder="Repeat secret code"
          />
        </div>

        <button
          type="submit"
          disabled={isForging}
          className="w-full bg-smoky-rose-500 text-white py-3 px-6 rounded-lg transition-all font-bold border-2 border-smoky-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isForging ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t-2 border-gray-200">
        <button
          onClick={returnToEntry}
          className="w-full text-center text-sm font-bold transition-colors underline decoration-2 underline-offset-4 text-smoky-rose-600"
        >
          Return to portal
        </button>
      </div>
    </div>
  );
}
