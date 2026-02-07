'use client';

import { useState, ChangeEvent } from 'react';

type QueryRefineryProps = {
  onCriteriaUpdate: (criteria: {
    phraseQuery?: string;
    territoryFilter?: string;
    distantWorkFlag?: boolean;
    visaSponsorship?: boolean;
    techKeywords?: string[];
  }) => void;
};

export default function QueryRefinery({ onCriteriaUpdate }: QueryRefineryProps) {
  const [phraseInput, setPhraseInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [distantBox, setDistantBox] = useState(false);
  const [visaOnly, setVisaOnly] = useState(false);
  const [techInput, setTechInput] = useState('');

  const deployFilters = () => {
    onCriteriaUpdate({
      phraseQuery: phraseInput || undefined,
      territoryFilter: areaInput || undefined,
      distantWorkFlag: distantBox ? true : undefined,
      visaSponsorship: visaOnly,
      techKeywords: techInput
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
    });
  };

  const clearFilters = () => {
    setPhraseInput('');
    setAreaInput('');
    setDistantBox(false);
    setVisaOnly(false);
    setTechInput('');
    onCriteriaUpdate({});
  };

  return (
    <div className="bg-[var(--background)] rounded-xl p-6 border-2 border-[var(--outline)] mb-8">
      <h3 className="text-lg font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
        <i className="bi bi-funnel text-[var(--foreground)]" aria-hidden="true" />
        Query Refinery
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label
            htmlFor="phrase-input"
            className="block text-xs font-bold text-[var(--muted)] mb-2 uppercase tracking-wide"
          >
            Search Phrases
          </label>
          <input
            id="phrase-input"
            type="text"
            value={phraseInput}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setPhraseInput(evt.target.value)}
            placeholder="TypeScript, DevOps, ML..."
            className="w-full px-4 py-2 border-2 border-[var(--outline)] rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)]"
          />
        </div>

        <div>
          <label
            htmlFor="area-input"
            className="block text-xs font-bold text-[var(--muted)] mb-2 uppercase tracking-wide"
          >
            Geographic Area
          </label>
          <input
            id="area-input"
            type="text"
            value={areaInput}
            onChange={(evt: ChangeEvent<HTMLInputElement>) => setAreaInput(evt.target.value)}
            placeholder="NYC, Berlin, Anywhere..."
            className="w-full px-4 py-2 border-2 border-[var(--outline)] rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)]"
          />
        </div>

        <div className="flex items-end">
          <div className="flex flex-col gap-3 w-full">
            <label className="flex items-center gap-2 cursor-pointer bg-[var(--background)] px-4 py-2 rounded-lg w-full">
              <input
                type="checkbox"
                checked={distantBox}
                onChange={(evt: ChangeEvent<HTMLInputElement>) => setDistantBox(evt.target.checked)}
                className="w-5 h-5 text-smoky-rose-500 focus:ring-2 focus:ring-smoky-rose-200 rounded"
              />
              <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <i className="bi bi-globe text-[var(--foreground)]" aria-hidden="true" />
                Remote Work
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-[var(--background)] px-4 py-2 rounded-lg w-full">
              <input
                type="checkbox"
                checked={visaOnly}
                onChange={(evt: ChangeEvent<HTMLInputElement>) => setVisaOnly(evt.target.checked)}
                className="w-5 h-5 text-smoky-rose-500 focus:ring-2 focus:ring-smoky-rose-200 rounded"
              />
              <span className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <i className="bi bi-passport text-[var(--foreground)]" aria-hidden="true" />
                Visa Sponsorship Only
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor="tech-filter"
          className="block text-xs font-bold text-[var(--muted)] mb-2 uppercase tracking-wide"
        >
          Technical Skills (comma-separated)
        </label>
        <input
          id="tech-filter"
          type="text"
          value={techInput}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setTechInput(evt.target.value)}
          placeholder="Python, React, Postgres"
          className="w-full px-4 py-2 border-2 border-[var(--outline)] rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted)]"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={deployFilters}
          className="flex-1 bg-smoky-rose-500 text-white py-2 px-6 rounded-lg transition-all font-bold border-2 border-smoky-rose-500"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="bg-[var(--background)] text-[var(--foreground)] py-2 px-6 rounded-lg border-2 border-[var(--outline)] transition-all font-bold"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
