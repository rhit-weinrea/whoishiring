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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-transparent rounded-lg p-4 border-2 border-slate-grey-700">
              <div className="text-3xl mb-2">
                <i className="bi bi-list-check" aria-hidden="true" />
              </div>
              <h3 className="font-bold mb-1">Curated Postings</h3>
              <p className="text-sm text-gray-400">Selected from HN</p>
            </div>
            <div className="bg-transparent rounded-lg p-4 border-2 border-slate-grey-700">
              <div className="text-3xl mb-2">
                <i className="bi bi-search" aria-hidden="true" />
              </div>
              <h3 className="font-bold mb-1">Advanced Search</h3>
              <p className="text-sm text-gray-400">Refine precisely</p>
            </div>
            <div className="bg-transparent rounded-lg p-4 border-2 border-slate-grey-700">
              <div className="text-3xl mb-2">
                <i className="bi bi-star" aria-hidden="true" />
              </div>
              <h3 className="font-bold mb-1">Pin Listings</h3>
              <p className="text-sm text-gray-400">Track progress</p>
            </div>
            <div className="bg-transparent rounded-lg p-4 border-2 border-slate-grey-700">
              <div className="text-3xl mb-2">
                <i className="bi bi-bell" aria-hidden="true" />
              </div>
              <h3 className="font-bold mb-1">Custom Alerts</h3>
              <p className="text-sm text-gray-400">Stay updated</p>
            </div>
          </div>
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
