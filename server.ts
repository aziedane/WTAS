import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Campaign, VisitLog, GlobalStats } from "./src/types.js";

// Database File Paths (local storage inside workspace for persistence)
const CAMPAIGNS_FILE = path.join(process.cwd(), "campaigns-db.json");
const LOGS_FILE = path.join(process.cwd(), "logs-db.json");

// Helper function to load data from JSON files
function readJSONFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

// Helper function to write data to JSON files
function writeJSONFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// User-Agent lists for natural traffic simulation
const DESKTOP_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 OPR/109.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0"
];

const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
];

const GOOGLE_REFERRERS = [
  "https://www.google.com/",
  "https://www.google.com/search?q=tips+meningkatkan+trafik+web",
  "https://www.google.com/search?q=alat+otomasi+website",
  "https://www.google.com/search?q=auto+traffic+scheduler",
  "https://www.google.com/search?q=optimasi+kecepatan+web",
  "https://www.google.com/search?q=baca+berita+terbaru"
];

const SOCIAL_REFERRERS = [
  "https://t.co/", // Twitter/X short URL
  "https://www.facebook.com/",
  "https://www.facebook.com/l.php",
  "https://www.instagram.com/",
  "https://www.linkedin.com/",
  "https://www.reddit.com/",
  "https://www.pinterest.com/"
];

// In-Memory state
let campaigns: Campaign[] = readJSONFile<Campaign[]>(CAMPAIGNS_FILE, []);
let visitLogs: VisitLog[] = readJSONFile<VisitLog[]>(LOGS_FILE, []);

// Store active timer objects to clean them up / restart them dynamically
const activeTimers: Record<string, NodeJS.Timeout> = {};

interface CountryGeo {
  name: string;
  code: string;
  flag: string;
  ranges: Array<{
    p1: number;
    p2Min: number;
    p2Max: number;
  }>;
}

const GLOBAL_GEOS: CountryGeo[] = [
  {
    name: "Amerika Serikat",
    code: "US",
    flag: "🇺🇸",
    ranges: [
      { p1: 3, p2Min: 0, p2Max: 15 },
      { p1: 34, p2Min: 192, p2Max: 207 },
      { p1: 52, p2Min: 0, p2Max: 15 },
      { p1: 104, p2Min: 16, p2Max: 31 }
    ]
  },
  {
    name: "Singapura",
    code: "SG",
    flag: "🇸🇬",
    ranges: [
      { p1: 128, p2Min: 199, p2Max: 199 },
      { p1: 13, p2Min: 228, p2Max: 231 },
      { p1: 116, p2Min: 251, p2Max: 251 }
    ]
  },
  {
    name: "Jepang",
    code: "JP",
    flag: "🇯🇵",
    ranges: [
      { p1: 126, p2Min: 0, p2Max: 50 },
      { p1: 133, p2Min: 0, p2Max: 99 },
      { p1: 210, p2Min: 140, p2Max: 140 }
    ]
  },
  {
    name: "Inggris Raya",
    code: "GB",
    flag: "🇬🇧",
    ranges: [
      { p1: 62, p2Min: 24, p2Max: 25 },
      { p1: 82, p2Min: 165, p2Max: 166 },
      { p1: 109, p2Min: 169, p2Max: 170 }
    ]
  },
  {
    name: "Jerman",
    code: "DE",
    flag: "🇩🇪",
    ranges: [
      { p1: 78, p2Min: 46, p2Max: 47 },
      { p1: 46, p2Min: 112, p2Max: 115 },
      { p1: 95, p2Min: 90, p2Max: 91 }
    ]
  },
  {
    name: "Australia",
    code: "AU",
    flag: "🇦🇺",
    ranges: [
      { p1: 14, p2Min: 200, p2Max: 201 },
      { p1: 120, p2Min: 144, p2Max: 145 }
    ]
  },
  {
    name: "Belanda",
    code: "NL",
    flag: "🇳🇱",
    ranges: [
      { p1: 94, p2Min: 228, p2Max: 228 },
      { p1: 185, p2Min: 10, p2Max: 11 }
    ]
  },
  {
    name: "Kanada",
    code: "CA",
    flag: "🇨🇦",
    ranges: [
      { p1: 198, p2Min: 50, p2Max: 51 },
      { p1: 142, p2Min: 120, p2Max: 125 }
    ]
  },
  {
    name: "Prancis",
    code: "FR",
    flag: "🇫🇷",
    ranges: [
      { p1: 37, p2Min: 187, p2Max: 205 },
      { p1: 164, p2Min: 132, p2Max: 135 }
    ]
  },
  {
    name: "Korea Selatan",
    code: "KR",
    flag: "🇰🇷",
    ranges: [
      { p1: 210, p2Min: 123, p2Max: 124 },
      { p1: 112, p2Min: 170, p2Max: 174 }
    ]
  }
];

// Generate random organic public IP based on list of non-Indonesian target countries
function generateOrganicGeoIP(): { ip: string; countryCode: string; countryName: string } {
  const country = GLOBAL_GEOS[Math.floor(Math.random() * GLOBAL_GEOS.length)];
  const range = country.ranges[Math.floor(Math.random() * country.ranges.length)];
  
  const p1 = range.p1;
  const p2 = Math.floor(Math.random() * (range.p2Max - range.p2Min + 1)) + range.p2Min;
  const p3 = Math.floor(Math.random() * 256);
  const p4 = Math.floor(Math.random() * 254) + 1;
  
  return {
    ip: `${p1}.${p2}.${p3}.${p4}`,
    countryCode: country.code,
    countryName: `${country.flag} ${country.name}`
  };
}

// Background request simulator function
async function simulateVisit(campaign: Campaign) {
  const now = new Date().toISOString();
  console.log(`[Campaign Run] Starting visits for "${campaign.name}" -> ${campaign.url}`);

  // Fetch count of requests to execute
  const count = campaign.requestCount || 1;
  const isRandomDelay = campaign.randomizeDelay !== false;

  for (let i = 0; i < count; i++) {
    // If multiple requests, add a delay to space them out naturally
    if (i > 0 && isRandomDelay) {
      const waitTime = 500 + Math.floor(Math.random() * 2000); // 500ms to 2500ms
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Determine User Agent
    let ua = "";
    if (campaign.deviceType === "desktop") {
      ua = DESKTOP_USER_AGENTS[Math.floor(Math.random() * DESKTOP_USER_AGENTS.length)];
    } else if (campaign.deviceType === "mobile") {
      ua = MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
    } else {
      // all/mix
      const combined = [...DESKTOP_USER_AGENTS, ...MOBILE_USER_AGENTS];
      ua = combined[Math.floor(Math.random() * combined.length)];
    }

    // Determine Referer
    let ref = "";
    if (campaign.referrerType === "google") {
      ref = GOOGLE_REFERRERS[Math.floor(Math.random() * GOOGLE_REFERRERS.length)];
    } else if (campaign.referrerType === "social") {
      ref = SOCIAL_REFERRERS[Math.floor(Math.random() * SOCIAL_REFERRERS.length)];
    } else if (campaign.referrerType === "custom" && campaign.customReferrer) {
      ref = campaign.customReferrer;
    } else {
      ref = ""; // direct
    }

    // Generate organic global location & IP
    const geo = generateOrganicGeoIP();

    // Determine the exact URL to request in this iteration to simulate clicking and deep navigation
    let targetUrl = campaign.url;
    if (campaign.deepLinks && campaign.deepLinks.length > 0) {
      // 40% chance of hitting main URL, 60% chance of clicking a deep link subpage
      if (Math.random() < 0.60) {
        const selectedPath = campaign.deepLinks[Math.floor(Math.random() * campaign.deepLinks.length)].trim();
        if (selectedPath) {
          if (/^https?:\/\//i.test(selectedPath)) {
            targetUrl = selectedPath;
          } else {
            // Relative path - resolve elegantly with parent URL domain origin
            try {
              const origin = new URL(campaign.url).origin;
              const cleanPath = selectedPath.startsWith("/") ? selectedPath : "/" + selectedPath;
              targetUrl = origin + cleanPath;
            } catch (e) {
              targetUrl = campaign.url;
            }
          }
        }
      }
    }

    const logId = Math.random().toString(36).substring(2, 11);
    const startTime = Date.now();

    try {
      // Trigger actual server-side visitor fetch request with spoofed IP headers
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent": ua,
          ...(ref ? { "Referer": ref } : {}),
          "X-Forwarded-For": geo.ip,
          "Client-IP": geo.ip,
          "X-Real-IP": geo.ip,
          "CF-Connecting-IP": geo.ip,
          "True-Client-IP": geo.ip,
          "X-Cluster-Client-IP": geo.ip,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        signal: AbortSignal.timeout(12000) // 12 seconds request timeout
      });

      const responseTime = Date.now() - startTime;
      const statusCode = response.status;
      const isSuccess = statusCode >= 200 && statusCode < 400;

      // Log entry compilation
      const newLog: VisitLog = {
        id: logId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        url: targetUrl,
        timestamp: new Date().toISOString(),
        referrer: ref || "Direct / Bookmark",
        userAgent: ua,
        ip: geo.ip,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        status: isSuccess ? "success" : "failed",
        statusCode: statusCode,
        responseTime: responseTime
      };

      // Add log
      visitLogs.unshift(newLog);
      
      // Update campaign counters in our running list
      const targetCampaign = campaigns.find(c => c.id === campaign.id);
      if (targetCampaign) {
        targetCampaign.totalVisits += 1;
        if (isSuccess) {
          targetCampaign.successfulVisits += 1;
        } else {
          targetCampaign.failedVisits += 1;
        }
        targetCampaign.lastRun = new Date().toISOString();
      }

    } catch (err: any) {
      const responseTime = Date.now() - startTime;
      console.error(`[Fetch Error] Campaign "${campaign.name}" hit failed:`, err.message || err);

      const errorLog: VisitLog = {
        id: logId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        url: targetUrl,
        timestamp: new Date().toISOString(),
        referrer: ref || "Direct / Bookmark",
        userAgent: ua,
        ip: geo.ip,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        status: "failed",
        statusCode: null,
        responseTime: responseTime,
        error: err.message || String(err)
      };

      visitLogs.unshift(errorLog);

      const targetCampaign = campaigns.find(c => c.id === campaign.id);
      if (targetCampaign) {
        targetCampaign.totalVisits += 1;
        targetCampaign.failedVisits += 1;
        targetCampaign.lastRun = new Date().toISOString();
      }
    }
  }

  // Cap logs to keep memory clean (max 500 latest entries)
  if (visitLogs.length > 500) {
    visitLogs = visitLogs.slice(0, 500);
  }

  // Save changes to db files
  writeJSONFile(CAMPAIGNS_FILE, campaigns);
  writeJSONFile(LOGS_FILE, visitLogs);
}

// Map timer setups
function startCampaignTimer(campaign: Campaign) {
  // Clear if already exists
  if (activeTimers[campaign.id]) {
    clearInterval(activeTimers[campaign.id]);
  }

  // Set interval (convert seconds to ms)
  const intervalMs = Math.max(5000, campaign.interval * 1000); // safety cap: minimum 5s to prevent crash loops
  
  console.log(`[Scheduler] Registered interval for campaign "${campaign.name}" every ${campaign.interval}s (${intervalMs}ms)`);
  
  activeTimers[campaign.id] = setInterval(() => {
    // Reload campaigns to ensure we have fresh properties (like toggle states)
    const freshCampaign = campaigns.find(c => c.id === campaign.id);
    if (freshCampaign && freshCampaign.status === "active") {
      simulateVisit(freshCampaign);
    } else {
      // Clear timer if no longer exists or inactive
      console.log(`[Scheduler] Cleaning up inactive timer for campaign "${campaign.id}"`);
      clearInterval(activeTimers[campaign.id]);
      delete activeTimers[campaign.id];
    }
  }, intervalMs);
}

// Initialize active campaigns on boot
function initializeScheduler() {
  console.log("[Scheduler] Initializing background engines...");
  campaigns.forEach((campaign) => {
    if (campaign.status === "active") {
      startCampaignTimer(campaign);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API - Get campaigns list
  app.get("/api/campaigns", (req, res) => {
    res.json(campaigns);
  });

  // API - Create new campaign
  app.post("/api/campaigns", (req, res) => {
    const {
      name,
      url,
      deepLinks,
      interval,
      referrerType,
      customReferrer,
      deviceType,
      requestCount,
      randomizeDelay,
    } = req.body;

    if (!name || !url || !interval) {
      res.status(400).json({ error: "Missing required fields (name, url, interval)" });
      return;
    }

    // Verify URL layout
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "http://" + formattedUrl;
    }

    const newCampaign: Campaign = {
      id: "camp_" + Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      url: formattedUrl,
      deepLinks: Array.isArray(deepLinks) ? deepLinks.filter(l => typeof l === "string" && l.trim().length > 0) : [],
      interval: parseInt(String(interval)) || 60,
      status: "paused", // starts as paused so they can double-check/configure
      referrerType: referrerType || "direct",
      customReferrer: customReferrer,
      deviceType: deviceType || "all",
      requestCount: parseInt(String(requestCount)) || 1,
      randomizeDelay: randomizeDelay !== false,
      totalVisits: 0,
      successfulVisits: 0,
      failedVisits: 0,
      lastRun: null,
      createdAt: new Date().toISOString()
    };

    campaigns.push(newCampaign);
    writeJSONFile(CAMPAIGNS_FILE, campaigns);

    res.status(201).json(newCampaign);
  });

  // API - Update existing campaign
  app.put("/api/campaigns/:id", (req, res) => {
    const { id } = req.params;
    const index = campaigns.findIndex((c) => c.id === id);

    if (index === -1) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const existing = campaigns[index];
    const {
      name,
      url,
      deepLinks,
      interval,
      referrerType,
      customReferrer,
      deviceType,
      requestCount,
      randomizeDelay
    } = req.body;

    let formattedUrl = url ? url.trim() : existing.url;
    if (url && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "http://" + formattedUrl;
    }

    campaigns[index] = {
      ...existing,
      name: name ? name.trim() : existing.name,
      url: formattedUrl,
      deepLinks: Array.isArray(deepLinks) ? deepLinks.filter(l => typeof l === "string" && l.trim().length > 0) : existing.deepLinks,
      interval: interval ? parseInt(String(interval)) : existing.interval,
      referrerType: referrerType || existing.referrerType,
      customReferrer: customReferrer !== undefined ? customReferrer : existing.customReferrer,
      deviceType: deviceType || existing.deviceType,
      requestCount: requestCount !== undefined ? parseInt(String(requestCount)) : existing.requestCount,
      randomizeDelay: randomizeDelay !== undefined ? !!randomizeDelay : existing.randomizeDelay
    };

    writeJSONFile(CAMPAIGNS_FILE, campaigns);

    // If campaign is active, restart timer to apply new settings instantly
    if (campaigns[index].status === "active") {
      startCampaignTimer(campaigns[index]);
    }

    res.json(campaigns[index]);
  });

  // API - Toggle active status (Play / Pause)
  app.post("/api/campaigns/:id/toggle", (req, res) => {
    const { id } = req.params;
    const index = campaigns.findIndex((c) => c.id === id);

    if (index === -1) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    const campaign = campaigns[index];
    const newStatus = campaign.status === "active" ? "paused" : "active";
    campaign.status = newStatus;

    writeJSONFile(CAMPAIGNS_FILE, campaigns);

    if (newStatus === "active") {
      startCampaignTimer(campaign);
      // Trigger a run immediately to give immediate visual feedback
      simulateVisit(campaign);
    } else {
      // Clear background timer
      if (activeTimers[campaign.id]) {
        clearInterval(activeTimers[campaign.id]);
        delete activeTimers[campaign.id];
      }
      console.log(`[Scheduler] Paused background engine for "${campaign.name}"`);
    }

    res.json(campaign);
  });

  // API - Force instant run/trigger
  app.post("/api/campaigns/:id/trigger", async (req, res) => {
    const { id } = req.params;
    const campaign = campaigns.find((c) => c.id === id);

    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Runs asynchronously so the user gets an instant response but the simulation keeps running
    simulateVisit(campaign);
    res.json({ message: "Simulasi kunjungan instan dipicu!", campaign });
  });

  // API - Delete campaign
  app.delete("/api/campaigns/:id", (req, res) => {
    const { id } = req.params;
    const index = campaigns.findIndex((c) => c.id === id);

    if (index === -1) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }

    // Clear background timer first
    if (activeTimers[id]) {
      clearInterval(activeTimers[id]);
      delete activeTimers[id];
    }

    const deleted = campaigns.splice(index, 1)[0];
    writeJSONFile(CAMPAIGNS_FILE, campaigns);

    res.json({ message: "Campaign deleted success", deleted });
  });

  // API - Get all visit logs
  app.get("/api/logs", (req, res) => {
    res.json(visitLogs);
  });

  // API - Clear logs
  app.post("/api/logs/clear", (req, res) => {
    visitLogs = [];
    writeJSONFile(LOGS_FILE, visitLogs);
    res.json({ status: "cleared" });
  });

  // API - Get aggregate statistics
  app.get("/api/stats", (req, res) => {
    let totals = 0;
    let successes = 0;
    let failures = 0;

    campaigns.forEach((c) => {
      totals += c.totalVisits || 0;
      successes += c.successfulVisits || 0;
      failures += c.failedVisits || 0;
    });

    const activeCount = campaigns.filter((c) => c.status === "active").length;
    const lastVisit = visitLogs.length > 0 ? visitLogs[0].timestamp : null;

    const stats: GlobalStats = {
      totalVisitsRun: totals,
      successfulVisitsRun: successes,
      failedVisitsRun: failures,
      activeCampaignsCount: activeCount,
      totalCampaignsCount: campaigns.length,
      lastVisitAt: lastVisit
    };

    res.json(stats);
  });

  // Initialize scheduler for existing campaigns before running Vite Dev/Prod handlers
  initializeScheduler();

  // Vite integration and static assets fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack engine:", err);
});
