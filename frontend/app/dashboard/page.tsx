'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBeam from '@/components/NavigationBeam';
import EmploymentCard from '@/components/EmploymentCard';
import QueryRefinery from '@/components/QueryRefinery';
import { queryEmploymentListings, pinListing, unpinListing, recallPinnedListings } from '@/lib/api';

type EmploymentListing = {
  id: number;
  hnItemId?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  posted_at: string;
  url?: string;
  remote?: boolean;
  salary?: string;
  tech?: string[];
};

export default function ListingBrowser() {
  const [listings, setListings] = useState<EmploymentListing[]>([]);
  const [pinnedSet, setPinnedSet] = useState<Set<number>>(new Set());
  const [pinnedMap, setPinnedMap] = useState<Map<number, number>>(new Map());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [faultMessage, setFaultMessage] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const routeController = useRouter();

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    const sessionTicket = typeof window !== 'undefined' ? localStorage.getItem('hn_session_vault') : null;

    if (!sessionTicket) {
      setIsGuest(true);
      await loadListingsData();
    } else {
      setIsGuest(false);
      await loadListingsData();
      await loadPinnedData();
    }
  };

  const loadListingsData = async (criteria?: any) => {
    try {
      setIsLoadingData(true);
      setFaultMessage('');
      const fetchedData = await queryEmploymentListings(criteria);
      const visaFilter = criteria?.visaSponsorship ? 'yes' : null;
      const techFilter = Array.isArray(criteria?.techKeywords) && criteria.techKeywords.length > 0
        ? criteria.techKeywords.map((item: string) => item.toLowerCase())
        : null;
      const filtered = fetchedData.filter((listing: any) => {
        const text = (listing.description || '').toLowerCase();
        if (visaFilter && !text.includes(`visa sponsorship: ${visaFilter}`)) {
          return false;
        }
        if (techFilter) {
          return techFilter.some((keyword: string) => text.includes(keyword));
        }
        return true;
      });
      setListings(filtered);
    } catch (fault) {
      setFaultMessage('Data retrieval fault. Retry suggested.');
      console.error(fault);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadPinnedData = async () => {
    try {
      const pinnedData = await recallPinnedListings();
      const identifiers = new Set<number>();
      const mapping = new Map<number, number>();
      pinnedData.forEach((record: any) => {
        const jobId = record.job_id ?? record.id;
        const savedId = record.saved_id ?? record.id;
        if (jobId) {
          identifiers.add(jobId);
          if (savedId) {
            mapping.set(jobId, savedId);
          }
        }
      });
      setPinnedSet(identifiers);
      setPinnedMap(mapping);
    } catch (fault) {
      console.error('Pinned data load fault:', fault);
    }
  };

  const executePinToggle = async (listingId: number) => {
    if (isGuest) return;
    try {
      if (pinnedSet.has(listingId)) {
        const savedId = pinnedMap.get(listingId);
        if (!savedId) {
          await loadPinnedData();
          return;
        }
        await unpinListing(savedId);
        setPinnedSet(previousSet => {
          const modifiedSet = new Set(previousSet);
          modifiedSet.delete(listingId);
          return modifiedSet;
        });
        setPinnedMap(previousMap => {
          const modifiedMap = new Map(previousMap);
          modifiedMap.delete(listingId);
          return modifiedMap;
        });
      } else {
        const saved = await pinListing(listingId);
        setPinnedSet(previousSet => new Set(previousSet).add(listingId));
        if (saved?.saved_id) {
          setPinnedMap(previousMap => {
            const modifiedMap = new Map(previousMap);
            modifiedMap.set(listingId, saved.saved_id);
            return modifiedMap;
          });
        }
      }
    } catch (fault) {
      console.error('Pin toggle fault:', fault);
    }
  };

  const applyCriteria = (criteria: any) => {
    loadListingsData(criteria);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <NavigationBeam isGuest={isGuest} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-2">
            <i className="bi bi-list" aria-hidden="true" />
            Browse Listings
          </h2>
          <p className="text-gray-600">
            Discover opportunities from Hacker News community
          </p>
        </div>

        <QueryRefinery onCriteriaUpdate={applyCriteria} />

        {faultMessage && (
          <div className="mb-6 p-4 bg-white border-2 border-red-500 rounded text-red-800">
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              {faultMessage}
            </span>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">
                <i className="bi bi-hourglass" aria-hidden="true" />
              </div>
              <p className="text-gray-600 font-bold">Loading listings...</p>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 border-2 border-slate-grey-200 rounded-lg bg-white">
            <div className="text-6xl mb-4">
              <i className="bi bi-search" aria-hidden="true" />
            </div>
            <p className="text-xl text-gray-600 font-bold">Zero matches found</p>
            <p className="text-gray-500 mt-2">Adjust your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <EmploymentCard
                key={`${listing.id}-${listing.title}`}
                listing={listing}
                onPinToggle={isGuest ? undefined : executePinToggle}
                isPinned={pinnedSet.has(listing.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
