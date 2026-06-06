import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Plus, 
  Trash, 
  RotateCw, 
  Globe, 
  Smartphone, 
  Monitor, 
  Compass, 
  Search, 
  Sparkles, 
  Clock, 
  Settings, 
  AlertCircle, 
  Terminal, 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Send,
  Sliders,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Campaign, VisitLog, GlobalStats } from "./types.js";

export default function App() {
  // Campaigns list state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalVisitsRun: 0,
    successfulVisitsRun: 0,
    failedVisitsRun: 0,
    activeCampaignsCount: 0,
    totalCampaignsCount: 0,
    lastVisitAt: null,
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs / Filter View state
  const [logFilter, setLogFilter] = useState<"all" | "success" | "failed">("all");
  const [logSearch, setLogSearch] = useState("");
  const [activeCamTab, setActiveCamTab] = useState<"all" | "active" | "paused">("all");

  // Form states for creating/editing campaign
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [showClearLogsConfirm, setShowClearLogsConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    deepLinksString: "", // New field: newline-separated subpages string
    interval: 60, // seconds
    referrerType: "direct" as Campaign["referrerType"],
    customReferrer: "",
    deviceType: "all" as Campaign["deviceType"],
    requestCount: 1,
    randomizeDelay: true
  });

  // Client-Side Active Realtime Viewer
  const [viewerCampaign, setViewerCampaign] = useState<Campaign | null>(null);
  const [viewerActive, setViewerActive] = useState(false);
  const [viewerTimeLeft, setViewerTimeLeft] = useState(0);
  const [viewerLogs, setViewerLogs] = useState<string[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [usePopupMode, setUsePopupMode] = useState(false); // New state to solve iframe click/JS tracking blocks
  const [copiedScript, setCopiedScript] = useState(false);
  const viewerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const copyScriptToClipboard = () => {
    const scriptCode = `(function(){\n  console.log("Auto-Engagement Clicker Active!");\n  // 1. Smooth Scroll Loop\n  setInterval(function(){\n    var scrollY = Math.floor(Math.random() * 320) + 120;\n    window.scrollBy({ top: (Math.random() > 0.35 ? scrollY : -scrollY), behavior: "smooth" });\n  }, 4000);\n  \n  // 2. Simulated Random Target Click\n  setTimeout(function(){\n    var clickable = document.querySelectorAll("a, button, [role=\'button\'], input[type=\'submit\']");\n    if(clickable.length > 0){\n      var target = clickable[Math.floor(Math.random() * clickable.length)];\n      console.log("[Auto-Clicker] Programmatic engagement click on:", target);\n      target.focus();\n      target.click();\n    }\n  }, 7000);\n})();`;
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const timestamp = new Date().toLocaleTimeString();
        setViewerLogs(prev => [
          `[${timestamp}] [Auto-Clicker] ✔ Berhasil mengakses dokumen DOM halaman!`,
          ...prev.slice(0, 15)
        ]);

        // Auto clicker logic inside same-origin page
        const elementsToClick = iframeDoc.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]');
        if (elementsToClick.length > 0) {
          const randomIndex = Math.floor(Math.random() * elementsToClick.length);
          const targetEl = elementsToClick[randomIndex] as HTMLElement;
          targetEl.focus();
          
          setViewerLogs(prev => [
            `[${timestamp}] [Auto-Clicker] Simulasikan klik otomatis pada elemen: <${targetEl.tagName.toLowerCase()}> "${targetEl.textContent?.substring(0, 25).trim() || 'tanpa label'}"`,
            ...prev.slice(0, 15)
          ]);
          
          targetEl.click();
        } else {
          // Click random coordinate on viewport
          const clickX = Math.floor(Math.random() * (iframeDoc.body.clientWidth || 800));
          const clickY = Math.floor(Math.random() * (iframeDoc.body.clientHeight || 600));
          
          setViewerLogs(prev => [
            `[${timestamp}] [Auto-Clicker] Simulasikan klik di koordinat acak (${clickX}px, ${clickY}px) pada body.`,
            ...prev.slice(0, 15)
          ]);

          const evt = new MouseEvent('click', {
            view: iframe.contentWindow || window,
            bubbles: true,
            cancelable: true,
            clientX: clickX,
            clientY: clickY
          });
          iframeDoc.body.dispatchEvent(evt);
        }

        // Auto scroll simulator
        const scrollDest = Math.floor(Math.random() * ((iframeDoc.documentElement.scrollHeight || 1000) - 200));
        iframeDoc.documentElement.scrollTo({
          top: scrollDest,
          behavior: 'smooth'
        });
      }
    } catch (err: any) {
      const timestamp = new Date().toLocaleTimeString();
      setViewerLogs(prev => [
        `[${timestamp}] [Auto-Clicker] 🔒 Proteksi CORS Terdeteksi! Halaman eksternal tidak mengizinkan bypass Iframe Klik langsung.`,
        `[${timestamp}] [Auto-Clicker] 👉 Tips: Pasang "Universal Clicker Script" (tersedia di tab info) pada web Anda, atau beralih ke Mode "🚀 Tab Riil (Popup Mode)" di atas.`,
        ...prev.slice(0, 15)
      ]);
    }
  };

  // Poll intervals
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500); // Poll server every 2.5s
    return () => clearInterval(interval);
  }, []);

  // Sync client-side auto-viewer timer
  useEffect(() => {
    if (viewerActive && viewerCampaign) {
      setViewerTimeLeft(viewerCampaign.interval);
      runViewerCycle();
      
      viewerTimerRef.current = setInterval(() => {
        setViewerTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger load cycle
            triggerIframeReload();
            return viewerCampaign.interval;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (viewerTimerRef.current) {
        clearInterval(viewerTimerRef.current);
      }
    }

    return () => {
      if (viewerTimerRef.current) clearInterval(viewerTimerRef.current);
    };
  }, [viewerActive, viewerCampaign, usePopupMode]);

  const triggerIframeReload = () => {
    if (!viewerCampaign) return;

    // Pick a target url either from parent campaign url or rotating deep links
    let finalTarget = viewerCampaign.url;
    if (viewerCampaign.deepLinks && viewerCampaign.deepLinks.length > 0) {
      if (Math.random() < 0.60) {
        const selected = viewerCampaign.deepLinks[Math.floor(Math.random() * viewerCampaign.deepLinks.length)].trim();
        if (selected) {
          if (/^https?:\/\//i.test(selected)) {
            finalTarget = selected;
          } else {
            try {
              const origin = new URL(viewerCampaign.url).origin;
              const cleanPath = selected.startsWith("/") ? selected : "/" + selected;
              finalTarget = origin + cleanPath;
            } catch (e) {
              finalTarget = viewerCampaign.url;
            }
          }
        }
      }
    }

    const timestamp = new Date().toLocaleTimeString();

    if (usePopupMode) {
      setViewerLogs(prev => [
        `[${timestamp}] [PopUp Engine] Meluncurkan tab kunjungan asli -> ${finalTarget}`,
        ...prev.slice(0, 15)
      ]);
      try {
        // Formulate window specs
        const popupWin = window.open(finalTarget, "_blank", "width=850,height=600,scrollbars=yes,resizable=yes");
        if (popupWin) {
          setViewerLogs(prev => [
            `[${timestamp}] [PopUp Engine] ✔ Jendela berhasil dibuka. Menjalankan skrip JS web penuh. Auto-close dalam 10s...`,
            ...prev.slice(0, 15)
          ]);
          // Schedule safe close
          setTimeout(() => {
            try {
              popupWin.close();
              const closedTime = new Date().toLocaleTimeString();
              setViewerLogs(p => [
                `[${closedTime}] [PopUp Engine] ✖ Kunjungan selesai & jendela ditutup otomatis secara aman.`,
                ...p.slice(0, 15)
              ]);
            } catch (err) {}
          }, 10000);
        } else {
          setViewerLogs(prev => [
            `[${timestamp}] [PopUp Engine] ⚠ Gagal! Pembuat tab diblokir browser. Mohon izinkan Pop-up di sudut kanan atas address bar Anda.`,
            ...prev.slice(0, 15)
          ]);
        }
      } catch (err: any) {
        setViewerLogs(prev => [
          `[${timestamp}] [PopUp Engine] Error peluncuran: ${err.message || String(err)}`,
          ...prev.slice(0, 15)
        ]);
      }
    } else {
      // Classic sandboxed iframe reload
      setIframeKey(prev => prev + 1);
      setViewerLogs(prev => [
        `[${timestamp}] [Client Engine] Memuat ulang Iframe Sandbox -> ${finalTarget}`,
        ...prev.slice(0, 15)
      ]);
    }
  };

  const runViewerCycle = () => {
    const timestamp = new Date().toLocaleTimeString();
    const modeDesc = usePopupMode ? "Tab Kunjungan Riil (Multi-Window)" : "Iframe Internal (Sandbox)";
    setViewerLogs(prev => [
      `[${timestamp}] [Visual Viewer] Memulai regenerasi trafik visual aktif (${modeDesc})`,
      ...prev.slice(0, 15)
    ]);
  };

  const fetchData = async () => {
    try {
      const [campaignsRes, logsRes, statsRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/logs"),
        fetch("/api/stats")
      ]);

      if (campaignsRes.ok && logsRes.ok && statsRes.ok) {
        const campaignsData = await campaignsRes.json();
        const logsData = await logsRes.json();
        const statsData = await statsRes.json();

        setCampaigns(campaignsData);
        setLogs(logsData);
        setStats(statsData);
      }
      setIsLoading(false);
    } catch (e) {
      console.error("Gagal melakukan polling server:", e);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    // Trim validation
    if (!formData.name.trim() || !formData.url.trim()) {
      setErrorMsg("Nama Kampanye dan URL Target wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    // URL formatting
    let processedUrl = formData.url.trim();
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = "http://" + processedUrl;
    }

    // Clean up newline-separated deep links
    const parsedDeepLinks = formData.deepLinksString
      ? formData.deepLinksString
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
      : [];

    try {
      const endpoint = editingCampaign 
        ? `/api/campaigns/${editingCampaign.id}` 
        : "/api/campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          url: processedUrl,
          deepLinks: parsedDeepLinks
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Gagal menyimpan kampanye.");
      }

      // Success
      setShowCreateModal(false);
      setEditingCampaign(null);
      // Reset form
      setFormData({
        name: "",
        url: "",
        deepLinksString: "",
        interval: 60,
        referrerType: "direct",
        customReferrer: "",
        deviceType: "all",
        requestCount: 1,
        randomizeDelay: true
      });
      fetchData();
    } catch (error: any) {
      setErrorMsg(error.message || "Ada kendala teknis saat menghubungkan ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlay = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Gagal mengubah status aktif kampanye:", e);
    }
  };

  const handleTriggerInstant = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/trigger`, { method: "POST" });
      if (res.ok) {
        fetchData();
        // Visual toast alerts / feedback inside client panel
        const time = new Date().toLocaleTimeString();
        setViewerLogs(prev => [
          `[${time}] [Trigger Manual] Membuka bypass & memicu burst kunjungan untuk "${name}"`,
          ...prev
        ]);
      }
    } catch (e) {
      console.error("Gagal meluncurkan trigger instan:", e);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setCampaignToDelete(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        // If it was the viewer target, clear it
        if (viewerCampaign && viewerCampaign.id === id) {
          setViewerActive(false);
          setViewerCampaign(null);
        }
        fetchData();
      }
    } catch (e) {
      console.error("Gagal menghapus kampanye:", e);
    }
  };

  const confirmClearLogs = async () => {
    try {
      await fetch("/api/logs/clear", { method: "POST" });
      fetchData();
    } catch (e) {
      console.error("Gagal membersihkan log harian:", e);
    }
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      url: campaign.url,
      deepLinksString: campaign.deepLinks ? campaign.deepLinks.join("\n") : "",
      interval: campaign.interval,
      referrerType: campaign.referrerType,
      customReferrer: campaign.customReferrer || "",
      deviceType: campaign.deviceType,
      requestCount: campaign.requestCount || 1,
      randomizeDelay: campaign.randomizeDelay !== false
    });
    setShowCreateModal(true);
  };

  const openNew = () => {
    setEditingCampaign(null);
    setFormData({
      name: "",
      url: "",
      deepLinksString: "",
      interval: 45,
      referrerType: "google",
      customReferrer: "",
      deviceType: "all",
      requestCount: 2,
      randomizeDelay: true
    });
    setShowCreateModal(true);
  };

  // Pre-configured templates to make scheduling incredibly easy
  const applyPresetInterval = (sec: number) => {
    setFormData(prev => ({ ...prev, interval: sec }));
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (activeCamTab === "active") return c.status === "active";
    if (activeCamTab === "paused") return c.status === "paused";
    return true;
  });

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Search filter
    const matchesSearch = 
      log.campaignName.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.url.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.referrer.toLowerCase().includes(logSearch.toLowerCase());
    
    // Status filter
    if (logFilter === "success") return matchesSearch && log.status === "success";
    if (logFilter === "failed") return matchesSearch && log.status === "failed";
    return matchesSearch;
  });

  // Helper formatting for seconds to readable Indo text
  const formatIntervalText = (sec: number) => {
    if (sec < 60) return `${sec} Detik`;
    const min = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    if (remainingSec === 0) return `${min} Menit`;
    return `${min} Menit ${remainingSec} Detik`;
  };

  return (
    <div className="min-h-screen bg-[#090c15] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Header Section */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-lg">
              <Zap className="w-5 h-5 animate-pulse text-emerald-400" id="header_icon" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white flex items-center gap-2 font-display">
                Web Traffic Automation Scheduler
              </h1>
              <p className="text-xs text-slate-400">
                Latar Belakang Aktif &bull; Simulasi Referrer &amp; User Agent Realistis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-center">
            {/* Live UTC Server Time Indicator */}
            <div className="px-3 py-1.5 bg-slate-950 rounded-lg text-xs font-mono border border-slate-800 flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>UTC: {new Date().toISOString().replace('T', ' ').substring(0, 19)}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 text-emerald-400 text-xs rounded-lg border border-emerald-500/10 font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sistem Aktif</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Global Stats Counter Ribbon */}
        <section className="col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <Activity className="w-24 h-24" />
              </div>
              <div className="text-xs text-indigo-400 font-semibold tracking-wider uppercase font-display">Total Simulasi Kunjungan</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight font-mono">{stats.totalVisitsRun}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                  HITS
                </span>
              </div>
              <div className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dipicu di latar belakang 24/7</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <CheckCircle className="w-24 h-24" />
              </div>
              <div className="text-xs text-emerald-400 font-semibold tracking-wider uppercase font-display">Kunjungan Sukses (2xx/3xx)</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight font-mono">{stats.successfulVisitsRun}</span>
                <span className="text-xs text-slate-400 font-medium">
                  ({stats.totalVisitsRun > 0 ? Math.round((stats.successfulVisitsRun / stats.totalVisitsRun) * 100) : 0}%)
                </span>
              </div>
              <div className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✔</span>
                <span>Server merespons normal (OK)</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-400 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <XCircle className="w-24 h-24" />
              </div>
              <div className="text-xs text-rose-400 font-semibold tracking-wider uppercase font-display">Kunjungan Gagal / Timeout</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-rose-500 tracking-tight font-mono">{stats.failedVisitsRun}</span>
                <span className="text-xs text-rose-400 bg-rose-550/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-mono">
                  {stats.failedVisitsRun > 0 ? `${Math.round((stats.failedVisitsRun / stats.totalVisitsRun) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-rose-500 font-bold">⚠</span>
                <span>Error atau limitasi server eksternal</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                <Sliders className="w-24 h-24" />
              </div>
              <div className="text-xs text-indigo-400 font-semibold tracking-wider uppercase font-display">Campaign Aktif Latar Belakang</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-indigo-400 tracking-tight font-mono">
                  {stats.activeCampaignsCount} <span className="text-base text-slate-500 font-normal">/ {stats.totalCampaignsCount}</span>
                </span>
              </div>
              <div className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-2 bg-indigo-500 rounded-full h-2 animate-pulse" />
                <span>Engine scheduler aktif berjalan</span>
              </div>
            </div>

          </div>
        </section>

        {/* Dashboard Actions and Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Campaigns Listing and Setup */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Campaigns Header Card */}
            <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-display">
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    Penjadwal Kampanye Otomatis
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Atur URL target dan interval. Server akan melakukan ping otomatis di latar belakang.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn_add_campaign"
                  onClick={openNew}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-[#090c15] rounded-xl text-xs font-bold flex items-center gap-2 transition duration-200 cursor-pointer self-start sm:self-center shadow-lg shadow-emerald-500/15"
                >
                  <Plus className="w-4 h-4 text-[#090c15]" />
                  Tambah Kampanye Baru
                </button>

              </div>

              {/* Filters for Campaign table */}
              <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-4">
                <button
                  type="button"
                  onClick={() => setActiveCamTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    activeCamTab === "all" ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  Semua ({campaigns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCamTab("active")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    activeCamTab === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  Sedang Berjalan ({campaigns.filter(c => c.status === "active").length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCamTab("paused")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                    activeCamTab === "paused" ? "bg-slate-800/40 text-slate-400 border border-slate-800/50 hover:text-white hover:bg-slate-800/40" : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  Diberhentikan ({campaigns.filter(c => c.status === "paused").length})
                </button>
              </div>

              {/* Campaigns list display */}
              <div className="mt-4 space-y-4">
                {isLoading ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-3" />
                    Memuat daftar kampanye dari server...
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="py-16 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 text-sm bg-slate-950/25">
                    <Globe className="w-9 h-9 mx-auto text-slate-600 mb-3" />
                    <span className="font-semibold block text-slate-300">Belum ada kampanye {activeCamTab !== "all" ? "dengan kriteria ini" : ""}</span>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Klik "Tambah Kampanye Baru" di sebelah atas untuk mulai mendongkrak trafik!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCampaigns.map((camp) => (
                      <div 
                        key={camp.id}
                        className={`p-4 rounded-xl border transition duration-200 relative overflow-hidden ${
                          camp.status === "active" 
                            ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.02] to-transparent shadow-md" 
                            : "border-slate-800 bg-slate-950/20 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-white text-sm tracking-tight">{camp.name}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
                                camp.status === "active" 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : "bg-slate-800 text-slate-400 border-slate-700/80"
                              }`}>
                                {camp.status === "active" ? "Aktif" : "Tertangguh"}
                              </span>
                            </div>
                            
                            <a 
                              href={camp.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-xs text-emerald-400/80 hover:text-emerald-300 font-mono flex items-center gap-1.5 break-all"
                            >
                              {camp.url}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>

                          {/* Top-Right Toggle & Action buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-start w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t border-slate-800/10 sm:border-0">
                            {/* Toggle Play/Pause */}
                            <button
                              type="button"
                              onClick={() => handleTogglePlay(camp.id)}
                              title={camp.status === "active" ? "Hentikan Scheduler" : "Jalankan Scheduler Latar Belakang"}
                              className={`p-2 rounded-lg border transition cursor-pointer ${
                                camp.status === "active"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                              }`}
                            >
                              {camp.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-emerald-400 stroke-none" />}
                            </button>

                            {/* Trigger Instant Visit */}
                            <button
                              type="button"
                              onClick={() => handleTriggerInstant(camp.id, camp.name)}
                              title="Picu Kunjungan Instant (Bypass Timer)"
                              className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>

                            {/* Set Viewer Target */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewerCampaign(camp);
                                setViewerActive(true);
                              }}
                              title="Tonton Reload Visual Aktif (Iframe/Tab)"
                              className={`p-2 rounded-lg border transition cursor-pointer ${
                                viewerCampaign?.id === camp.id && viewerActive
                                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                  : "bg-slate-800 border-slate-705 border-slate-700 text-slate-450 hover:text-white"
                              }`}
                            >
                              <Monitor className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEdit(camp)}
                              title="Edit Pengaturan"
                              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/85 transition cursor-pointer"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeletePrompt(camp.id)}
                              title="Hapus Kampanye"
                              className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>

                        {/* Parameter Summary tags */}
                        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/40 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Interval: <span className="text-slate-300 font-medium">{formatIntervalText(camp.interval)}</span>
                          </span>

                          <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/40 px-2 py-0.5 rounded-md">
                            <Compass className="w-3.5 h-3.5 text-slate-500" />
                            Rujukan: 
                            <span className="text-slate-300 font-medium capitalize">
                              {camp.referrerType === "google" ? "Google Organic" : camp.referrerType === "social" ? "Media Sosial" : camp.referrerType === "custom" ? "URL Kustom" : "Langsung (Direct)"}
                            </span>
                          </span>

                          <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/40 px-2 py-0.5 rounded-md">
                            {camp.deviceType === "mobile" ? <Smartphone className="w-3.5 h-3.5 text-slate-500" /> : <Monitor className="w-3.5 h-3.5 text-slate-500" />}
                            Agen: <span className="text-slate-300 font-medium capitalize">{camp.deviceType === "all" ? "Acak" : camp.deviceType}</span>
                          </span>

                          <span className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/40 px-2 py-0.5 rounded-md">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            Burst: <span className="text-slate-300 font-semibold">{camp.requestCount}x hits</span>
                          </span>
                        </div>

                        {/* Stats mini grid */}
                        <div className="mt-3 grid grid-cols-3 gap-2 py-1.5 px-2 bg-slate-950/65 rounded-xl border border-slate-900/50 text-center text-xs font-mono">
                          <div>
                            <div className="text-[10px] text-slate-500">Sukses</div>
                            <div className="font-semibold text-emerald-400 mt-0.5">{camp.successfulVisits}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">Gagal / Error</div>
                            <div className="font-semibold text-rose-400 mt-0.5">{camp.failedVisits}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500">Waktu Terakhir</div>
                            <div className="font-semibold text-slate-300 truncate mt-0.5">
                              {camp.lastRun ? new Date(camp.lastRun).toTimeString().split(' ')[0] : "Belum Jalan"}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Live Interactive Browser Viewer Panel */}
            <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2 font-display">
                    <Monitor className="w-5 h-5 text-amber-500" />
                    Live Visual Auto-Opener
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Aktifkan pemantau di layar. Browser ini akan meload web target secara konstan untuk menguji event penonton.
                  </p>
                </div>
                
                {viewerCampaign && (
                  <button
                    type="button"
                    onClick={() => setViewerActive(!viewerActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-center shadow-lg ${
                      viewerActive 
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950" 
                        : "bg-slate-800 hover:bg-slate-750 text-white"
                    }`}
                  >
                    {viewerActive ? "Hentikan Viewer" : "Jalankan Viewer"}
                  </button>
                )}
              </div>

              {!viewerCampaign ? (
                <div className="mt-5 p-6 border border-dashed border-slate-800 rounded-2xl text-center text-sm text-slate-400 bg-slate-950/20">
                  <p className="leading-relaxed">Membantu mengatasi masalah server-side caching dengan memuat web target di client-side secara simultan.</p>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-1.5">
                    Klik tombol layar <Monitor className="inline w-3.5 h-3.5" /> pada salah satu list kampanye untuk memulai live reload browser!
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Target Visual:</span>{" "}
                        <span className="text-amber-400 font-bold">{viewerCampaign.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> Reload berikutnya dalam:{" "}
                          <span className="font-mono font-bold text-emerald-400">{viewerTimeLeft}s</span>
                        </span>
                        
                        <button
                          type="button"
                          onClick={triggerIframeReload}
                          className="text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition font-semibold"
                        >
                          <RotateCw className="w-3.5 h-3.5 text-emerald-400" /> Force Reload
                        </button>
                      </div>
                    </div>

                    {/* Mode selector to solve frame loading blocks */}
                    <div className="pt-2.5 border-t border-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400">
                        <span className="text-emerald-400 font-semibold">✦ Mode Muat Visual Client:</span>{" "}
                        {usePopupMode ? "Panggil Tab Baru (Bypass Iframe)" : "Iframe Internal (Sandbox)"}
                      </div>
                      <div className="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800 self-stretch md:self-auto">
                        <button
                          type="button"
                          onClick={() => setUsePopupMode(false)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            !usePopupMode ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Iframe Sandbox
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsePopupMode(true)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            usePopupMode ? "bg-amber-600 text-slate-950 font-bold" : "text-slate-550 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          🚀 Tab Riil (Popup Mode)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Browser Live Simulator Sandbox (Iframe wrapper) */}
                  <div className="relative border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
                    <div className="p-2.5 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{usePopupMode ? "Tab Riil Mode Engine (Bypass Sandboxing)" : "Iframe Render Window \u2022 Sandboxed Client Viewer"}</span>
                      <a 
                        href={viewerCampaign.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-emerald-400 hover:underline flex items-center gap-1.5"
                      >
                        Buka di Tab Baru <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    
                    <div className="h-64 relative bg-[#06090e] border border-slate-800/20 rounded-xl flex flex-col justify-center items-center p-4">
                      
                      {viewerActive ? (
                        <>
                          {usePopupMode ? (
                            <div className="text-center p-4 space-y-2.5">
                              <Activity className="w-8 h-8 text-amber-500 animate-pulse mx-auto" />
                              <h4 className="font-semibold text-slate-300 text-sm tracking-tight">Mode Tab Riil Aktif</h4>
                              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Browser sedang membuka tab kunjungan asli di jendela eksternal yang di-refresh secara periodik lalu ditutup otomatis dalam waktu 10 detik secara simulasi.
                              </p>
                              <p className="text-[10px] text-amber-550 text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/25 max-w-xs mx-auto">
                                Pastikan pop-up diizinkan (allow pop-ups) pada browser Anda agar sistem dapat meluncurkan tab-tab ini!
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* We render iframe with referrer policy, sandbox, and key to force refresh */}
                              <iframe
                                ref={iframeRef}
                                key={iframeKey}
                                src={viewerCampaign.url}
                                referrerPolicy="no-referrer"
                                sandbox="allow-scripts allow-forms allow-same-origin"
                                className="w-full h-full border-0 rounded"
                                title="Web Auto Opener Sandbox"
                                onLoad={handleIframeLoad}
                                onError={() => {
                                  const stamp = new Date().toLocaleTimeString();
                                  setViewerLogs(p => [`[${stamp}] [Client Error] Situs menolak dimuat dalam iframe (X-Frame-Options/CORS). Kami beralih ke simulasi request latar belakang penuh.`, ...p]);
                                }}
                              />
                            </>
                          )}
                          <div className="absolute inset-x-0 bottom-0 py-1.5 bg-emerald-950/90 border-t border-emerald-800/30 text-[10px] text-emerald-300 px-3 text-center pointer-events-none flex justify-center items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                            <span>Browser aktif meloading halaman ini (Simulasi Pengunjung Baru)</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-500 space-y-2.5">
                          <Activity className="w-8 h-8 text-slate-600 animate-pulse mx-auto" />
                          <p>Visual sandbox ditangguhkan.</p>
                          <p className="text-[11px] text-slate-600">Klik "Jalankan Viewer" untuk memicu rendering halaman.</p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Visual Sandboxed logs */}
                  <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-850 font-mono text-[11px] text-slate-400 space-y-1 h-32 overflow-y-auto shadow-inner">
                    <div className="text-slate-550 text-slate-500 pb-1.5 border-b border-slate-900 flex items-center justify-between">
                      <span>Log Mesin Browser Lokal</span>
                      <span className="text-[10px] rounded bg-slate-900 border border-slate-850 px-1.5 text-orange-400">CLIENT</span>
                    </div>
                    {viewerLogs.length === 0 ? (
                      <div className="text-slate-600 italic">Siap menjalankan reload visual...</div>
                    ) : (
                      viewerLogs.map((lg, i) => (
                        <div key={i} className="leading-5 truncate select-none border-b border-gray-950/30">
                          {lg}
                        </div>
                      ))
                    )}
                  </div>
                  </div>

                )}
              </div>

            {/* Platform Guides Card */}
            <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800 shadow-xl space-y-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Panduan Optimasi Trafik Instant
              </h3>

              <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                <div className="p-3.5 bg-slate-950/50 rounded-xl space-y-1 border border-slate-850/60">
                  <div className="text-slate-350 text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="text-emerald-400">✦</span> Jeda dan Struktur (Pacing)
                  </div>
                  <p className="text-[11px]">
                    Gunakan integrasi <strong>Burst Kunjungan (multiple requests)</strong> dengan <strong>Pacing Berjeda</strong> agar hit analytics membaca visitor datang secara sekuensial yang normal, bukan lonjakan anomali bot.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/50 rounded-xl space-y-1 border border-slate-850/60">
                  <div className="text-slate-350 text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="text-emerald-400">✦</span> Penyamaran URL Referrer
                  </div>
                  <p className="text-[11px]">
                    Dengan referral spoofing Google Search, web analytics seperti Google Analytics akan mencatat kunjungan bertipe <em>Organic Search</em> yang meningkatkan reputasi SEO secara instan.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/50 rounded-xl space-y-1 border border-slate-850/60">
                  <div className="text-slate-350 text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="text-emerald-400">✦</span> Penyamaran IP Publik Acak
                  </div>
                  <p className="text-[11px]">
                    Setiap request dilengkapi dengan header forwarder IP publik acak dari berbagai provider internasional (menghindari subblok privat). Ini memastikan sistem web analytics mengenali hits sebagai pengunjung dari berbagai belahan dunia secara organik.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950/50 rounded-xl space-y-1 border border-slate-850/60">
                  <div className="text-slate-350 text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="text-emerald-400">✦</span> Berjalan Seutuhnya di Latar Belakang
                  </div>
                  <p className="text-[11px]">
                    Server scheduler Express berjalan mandiri piringan awan Cloud Run. Anda dapat menutup tab browser ini, mematikan komputer, dan trafik akan tetap terus mengalir tanpa henti.
                  </p>
                </div>
              </div>
            </div>

            {/* Universal Auto-Clicker Script Block */}
            <div className="bg-[#10192b] rounded-2xl p-5 md:p-6 border border-amber-500/20 shadow-2xl space-y-3.5">
              <h3 className="font-semibold text-amber-400 text-sm flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                Solusi Klik &amp; Interaksi Otomatis (Anti-Bypass CORS)
              </h3>
              <p className="text-[11.5px] text-slate-300 leading-relaxed">
                Browser modern memproteksi Iframe silang-domain (<strong>CORS &amp; Same-Origin Policy</strong>) sehingga parent window dilarang menyusupkan script klik langsung ke situs luar.
              </p>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Cara Kerja Alternatif Terbaik:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Salin tag script ringan sekali pakai berikut dan sematkan pada bagian template website Anda (seperti header Blogger/WordPress, atau HTML di atas tag <code>&lt;/body&gt;</code>) untuk mensimulasikan gulir alami, pelacakan sesi Google Analytics, dan klik pemicu otomatis:
                </p>
                <div className="relative bg-slate-900 rounded-lg p-2.5 border border-slate-800 font-mono text-[10.5px] text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
{`<script>
(function(){
  console.log("Anti-Bypass Auto-Clicker Active!");
  // 1. Simulasi scroll acak untuk mengaktifkan pelacak aktivitas analytics
  setInterval(function(){
    var scrollY = Math.floor(Math.random() * 300) + 100;
    window.scrollBy({ top: (Math.random() > 0.4 ? scrollY : -scrollY), behavior: "smooth" });
  }, 4000);
  
  // 2. Simulasi Klik Otomatis pada tautan/tombol acak setelah 6 detik mendarat
  setTimeout(function(){
    var clickable = document.querySelectorAll("a, button, [role='button'], input[type='submit']");
    if(clickable.length > 0){
      var target = clickable[Math.floor(Math.random() * clickable.length)];
      console.log("Clicking element:", target);
      target.focus();
      target.click();
    }
  }, 6000);
})();
</script>`}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <span className="text-[10px] text-slate-500 leading-normal max-w-sm">
                  * Ringan (~0.2KB), aman, kompatibel dengan semua penyedia situs (Blogger, WordPress, Webflow, Shopify).
                </span>
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    copiedScript 
                      ? "bg-emerald-600 text-white tracking-wide animate-pulse shadow-md" 
                      : "bg-amber-600 text-slate-950 hover:bg-amber-500 active:scale-95 shadow-md"
                  }`}
                >
                  {copiedScript ? "✓ Tersalin ke Clipboard!" : "Salin Script Klik"}
                </button>
              </div>
            </div>

          </section>

          {/* Right Panel: Live Feed Terminal Logging & System Stats */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Terminal Live logs */}
            <div className="bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-800 shadow-xl flex flex-col h-full">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="font-semibold text-white text-sm tracking-tight">Konsol Log Trafik Server</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Umpan pemantau riwayat bot background</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearLogsConfirm(true)}
                    className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 hover:text-white rounded-xl text-[11px] font-mono text-slate-300 border border-slate-750 hover:border-slate-700 transition cursor-pointer font-semibold"
                  >
                    Bersihkan Log
                  </button>
                  <span className="text-[10px] font-mono rounded bg-emerald-950/40 border border-emerald-9D0/40 border-emerald-800/40 px-2 py-0.5 text-emerald-400 font-bold">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Console search and filters */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Cari log..."
                    className="w-full pl-9 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                  {logSearch && (
                    <button
                      type="button"
                      onClick={() => setLogSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setLogFilter("all")}
                    className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition cursor-pointer ${
                      logFilter === "all" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter("success")}
                    className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition cursor-pointer ${
                      logFilter === "success" ? "bg-emerald-500/10 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Sukses
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogFilter("failed")}
                    className={`flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition cursor-pointer ${
                      logFilter === "failed" ? "bg-rose-500/10 text-rose-405 text-rose-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Gagal
                  </button>
                </div>
              </div>

              {/* Black box console wrapper */}
              <div className="mt-4 bg-[#04060a] border border-slate-850 rounded-2xl p-4 font-mono text-xs text-emerald-300 h-[480px] overflow-y-auto space-y-3 shadow-2xl">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-slate-505 text-slate-500 italic text-sm">
                    <Terminal className="w-8 h-8 text-slate-705 text-slate-700 mb-2 animate-pulse" />
                    {logSearch || logFilter !== "all" ? "Tidak ditemukan kecocokan log." : "Menanti rilis hit otomasi..."}
                    <p className="text-[11px] text-slate-600 mt-1">Aktifkan scheduler di panel sebelah kiri untuk melihat bot bekerja.</p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="border-b border-slate-900/60 pb-3 last:border-b-0 space-y-1 select-text"
                    >
                      {/* Header line of log entry */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        <span className="text-purple-400 font-bold">
                          [{new Date(log.timestamp).toTimeString().split(' ')[0]}]
                        </span>
                        
                        <span className="text-slate-400 font-semibold truncate hover:text-slate-300 max-w-[200px]" title={log.campaignName}>
                          {log.campaignName}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">
                              <CheckCircle className="w-3 h-3" /> {log.statusCode || 200} OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-bold">
                              <XCircle className="w-3 h-3" /> ERR {log.statusCode || "TIMEOUT"}
                            </span>
                          )}
                          
                          <span className="px-1.5 bg-slate-950 text-slate-400 text-[10px] font-semibold border border-slate-800 rounded-md">
                            {log.responseTime}ms
                          </span>
                        </div>
                      </div>

                      {/* Main URL targeted */}
                      <div className="text-[11px] text-slate-200 break-all flex items-center gap-1">
                        <span className="text-slate-600 flex-shrink-0 font-semibold">&raquo; URL:</span>
                        <span className="hover:underline">{log.url}</span>
                      </div>

                      {/* Referrer info */}
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="text-slate-600 flex-shrink-0 font-semibold">&raquo; Rujukan (Referer):</span>
                        <span className="text-amber-500 font-medium break-all">{log.referrer}</span>
                      </div>

                      {/* User agent simulated */}
                      <div className="text-[10px] text-slate-500 italic break-all flex items-start gap-1">
                        <span className="text-slate-600 flex-shrink-0 font-semibold">&raquo; Agent:</span>
                        <span className="text-slate-400">{log.userAgent}</span>
                      </div>

                      {/* Simulated Spoofed IP & Geolocation Country */}
                      {log.ip && (
                        <div className="text-[10px] text-amber-400/90 break-all flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-600 flex-shrink-0 font-semibold">&raquo; IP Publik:</span>
                          <span className="font-mono font-semibold text-amber-300">{log.ip}</span>
                          {log.countryName && (
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1">
                              {log.countryName}
                            </span>
                          )}
                          {!log.countryName && (
                            <span className="text-[9px] bg-emerald-950/40 text-emerald-400 px-1 rounded border border-emerald-900/30">organic geo</span>
                          )}
                        </div>
                      )}

                      {/* Explicit Error message if failed */}
                      {log.error && (
                        <div className="text-[10.5px] text-rose-400 flex items-center gap-1 bg-rose-950/10 p-1.5 rounded font-semibold mt-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>Penyebab: {log.error}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>



          </section>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 py-10 border-t border-slate-900 text-center text-xs text-slate-500 font-medium">
        <p>Web Traffic Automation Scheduler &bull; Powered by Cloud Run Express Sandbox &bull; 2026</p>
      </footer>

      {/* POPUP MODAL: CREATE OR EDIT CAMPAIGN */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  {editingCampaign ? "Edit Pengaturan Kampanye" : "Buat Kampanye Trafik Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-5 space-y-4">
                
                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form Field: Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Nama Kampanye <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Trafik Blog Utama, Promosi Halaman Landing"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Form Field: URL target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    URL Target Eksklusif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="Contoh: https://domainsaya.com/artikel-1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <p className="text-[10px] text-slate-500 select-none">
                    Pastikan situs memasang script analytics (Google Analytics, Histats, Plausible, etc) untuk melihat hasilnya.
                  </p>
                </div>

                {/* Form Field: Deep Links / Crawl Paths */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Multi-pages Deep Crawling Paths (Simulasi Klik &amp; Pindah Halaman)
                    </label>
                    <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-9D0/40 border-emerald-800/40 px-1.5 py-0.5 rounded">
                      Rekomendasi Utama
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.deepLinksString}
                    onChange={(e) => setFormData(prev => ({ ...prev, deepLinksString: e.target.value }))}
                    placeholder="Masukkan URL atau path kustom per baris, contoh:&#13;&#10;/tentang-kami&#13;&#10;/produk/baju-baru&#13;&#10;/kontak-marketing"
                    className="w-full px-3 py-2 bg-slate-955 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    <strong>Solusi Klik Otomatis:</strong> Browser memblokir klik paksa dalam Iframe akibat <i>Same-Origin Policy</i>. Dengan mengisi path di sini, bot server kami akan bergantian mengetuk tautan-tautan tersebut secara otomatis, mensimulasikan pengunjung sedang mengklik dan menjelajah mandiri (meningkatkan pageviews &amp; durasi sesi).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Form Field: Interval (seconds) with Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Interval Eksekusi (Waktu Tunggu): <span className="text-emerald-400">{formatIntervalText(formData.interval)}</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="1800"
                      step="5"
                      value={formData.interval}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => applyPresetInterval(10)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[9.5px] font-mono text-slate-400 font-bold transition cursor-pointer"
                      >
                        10s (Instant)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetInterval(30)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[9.5px] font-mono text-slate-400 font-bold transition cursor-pointer"
                      >
                        30s
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetInterval(60)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[9.5px] font-mono text-slate-400 font-bold transition cursor-pointer"
                      >
                        1 Menit
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetInterval(300)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 rounded-lg text-[9.5px] font-mono text-slate-400 font-bold transition cursor-pointer"
                      >
                        5 Menit
                      </button>
                    </div>
                  </div>

                  {/* Form Field: Request count (burst hits) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Burst Hit: <span className="text-emerald-400 font-bold">{formData.requestCount} Kali Kunjungan</span> per Interval
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.requestCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, requestCount: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                    />
                    <div className="text-[10px] text-slate-500 flex items-center justify-between select-none">
                      <span>1 Hits</span>
                      <span>10 Burst Hits (Maks)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Form Field: Referrer configuration */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Penyamaran Sumber SEO (Referrer)
                    </label>
                    <select
                      value={formData.referrerType}
                      onChange={(e) => setFormData(prev => ({ ...prev, referrerType: e.target.value as Campaign["referrerType"] }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="direct">Direct / Langsung (Tanpa Rujukan)</option>
                      <option value="google">Google Search Engine (Organic)</option>
                      <option value="social">Media Sosial (Twitter, Facebook, dll)</option>
                      <option value="custom">Alamat Kustom (Backlink URL)</option>
                    </select>
                  </div>

                  {/* Form Field: Device type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Pilihan Sistem Perangkat (User Agent)
                    </label>
                    <select
                      value={formData.deviceType}
                      onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value as Campaign["deviceType"] }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="all">Acak Semua Perangkat (Rekomendasi)</option>
                      <option value="desktop">Hanya Desktop Mac / Windows</option>
                      <option value="mobile">Hanya Smartphone iOS / Android</option>
                    </select>
                  </div>
                </div>

                {/* Form Field: Custom referrer value (Dynamic input) */}
                {formData.referrerType === "custom" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-amber-400 block">
                      Masukkan URL Rujukan Kustom
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customReferrer}
                      onChange={(e) => setFormData(prev => ({ ...prev, customReferrer: e.target.value }))}
                      placeholder="Contoh: https://news.ycombinator.com/item?id=12345"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}

                {/* Form Field: Randomize delays with simple info */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.randomizeDelay}
                      onChange={(e) => setFormData(prev => ({ ...prev, randomizeDelay: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer rounded border-slate-800 bg-slate-950"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">Aktifkan Jeda Antara (Pacing Berjeda)</span>
                      <span className="text-[10px] text-slate-500 block">Menambahkan jeda acak 500ms - 2500ms antar hits agar simulasi lebih natural</span>
                    </div>
                  </label>
                </div>

                {/* Form Actions footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0b0f19] rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/20"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        Sedang Menyimpan...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        {editingCampaign ? "Simpan Perubahan" : "Mulai Kampanye"}
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog for Campaign Deletion */}
      <AnimatePresence>
        {campaignToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-450 text-rose-400">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <Trash className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Hapus Kampanye?</h4>
                  <p className="text-[11.5px] text-slate-400 font-medium">Tindakan ini tidak bisa dibatalkan.</p>
                </div>
              </div>
              <p className="text-xs text-slate-350 bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
                Kampanye: <strong className="text-rose-400">"{campaigns.find(c => c.id === campaignToDelete)?.name || 'Scheduler Campaign'}"</strong>
              </p>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCampaignToDelete(null)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold border border-slate-705 border-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDelete(campaignToDelete);
                    setCampaignToDelete(null);
                  }}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-550 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-950/50"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog for Log Clearance */}
      <AnimatePresence>
        {showClearLogsConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Bersihkan Log Server?</h4>
                  <p className="text-[11.5px] text-slate-400 font-medium">Menghapus semua statistik pemantauan bot live.</p>
                </div>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearLogsConfirm(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-xl text-xs font-semibold border border-slate-705 border-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmClearLogs();
                    setShowClearLogsConfirm(false);
                  }}
                  className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-550 text-slate-950 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Bersihkan Semua
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
