"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Play,
  Pause,
  Volume2,
  Clock,
  Layers,
  Settings2,
  ShieldCheck,
  ChevronRight,
  Zap,
  Flame,
  Radio,
  Music2,
  Type,
  Shuffle,
  HelpCircle,
  X,
  Loader2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateSeriesPayload, SeriesItem } from "@/lib/api";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";
import { toast } from "sonner";

export interface CreateSeriesWizardProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSeriesCreated: (series: SeriesItem) => void;
  initialNiche?: string;
}

export interface NicheEngine {
  id: string;
  name: string;
  emoji: string;
  avgViews: string;
  retentionMetric: string;
  badge: string;
  tagline: string;
  description: string;
  defaultTitle: string;
  suggestedTitles: string[];
  defaultStyle: string;
  defaultVoice: string;
  defaultMusic: string;
  tone: string;
  genre: string;
  hookFormula: string;
}

export const VIRAL_NICHES: NicheEngine[] = [
  {
    id: "scary_stories",
    name: "Scary Stories",
    emoji: "👻",
    avgViews: "1.8M",
    retentionMetric: "82% Retention Hook",
    badge: "🔥 High Viral Rate",
    tagline: "Unsettling mysteries & creepypasta",
    description: "Creeping suspense, dread pacing, and sudden 0-3s twist hooks that keep viewers on the edge of their seats.",
    defaultTitle: "Midnight Trail Incidents",
    suggestedTitles: [
      "Midnight Trail Incidents",
      "The Unmarked Cabin Tapes",
      "Whispers from the Basement Floor",
      "They Never Left the Lighthouse",
    ],
    defaultStyle: "cinematic_dark",
    defaultVoice: "en-US-ChristopherNeural",
    defaultMusic: "cinematic_mystery",
    tone: "Eerie, Suspenseful & Chilling",
    genre: "Horror & Mystery",
    hookFormula: "0-3s chilling anomaly discovery",
  },
  {
    id: "mythology",
    name: "Ancient Mythology",
    emoji: "⚡",
    avgViews: "1.2M",
    retentionMetric: "79% Retention",
    badge: "👑 Evergreen Classic",
    tagline: "Epic clashes of gods & ancient titans",
    description: "Majestic booming narration, mythical artifacts, divine hubris, and thunderous celestial wars.",
    defaultTitle: "Wrath of the Olympus Gate",
    suggestedTitles: [
      "Wrath of the Olympus Gate",
      "What Zeus Feared Beneath the Mountain",
      "The Cursed Titan of Tartarus",
      "Anubis and the Stolen Soul Scale",
    ],
    defaultStyle: "mythic_epic",
    defaultVoice: "en-US-BrianMultilingualNeural",
    defaultMusic: "epic_orchestral",
    tone: "Majestic, Grand & Thunderous",
    genre: "Mythology & Epic Lore",
    hookFormula: "Divine edict or forbidden godly secret",
  },
  {
    id: "school_gossip",
    name: "School Gossip & Confessions",
    emoji: "🤫",
    avgViews: "2.4M",
    retentionMetric: "91% Viral Hook",
    badge: "🚀 #1 On TikTok",
    tagline: "First-person relationship dilemmas & drama",
    description: "Fast conversational banter, high-stakes teenage / college drama, and unresolved moral cliffhangers.",
    defaultTitle: "The Friday Night Lie",
    suggestedTitles: [
      "The Friday Night Lie",
      "My Best Friend's Secret Phone",
      "The Prom Rumor That Ruined Us",
      "I Heard What She Said in the Bathroom",
    ],
    defaultStyle: "modern_candid",
    defaultVoice: "en-US-AvaMultilingualNeural",
    defaultMusic: "lofi_chill",
    tone: "Fast-Paced, Relatable & Emotional",
    genre: "Drama & Confessions",
    hookFormula: "Immediate first-person betrayal or shock",
  },
  {
    id: "dark_history",
    name: "Dark History",
    emoji: "📜",
    avgViews: "1.1M",
    retentionMetric: "84% Retention",
    badge: "🧠 High Curiosity",
    tagline: "Unsolved historical events & chilling truths",
    description: "Counter-intuitive facts challenging textbook history with forensic pacing and shocking archives.",
    defaultTitle: "The Lost War Archives",
    suggestedTitles: [
      "The Lost War Archives",
      "What History Books Hid About Napoleon",
      "The Forgotten Bunker of 1944",
      "The Roman Emperor Who Disappeared",
    ],
    defaultStyle: "cinematic_dark",
    defaultVoice: "en-US-ChristopherNeural",
    defaultMusic: "cinematic_mystery",
    tone: "Analytical, Cold & Forensic",
    genre: "Historical & Investigative",
    hookFormula: "Counter-intuitive historical revelation",
  },
  {
    id: "heists",
    name: "Heists & Masterminds",
    emoji: "💎",
    avgViews: "950K",
    retentionMetric: "88% Retention",
    badge: "⏱️ Ticking Clock",
    tagline: "Impossible high-IQ robberies & escapes",
    description: "Minute-by-minute tension, tactical blueprint breakdowns, and psychological loophole thrillers.",
    defaultTitle: "The Antwerp Zero-Alarm Job",
    suggestedTitles: [
      "The Antwerp Zero-Alarm Job",
      "How 3 Men Stole the Crown Vault",
      "The 4-Minute Museum Escape",
      "The Mastermind Who Left No Fingerprints",
    ],
    defaultStyle: "noir_thriller",
    defaultVoice: "en-US-BrianMultilingualNeural",
    defaultMusic: "phonk_tension",
    tone: "Calculated, Precise & High-Tension",
    genre: "Thriller & True Crime",
    hookFormula: "Zero-detection impossible breach",
  },
  {
    id: "anime_lore",
    name: "Anime Battles & Lore",
    emoji: "⚔️",
    avgViews: "1.5M",
    retentionMetric: "89% Retention",
    badge: "💥 High Adrenaline",
    tagline: "Power scaling, forbidden techniques & rivalries",
    description: "Epic power escalation, anime key moments, high emotional intensity, and philosophical clashes.",
    defaultTitle: "The Banished Sword God",
    suggestedTitles: [
      "The Banished Sword God",
      "When the Weakest Rank Shattered the Arena",
      "The Forbidden Blade Stance",
      "He Spent 1,000 Years in the Void Realm",
    ],
    defaultStyle: "anime",
    defaultVoice: "en-US-GuyNeural",
    defaultMusic: "phonk_tension",
    tone: "Adrenaline-Fueled & Dramatic",
    genre: "Anime & Action",
    hookFormula: "Unfathomable power feat or broken ability",
  },
  {
    id: "kindness",
    name: "Acts of Kindness",
    emoji: "💖",
    avgViews: "890K",
    retentionMetric: "94% Share Rate",
    badge: "✨ Viral Wholesome",
    tagline: "Heartwarming true stories & inspiring moments",
    description: "Deep emotional crescendo, uplifting climax, and powerful human empathy that compels sharing.",
    defaultTitle: "The 40-Year Baker's Miracle",
    suggestedTitles: [
      "The 40-Year Baker's Miracle",
      "When the Entire Town Showed Up for Him",
      "A Homeless Man's Last $20",
      "The Secret Hero of 5th Avenue",
    ],
    defaultStyle: "heartwarming_cinematic",
    defaultVoice: "en-US-EmmaMultilingualNeural",
    defaultMusic: "uplifting_emotional",
    tone: "Warm, Inspiring & Empathetic",
    genre: "Inspirational & Wholesome",
    hookFormula: "Emotional struggle turned around by kindness",
  },
  {
    id: "stickman",
    name: "Stickman Viral Drama",
    emoji: "🎭",
    avgViews: "2.1M",
    retentionMetric: "93% Retention",
    badge: "🚀 PostMatic Exclusive",
    tagline: "Minimalist 2D line combat & snappy comedy",
    description: "Alan Becker inspired 2D vector stick figure acrobatics, fast-paced comedic banter, and sudden absurd turns.",
    defaultTitle: "Stickman vs The Grand Master",
    suggestedTitles: [
      "Stickman vs The Grand Master",
      "When Red Stickman Found the Pen Tool",
      "The Stickman Office War of 2026",
      "Stickman Martial Arts Championship",
    ],
    defaultStyle: "stickman",
    defaultVoice: "en-US-GuyNeural",
    defaultMusic: "phonk_tension",
    tone: "Fast-Paced, Comedic & Kinetic",
    genre: "Animation & Comedy",
    hookFormula: "Chaotic acrobatics or instant snappy banter",
  },
];

export const ART_STYLES = [
  {
    id: "cinematic_dark",
    name: "Dark Cinematic",
    description: "Moody David Fincher aesthetic, volumetric fog & 8K shadows",
    previewBg: "from-zinc-900 to-black border-zinc-700/50",
    badge: "Photoreal",
  },
  {
    id: "anime",
    name: "2D Japanese Anime",
    description: "Studio MAPPA / Ufotable cel-shaded keyframes with dynamic lighting",
    previewBg: "from-indigo-950/60 to-purple-950/40 border-indigo-500/30",
    badge: "Non-Photoreal",
  },
  {
    id: "stickman",
    name: "Minimalist Stickman",
    description: "2D clean vector figures with neon glow combat trails & speed lines",
    previewBg: "from-neutral-900 to-black border-cyan-500/30",
    badge: "Exclusive 2D",
  },
  {
    id: "mythic_epic",
    name: "Mythic Epic",
    description: "Golden god rays, grand ancient temples & crackling divine energy",
    previewBg: "from-amber-950/40 to-yellow-950/20 border-amber-500/30",
    badge: "High Fantasy",
  },
  {
    id: "noir_thriller",
    name: "Neo-Noir Thriller",
    description: "Michael Mann sleek neon reflections on wet asphalt & high tension",
    previewBg: "from-slate-900 to-zinc-950 border-blue-500/30",
    badge: "Tension",
  },
  {
    id: "modern_candid",
    name: "Modern Candid",
    description: "35mm natural depth of field, authentic daylight & urban documentary",
    previewBg: "from-zinc-900 to-zinc-950 border-zinc-600/30",
    badge: "Realistic",
  },
  {
    id: "heartwarming_cinematic",
    name: "Heartwarming Glow",
    description: "Warm golden hour natural rim lighting & soft nostalgic bokeh",
    previewBg: "from-rose-950/30 to-amber-950/30 border-rose-500/30",
    badge: "Warmth",
  },
];

export const NEURAL_VOICES = [
  {
    id: "en-US-BrianMultilingualNeural",
    name: "Brian",
    role: "Deep & Conversational",
    tag: "Viral TikTok Voice",
    sampleText: "Here is the wild part... nobody saw what was coming next.",
  },
  {
    id: "en-US-AvaMultilingualNeural",
    name: "Ava",
    role: "Warm & Expressive",
    tag: "High-Retention Drama",
    sampleText: "I still remember the exact moment she opened the message...",
  },
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep & Authoritative",
    tag: "Cinematic Documentary",
    sampleText: "Deep beneath the mountain, the first signal was detected.",
  },
  {
    id: "en-US-EmmaMultilingualNeural",
    name: "Emma",
    role: "Empathetic & Emotional",
    tag: "Heartwarming & Story",
    sampleText: "He had worked 40 years without ever asking for recognition.",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "Punchy & Energetic",
    tag: "Fast Action & Banter",
    sampleText: "Wait until you see how this stickman handles 50 opponents!",
  },
];

export const SUBTITLE_STYLES = [
  {
    id: "hormozi_yellow",
    name: "Hormozi Kinetic Yellow",
    highlightColor: "#FACC15",
    textColor: "#FFFFFF",
    bgPill: "bg-black/60",
    sampleWord: "UNFORGIVABLE",
  },
  {
    id: "neon_cyan",
    name: "Cyber Neon Cyan",
    highlightColor: "#38BDF8",
    textColor: "#FFFFFF",
    bgPill: "bg-cyan-950/60 border border-cyan-500/30",
    sampleWord: "QUANTUM",
  },
  {
    id: "lime_punch",
    name: "Electric Lime",
    highlightColor: "#4ADE80",
    textColor: "#FFFFFF",
    bgPill: "bg-emerald-950/60 border border-emerald-500/30",
    sampleWord: "MASSIVE",
  },
  {
    id: "minimal_white",
    name: "Clean Monochrome",
    highlightColor: "#FFFFFF",
    textColor: "#A1A1AA",
    bgPill: "bg-zinc-900/80 border border-white/10",
    sampleWord: "EVIDENT",
  },
];

export const MUSIC_TRACKS = [
  { id: "none", name: "No Music (Narration Only)", mood: "Clean speech-only narration", previewUrl: null },
  { id: "cinematic_mystery", name: "Cinematic Mystery", mood: "Dark, Suspenseful & Creeping", previewUrl: "/audio/music/cinematic_mystery.mp3" },
  { id: "epic_orchestral", name: "Epic Orchestral", mood: "Grand Horns, Choirs & War Drums", previewUrl: "/audio/music/epic_orchestral.mp3" },
  { id: "lofi_chill", name: "Lofi Chill Beats", mood: "Mellow Vinyl, Nostalgic & Intimate", previewUrl: "/audio/music/lofi_chill.mp3" },
  { id: "phonk_tension", name: "High-Tension Phonk", mood: "Aggressive Bass & Kinetic Energy", previewUrl: "/audio/music/phonk_tension.mp3" },
  { id: "uplifting_emotional", name: "Uplifting Emotional", mood: "Inspiring Piano & Ambient Crescendo", previewUrl: "/audio/music/uplifting_emotional.mp3" },
];

export function CreateSeriesWizard({
  userId,
  isOpen,
  onClose,
  onSeriesCreated,
  initialNiche,
}: CreateSeriesWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Niche & Identity
  const [selectedNicheId, setSelectedNicheId] = useState<string>(initialNiche || "scary_stories");
  const [title, setTitle] = useState("Midnight Trail Incidents");
  const [showAdvancedBible, setShowAdvancedBible] = useState(false);
  const [customPremise, setCustomPremise] = useState("");
  const [customWorldRules, setCustomWorldRules] = useState("");

  // Step 2: Visual Style, Voice & Subtitles
  const [artStyle, setArtStyle] = useState("cinematic_dark");
  const [selectedVoice, setSelectedVoice] = useState("en-US-ChristopherNeural");
  const [subtitleStyle, setSubtitleStyle] = useState("hormozi_yellow");
  const [musicTrack, setMusicTrack] = useState("cinematic_mystery");
  const [isPlayingAudioSample, setIsPlayingAudioSample] = useState(false);
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Step 3: Autopilot Schedule & Distribution
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(["youtube", "tiktok"]);
  const [frequency, setFrequency] = useState<number>(1);
  const [preferredTime, setPreferredTime] = useState<string>("18:00");
  const [autopilotEnabled, setAutopilotEnabled] = useState<boolean>(true);
  const [requireApproval, setRequireApproval] = useState<boolean>(false);

  // Current Niche Engine
  const activeNiche = VIRAL_NICHES.find((n) => n.id === selectedNicheId) || VIRAL_NICHES[0];

  // When niche is selected, populate smart presets
  const handleSelectNiche = (niche: NicheEngine) => {
    setSelectedNicheId(niche.id);
    setTitle(niche.defaultTitle);
    setArtStyle(niche.defaultStyle);
    setSelectedVoice(niche.defaultVoice);
    setMusicTrack(niche.defaultMusic);
  };

  const handleRandomizeTitle = () => {
    const list = activeNiche.suggestedTitles;
    const next = list[Math.floor(Math.random() * list.length)];
    setTitle(next);
  };

  // Preview Voice using Web Speech API fallback or animated speech sample
  const handlePlayVoicePreview = (voiceId: string, sampleText: string) => {
    if (typeof window === "undefined") return;

    if (isPlayingAudioSample) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudioSample(false);
      return;
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.rate = 1.0;
        utterance.pitch = voiceId.includes("Christopher") ? 0.8 : voiceId.includes("Guy") ? 1.1 : 1.0;
        utterance.onend = () => setIsPlayingAudioSample(false);
        utterance.onerror = () => setIsPlayingAudioSample(false);
        setIsPlayingAudioSample(true);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsPlayingAudioSample(false);
      }
    } else {
      toast.info(`Auditioning ${voiceId}: "${sampleText}"`);
    }
  };

  // Audition Background Music Preview
  const handlePlayMusicPreview = (trackId: string, previewUrl: string | null) => {
    if (!previewUrl) return;

    if (playingMusicId === trackId) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
      }
      setPlayingMusicId(null);
      return;
    }

    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
    }

    const audio = new Audio(previewUrl);
    musicAudioRef.current = audio;
    setPlayingMusicId(trackId);

    audio.play().catch((err) => {
      console.warn("Music preview playback error:", err);
      setPlayingMusicId(null);
    });
    audio.onended = () => setPlayingMusicId(null);
    audio.onerror = () => {
      console.warn(`Music preview failed to load: ${previewUrl}`);
      setPlayingMusicId(null);
    };
  };

  // Cleanup speech synthesis & music preview on unmount/step change
  useEffect(() => {
    return () => {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStep, isOpen]);

  const togglePlatform = (p: string) => {
    if (targetPlatforms.includes(p)) {
      if (targetPlatforms.length > 1) {
        setTargetPlatforms(targetPlatforms.filter((item) => item !== p));
      } else {
        toast.warning("Select at least one destination platform.");
      }
    } else {
      setTargetPlatforms([...targetPlatforms, p]);
    }
  };

  const handleCreateSeriesSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please provide a series title.");
      return;
    }

    setIsSubmitting(true);
    try {
      const rules = customWorldRules
        ? customWorldRules.split("\n").map((r) => r.trim()).filter(Boolean)
        : undefined;

      const payload: CreateSeriesPayload = {
        user_id: userId || "anonymous",
        title: title.trim(),
        niche: activeNiche.id,
        genre: activeNiche.genre,
        tone: activeNiche.tone,
        art_style: artStyle,
        voice: selectedVoice,
        music_track: musicTrack,
        subtitle_style: subtitleStyle,
        autopilot_enabled: autopilotEnabled,
        post_frequency_per_day: frequency,
        preferred_time_utc: preferredTime,
        target_platforms: targetPlatforms,
        require_approval: requireApproval,
        premise: customPremise.trim() || activeNiche.description,
        world_rules: rules,
      };

      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create series");
      }

      const createdSeries: SeriesItem = await res.json();
      toast.success(
        autopilotEnabled
          ? `Series "${createdSeries.title}" created with Daily Autopilot Active!`
          : `Series "${createdSeries.title}" created successfully!`
      );

      onSeriesCreated(createdSeries);
      onClose();
    } catch (err: any) {
      console.error("Create series failed:", err);
      toast.error(err.message || "Failed to create series.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900">
        {/* Top Purple Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6c5ce7] to-transparent" />

        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#6c5ce7] font-semibold">
                Autonomous Studio
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">Step {currentStep} of 3</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {currentStep === 1 && "Create a Viral Series • Choose Niche"}
              {currentStep === 2 && "Customize Visual Style & Neural Voice"}
              {currentStep === 3 && "Autopilot Posting & Channel Distribution"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="shrink-0 grid grid-cols-3 bg-slate-50 border-b border-slate-200">
          {[
            { step: 1, label: "1. Viral Niche" },
            { step: 2, label: "2. Style & Voice" },
            { step: 3, label: "3. Autopilot" },
          ].map((item) => (
            <div
              key={item.step}
              className={`py-2.5 text-center text-xs font-semibold transition-all border-b-2 ${
                currentStep === item.step
                  ? "border-[#6c5ce7] text-[#6c5ce7] bg-purple-50/50 font-bold"
                  : currentStep > item.step
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/30"
                  : "border-transparent text-slate-400"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ================= STEP 1: CHOOSE VIRAL NICHE ================= */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Select a Pre-Engineered Niche Engine</h3>
                  <p className="text-xs text-slate-500">
                    Each niche includes fine-tuned retention formulas, 0–3s hook schemas, and proven soundscapes.
                  </p>
                </div>
                <Badge variant="primary" className="text-[11px] py-0.5">
                  8 Engines Available
                </Badge>
              </div>

              {/* 8 Niche Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {VIRAL_NICHES.map((niche) => {
                  const isSelected = selectedNicheId === niche.id;
                  return (
                    <div
                      key={niche.id}
                      onClick={() => handleSelectNiche(niche)}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-purple-50/80 border-[#6c5ce7] shadow-xs ring-1 ring-[#6c5ce7]"
                          : "bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{niche.emoji}</span>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                            {niche.avgViews}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#6c5ce7] transition-colors">
                              {niche.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                            {niche.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                        <span className="text-[#6c5ce7] font-mono font-semibold">{niche.retentionMetric}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#6c5ce7] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Title & Suggested Hooks */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                    <span>Series Title</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      (Episodes will follow this narrative arc)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizeTitle}
                    className="text-xs text-[#6c5ce7] hover:text-[#5b4bc4] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Suggest Another</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chronicles of the Lost Island"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]"
                  />
                </div>

                {/* Quick Title Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Viral Presets:
                  </span>
                  {activeNiche.suggestedTitles.map((st, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(st)}
                      className={`text-[11px] px-2.5 py-1 rounded-md transition-all border ${
                        title === st
                          ? "bg-purple-50 text-[#6c5ce7] border-purple-200 font-medium"
                          : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Show Bible Drawer (Optional) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedBible(!showAdvancedBible)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">Advanced Universe Lore & Canon Rules (Optional)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">{showAdvancedBible ? "Hide" : "Customize"}</span>
                </button>

                {showAdvancedBible && (
                  <div className="p-4 space-y-3 bg-white border-t border-slate-200 animate-in fade-in duration-150">
                    <div>
                      <label className="text-[11px] font-medium text-slate-700 block mb-1">
                        Overarching Universe Premise
                      </label>
                      <textarea
                        rows={2}
                        value={customPremise}
                        onChange={(e) => setCustomPremise(e.target.value)}
                        placeholder={activeNiche.description}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#6c5ce7] resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-700 block mb-1">
                        Canon World Rules (One rule per line)
                      </label>
                      <textarea
                        rows={2}
                        value={customWorldRules}
                        onChange={(e) => setCustomWorldRules(e.target.value)}
                        placeholder="e.g. Always conclude with an unresolved cliffhanger.&#10;Use first-person narration only."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#6c5ce7] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: CUSTOMIZE STYLE & VOICE ================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Visual Art Style */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">Visual Art Style</label>
                  <span className="text-[11px] text-slate-500">Enforced via strict SDXL prompt anchors</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ART_STYLES.map((style) => {
                    const isSelected = artStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setArtStyle(style.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-purple-50/80 border-[#6c5ce7] ring-1 ring-[#6c5ce7]"
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-slate-900">{style.name}</h4>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shadow-2xs font-semibold">
                            {style.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                          {style.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Neural Voice & Audio Preview */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">Neural Voice Narrator</label>
                  <span className="text-[11px] text-slate-500">Natural Edge-TTS Voices</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {NEURAL_VOICES.map((v) => {
                    const isSelected = selectedVoice === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? "bg-purple-50/80 border-[#6c5ce7] ring-1 ring-[#6c5ce7]"
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900">{v.name}</h4>
                            <p className="text-[10px] text-[#6c5ce7] font-medium">{v.role}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayVoicePreview(v.id, v.sampleText);
                            }}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isPlayingAudioSample && selectedVoice === v.id
                                ? "bg-[#6c5ce7] text-white border-[#6c5ce7] animate-pulse"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                            }`}
                            title="Audition voice"
                          >
                            {isPlayingAudioSample && selectedVoice === v.id ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 italic line-clamp-1">
                          "{v.sampleText}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subtitle Style & Live Highlight Preview */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">Subtitle Animation Engine</label>
                  <span className="text-[11px] text-slate-500">Live Render Preview</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selector Radio Grid */}
                  <div className="space-y-2">
                    {SUBTITLE_STYLES.map((sub) => {
                      const isSelected = subtitleStyle === sub.id;
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSubtitleStyle(sub.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-purple-50 border-[#6c5ce7]"
                              : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-300"
                              style={{ backgroundColor: sub.highlightColor }}
                            />
                            <span className="text-xs font-medium text-slate-900">{sub.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#6c5ce7]" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Animated Subtitle Preview Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest relative z-10">
                      Simulated 9:16 Video Caption
                    </span>
                    <div className="relative z-10 px-4 py-2 rounded-lg bg-black/70 backdrop-blur-xs border border-white/10">
                      <p className="text-sm font-extrabold uppercase tracking-tight text-white flex items-center justify-center gap-1.5">
                        <span>AND THEN</span>
                        <span
                          className="px-1.5 py-0.5 rounded shadow-lg animate-pulse"
                          style={{
                            color: "#000000",
                            backgroundColor:
                              SUBTITLE_STYLES.find((s) => s.id === subtitleStyle)?.highlightColor || "#FACC15",
                          }}
                        >
                          EVERYTHING
                        </span>
                        <span>CHANGED</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Music Preset */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900">Background Music Preset</label>
                  <span className="text-[11px] text-slate-500">Auto-ducked underneath speech</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {MUSIC_TRACKS.map((track) => {
                    const isSelected = musicTrack === track.id;
                    const isPlaying = playingMusicId === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setMusicTrack(track.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-50 border-[#6c5ce7] ring-1 ring-[#6c5ce7]"
                            : "bg-slate-50 border-slate-200 hover:bg-white"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-slate-900 truncate">{track.name}</p>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#6c5ce7] shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">{track.mood}</p>
                        </div>
                        {track.previewUrl ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayMusicPreview(track.id, track.previewUrl);
                            }}
                            className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                              isPlaying
                                ? "bg-[#6c5ce7] text-white border-[#6c5ce7] animate-pulse"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                            }`}
                            title={isPlaying ? "Pause music preview" : "Audition music preview"}
                          >
                            {isPlaying ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                          </button>
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" title="No background audio" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Trending Audio Link (TikTok / YouTube) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      Or Trending Audio Link (TikTok / YouTube / Sound URL)
                    </label>
                    {musicTrack && musicTrack.startsWith("http") && (
                      <span className="text-[10px] text-[#6c5ce7] font-mono flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-pulse" />
                        Custom Sound Active
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    value={musicTrack.startsWith("http") ? musicTrack : ""}
                    onChange={(e) => setMusicTrack(e.target.value.trim() || "cinematic_mystery")}
                    placeholder="https://www.tiktok.com/@... or https://youtube.com/shorts/..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c5ce7] transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Directly downloads and extracts background music from TikTok or YouTube, mixed with voice ducking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: AUTOPILOT & DISTRIBUTION ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Channel Selector with Official SVGs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Destination Social Channels</h3>
                    <p className="text-[11px] text-slate-500">Where should autonomous daily episodes publish?</p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Direct API Integration
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "youtube",
                      name: "YouTube Shorts",
                      icon: <YouTubeIcon className="w-5 h-5 text-red-500" />,
                      subtitle: "Direct video upload",
                    },
                    {
                      id: "tiktok",
                      name: "TikTok",
                      icon: <TikTokIcon className="w-5 h-5 text-cyan-600" />,
                      subtitle: "Direct Content API",
                    },
                    {
                      id: "instagram",
                      name: "Instagram Reels",
                      icon: <InstagramIcon className="w-5 h-5 text-pink-600" />,
                      subtitle: "Graph API Reels",
                    },
                  ].map((p) => {
                    const isSelected = targetPlatforms.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-50/80 border-[#6c5ce7] ring-1 ring-[#6c5ce7]"
                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 opacity-75"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">{p.icon}</div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                            <p className="text-[10px] text-slate-500">{p.subtitle}</p>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? "bg-[#6c5ce7] border-[#6c5ce7] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Autopilot Frequency & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 block">Posting Cadence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 1, label: "1 / Day", badge: "Recommended" },
                      { val: 2, label: "2 / Day", badge: "Growth" },
                      { val: 3, label: "3 / Week", badge: "Conservative" },
                    ].map((f) => (
                      <button
                        key={f.val}
                        type="button"
                        onClick={() => setFrequency(f.val)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          frequency === f.val
                            ? "bg-purple-50 border-[#6c5ce7] text-[#6c5ce7]"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
                        }`}
                      >
                        <div className="text-xs font-bold">{f.label}</div>
                        <div className="text-[9px] text-[#6c5ce7] font-mono font-semibold mt-0.5">{f.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-900 block">Preferred Posting Time (UTC)</label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]"
                  >
                    <option value="18:00">18:00 UTC (1:00 PM EST • Peak Views)</option>
                    <option value="12:00">12:00 UTC (7:00 AM EST • Morning Commute)</option>
                    <option value="21:00">21:00 UTC (4:00 PM EST • Evening Prime)</option>
                    <option value="00:00">00:00 UTC (7:00 PM EST • Night Owl)</option>
                  </select>
                </div>
              </div>

              {/* Autopilot Safety & Approval Switch */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#6c5ce7] fill-[#6c5ce7]" />
                      <span>Zero-OpEx Daily Autopilot Engine</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Renders in distributed cloud compute and posts automatically while you sleep.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autopilotEnabled}
                    onChange={(e) => setAutopilotEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#6c5ce7] cursor-pointer"
                  />
                </div>

                {autopilotEnabled && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-slate-700">Approval Queue Guard</p>
                      <p className="text-[10px] text-slate-500">
                        {requireApproval
                          ? "Episodes will pause in queue for 1-click review before going live."
                          : "100% Autonomous — video will post directly to social APIs upon rendering."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setRequireApproval(!requireApproval)}
                      className="text-[11px] h-7 px-2.5 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                    >
                      {requireApproval ? "Manual Review On" : "Direct Auto-Post"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Ready Summary Card */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-[#6c5ce7] uppercase tracking-wider font-semibold">
                    Ready to Launch
                  </span>
                  <p className="text-xs font-semibold text-slate-900">
                    {title} • {activeNiche.name}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {frequency} episode/day via {targetPlatforms.join(", ").toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="primary" className="text-[10px] bg-[#6c5ce7] text-white font-semibold">
                    {autopilotEnabled ? "AUTOPILOT ARMED" : "MANUAL TRIGGER"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="text-xs h-9 px-3.5 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Back</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 px-3.5 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900"
            >
              Cancel
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 2 | 3)}
                className="text-xs h-9 px-4 font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !title.trim()}
                onClick={handleCreateSeriesSubmit}
                className="text-xs h-9 px-5 font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Arming Autopilot...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    <span>Launch Series & Activate Autopilot</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
