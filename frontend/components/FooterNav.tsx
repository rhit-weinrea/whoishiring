'use client';

export default function FooterNav() {
  return (
    <footer className="w-full border-t-2 border-[var(--outline)] py-4 px-6" style={{ background: 'var(--surface)' }}>
      <div className="container mx-auto flex justify-center items-center">
        <a
          href="/feedback"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[var(--muted-light)]"
          style={{ color: 'var(--foreground)', opacity: 0.7 }}
        >
          <i className="bi bi-flag" aria-hidden="true" />
          Report an Issue / Give Feedback
        </a>
      </div>
    </footer>
  );
}
