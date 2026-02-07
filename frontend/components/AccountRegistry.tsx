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
      setAlertMsg('Passwords must be identical');
      return;
    }

    if (codeField.length < 6) {
      setAlertMsg('Password requires 8+ characters');
      return;
    }

    if (aliasField.length < 3) {
      setAlertMsg('Username needs 3+ characters');
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
   <div className="w-full max-w-md p-8 bg-[var(--background)] rounded-xl border-2 border-[var(--muted-light)]">
  <h2 className="text-3xl font-black mb-2 text-[var(--secondary)]">Account Registry</h2>
  <p className="text-sm text-[var(--muted)]">Craft your identity</p>

  {alertMsg && (
    <div className="mb-5 p-4 bg-[var(--background)] border-2 border-yellow-500 rounded text-yellow-800 text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <i className="bi bi-exclamation-triangle text-[var(--foreground)]" />
        {alertMsg}
      </span>
    </div>
  )}

  <button className="w-full bg-[var(--primary)] text-[var(--background)] py-3 px-6 rounded-lg transition-all font-bold border-2 border-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed">
    Create account
  </button>
</div>

  );
}
