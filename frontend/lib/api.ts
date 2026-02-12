// Custom network bridge with session persistence
const VAULT_KEY = 'hn_session_vault';
const API_ROOT = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000/api/v1');
const resolveRemoteFlag = (remoteStatus?: string | boolean) => {
  if (typeof remoteStatus === 'boolean') return remoteStatus;
  if (!remoteStatus) return false;
  return remoteStatus.toLowerCase().includes('remote');
};

const extractRolesFromSummary = (summary?: string) => {
  if (!summary) return { roles: [] as string[], cleaned: summary || '' };
  const lines = summary.split('\n');
  if (!lines[0]?.toLowerCase().startsWith('roles:')) {
    return { roles: [] as string[], cleaned: summary };
  }
  const roles: string[] = [];
  let idx = 1;
  while (idx < lines.length && lines[idx].trim().startsWith('-')) {
    roles.push(lines[idx].replace(/^\s*-\s*/, '').trim());
    idx += 1;
  }
  const cleaned = lines.slice(idx).join('\n').trim();
  return { roles, cleaned };
};

const mapJobToListing = (job: any) => ({
  id: job.job_id ?? job.id,
  hnItemId: job.hn_item_id ?? job.hnItemId,
  title: job.posting_title ?? job.title ?? 'Untitled role',
  company: job.company_name ?? job.company ?? 'Unknown',
  location: job.job_location ?? job.location ?? 'Unspecified',
  description: job.job_description ?? job.description ?? '',
  posted_at: job.parsed_timestamp ?? job.posted_at ?? new Date().toISOString(),
  url: job.application_url ?? job.url,
  remote: resolveRemoteFlag(job.remote_status ?? job.remote),
  salary: job.salary_range ?? job.salary,
  tech: job.tech_stack ?? job.technologies ?? [],
});

if (!API_ROOT && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL must be configured in production');
}

class NetworkBridge {
  sessionVault: string | null;
  
  constructor() {
    this.sessionVault = this.recallSession();
  }

  recallSession(): string | null {
    return typeof window !== 'undefined' ? window.localStorage.getItem(VAULT_KEY) : null;
  }

  archiveSession(ticket: string): void {
    this.sessionVault = ticket;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VAULT_KEY, ticket);
    }
  }

  eraseSession(): void {
    this.sessionVault = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(VAULT_KEY);
    }
  }

  async transmit(endpoint: string, verb: string, cargo?: unknown): Promise<any> {
    const headerBag: Record<string, string> = {};

    if (verb !== 'GET') {
      headerBag['Content-Type'] = 'application/json';
    }

    if (this.sessionVault) {
      headerBag['Authorization'] = `Bearer ${this.sessionVault}`;
    }

    const requestConfig: RequestInit = { method: verb, headers: headerBag };

    if (cargo && verb !== 'GET') {
      requestConfig.body = JSON.stringify(cargo);
    }

    const reply = await fetch(`${API_ROOT}${endpoint}`, requestConfig);
    
    if (!reply.ok) {
      const fault = await reply.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(fault.message || `Network fault: ${reply.status}`);
    }

    return reply.json();
  }
}

const bridge = new NetworkBridge();

// Credential operations
export const authenticateViaCredentials = async (mailAddress: string, secretCode: string) => {
  const outcome = await bridge.transmit('/auth/login', 'POST', { 
    username: mailAddress, 
    password: secretCode 
  });
  if (outcome.access_token) {
    bridge.archiveSession(outcome.access_token);
  }
  return outcome;
};

export const forgeNewAccount = async (mailAddress: string, secretCode: string, alias: string) => {
  const outcome = await bridge.transmit('/auth/register', 'POST', { 
    email_address: mailAddress, 
    password: secretCode, 
    username: alias 
  });
  if (outcome.access_token) {
    bridge.archiveSession(outcome.access_token);
  }
  return outcome;
};

export const terminateSession = (): void => {
  bridge.eraseSession();
};

// Employment listing operations
export const queryEmploymentListings = async (criteria?: {
  phraseQuery?: string;
  territoryFilter?: string;
  distantWorkFlag?: boolean;
}) => {
  const paramBag = new URLSearchParams();

  if (criteria?.phraseQuery) {
    paramBag.append('search_term', criteria.phraseQuery);
    const data = await bridge.transmit(`/jobs/search/text?${paramBag.toString()}`, 'GET');
    return data.map(mapJobToListing);
  }

  if (criteria?.territoryFilter) paramBag.append('location_query', criteria.territoryFilter);
  if (criteria?.distantWorkFlag) paramBag.append('remote_filter', 'remote');

  const querySegment = paramBag.toString() ? `?${paramBag.toString()}` : '';
  const data = await bridge.transmit(`/jobs/browse${querySegment}`, 'GET');
  return data.flatMap((job: any) => {
    const base = mapJobToListing(job);
    const { roles, cleaned } = extractRolesFromSummary(base.description);
    if (!roles.length) {
      return [{ ...base, description: cleaned }];
    }
    return roles.map((role) => ({
      ...base,
      title: role,
      description: cleaned,
    }));
  });
};

export const pinListing = async (listingIdentifier: number) => {
  const data = await bridge.transmit('/saved-jobs/save', 'POST', { job_posting_id: listingIdentifier });
  return {
    saved_id: data.saved_id ?? data.id,
    job_id: data.job_posting_id ?? listingIdentifier,
  };
};

export const unpinListing = async (savedIdentifier: number) => {
  return bridge.transmit(`/saved-jobs/${savedIdentifier}`, 'DELETE');
};

export const recallPinnedListings = async () => {
  const data = await bridge.transmit('/saved-jobs/my-saved-jobs', 'GET');
  return data.flatMap((entry: any) => {
    const posting = entry.posting_rel || {};
    const base = {
      saved_id: entry.saved_id ?? entry.id,
      job_id: entry.job_posting_id ?? posting.job_id ?? entry.job_id,
      ...mapJobToListing(posting),
    };
    const { roles, cleaned } = extractRolesFromSummary(base.description);
    if (!roles.length) {
      return [{ ...base, description: cleaned }];
    }
    return roles.map((role) => ({
      ...base,
      title: role,
      description: cleaned,
    }));
  });
};

// Profile configuration operations
export const fetchProfileConfig = async () => {
  const data = await bridge.transmit('/preferences/my-preferences', 'GET');
  return {
    keywords: data.keywords_to_match || [],
    locations: data.preferred_locations || [],
    tech_keywords: data.preferred_tech_stack || [],
    remote_preference: data.remote_only || false,
    visa_sponsorship_only: data.visa_sponsorship_only || false,
  };
};

export const persistProfileConfig = async (configuration: {
  keywords?: string[];
  locations?: string[];
  tech_keywords?: string[];
  remote_preference?: boolean;
  visa_sponsorship_only?: boolean;
}) => {
  return bridge.transmit('/preferences/my-preferences', 'PUT', {
    preferred_locations: configuration.locations,
    preferred_tech_stack: configuration.tech_keywords,
    remote_only: configuration.remote_preference ?? false,
    keywords_to_match: configuration.keywords ?? [],
    visa_sponsorship_only: configuration.visa_sponsorship_only ?? false,
  });
};

export const fetchLocationSuggestions = async (query: string, limit = 5) => {
  const params = new URLSearchParams({ query, limit: `${limit}` });
  return bridge.transmit(`/locations/suggest?${params.toString()}`, 'GET');
};

export const verifyIdentity = async () => {
  return bridge.transmit('/auth/profile', 'GET');
};

export { bridge };
