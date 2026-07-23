'use client';

import { useState, useEffect } from 'react';
import NavigationBeam from '@/components/NavigationBeam';
import EmploymentCard from '@/components/EmploymentCard';
import QueryRefinery from '@/components/QueryRefinery';
import { queryEmploymentListings } from '@/lib/api';

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

export default function JobBoard() {
  const [listings, setListings] = useState<EmploymentListing[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [faultMessage, setFaultMessage] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [numJobsPerPage, setNumJobsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadListingsData();
  }, []);

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
      setPageNumber(1);
      const perPage = filtered.length < numJobsPerPage ? filtered.length || 1 : numJobsPerPage;
      setNumJobsPerPage(perPage);
      setTotalPages(Math.ceil(filtered.length / perPage));
      if (typeof window !== 'undefined') sessionStorage.removeItem('hn_reload_count');
    } catch (fault) {
      console.error(fault);
      if (!criteria && typeof window !== 'undefined') {
        const retries = Number(sessionStorage.getItem('hn_reload_count') || '0');
        if (retries < 2) {
          sessionStorage.setItem('hn_reload_count', String(retries + 1));
          window.location.reload();
          return;
        }
      }
      setFaultMessage('Data retrieval fault. Retry suggested.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const applyCriteria = (criteria: any) => {
    loadListingsData(criteria);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <NavigationBeam />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-black mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <i className="bi bi-list" aria-hidden="true" />
            Browse Listings
          </h2>
          <p style={{ color: 'var(--foreground)' }}>
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
              className="px-4 py-2 rounded-lg font-bold border-2 border-[var(--outline)] bg-[var(--surface)] text-[var(--foreground)] hover:border-smoky-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <span key={`ellipsis-${idx}`} className="px-2 text-[var(--muted)] font-bold">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPageNumber(p)}
                    className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${
                      p === pageNumber
                        ? 'bg-smoky-rose-500 text-white border-smoky-rose-500'
                        : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--outline)] hover:border-smoky-rose-500'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPageNumber(p => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages}
              className="px-4 py-2 rounded-lg font-bold border-2 border-[var(--outline)] bg-[var(--surface)] text-[var(--foreground)] hover:border-smoky-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
