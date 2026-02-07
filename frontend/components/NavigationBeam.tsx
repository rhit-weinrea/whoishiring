'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { terminateSession } from '@/lib/api';
import { useTheme } from '@/lib/theme';

type NavigationBeamProps = {
  isGuest?: boolean;
};

export default function NavigationBeam({ isGuest = false }: NavigationBeamProps) {
  const activePath = usePathname();
  const { isDark, toggleTheme } = useTheme();

  const executeLogout = () => {
    terminateSession();
    window.location.href = '/';
  };

  const linkRegistry = isGuest
    ? [{ path: '/dashboard', text: 'Listings', icon: 'bi-list' }]
    : [
        { path: '/dashboard', text: 'Listings', icon: 'bi-list' },
        { path: '/dashboard/pinned', text: 'Pinned', icon: 'bi-star' },
        { path: '/dashboard/profile', text: 'Profile', icon: 'bi-gear' },
      ];

  return (
    <nav className="bg-[var(--secondary)] border-b-2 border-[var(--primary)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <i className="bi bi-briefcase text-[var(--foreground)] text-2xl" aria-hidden="true" />
            <h1 className="text-2xl font-black text-[var(--foreground)]">HN Career Hub</h1>
          </div>

          {/* Navigation & actions */}
          <div className="flex items-center gap-6">
            {linkRegistry.map((entry) => {
              const isCurrentRoute = activePath === entry.path;
              return (
                <Link
                  key={entry.path}
                  href={entry.path}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    isCurrentRoute
                      ? 'bg-[var(--primary)] text-[var(--background)] border-2 border-[var(--primary)]'
                      : 'text-[var(--muted)] border-2 border-transparent hover:text-[var(--foreground)] hover:border-[var(--primary)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <i className={`bi ${entry.icon}`} aria-hidden="true" />
                    {entry.text}
                  </span>
                </Link>
              );
            })}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-all rounded-lg border-2 border-transparent hover:border-[var(--primary)]"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`} aria-hidden="true" />
            </button>

            {/* Sign In / Logout */}
            {isGuest ? (
              <Link
                href="/"
                className="px-4 py-2 bg-[var(--primary)] text-[var(--background)] rounded-lg font-bold hover:bg-[var(--primary-light)] transition-all border-2 border-[var(--primary)]"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                  Sign In
                </span>
              </Link>
            ) : (
              <button
                onClick={executeLogout}
                className="px-4 py-2 bg-transparent text-[var(--foreground)] rounded-lg font-bold hover:bg-[var(--muted-light)] transition-all border-2 border-[var(--primary)]"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-box-arrow-right" aria-hidden="true" />
                  Logout
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
