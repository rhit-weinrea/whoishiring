'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// terminateSession import removed
import { useTheme } from '@/lib/theme';

type NavigationBeamProps = {
  isGuest?: boolean;
};

export default function NavigationBeam({ isGuest = false }: NavigationBeamProps) {
  const activePath = usePathname();
  const { isDark, toggleTheme } = useTheme();

  const executeLogout = () => {
    // terminateSession disabled
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
    <nav className="box border-b-2 border-[var(--outline)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <i className="bi bi-briefcase text-[var(--foreground)] text-2xl" aria-hidden="true" />
            <h1 className="text-2xl font-[var(--text-light)] text-[var(--foreground)]">HN Career Hub</h1>
          </div>

          {/* Navigation & actions */}
          <div className="flex items-center gap-6" style={{flexWrap: 'wrap'}}>
            {linkRegistry.map((entry) => {
              const isCurrentRoute = activePath === entry.path;
              const isListings = entry.text === 'Listings';
              return (
                <Link
                  key={entry.path}
                  href={entry.path}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    isCurrentRoute
                      ? 'border-2 border-[var(--primary)] text-[var(--primary)] bg-[var(--background)]'
                      : isListings
                        ? 'bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-light)]'
                        : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted-light)]'
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
                      className="px-3 py-2 text-[var(--foreground)] bg-[var(--background)] rounded-lg transition-all hover:bg-[var(--muted-light)]"
                      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`} aria-hidden="true" />
                    </button>
        
                    {/* Sign In / Logout */}
                    {/* {isGuest ? (
                      <Link
                        href="/login"
                        className="px-4 py-2 rounded-lg font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-all"
                      >
                        Sign In
                      </Link>
                    ) : (
                      <button
                        onClick={executeLogout}
                        className="px-4 py-2 rounded-lg font-bold bg-[var(--danger)] text-white hover:bg-[var(--danger-dark)] transition-all"
                      >
                        Logout
                      </button> */}
                   {/* // Note: The Sign In / Logout button is currently commented out as authentication flows are being finalized. It can be re-enabled once those flows are in place.)} */}
                  </div>
                </div>
              </div>
            </nav>
            
          );
        }
