'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { authenticateViaCredentials } from '@/lib/api';

type EntryPortalProps = {
  onAuthenticated: () => void;
  toggleMode: () => void;
};

// EntryPortal is disabled. Always route to main page.
export default function EntryPortal({ onAuthenticated, toggleMode }: EntryPortalProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
};
