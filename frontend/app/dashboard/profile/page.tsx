'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBeam from '@/components/NavigationBeam';
import { fetchProfileConfig, persistProfileConfig, fetchLocationSuggestions } from '@/lib/api';

type ProfileConfig = {
  keywords: string[];
  locations: string[];
  tech_keywords: string[];
  remote_preference: boolean;
  visa_sponsorship_only: boolean;
  email_alerts: boolean;
};

export default function ProfileManager() {
  const [configuration, setConfiguration] = useState<ProfileConfig>({
    keywords: [],
    locations: [],
    tech_keywords: [],
    remote_preference: false,
    visa_sponsorship_only: false,
    email_alerts: false,
  });
  
  const [keywordBuffer, setKeywordBuffer] = useState('');
  const [locationBuffer, setLocationBuffer] = useState('');
  const [techBuffer, setTechBuffer] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(true);
  const [isPersisting, setIsPersisting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const routeController = useRouter();

  useEffect(() => {
    verifyAndRetrieve();
  }, []);

  useEffect(() => {
    const trimmed = locationBuffer.trim();
    if (trimmed.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const suggestions = await fetchLocationSuggestions(trimmed, 6);
        const unique = suggestions.filter((entry: string) => !configuration.locations.includes(entry));
        setLocationSuggestions(unique);
      } catch (fault) {
        console.error('Location suggestion fault:', fault);
        setLocationSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [locationBuffer, configuration.locations]);

  const verifyAndRetrieve = async () => {
    const sessionTicket = typeof window !== 'undefined' ? localStorage.getItem('hn_session_vault') : null;
    
    if (!sessionTicket) {
      routeController.push('/');
      return;
    }

    await retrieveConfiguration();
  };

  const retrieveConfiguration = async () => {
    try {
      setIsRetrieving(true);
      const fetchedConfig = await fetchProfileConfig();
      setConfiguration({
        keywords: fetchedConfig.keywords || [],
        locations: fetchedConfig.locations || [],
        tech_keywords: fetchedConfig.tech_keywords || [],
        remote_preference: fetchedConfig.remote_preference || false,
        visa_sponsorship_only: fetchedConfig.visa_sponsorship_only || false,
        email_alerts: fetchedConfig.email_alerts || false,
      });
    } catch (fault) {
      console.error('Configuration retrieval fault:', fault);
    } finally {
      setIsRetrieving(false);
    }
  };

  const executeConfigSave = async () => {
    try {
      setIsPersisting(true);
      setStatusMessage('');
      await persistProfileConfig(configuration);
      setStatusMessage('Configuration persisted.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (fault) {
      setStatusMessage('Persistence operation failed.');
      console.error(fault);
    } finally {
      setIsPersisting(false);
    }
  };

  const appendKeyword = () => {
    const trimmed = keywordBuffer.trim();
    if (trimmed && !configuration.keywords.includes(trimmed)) {
      setConfiguration({ ...configuration, keywords: [...configuration.keywords, trimmed] });
      setKeywordBuffer('');
    }
  };

  const purgeKeyword = (term: string) => {
    setConfiguration({ ...configuration, keywords: configuration.keywords.filter(k => k !== term) });
  };

  const appendLocation = () => {
    const trimmed = locationBuffer.trim();
    if (trimmed && !configuration.locations.includes(trimmed)) {
      setConfiguration({ ...configuration, locations: [...configuration.locations, trimmed] });
      setLocationBuffer('');
      setLocationSuggestions([]);
    }
  };

  const selectLocationSuggestion = (value: string) => {
    if (!configuration.locations.includes(value)) {
      setConfiguration({ ...configuration, locations: [...configuration.locations, value] });
    }
    setLocationBuffer('');
    setLocationSuggestions([]);
  };

  const purgeLocation = (place: string) => {
    setConfiguration({ ...configuration, locations: configuration.locations.filter(l => l !== place) });
  };

  const appendTechKeyword = () => {
    const trimmed = techBuffer.trim();
    if (trimmed && !configuration.tech_keywords.includes(trimmed)) {
      setConfiguration({ ...configuration, tech_keywords: [...configuration.tech_keywords, trimmed] });
      setTechBuffer('');
    }
  };

  const purgeTechKeyword = (category: string) => {
    setConfiguration({ ...configuration, tech_keywords: configuration.tech_keywords.filter(jt => jt !== category) });
  };

  const handleKeywordEnter = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') appendKeyword();
  };

  const handleLocationEnter = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') appendLocation();
  };

  const handleTechEnter = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') appendTechKeyword();
  };

  if (isRetrieving) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <NavigationBeam />
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">
              <i className="bi bi-hourglass" aria-hidden="true" />
            </div>
            <p className="text-gray-600 font-bold">Retrieving profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <NavigationBeam />
      
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-2">
            <i className="bi bi-gear" aria-hidden="true" />
            Profile Manager
          </h2>
          <p className="text-gray-600">
            Customize your experience
          </p>
        </div>

        {statusMessage && (
          <div className="mb-6 p-4 bg-white border-2 border-green-500 rounded text-green-800 font-medium">
            {statusMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Keywords Section */}
          <div className="bg-white rounded-xl p-6 border-2 border-slate-grey-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bi bi-key" aria-hidden="true" />
              Search Keywords
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={keywordBuffer}
                onChange={(evt) => setKeywordBuffer(evt.target.value)}
                onKeyPress={handleKeywordEnter}
                placeholder="JavaScript, Rust, Data..."
                className="flex-1 px-4 py-2 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all"
              />
              <button
                onClick={appendKeyword}
                className="bg-smoky-rose-500 text-white px-6 py-2 rounded-lg font-bold transition-all border-2 border-smoky-rose-500"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-plus" aria-hidden="true" />
                  Append
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {configuration.keywords.map((term) => (
                <span
                  key={term}
                  className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  {term}
                  <button
                    onClick={() => purgeKeyword(term)}
                    className="text-orange-600 hover:text-orange-800 font-bold"
                  >
                    <i className="bi bi-x" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {configuration.keywords.length === 0 && (
                <p className="text-gray-500 text-sm">No keywords configured</p>
              )}
            </div>
          </div>

          {/* Locations Section */}
          <div className="bg-white rounded-xl p-6 border-2 border-slate-grey-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bi bi-geo-alt" aria-hidden="true" />
              Target Locations
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={locationBuffer}
                onChange={(evt) => setLocationBuffer(evt.target.value)}
                onKeyPress={handleLocationEnter}
                placeholder="Austin, London, Tokyo..."
                className="flex-1 px-4 py-2 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all"
              />
              <button
                onClick={appendLocation}
                className="bg-smoky-rose-500 text-white px-6 py-2 rounded-lg font-bold transition-all border-2 border-smoky-rose-500"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-plus" aria-hidden="true" />
                  Append
                </span>
              </button>
            </div>
            {(isSuggesting || locationSuggestions.length > 0) && (
              <div className="mb-4 border-2 border-slate-grey-200 rounded-lg bg-slate-50">
                {isSuggesting && (
                  <p className="text-sm text-gray-500 px-4 py-2">Searching...</p>
                )}
                {!isSuggesting && locationSuggestions.length > 0 && (
                  <ul className="divide-y divide-slate-grey-200">
                    {locationSuggestions.map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onClick={() => selectLocationSuggestion(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-smoky-rose-50 text-gray-700 font-medium"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {configuration.locations.map((place) => (
                <span
                  key={place}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  {place}
                  <button
                    onClick={() => purgeLocation(place)}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    <i className="bi bi-x" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {configuration.locations.length === 0 && (
                <p className="text-gray-500 text-sm">No locations configured</p>
              )}
            </div>
          </div>

          {/* Tech Keywords Section */}
          <div className="bg-white rounded-xl p-6 border-2 border-slate-grey-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bi bi-cpu" aria-hidden="true" />
              Tech Keywords
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={techBuffer}
                onChange={(evt) => setTechBuffer(evt.target.value)}
                onKeyPress={handleTechEnter}
                placeholder="Python, Next.js, AWS..."
                className="flex-1 px-4 py-2 border-2 border-slate-grey-300 rounded-lg focus:ring-2 focus:ring-smoky-rose-200 focus:border-smoky-rose-500 outline-none transition-all"
              />
              <button
                onClick={appendTechKeyword}
                className="bg-smoky-rose-500 text-white px-6 py-2 rounded-lg font-bold transition-all border-2 border-smoky-rose-500"
              >
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-plus" aria-hidden="true" />
                  Append
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {configuration.tech_keywords.map((category) => (
                <span
                  key={category}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                >
                  {category}
                  <button
                    onClick={() => purgeTechKeyword(category)}
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    <i className="bi bi-x" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {configuration.tech_keywords.length === 0 && (
                <p className="text-gray-500 text-sm">No tech keywords configured</p>
              )}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white rounded-xl p-6 border-2 border-slate-grey-200 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bi bi-sliders" aria-hidden="true" />
              Extra Controls
            </h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={configuration.remote_preference}
                onChange={(evt) => setConfiguration({ ...configuration, remote_preference: evt.target.checked })}
                className="w-6 h-6 text-smoky-rose-500 focus:ring-2 focus:ring-smoky-rose-200 rounded"
              />
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="bi bi-globe" aria-hidden="true" />
                Favor remote work
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={configuration.visa_sponsorship_only}
                onChange={(evt) => setConfiguration({ ...configuration, visa_sponsorship_only: evt.target.checked })}
                className="w-6 h-6 text-smoky-rose-500 focus:ring-2 focus:ring-smoky-rose-200 rounded"
              />
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="bi bi-passport" aria-hidden="true" />
                Visa sponsorship only
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={configuration.email_alerts}
                onChange={(evt) => setConfiguration({ ...configuration, email_alerts: evt.target.checked })}
                className="w-6 h-6 text-smoky-rose-500 focus:ring-2 focus:ring-smoky-rose-200 rounded"
              />
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <i className="bi bi-bell" aria-hidden="true" />
                Enable job notifications
              </span>
            </label>
          </div>

          {/* Save Button */}
          <button
            onClick={executeConfigSave}
            disabled={isPersisting}
            className="w-full bg-smoky-rose-500 text-white py-4 px-6 rounded-lg font-bold transition-all border-2 border-smoky-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <span className="inline-flex items-center gap-2">
              <i className="bi bi-save" aria-hidden="true" />
              {isPersisting ? 'Persisting...' : 'Persist configuration'}
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
