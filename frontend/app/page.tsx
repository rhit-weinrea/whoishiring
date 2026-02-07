'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EntryPortal from '@/components/EntryPortal';
import AccountRegistry from '@/components/AccountRegistry';

export default function WelcomeZone() {
  const [viewMode, setViewMode] = useState<'authenticate' | 'register'>('authenticate');
  const routeController = useRouter();

  const proceedToDashboard = () => {
    routeController.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-slate-grey-900 flex items-center justify-center p-6">
      <div className="absolute inset-0 opacity-20"></div>
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-white space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <i className="bi bi-briefcase text-white text-4xl" aria-hidden="true" />
            <h1 className="text-5xl font-black leading-tight">
              HN Career Hub
            </h1>
          </div>
          
          <p className="text-xl text-slate-grey-200 leading-relaxed">
            Discover exceptional career opportunities curated from Hacker News.
            Connect with innovative companies seeking talented individuals.
          </p>

          <button
            onClick={() => routeController.push('/dashboard')}
            className="mt-4 px-8 py-3 bg-transparent text-white rounded-lg font-bold hover:bg-slate-grey-800 transition-all border-2 border-smoky-rose-500 text-lg"
          >
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-eye" aria-hidden="true" />
              Browse as Guest
            </span>
          </button>
        </div>

        <div className="flex-1 w-full">
          {viewMode === 'authenticate' ? (
            <EntryPortal
              onAuthenticated={proceedToDashboard}
              toggleMode={() => setViewMode('register')}
            />
          ) : (
            <AccountRegistry
              onAccountCreated={proceedToDashboard}
              returnToEntry={() => setViewMode('authenticate')}
            />
          )}
        </div>
      </div>
    </main>
  );
}
