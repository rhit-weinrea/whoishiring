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
  const [pageNumber, setPageNumber] = useState(1);
  const [numJobsPerPage, setNumJobsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(listings.length);
  const [totalPages, setTotalPages] = useState(1);

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
      setTotalJobs(filtered.length);
      setTotalPages(Math.ceil(filtered.length / numJobsPerPage));
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
    <div className="min-h-screen bg-gradient-to-br" style={{ background: 'var(--background)' }}>
      <NavigationBeam isGuest={isGuest} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <i className="bi bi-list" aria-hidden="true" />
            Browse Listings
          </h2>
          <p style={{ color: 'var(--outline)' }}>
            Discover opportunities from Hacker News community
          </p>
        </div>

        <QueryRefinery onCriteriaUpdate={applyCriteria} />

        {faultMessage && (
          <div className="mb-6 p-4 rounded" style={{ background: 'var(--background)', border: '2px solid red', color: 'red' }}>
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-exclamation-triangle" aria-hidden="true" />
              {faultMessage}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center my-4">
          <span className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <i className="bi bi-briefcase" aria-hidden="true" />
            {totalJobs} Job{totalJobs !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: 'var(--background)', border: `2px solid var(--outline)`, color: 'var(--foreground)' }}>
            <span>Show</span>
            <select
              value={numJobsPerPage}
              onChange={e => {
                const value = e.target.value === 'all' ? totalJobs : Number(e.target.value);
                setNumJobsPerPage(value);
                setPageNumber(1);
                setTotalPages(Math.ceil(totalJobs / (value === 0 ? 1 : value)));
              }}
              className="px-2 py-1 rounded-lg font-bold focus:outline-none transition-all"
              style={{ background: 'var(--background)', border: `2px solid var(--outline)`, color: 'var(--foreground)' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={totalJobs}>All</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce" style={{ color: 'var(--foreground)' }}>
                <i className="bi bi-hourglass" aria-hidden="true" />
              </div>
              <p style={{ color: 'var(--outline)', fontWeight: 'bold' }}>Loading listings...</p>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 rounded-lg" style={{ border: `2px solid var(--outline)`, background: 'var(--background)' }}>
            <div className="text-6xl mb-4" style={{ color: 'var(--foreground)' }}>
              <i className="bi bi-search" aria-hidden="true" />
            </div>
            <p className="text-xl font-bold" style={{ color: 'var(--outline)' }}>Zero matches found</p>
            <p style={{ color: 'var(--outline)', marginTop: '0.5rem' }}>Adjust your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {listings.slice((pageNumber - 1) * numJobsPerPage, pageNumber * numJobsPerPage).map((listing) => (
                <EmploymentCard
                  key={`${listing.id}-${listing.title}`}
                  listing={listing}
                  onPinToggle={isGuest ? undefined : executePinToggle}
                  isPinned={pinnedSet.has(listing.id)}
                />
              ))}
            </div>
          </>
        )}
        {totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 mt-8">
    <button
      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
      disabled={pageNumber === 1}
      className="px-4 py-2 rounded-lg font-bold border-2 border-slate-grey-200 bg-white text-gray-700 hover:border-smoky-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <i className="bi bi-chevron-left" aria-hidden="true" />
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(p => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 1)
      .reduce<(number | string)[]>((acc, p, idx, arr) => {
        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
        acc.push(p);
        return acc;
      }, [])
      .map((p, idx) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 font-bold">...</span>
        ) : (
          <button
            key={p}
            onClick={() => setPageNumber(p)}
            className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${
              p === pageNumber
                ? 'bg-smoky-rose-500 text-white border-smoky-rose-500'
                : 'bg-white text-gray-700 border-slate-grey-200 hover:border-smoky-rose-500'
            }`}
          >
            {p}
          </button>
        )
      )}
    <button
      onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
      disabled={pageNumber === totalPages}
      className="px-4 py-2 rounded-lg font-bold border-2 border-slate-grey-200 bg-white text-gray-700 hover:border-smoky-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <i className="bi bi-chevron-right" aria-hidden="true" />
    </button>
  </div>
)}
      </main>
    </div>
  );
}
