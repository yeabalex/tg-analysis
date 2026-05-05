"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Loader2, ArrowLeft, Skull, Brain, Code, Terminal, Trophy, MessageSquare, Activity, Crown, GraduationCap, X, CheckCircle2, Users, Star, Flame, Zap, ShieldAlert, Swords, Heart, Monitor, Globe, Shield, Ticket, Box, AlertTriangle, Flag, TrendingUp, TrendingDown, Send, Bell, Search, Rocket } from "lucide-react";

const loadingMessages = [
  "Scanning channel activity...",
];

const calcPercentile = (score: number, arr: number[]) => {
  if (!arr || arr.length === 0) return 99;
  const belowOrEqual = arr.filter(s => s <= score).length;
  return Math.max(1, Math.min(99, Math.round((belowOrEqual / arr.length) * 100)));
};

const calculateMatches = (myTraits: any, allChannels: any[], myChannel: string) => {
  if (!allChannels || allChannels.length <= 1) return [];
  const matches = allChannels
    .filter(c => c.channel.toLowerCase() !== myChannel.toLowerCase())
    .map(c => {
      const distance = Math.sqrt(
        Math.pow(myTraits.smartness - c.traits.smartness, 2) +
        Math.pow(myTraits.toxicity - c.traits.toxicity, 2) +
        Math.pow(myTraits.yapLevel - c.traits.yapLevel, 2) +
        Math.pow(myTraits.egoLevel - c.traits.egoLevel, 2)
      );
      const maxDistance = 200;
      const matchPercentage = Math.max(1, Math.round(100 - (distance / maxDistance) * 100));
      return { channel: c.channel, percentage: matchPercentage, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  return matches;
};

const StoryViewer = ({ data, stats, onClose }: { data: any, stats: any, onClose: () => void }) => {
  const [slide, setSlide] = useState(0);

  const smartPercentile = stats ? calcPercentile(data.goodTraits.smartness.score, stats.smartness) : 99;
  const toxicPercentile = stats ? calcPercentile(data.spicyTraits.toxicity.score, stats.toxicity) : 99;

  const matches = stats?.rawChannels ? calculateMatches(
    { smartness: data.goodTraits.smartness.score, toxicity: data.spicyTraits.toxicity.score, yapLevel: data.spicyTraits.yapLevel.score, egoLevel: data.spicyTraits.egoLevel.score },
    stats.rawChannels, data.channel
  ) : [];

  const slides = [
    {
      id: "intro",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center relative z-10 px-6">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="text-lg font-black text-[#FF6B00] mb-4 uppercase tracking-widest border border-[#FF6B00]/30 px-4 py-1 rounded-full">{data.identity.activityLevel}</div>
          <div className="text-[2.5rem] font-black mb-6 tracking-tighter leading-tight drop-shadow-2xl">{data.personalityType.title}</div>
          <div className="text-lg text-gray-300 font-medium leading-relaxed max-w-sm">{data.personalityType.description}</div>
        </div>
      )
    },
    {
      id: "good-traits",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-2 tracking-tight text-white"><CheckCircle2 className="text-blue-500" /> Good Traits</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl col-span-2">
              <div className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-1">Smartness</div>
              <div className="text-6xl font-black text-white">{data.goodTraits.smartness.score}<span className="text-3xl text-gray-600">/100</span></div><div className="text-sm font-bold text-blue-300 mt-2">{data.goodTraits.smartness.description}</div>
              <div className="text-sm font-bold text-blue-300 mt-2">Smarter than {smartPercentile}% of creators</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Usefulness</div>
              <div className="text-4xl font-black text-white">{data.goodTraits.usefulness.score}<span className="text-xl text-gray-600">/100</span></div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-3xl">
              <div className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-1">Funny</div>
              <div className="text-4xl font-black text-white">{data.goodTraits.funny.score}<span className="text-xl text-gray-600">/100</span></div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-3xl">
              <div className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-1">Cool</div>
              <div className="text-4xl font-black text-white">{data.goodTraits.cool.score}<span className="text-xl text-gray-600">/100</span></div>
            </div>
            <div className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-3xl">
              <div className="text-pink-400 font-bold text-xs uppercase tracking-widest mb-1">Positivity</div>
              <div className="text-4xl font-black text-white">{data.goodTraits.positivity.score}<span className="text-xl text-gray-600">/100</span></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "spicy-traits",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-2 tracking-tight text-white"><Skull className="text-red-500" /> Spicy Traits</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-3xl col-span-2">
              <div className="text-red-400 font-bold text-sm uppercase tracking-widest mb-1">Toxicity</div>
              <div className="text-6xl font-black text-white">{data.spicyTraits.toxicity.score}<span className="text-3xl text-gray-600">/100</span></div><div className="text-sm font-bold text-red-300 mt-2">{data.spicyTraits.toxicity.description}</div>
              <div className="text-sm font-bold text-red-300 mt-2">More toxic than {toxicPercentile}% of creators</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl">
              <div className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-1">Yap Level</div>
              <div className="text-4xl font-black text-white">{data.spicyTraits.yapLevel.score}</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-3xl">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-1">Ego</div>
              <div className="text-4xl font-black text-white">{data.spicyTraits.egoLevel.score}</div>
            </div>
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-4 rounded-3xl">
              <div className="text-fuchsia-400 font-bold text-xs uppercase tracking-widest mb-1">Chaos</div>
              <div className="text-4xl font-black text-white">{data.spicyTraits.chaosLevel.score}</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-3xl">
              <div className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">Overconfident</div>
              <div className="text-4xl font-black text-white">{data.spicyTraits.overconfidence.score}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "strengths",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10">
          <div className="mb-8">
            <h2 className="text-4xl font-black mb-8 leading-tight tracking-tighter flex items-center gap-3 text-emerald-400"><Shield className="text-emerald-400" size={32} /> Strengths</h2>
            <ul className="space-y-4">
              {data.strengthsAndWeaknesses.strengths.map((s: string, i: number) => (
                <li key={i} className="text-xl font-medium text-white leading-relaxed bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 shadow-lg">{s}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "weaknesses",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10">
          <div>
            <h2 className="text-4xl font-black mb-8 leading-tight tracking-tighter flex items-center gap-3 text-red-400"><ShieldAlert className="text-red-400" size={32} /> Weaknesses</h2>
            <ul className="space-y-4">
              {data.strengthsAndWeaknesses.weaknesses.map((w: string, i: number) => (
                <li key={i} className="text-xl font-medium text-white leading-relaxed bg-red-500/10 p-5 rounded-3xl border border-red-500/20 shadow-lg">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "signatures",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10">
          <div className="text-sm text-[#FF6B00] uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
            <Star /> Signatures
          </div>
          <h2 className="text-4xl font-black mb-8 leading-tight tracking-tighter text-white">What makes you unique.</h2>
          <div className="space-y-4">
            {data.signatureTraits.map((trait: string, i: number) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-start gap-4 shadow-xl">
                <span className="text-[#FF6B00] font-black text-2xl mt-[-4px]">→</span>
                <span className="font-bold text-lg text-white leading-tight">{trait}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "if-they-were",
      content: (
        <div className="flex flex-col justify-center h-full px-6 relative z-10 overflow-y-auto hide-scrollbar pt-20 pb-20">
          <h2 className="text-2xl font-black mb-6 tracking-tight text-white flex items-center gap-2"><Globe className="text-blue-400" /> If you were a...</h2>
          <div className="space-y-4">
            <div className="bg-[#151515] p-5 rounded-3xl border border-white/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Code size={14} /> Language</div>
              <div className="text-2xl font-black text-[#FF6B00] mb-2">{data.ifTheyWere.programmingLanguage.name}</div>
              <div className="text-sm text-gray-300">{data.ifTheyWere.programmingLanguage.description}</div>
            </div>
            <div className="bg-[#151515] p-5 rounded-3xl border border-white/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Box size={14} /> Framework</div>
              <div className="text-2xl font-black text-purple-400 mb-2">{data.ifTheyWere.framework.name}</div>
              <div className="text-sm text-gray-300">{data.ifTheyWere.framework.description}</div>
            </div>
            <div className="bg-[#151515] p-5 rounded-3xl border border-white/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Terminal size={14} /> OS</div>
              <div className="text-2xl font-black text-blue-400 mb-2">{data.ifTheyWere.operatingSystem.name}</div>
              <div className="text-sm text-gray-300">{data.ifTheyWere.operatingSystem.description}</div>
            </div>
            <div className="bg-[#151515] p-5 rounded-3xl border border-white/10">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Monitor size={14} /> Browser</div>
              <div className="text-2xl font-black text-emerald-400 mb-2">{data.ifTheyWere.webBrowser.name}</div>
              <div className="text-sm text-gray-300">{data.ifTheyWere.webBrowser.description}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "matches",
      content: (
        <div className="flex flex-col justify-center h-full px-8 relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF6B00]/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="text-sm text-[#FF6B00] uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
            <Users /> Vibe Match
          </div>
          <h2 className="text-[2.5rem] font-black mb-8 leading-tight tracking-tighter text-white">Channels with your exact energy.</h2>
          <div className="space-y-4 relative z-10">
            {matches.length > 0 ? matches.map((m: any, i: number) => (
              <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-[2rem] p-5 flex items-center gap-4 shadow-xl">
                <img src={`/api/avatar?channel=${m.channel}`} className="w-14 h-14 rounded-full border border-white/20 object-cover" />
                <div className="flex-1">
                  <div className="font-black text-2xl text-white">@{m.channel}</div>
                  <div className="text-sm text-[#FF6B00] font-black uppercase tracking-widest">{m.percentage}% Match</div>
                </div>
              </div>
            )) : (
              <div className="text-gray-400 font-medium bg-white/5 p-4 rounded-xl">Not enough channels analyzed yet.</div>
            )}
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (slide < slides.length - 1) setSlide(s => s + 1);
      else onClose();
    }, 5500);
    return () => clearInterval(timer);
  }, [slide, slides.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col selection:bg-[#FF6B00]/30 max-w-md mx-auto w-full">
      <div className="flex gap-1.5 p-4 pt-6 z-50 relative">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden relative">
            {slide === i && <div className="absolute inset-y-0 left-0 bg-white" style={{ animation: 'storyProgress 5.5s linear forwards' }} />}
            {slide > i && <div className="absolute inset-y-0 left-0 bg-white w-full" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 z-50 relative">
        <div className="flex items-center gap-3">
          <img src={`/api/avatar?channel=${data.channel}`} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
          <span className="font-bold text-white text-lg tracking-tight">@{data.channel}</span>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
          <X size={20} className="text-white" />
        </button>
      </div>
      <div
        className="flex-1 relative"
        onClick={(e) => {
          if (window.getSelection()?.toString()) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 3) {
            if (slide > 0) setSlide(s => s - 1);
          } else {
            if (slide < slides.length - 1) setSlide(s => s + 1);
            else onClose();
          }
        }}
      >
        {slides.map((s, i) => (
          <div key={s.id} className={`absolute inset-0 transition-opacity duration-300 ${slide === i ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {s.content}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes storyProgress { 0% { width: 0%; } 100% { width: 100%; } } .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe?: {
          user?: { id: number };
          chat?: { id: number };
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export default function App() {
  const [username, setUsername] = useState("");
  const [viewMode, setViewMode] = useState<'home' | 'loading' | 'story' | 'full' | 'submitted'>('home');
  const [result, setResult] = useState<any>(null);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);
  const [expandedLanguage, setExpandedLanguage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [submittedChannel, setSubmittedChannel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Telegram WebApp SDK init
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
    }
  }, []);

  // Debounced Search from Redis DB
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle ?channel= deep link from bot notification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelParam = params.get('channel');
    if (channelParam) {
      analyzeChannel(undefined, channelParam, false);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Telegram Back Button handling
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
      tg.HapticFeedback.impactOccurred('light');
      if (viewMode === 'full') setViewMode('home');
      else if (viewMode === 'story') setViewMode('home');
      else if (viewMode === 'loading') setViewMode('home');
      else if (viewMode === 'submitted') setViewMode('home');
    };

    if (viewMode !== 'home') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }

    return () => {
      tg.BackButton.offClick(handleBack);
    };
  }, [viewMode]);

  useEffect(() => {
    fetch(`/api/leaderboard?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(data => { setLeaderboards(data.leaderboards); setStats(data.stats); }).catch(console.error);
  }, []);

  useEffect(() => {
    if (viewMode === 'loading') {
      let i = 0;
      const int = setInterval(() => { i = (i + 1) % loadingMessages.length; setLoadingMsg(loadingMessages[i]); }, 2500);
      return () => clearInterval(int);
    }
  }, [viewMode]);

  const analyzeChannel = async (e?: React.FormEvent, directUsername?: string, isLeaderboardClick: boolean = false) => {
    if (e) e.preventDefault();
    const targetUsername = directUsername || username;
    if (!targetUsername) return;
    const cleanName = targetUsername.replace('@', '').trim();
    window.Telegram?.WebApp.HapticFeedback.impactOccurred('medium');
    setResult(null); setUsername(cleanName);
    setIsSubmitting(true);

    // Get Telegram chatId for bot notification
    const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelName: cleanName, chatId }) });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.error) {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
        setToast({ message: data.error, type: 'error' });
        return;
      }

      const finishProcess = (analysisData: any) => {
        window.Telegram?.WebApp.HapticFeedback.notificationOccurred('success');
        setResult(analysisData);
        setViewMode(isLeaderboardClick ? 'full' : 'story');
      };

      // If cached, load instantly
      if (data.cached) {
        setViewMode('loading');
        return setTimeout(() => finishProcess(data.data), 800);
      }

      // Otherwise, show "analysis started" page
      window.Telegram?.WebApp.HapticFeedback.notificationOccurred('success');
      setSubmittedChannel(cleanName);
      setViewMode('submitted');

    } catch (err) { 
      console.error(err); 
      setIsSubmitting(false);
      setToast({ message: 'Something went wrong. Try again.', type: 'error' }); 
      setViewMode('home'); 
    }
  };

  // Toast UI overlay
  const ToastOverlay = toast ? (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[calc(100%-2rem)] animate-[slideDown_0.3s_ease-out]">
      <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 shadow-2xl border backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'
        }`}>
        {toast.type === 'success' ? <Bell size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
        <span className="text-sm font-bold leading-tight">{toast.message}</span>
        <button onClick={() => setToast(null)} className="ml-auto shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"><X size={16} /></button>
      </div>
    </div>
  ) : null;

  if (viewMode === 'submitted') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative max-w-md mx-auto w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-8 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 animate-pulse">
            <Rocket size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-3">Analysis Started!</h2>
          <p className="text-lg text-gray-400 font-medium mb-2 max-w-xs leading-relaxed">
            We&apos;re analyzing <span className="text-[#FF6B00] font-black">@{submittedChannel}</span>
          </p>
          <p className="text-sm text-gray-500 font-medium mb-10 max-w-xs leading-relaxed">
            You&apos;ll receive a notification through the bot when your results are ready.
          </p>
          <button
            onClick={() => setViewMode('home')}
            className="bg-gradient-to-r from-[#FF6B00] to-[#ff4000] text-black rounded-full px-8 py-4 font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,107,0,0.3)] flex items-center gap-2"
          >
            <ArrowLeft size={20} strokeWidth={3} /> Go Home
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden relative max-w-md mx-auto w-full">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF6B00]/20 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-8 relative">
            <Loader2 className="w-full h-full text-[#FF6B00] animate-spin" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center text-[#FF6B00] opacity-50"><Activity size={32} /></div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white text-center">{loadingMsg}</h2>
          <p className="text-xl mt-4 font-bold tracking-tighter text-[#FF6B00] bg-[#FF6B00]/10 px-4 py-2 rounded-2xl">@{username}</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'story' && result) return <StoryViewer data={{ channel: result.channel, ...result.analysis }} stats={stats} onClose={() => setViewMode('full')} />;

  if (viewMode === 'full' && result) {
    const r = result.analysis;
    const smartPercentile = stats ? calcPercentile(r.goodTraits.smartness.score, stats.smartness) : 99;
    const toxicPercentile = stats ? calcPercentile(r.spicyTraits.toxicity.score, stats.toxicity) : 99;
    const matches = stats?.rawChannels ? calculateMatches({ smartness: r.goodTraits.smartness.score, toxicity: r.spicyTraits.toxicity.score, yapLevel: r.spicyTraits.yapLevel.score, egoLevel: r.spicyTraits.egoLevel.score }, stats.rawChannels, result.channel) : [];

    return (
      <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden pb-24 selection:bg-[#FF6B00]/30 max-w-md mx-auto w-full relative">
        <div className="sticky top-0 bg-black/80 backdrop-blur-xl z-50 p-4 flex items-center gap-4 border-b border-white/5">
          <button onClick={() => setViewMode('home')} className="p-3 bg-[#1F1F1F] rounded-full hover:scale-110 active:scale-95 transition-all">
            <ArrowLeft size={24} strokeWidth={2.5} className="text-[#FF6B00]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight truncate">@{result.channel}</h1>
            <p className="text-xs font-black text-[#FF6B00] uppercase tracking-widest truncate">{r.identity.activityLevel}</p>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-8 relative z-10">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-[2rem] p-6 border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#FF6B00]/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="inline-block bg-[#FF6B00] text-black px-4 py-1.5 rounded-full text-sm font-black tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(255,107,0,0.4)]">
              {r.identity.devRank}
            </div>
            <h2 className="text-[2.5rem] font-black mb-3 tracking-tighter leading-tight text-white">{r.personalityType.title}</h2>
            <p className="text-gray-300 text-lg leading-relaxed font-medium">{r.personalityType.description}</p>
          </div>

          <div>
            <h3 className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2 px-2"><CheckCircle2 size={16} className="text-blue-500" /> Good Traits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full relative col-span-2">
                <span className="font-bold text-blue-400 text-lg tracking-tight">Smartness</span>
                <div className="relative z-10 mt-2">
                  <div className="text-[5rem] font-black tracking-tighter leading-none text-white mb-1">{r.goodTraits.smartness.score}<span className="text-3xl text-gray-500">/100</span></div><div className="text-xs text-blue-200/80 mb-2 font-medium leading-tight">{r.goodTraits.smartness.description}</div>
                  <div className="text-sm text-blue-300 font-bold leading-tight">Smarter than {smartPercentile}%</div>
                </div>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-emerald-400 text-lg tracking-tight">Usefulness</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.usefulness.score}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.usefulness.description}</div></div>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-yellow-400 text-lg tracking-tight">Funny</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.funny.score}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.funny.description}</div></div>
              <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-cyan-400 text-lg tracking-tight">Cool</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.cool.score}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.cool.description}</div></div>
              <div className="bg-pink-500/20 border border-pink-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-pink-400 text-lg tracking-tight">Positivity</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.positivity.score}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.positivity.description}</div></div>
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-indigo-400 text-lg tracking-tight">Aura</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.aura.score || '?'}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.aura.description}</div></div>
              <div className="bg-teal-500/20 border border-teal-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-teal-400 text-lg tracking-tight">Based Level</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.goodTraits.basedLevel.score || '?'}</div><div className="text-xs text-blue-300/80 mt-1 font-bold leading-tight ">{r.goodTraits.basedLevel.description}</div></div>
            </div>
          </div>

          <div>
            <h3 className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2 px-2"><Skull size={16} className="text-red-500" /> Spicy Traits</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full col-span-2">
                <span className="font-bold text-red-400 text-lg tracking-tight">Toxicity</span>
                <div className="mt-2">
                  <div className="text-[5rem] font-black tracking-tighter leading-none text-white mb-1">{r.spicyTraits.toxicity.score}<span className="text-3xl text-gray-500">/100</span></div><div className="text-xs text-red-200/80 mb-2 font-medium leading-tight">{r.spicyTraits.toxicity.description}</div>
                  <div className="text-sm text-red-300 font-bold leading-tight">More toxic than {toxicPercentile}%</div>
                </div>
              </div>
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-orange-400 text-lg tracking-tight">Yap Level</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.spicyTraits.yapLevel.score}</div><div className="text-xs text-red-300/80 mt-1 font-bold leading-tight ">{r.spicyTraits.yapLevel.description}</div></div>
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-purple-400 text-lg tracking-tight">Ego Level</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.spicyTraits.egoLevel.score}</div><div className="text-xs text-red-300/80 mt-1 font-bold leading-tight ">{r.spicyTraits.egoLevel.description}</div></div>
              <div className="bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-fuchsia-400 text-lg tracking-tight">Chaos</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.spicyTraits.chaosLevel.score}</div><div className="text-xs text-red-300/80 mt-1 font-bold leading-tight ">{r.spicyTraits.chaosLevel.description}</div></div>
              <div className="bg-rose-500/20 border border-rose-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full"><span className="font-bold text-rose-400 text-lg tracking-tight">Overconfident</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.spicyTraits.overconfidence.score}</div><div className="text-xs text-red-300/80 mt-1 font-bold leading-tight ">{r.spicyTraits.overconfidence.description}</div></div>
              <div className="bg-violet-500/20 border border-violet-500/30 rounded-[2rem] p-5 flex flex-col justify-between h-full col-span-2"><span className="font-bold text-violet-400 text-lg tracking-tight">Delusional</span><div className="text-[4rem] font-black tracking-tighter leading-none text-white">{r.spicyTraits.delusionLevel.score || '?'}</div><div className="text-xs text-red-300/80 mt-1 font-bold leading-tight ">{r.spicyTraits.delusionLevel.description}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
              <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><Shield /> Strengths</h3>
              <ul className="space-y-2">{r.strengthsAndWeaknesses.strengths.map((s: string, i: number) => <li key={i} className="text-gray-200 font-medium flex items-start gap-2"><TrendingUp size={18} className="text-emerald-400 shrink-0 mt-0.5" /> <span>{s}</span></li>)}</ul>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-6">
              <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert /> Weaknesses</h3>
              <ul className="space-y-2">{r.strengthsAndWeaknesses.weaknesses.map((w: string, i: number) => <li key={i} className="text-gray-200 font-medium flex items-start gap-2"><TrendingDown size={18} className="text-red-400 shrink-0 mt-0.5" /> <span>{w}</span></li>)}</ul>
            </div>
          </div>

          {r.mostLikelyTo && (
            <div className="bg-[#151515] rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-yellow-400 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2"><Trophy size={16} /> Most Likely To...</h3>
              <div className="text-xl font-medium text-white italic">"{r.mostLikelyTo}"</div>
            </div>
          )}

          <div className="bg-[#151515] rounded-[2rem] p-6 border border-white/5">
            <h3 className="text-[#FF6B00] font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2"><Star size={16} /> Signature Traits</h3>
            <ul className="space-y-3">{r.signatureTraits.map((t: string, i: number) => <li key={i} className="text-lg font-medium text-gray-200 flex gap-3"><span className="text-[#FF6B00]">→</span>{t}</li>)}</ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10 col-span-2"><div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Code size={14} /> Language</div><div className="text-2xl font-black text-[#FF6B00] mb-2">{r.ifTheyWere.programmingLanguage.name}</div><div className="text-sm text-gray-300">{r.ifTheyWere.programmingLanguage.description}</div></div>
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10 col-span-2"><div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Terminal size={14} /> OS</div><div className="text-2xl font-black text-blue-400 mb-2">{r.ifTheyWere.operatingSystem.name}</div><div className="text-sm text-gray-300">{r.ifTheyWere.operatingSystem.description}</div></div>
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10"><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Framework</div><div className="text-lg font-black text-purple-400 mb-1">{r.ifTheyWere.framework.name}</div><div className="text-xs text-gray-400 ">{r.ifTheyWere.framework.description}</div></div>
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10"><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Browser</div><div className="text-lg font-black text-emerald-400 mb-1">{r.ifTheyWere.webBrowser.name}</div><div className="text-xs text-gray-400 ">{r.ifTheyWere.webBrowser.description}</div></div>
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10"><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Football Club</div><div className="text-lg font-black text-rose-400 mb-1">{r.ifTheyWere.footballClub.name}</div><div className="text-xs text-gray-400 ">{r.ifTheyWere.footballClub.description}</div></div>
            <div className="bg-[#151515] rounded-3xl p-5 border border-white/10"><div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Villain</div><div className="text-lg font-black text-yellow-400 mb-1">{r.ifTheyWere.movieVillain.name}</div><div className="text-xs text-gray-400 ">{r.ifTheyWere.movieVillain.description}</div></div>
          </div>

          {matches.length > 0 && (
            <div className="mt-8">
              <h3 className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2 px-2"><Users size={16} /> Vibe Matches</h3>
              <div className="space-y-3">
                {matches.map((m: any, i: number) => (
                  <div key={i} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#FF6B00]/50" onClick={() => { setViewMode('home'); analyzeChannel(undefined, m.channel, true); }}>
                    <img src={`/api/avatar?channel=${m.channel}`} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                    <div className="flex-1"><div className="font-bold text-lg text-white">@{m.channel}</div><div className="text-xs text-[#FF6B00] font-black uppercase tracking-widest">{m.percentage}% Match</div></div><ChevronRight className="text-gray-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 pb-6 bg-gradient-to-t from-black via-black to-transparent pointer-events-none">
          <a href={`https://t.me/${result.channel}`} target="_blank" rel="noopener noreferrer" className="pointer-events-auto max-w-md mx-auto bg-[#1A1A1A] border border-white/10 rounded-full p-2 pr-5 flex items-center gap-3 shadow-2xl hover:bg-[#2A2A2A] transition-colors">
            <img src={`/api/avatar?channel=${result.channel}`} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
            <div className="flex-1">
              <div className="font-bold text-white text-sm leading-tight">@{result.channel}</div>
              <div className="text-xs text-[#FF6B00] font-black uppercase tracking-widest">View on Telegram</div>
            </div>
            <div className="bg-[#FF6B00]/20 p-2 rounded-full text-[#FF6B00]">
              <ChevronRight size={18} />
            </div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#FF6B00]/30 overflow-x-hidden max-w-md mx-auto w-full">
      {ToastOverlay}
      <div className="pt-16 pb-12 px-6 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#FF6B00]/10 to-transparent pointer-events-none" />
        <h1 className="text-[4rem] font-black tracking-tighter leading-[0.9] mb-4 text-white relative z-10">
          Channel <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#ff2a00]">Analyzer.</span>
        </h1>
        {stats && (stats.totalAnalyzed > 0 || stats.total > 0) && (
          <p className="relative z-10 mb-8 text-sm font-bold text-gray-500"><span className="text-[#FF6B00]">{(stats.totalAnalyzed || stats.total).toLocaleString()}</span> channels analyzed</p>
        )}
        <form onSubmit={(e) => analyzeChannel(e, undefined, false)} className="relative group z-10">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none"><span className="text-gray-400 font-bold text-xl">@</span></div>
          <input type="text" className="w-full bg-[#151515] text-white rounded-[2rem] py-6 pl-12 pr-32 text-xl font-bold outline-none transition-all placeholder:text-gray-600 border border-white/5 focus:border-[#FF6B00]/50 focus:bg-[#1A1A1A] shadow-2xl" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="absolute inset-y-2 right-2 bg-gradient-to-r from-[#FF6B00] to-[#ff4000] text-black rounded-[1.5rem] px-5 font-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-80 disabled:hover:scale-100 disabled:cursor-not-allowed w-32"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : "ANALYZE"}
          </button>
        </form>
      </div>

      {leaderboards ? (
        <div className="pb-20">
          <div className="px-6 mb-6 relative">
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
              <Search className="text-gray-500 w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search analyzed channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] text-white rounded-2xl py-4 pl-12 pr-4 outline-none border border-white/5 focus:border-white/20 transition-all placeholder:text-gray-600"
            />
          </div>

          {leaderboards.recentAnalyses && leaderboards.recentAnalyses.length > 0 && !searchQuery && (
            <div className="mb-10">
              <div className="px-6 mb-3"><span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recent</span></div>
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar px-6">
                {leaderboards.recentAnalyses.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group w-16" onClick={() => analyzeChannel(undefined, item.channel, true)}>
                    <img src={`/api/avatar?channel=${item.channel}`} className="w-14 h-14 rounded-full object-cover border-2 border-[#1A1A1A] group-hover:border-[#FF6B00] transition-all shadow-lg" alt={item.channel} />
                    <span className="text-[10px] font-bold text-gray-400 w-full truncate text-center group-hover:text-[#FF6B00] transition-colors">@{item.channel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery ? (
            <div className="px-6">
              <h2 className="text-xl font-black tracking-tight text-white mb-4">Search Results</h2>
              {isSearching ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" strokeWidth={2} /></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {searchResults.map((channel: string, i: number) => (
                    <div key={i} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-3 cursor-pointer hover:border-[#FF6B00]/50 transition-all" onClick={() => analyzeChannel(undefined, channel, true)}>
                      <img src={`/api/avatar?channel=${channel}`} className="w-16 h-16 rounded-full border border-white/10 object-cover shadow-lg" alt={channel} />
                      <span className="font-bold text-white w-full text-center truncate text-sm">@{channel}</span>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="col-span-2 text-center text-gray-500 py-10 font-bold bg-[#151515] rounded-2xl border border-white/5">No channels found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {leaderboards.mostToxic.length > 0 && (
                <div className="mb-12">
                  <div className="px-6 flex items-center justify-between mb-4"><h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2"><Skull className="text-red-500" /> Most Toxic</h2><span className="text-xs font-bold bg-red-500/20 text-red-500 px-3 py-1 rounded-full">TOP 10</span></div>
                  <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x hide-scrollbar px-6">
                    {leaderboards.mostToxic.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-3 shrink-0 snap-start cursor-pointer w-[4.5rem] group" onClick={() => analyzeChannel(undefined, item.channel, true)}>
                        <div className="relative transform group-hover:-translate-y-2 transition-all duration-300">
                          <img src={`/api/avatar?channel=${item.channel}`} className="w-[4.5rem] h-[4.5rem] rounded-full object-cover shadow-[0_8px_20px_rgba(239,68,68,0.2)] border-2 border-[#1A1A1A] group-hover:border-red-500" alt={item.channel} />
                          {i === 0 && <div className="absolute -top-3 -right-2 drop-shadow-md rotate-12"><Crown size={20} className="text-yellow-500 fill-yellow-500" /></div>}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-black text-[12px] font-black px-2.5 py-0.5 rounded-full border-2 border-black">{item.score}</div>
                        </div>
                        <span className="text-xs font-bold text-gray-400 w-full truncate text-center group-hover:text-red-400 transition-colors mt-1">@{item.channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leaderboards.smartest.length > 0 && (
                <div className="mb-12">
                  <div className="px-6 flex items-center justify-between mb-4"><h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2"><Brain className="text-blue-500" /> Biggest Brains</h2><span className="text-xs font-bold bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full">TOP 10</span></div>
                  <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x hide-scrollbar px-6">
                    {leaderboards.smartest.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-3 shrink-0 snap-start cursor-pointer w-[4.5rem] group" onClick={() => analyzeChannel(undefined, item.channel, true)}>
                        <div className="relative transform group-hover:-translate-y-2 transition-all duration-300">
                          <img src={`/api/avatar?channel=${item.channel}`} className="w-[4.5rem] h-[4.5rem] rounded-full object-cover shadow-[0_8px_20px_rgba(59,130,246,0.2)] border-2 border-[#1A1A1A] group-hover:border-blue-500" alt={item.channel} />
                          {i === 0 && <div className="absolute -top-3 -right-2 drop-shadow-md rotate-12"><GraduationCap size={20} className="text-yellow-500 fill-yellow-500" /></div>}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[12px] font-black px-2.5 py-0.5 rounded-full border-2 border-black">{item.score}</div>
                        </div>
                        <span className="text-xs font-bold text-gray-400 w-full truncate text-center group-hover:text-blue-400 transition-colors mt-1">@{item.channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leaderboards.highestAura && leaderboards.highestAura.length > 0 && (
                <div className="mb-12">
                  <div className="px-6 flex items-center justify-between mb-4"><h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2"><Zap className="text-indigo-500" /> Highest Aura</h2><span className="text-xs font-bold bg-indigo-500/20 text-indigo-500 px-3 py-1 rounded-full">TOP 10</span></div>
                  <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x hide-scrollbar px-6">
                    {leaderboards.highestAura.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col items-center gap-3 shrink-0 snap-start cursor-pointer w-[4.5rem] group" onClick={() => analyzeChannel(undefined, item.channel, true)}>
                        <div className="relative transform group-hover:-translate-y-2 transition-all duration-300">
                          <img src={`/api/avatar?channel=${item.channel}`} className="w-[4.5rem] h-[4.5rem] rounded-full object-cover shadow-[0_8px_20px_rgba(99,102,241,0.2)] border-2 border-[#1A1A1A] group-hover:border-indigo-500" alt={item.channel} />
                          {i === 0 && <div className="absolute -top-3 -right-2 drop-shadow-md rotate-12"><Crown size={20} className="text-yellow-500 fill-yellow-500" /></div>}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[12px] font-black px-2.5 py-0.5 rounded-full border-2 border-black">{item.score}</div>
                        </div>
                        <span className="text-xs font-bold text-gray-400 w-full truncate text-center group-hover:text-indigo-400 transition-colors mt-1">@{item.channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leaderboards.topLanguages.length > 0 && (
                <div className="px-6 pb-16">
                  <h2 className="text-2xl font-black tracking-tight text-white mb-4 flex items-center gap-2"><Code className="text-[#FF6B00]" /> Popular Languages</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {leaderboards.topLanguages.map((item: any, i: number) => {
                      const isExpanded = expandedLanguage === item.name;
                      return (
                        <div
                          key={i}
                          onClick={() => setExpandedLanguage(isExpanded ? null : item.name)}
                          className={`cursor-pointer rounded-[2rem] p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 shadow-lg ${isExpanded ? 'col-span-2 aspect-auto min-h-[160px]' : 'h-full'} ${i === 0 ? 'bg-gradient-to-br from-[#FF6B00] to-[#ff3300] text-black border-none' : 'bg-[#151515] text-white border border-white/5 hover:border-white/20'}`}
                        >
                          <Code className={`absolute -right-4 -top-4 w-32 h-32 opacity-10 transition-transform ${isExpanded ? 'rotate-12 scale-110' : ''} ${i === 0 ? 'text-black' : 'text-gray-500'}`} strokeWidth={1} />
                          <span className={`text-xl font-black relative z-10 ${i === 0 ? 'opacity-80' : 'text-gray-600'}`}>#{i + 1}</span>
                          <div className="relative z-10">
                            <div className="text-[2rem] font-black tracking-tighter leading-none mb-1 break-words">{item.name}</div>
                            <div className={`text-sm font-bold ${i === 0 ? 'opacity-80' : 'text-gray-400'}`}>{item.count} users</div>
                          </div>
                          {isExpanded && item.channels && (
                            <div className={`mt-4 pt-4 border-t relative z-20 ${i === 0 ? 'border-black/20' : 'border-white/10'}`}>
                              <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${i === 0 ? 'text-black/60' : 'text-gray-500'}`}>Channels</div>
                              <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
                                {item.channels.map((ch: string, idx: number) => (
                                  <div key={idx} className="flex flex-col items-center gap-1 shrink-0 snap-start cursor-pointer group/ch" onClick={(e) => { e.stopPropagation(); analyzeChannel(undefined, ch, true); }}>
                                    <img src={`/api/avatar?channel=${ch}`} className={`w-12 h-12 rounded-full object-cover border-2 transition-transform group-hover/ch:scale-110 ${i === 0 ? 'border-black/20' : 'border-[#1A1A1A]'}`} />
                                    <span className={`text-[10px] font-bold w-12 truncate text-center ${i === 0 ? 'text-black' : 'text-gray-300'}`}>@{ch}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-center py-20 flex-col items-center gap-4"><Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" strokeWidth={2} /><p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Fetching DB...</p></div>
      )}
    </div>
  );
}
