'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBeam from '@/components/NavigationBeam';
import EmploymentCard from '@/components/EmploymentCard';
import { recallPinnedListings, unpinListing } from '@/lib/api';

type PinnedRecord = {
  saved_id: number;
  job_id: number;
  hnItemId?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  posted_at: string;
  url?: string;
  remote?: boolean;
  salary?: string;
};

export default function PinnedCollection() {
  const [pinnedRecords, setPinnedRecords] = useState<PinnedRecord[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(true);
  const [faultMessage, setFaultMessage] = useState('');
  const routeController = useRouter();

  useEffect(() => {
    verifyAndRetrieve();
  }, []);

  const verifyAndRetrieve = async () => {
    const sessionTicket = typeof window !== 'undefined' ? localStorage.getItem('hn_session_vault') : null;
    
    if (!sessionTicket) {
      routeController.push('/');
      return;
    }

    await retrievePinned();
  };

  const retrievePinned = async () => {
    try {
      setIsRetrieving(true);
      setFaultMessage('');
      const fetchedRecords = await recallPinnedListings();
      setPinnedRecords(fetchedRecords);
    } catch (fault) {
      setFaultMessage('Retrieval of pinned items failed');
      console.error(fault);
    } finally {
      setIsRetrieving(false);
    }
  };

  const executeUnpin = async (savedIdentifier: number) => {
    try {
      await unpinListing(savedIdentifier);
      setPinnedRecords(previous => previous.filter(record => record.saved_id !== savedIdentifier));
    } catch (fault) {
      console.error('Unpin operation failed:', fault);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <NavigationBeam />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-2">
            <i className="bi bi-star" aria-hidden="true" />
            Pinned Collection
          </h2>
          <p className="text-gray-600">
            Your preserved listings for reference
          </p>
        </div>

        {faultMessage && (
          <div className="mb-6 p-4 bg-white border-2 border-red-500 rounded text-red-800">
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              {faultMessage}
            </span>
          </div>
        )}

        {isRetrieving ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">
                <i className="bi bi-hourglass" aria-hidden="true" />
              </div>
              <p className="text-gray-600 font-bold">Retrieving pins...</p>
            </div>
          </div>
        ) : pinnedRecords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-slate-grey-200">
            <div className="text-6xl mb-4">
              <i className="bi bi-book" aria-hidden="true" />
            </div>
            <p className="text-xl text-gray-600 font-bold">Collection empty</p>
            <p className="text-gray-500 mt-2">Pin listings from the browser</p>
            <button
              onClick={() => routeController.push('/dashboard')}
              className="mt-6 bg-smoky-rose-500 text-white px-6 py-3 rounded-lg font-bold transition-all border-2 border-smoky-rose-500"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-gray-600 font-semibold">
              {pinnedRecords.length} {pinnedRecords.length === 1 ? 'item' : 'items'} pinned
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pinnedRecords.map((record) => (
                <EmploymentCard
                  key={`${record.saved_id}-${record.title}`}
                  listing={{
                    id: record.saved_id,
                    hnItemId: record.hnItemId,
                    title: record.title,
                    company: record.company,
                    location: record.location,
                    description: record.description,
                    posted_at: record.posted_at,
                    url: record.url,
                    remote: record.remote,
                    salary: record.salary,
                  }}
                  onPinToggle={executeUnpin}
                  isPinned={true}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
