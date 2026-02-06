'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { terminateSession } from '@/lib/api';

type NavigationBeamProps = {
  isGuest?: boolean;
};

export default function NavigationBeam({ isGuest = false }: NavigationBeamProps) {
  const activePath = usePathname();

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
    <nav className="bg-slate-grey-900 border-b-2 border-smoky-rose-500">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="bi bi-briefcase text-white text-2xl" aria-hidden="true" />
            <h1 className="text-2xl font-black text-white">
              HN Career Hub
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {linkRegistry.map((entry) => {
              const isCurrentRoute = activePath === entry.path;
              return (
                <Link
                  key={entry.path}
                  href={entry.path}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    isCurrentRoute
                      ? 'bg-smoky-rose-500 text-white border-2 border-smoky-rose-500'
                      : 'text-gray-300 hover:text-white border-2 border-transparent hover:border-smoky-rose-500'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <i className={`bi ${entry.icon}`} aria-hidden="true" />
                    {entry.text}
                  </span>
                </Link>
              );
            })}

            {isGuest ? (
              <Link
                href="/"
                className="ml-4 px-4 py-2 bg-smoky-rose-500 text-white rounded-lg font-bold hover:bg-smoky-rose-600 transition-all border-2 border-smoky-rose-500"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                  Sign In
                </span>
              </Link>
            ) : (
              <button
                onClick={executeLogout}
                className="ml-4 px-4 py-2 bg-transparent text-white rounded-lg font-bold hover:bg-slate-grey-800 transition-all border-2 border-smoky-rose-500"
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
