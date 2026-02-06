'use client';

import { useState } from 'react';

type EmploymentCardProps = {
  listing: {
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
  onPinToggle?: (identifier: number) => void;
  isPinned?: boolean;
};

export default function EmploymentCard({ listing, onPinToggle, isPinned }: EmploymentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const extractApplyEmail = (text: string) => {
    const reversedMatch = text.match(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})\s*\(reversed\)/i);
    if (reversedMatch) {
      const reversed = reversedMatch[1];
      const normal = reversed.split('').reverse().join('');
      return normal;
    }

    const match = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    return match ? match[0] : null;
  };

  const extractFirstUrl = (text: string) => {
    const match = text.match(/https?:\/\/[^\s<>"]+/i);
    return match ? match[0] : null;
  };

  const extractVisaStatus = (text: string) => {
    const match = text.match(/visa sponsorship:\s*(yes|no|unknown)/i);
    return match ? match[1].toLowerCase() : null;
  };

  const cleanDescription = (text: string) => {
    const company = listing.company?.toLowerCase() || '';
    const title = listing.title?.toLowerCase() || '';
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const lowered = line.toLowerCase();
        if (lowered.startsWith('apply url:') || lowered.startsWith('apply:') || lowered.startsWith('visa sponsorship:')) {
          return false;
        }
        if (company && lowered === company) return false;
        if (title && lowered === title) return false;
        return true;
      })
      .map((line) => line.replace(/https?:\/\/[^\s<>"]+/gi, '').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '').trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  };

  const applyEmail = extractApplyEmail(listing.description);
  const descriptionUrl = extractFirstUrl(listing.description);
  const applyUrl = listing.url && !listing.url.includes('...') && !listing.url.includes('…')
    ? listing.url
    : descriptionUrl || listing.url;
  const visaStatus = extractVisaStatus(listing.description);
  const cleanedDescription = cleanDescription(listing.description);
  const computeTimeElapsed = (timestamp: string) => {
    const hasTimezone = /z$|[+-]\d{2}:?\d{2}$/i.test(timestamp);
    const safeTimestamp = hasTimezone ? timestamp : `${timestamp}Z`;
    const postedMoment = new Date(safeTimestamp);
    const currentMoment = new Date();
    const millisecondGap = currentMoment.getTime() - postedMoment.getTime();
    const hourGap = Math.floor(millisecondGap / (1000 * 60 * 60));
    const dayGap = Math.floor(hourGap / 24);

    if (dayGap > 7) {
      return `${Math.floor(dayGap / 7)}w past`;
    } else if (dayGap > 0) {
      return `${dayGap}d past`;
    } else if (hourGap > 0) {
      return `${hourGap}h past`;
    } else {
      return 'moments ago';
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 border-2 border-slate-grey-200 hover:border-smoky-rose-500 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-lg text-gray-900 flex items-center gap-2">
              <i className="bi bi-building text-black" aria-hidden="true" />
              {listing.company}
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-left"
              aria-expanded={isExpanded}
            >
              <h3 className="text-lg font-semibold text-gray-700 group-hover:text-smoky-rose-500 transition-colors">
                {listing.title}
              </h3>
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <i className="bi bi-geo-alt text-black" aria-hidden="true" />
              {listing.location}
            </span>
            {listing.remote && (
              <span className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-slate-grey-200">
                <i className="bi bi-globe text-black" aria-hidden="true" />
                Remote
              </span>
            )}
            {visaStatus && visaStatus !== 'unknown' && (
              <span className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-slate-grey-200">
                <i className="bi bi-passport text-black" aria-hidden="true" />
                Visa {visaStatus === 'yes' ? 'Sponsorship' : 'No Sponsorship'}
              </span>
            )}
          </div>
        </div>
        
        {onPinToggle && (
          <button
            onClick={() => onPinToggle(listing.id)}
            className="ml-4 text-xl hover:scale-110 transition-transform"
            aria-label={isPinned ? 'Unpin listing' : 'Pin listing'}
          >
            <i className={isPinned ? 'bi bi-star-fill text-black' : 'bi bi-star text-black'} aria-hidden="true" />
          </button>
        )}
      </div>

      <p className={`text-gray-700 text-sm leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-8'}`}>
        {cleanedDescription}
      </p>

      {listing.tech && listing.tech.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {listing.tech.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-semibold border border-slate-grey-200 rounded bg-white text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <i className="bi bi-clock text-black" aria-hidden="true" />
            {computeTimeElapsed(listing.posted_at)}
          </span>
          {listing.salary && (
            <span className="bg-white text-gray-800 px-2 py-1 rounded font-semibold flex items-center gap-2 border border-slate-grey-200">
              <i className="bi bi-cash-stack text-black" aria-hidden="true" />
              {listing.salary}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {listing.hnItemId && (
            <a
              href={`https://news.ycombinator.com/item?id=${listing.hnItemId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:scale-110 transition-transform"
              aria-label="Open original Hacker News post"
            >
              <i className="bi bi-link-45deg text-black" aria-hidden="true" />
            </a>
          )}
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Open application link"
            >
              Apply
            </a>
          )}
          {applyEmail && (
            <a
              href={`mailto:${applyEmail}`}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Email application"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
