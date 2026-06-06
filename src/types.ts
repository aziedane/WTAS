export interface Campaign {
  id: string;
  name: string;
  url: string;
  deepLinks?: string[]; // Array of subpage URLs to rotate and simulate continuous browsing clicks
  interval: number; // in seconds
  status: 'active' | 'paused';
  referrerType: 'direct' | 'google' | 'social' | 'custom';
  customReferrer?: string;
  deviceType: 'all' | 'desktop' | 'mobile';
  requestCount: number; // number of requests made per interval sequence
  randomizeDelay: boolean; // whether to randomize delays between secondary requests
  totalVisits: number;
  successfulVisits: number;
  failedVisits: number;
  lastRun: string | null; // ISO timestamp
  createdAt: string;
}

export interface VisitLog {
  id: string;
  campaignId: string;
  campaignName: string;
  url: string;
  timestamp: string; // ISO string
  referrer: string;
  userAgent: string;
  ip?: string; // Simulated IP address
  countryCode?: string; // E.g. US, SG, JP
  countryName?: string; // E.g. United States, Singapore
  status: 'success' | 'failed';
  statusCode: number | null;
  responseTime: number; // ms
  error?: string;
}

export interface GlobalStats {
  totalVisitsRun: number;
  successfulVisitsRun: number;
  failedVisitsRun: number;
  activeCampaignsCount: number;
  totalCampaignsCount: number;
  lastVisitAt: string | null;
}
