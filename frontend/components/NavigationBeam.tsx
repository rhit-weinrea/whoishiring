'use client';

import { useTheme } from '@/lib/theme';

export default function NavigationBeam() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="box border-b-2 border-[var(--outline)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="bi bi-briefcase text-[var(--foreground)] text-2xl" aria-hidden="true" />
            <h1 className="text-2xl font-[var(--text-light)] text-[var(--foreground)]">HN Career Hub</h1>
          </div>

          <button
            onClick={toggleTheme}
            className="px-3 py-2 text-[var(--foreground)] bg-[var(--background)] rounded-lg transition-all hover:bg-[var(--muted-light)]"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <i className={`bi ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}
