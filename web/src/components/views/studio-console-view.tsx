"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Clock,
  Mic,
  Video,
  Download,
  Film,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Share2,
  Volume2,
  VolumeX,
  RotateCcw,
  Heart,
  MessageCircle,
  Bookmark,
  Music2,
  TrendingUp,
  Sliders,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Check,
  Compass,
  Maximize2,
  Radio,
  MicOff,
  Palette,
  Sword,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse } from "@/lib/api";

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

const EDITORIAL_TOPICS = [
  {
    category: "Extreme Earth",
    title: "The Mariana Abyss",
    topic: "Why the Mariana Trench is terrifying and what lurks at the deepest point on Earth",
    runtimeHint: "45s",
  },
  {
    category: "Cognitive Science",
    title: "High-EQ Biases",
    topic: "4 subtle psychological tricks that people with high emotional intelligence use daily",
    runtimeHint: "25s",
  },
  {
    category: "Ancient Engineering",
    title: "Roman Megastructures",
    topic: "How ancient Roman concrete self-heals underwater over thousands of years",
    runtimeHint: "25s",
  },
  {
    category: "Astrophysics",
    title: "Singularity Collisions",
    topic: "What actually happens at the event horizon if two supermassive black holes collide",
    runtimeHint: "45s",
  },
  {
    category: "Asymmetric Wealth",
    title: "Generational Capital",
    topic: "The 3 counter-intuitive capital allocation rules followed by generational wealth builders",
    runtimeHint: "25s",
  },
];

export const VOICES = [
  {
    id: "en-US-BrianMultilingualNeural",
    name: "Brian",
    role: "Deep & Conversational",
    genre: "Viral TikTok & Storytelling",
    badge: "🔥 Most Natural",
    initials: "B",
  },
  {
    id: "en-US-AvaMultilingualNeural",
    name: "Ava",
    role: "Warm & Engaging",
    genre: "Lifestyle & Storyteller",
    badge: "✨ Ultra Human",
    initials: "A",
  },
  {
    id: "en-US-AndrewMultilingualNeural",
    name: "Andrew",
    role: "Punchy & Dynamic",
    genre: "Podcast & Explainer",
    badge: "🎙️ Podcast",
    initials: "An",
  },
  {
    id: "en-US-EmmaMultilingualNeural",
    name: "Emma",
    role: "Friendly & Expressive",
    genre: "Education & Advice",
    badge: "🌟 Storyteller",
    initials: "Em",
  },
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep & Cinematic",
    genre: "Classic Documentary",
    badge: "Classic",
    initials: "C",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "Energetic & Casual",
    genre: "Fast Paced & Modern",
    badge: "Energetic",
    initials: "G",
  },
  {
    id: "en-US-EricNeural",
    name: "Eric",
    role: "Authoritative & Deep",
    genre: "Finance & Explainers",
    badge: "Explainer",
    initials: "E",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    role: "Warm & Conversational",
    genre: "Lifestyle & Advice",
    badge: "Warm",
    initials: "J",
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    role: "British Storyteller",
    genre: "History & Lore",
    badge: "Narrative",
    initials: "S",
  },
];

const SHORT_DURATIONS = [
  { value: 15, label: "15s", role: "Quick Hook" },
  { value: 25, label: "25s", role: "Standard" },
  { value: 45, label: "45s", role: "Story Arc" },
  { value: 60, label: "60s", role: "Deep Dive" },
];

const LONG_DURATIONS = [
  { value: 30, label: "30s", role: "Brief Feature" },
  { value: 60, label: "60s", role: "Standard Video" },
  { value: 90, label: "90s", role: "Story Explainer" },
  { value: 120, label: "120s", role: "Deep Dive" },
];

const ANIMATION_STYLES = [
  {
    id: "anime",
    name: "Japanese Anime",
    tagline: "Studio Mappa & Ufotable",
    icon: "🌸",
    badge: "2D Masterwork",
    desc: "Vibrant cel-shading, dynamic action lines & expressive anime eyes",
    accent: "from-pink-500/20 to-purple-500/10 border-pink-500/30 text-pink-400",
  },
  {
    id: "3d_cartoon",
    name: "3D Feature Film",
    tagline: "Shrek & Pixar Style",
    icon: "🏰",
    badge: "3D CGI",
    desc: "DreamWorks / Pixar stylized character modeling & volumetric lighting",
    accent: "from-emerald-500/20 to-amber-500/10 border-emerald-500/30 text-emerald-400",
  },
  {
    id: "donghua",
    name: "3D Donghua",
    tagline: "Xianxia Cultivator",
    icon: "🐉",
    badge: "Mythical CGI",
    desc: "Chinese fantasy animation, ethereal energy auras & martial arts",
    accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
  },
  {
    id: "stickman",
    name: "Stickman Combat",
    tagline: "Alan Becker Style",
    icon: "⚔️",
    badge: "High Octane",
    desc: "Fluid martial arts combat, neon velocity streaks & sonic impacts",
    accent: "from-amber-500/20 to-red-500/10 border-amber-500/30 text-amber-400",
  },
];

interface StudioConsoleViewProps {
  topic: string;
  setTopic: (t: string) => void;
  videoFormat?: "short" | "long";
  setVideoFormat?: (f: "short" | "long") => void;
  targetPlatform?: "youtube" | "tiktok" | "instagram";
  setTargetPlatform?: (p: "youtube" | "tiktok" | "instagram") => void;
  targetDuration: number;
  setTargetDuration: (d: number) => void;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
  autoPublishYouTube?: boolean;
  setAutoPublishYouTube?: (val: boolean) => void;
  isSubmitting: boolean;
  activeJob: VideoJobResponse | null;
  onGenerate: () => void;
  onOpenSocialModal: () => void;
  studioMode?: "shorts" | "story";
  setStudioMode?: (m: "shorts" | "story") => void;
  storyStyle?: "anime" | "donghua" | "stickman" | "3d_cartoon";
  setStoryStyle?: (s: "anime" | "donghua" | "stickman" | "3d_cartoon") => void;
}

export function StudioConsoleView({
  topic,
  setTopic,
  videoFormat = "short",
  setVideoFormat,
  targetPlatform = "youtube",
  setTargetPlatform,
  targetDuration,
  setTargetDuration,
  selectedVoice,
  setSelectedVoice,
  autoPublishYouTube = false,
  setAutoPublishYouTube,
  isSubmitting,
  activeJob,
  onGenerate,
  onOpenSocialModal,
  studioMode = "shorts",
  setStudioMode,
  storyStyle = "anime",
  setStoryStyle,
}: StudioConsoleViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(false);
  const [auditionVoiceId, setAuditionVoiceId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"controls" | "canvas">("controls");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentDurations = videoFormat === "long" ? LONG_DURATIONS : SHORT_DURATIONS;

  const handleFormatChange = (newFormat: "short" | "long") => {
    if (setVideoFormat) {
      setVideoFormat(newFormat);
      if (newFormat === "long") {
        if (setTargetPlatform) setTargetPlatform("youtube");
        if (targetDuration < 30) setTargetDuration(60);
      } else {
        if (targetDuration > 60) setTargetDuration(45);
      }
    }
  };

  // Stop audition audio on unmount
  useEffect(() => {
    return () => {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }
    };
  }, []);

  const togglePlayVoiceSample = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (auditionVoiceId === voiceId) {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current.currentTime = 0;
      }
      setAuditionVoiceId(null);
    } else {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(`/audio/samples/${voiceId}.mp3`);
      auditionAudioRef.current = audio;
      setAuditionVoiceId(voiceId);

      audio.play().catch((err) => {
        console.warn("Audio audition error:", err);
        setAuditionVoiceId(null);
      });
      audio.onended = () => setAuditionVoiceId(null);
      audio.onerror = () => {
        console.warn(`Audio sample failed to load for ${voiceId}`);
        setAuditionVoiceId(null);
      };
    }
  };

  // Voice Dictation (Speech-to-Text) Controller
  const [isDictating, setIsDictating] = useState(false);
  const [dictationSupported, setDictationSupported] = useState(true);
  const [dictationNotice, setDictationNotice] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      );
      setDictationSupported(hasSupport);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleDictation = () => {
    if (!dictationSupported) {
      setDictationNotice("Voice dictation is supported on Chrome, Edge, and Safari.");
      setTimeout(() => setDictationNotice(null), 4500);
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecClass) return;

    try {
      const recognition = new SpeechRecClass() as SpeechRecognitionInstance;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      const initialBaseText = topic.trim();

      recognition.onstart = () => {
        setIsDictating(true);
        setDictationNotice(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item[0]) {
            currentTranscript += item[0].transcript;
          }
        }

        const cleanedCurrent = currentTranscript.trim();
        if (cleanedCurrent) {
          const separator = initialBaseText.length > 0 ? " " : "";
          const combined = `${initialBaseText}${separator}${cleanedCurrent}`.slice(0, 300);
          setTopic(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setDictationNotice("Microphone access denied. Please grant microphone permissions.");
          setTimeout(() => setDictationNotice(null), 5000);
        } else if (event.error === "no-speech") {
          // Silent timeout, gracefully handled
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsDictating(false);
      setDictationNotice("Unable to access microphone.");
      setTimeout(() => setDictationNotice(null), 4500);
    }
  };

  const getStageStatus = (stage: "scripting" | "tts" | "sourcing" | "assembly") => {
    if (!activeJob) return "pending";
    const status = activeJob.status;

    if (status === "completed") return "done";
    if (status === "failed") return "failed";

    if (stage === "scripting") {
      if (status === "scripting") return "active";
      if (["synthesizing", "sourcing_media", "rendering"].includes(status)) return "done";
    }
    if (stage === "tts") {
      if (status === "synthesizing") return "active";
      if (["sourcing_media", "rendering"].includes(status)) return "done";
    }
    if (stage === "sourcing") {
      if (status === "sourcing_media") return "active";
      if (["rendering"].includes(status)) return "done";
    }
    if (stage === "assembly") {
      if (status === "rendering") return "active";
    }
    return "pending";
  };

  const videoSrc = activeJob?.video_url
    ? activeJob.video_url.startsWith("http")
      ? activeJob.video_url
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${activeJob.video_url}`
    : null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "0:00";
    const mins = Math.floor(sec / 60);
    const remainingSecs = Math.floor(sec % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const isRendering = activeJob && !["completed", "failed"].includes(activeJob.status);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full max-w-full min-w-0 pb-28 sm:pb-8">
      {/* Studio View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Create Video
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {videoFormat === "long" ? "16:9 Landscape" : "9:16 Vertical"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            {videoFormat === "long"
              ? "Generate 16:9 widescreen videos formatted for standard YouTube landscape playback with AI narration and stock visuals."
              : "Turn your ideas into short-form vertical videos with natural voiceovers, curated visuals, and animated subtitles."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSocialModal}
            className="flex-1 sm:flex-initial text-xs h-9 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] text-zinc-300"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            Channels
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerate}
            isLoading={isSubmitting || !!isRendering}
            className="flex-1 sm:flex-initial text-xs h-9 font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {isRendering ? "Creating..." : "Create Video"}
          </Button>
        </div>
      </div>

      {/* Adaptive Mobile Stepper Tab (Sticky on < lg viewports) */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center p-1 rounded-xl bg-[#090b10]/95 backdrop-blur-md border border-white/[0.08] shadow-lg w-full max-w-full">
        <button
          type="button"
          onClick={() => setMobileTab("controls")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            mobileTab === "controls"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("canvas")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all relative ${
            mobileTab === "canvas"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {videoFormat === "long" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
          <span>Preview</span>
          {isRendering && (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-4" />
          )}
        </button>
      </div>

      {/* Main Studio Grid: Controls Deck (Left) + Hardware Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full max-w-full min-w-0">
        {/* Left Column: Input Form Controls */}
        <div className={`lg:col-span-7 space-y-5 sm:space-y-6 min-w-0 w-full max-w-full ${mobileTab === "canvas" ? "hidden lg:block" : "block"}`}>
          {/* Main Control Card */}
          <div className="studio-card rounded-2xl p-4 sm:p-6 space-y-5 min-w-0 w-full max-w-full overflow-hidden">
            {/* 0. Studio Creation Mode Switcher */}
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-amber-400" />
                  Studio Creation Mode
                </label>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {studioMode === "story" ? "Multi-Character & SFX" : "Faceless Stock B-Roll"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setStudioMode && setStudioMode("shorts")}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start gap-3 ${
                    studioMode === "shorts"
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/20"
                      : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    studioMode === "shorts"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}>
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-tight">Faceless Shorts</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Stock video + AI narrator</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioMode && setStudioMode("story")}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start gap-3 ${
                    studioMode === "story"
                      ? "bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/30"
                      : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    studioMode === "story"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-tight">Animated Story</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 border border-purple-500/30">NEW</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Multi-voice, Anime & Foley SFX</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Animation Style Selector (Only shown in Story Mode) */}
            {studioMode === "story" && (
              <div className="space-y-2.5 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-purple-400" />
                    Animation Genre & Aesthetic
                  </label>
                  <span className="text-[10px] text-purple-300/80 font-mono">
                    Consistent Characters & Foley SFX
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANIMATION_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStoryStyle && setStoryStyle(st.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                        storyStyle === st.id
                          ? "bg-purple-500/20 border-purple-400 text-white shadow-md ring-1 ring-purple-400/30"
                          : "bg-black/40 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{st.icon}</span>
                        <Badge variant="outline" className="text-[8px] py-0 px-1 border-white/10 text-zinc-400">
                          {st.badge}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-white tracking-tight leading-tight">{st.name}</div>
                        <div className="text-[9px] text-zinc-400 truncate mt-0.5">{st.tagline}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 text-[10px] text-purple-300/70">
                  <Zap className="h-3 w-3 text-purple-400 shrink-0" />
                  <span>Includes automatic action sound effects (punches, flight whooshes, impacts) & colored speaker captions.</span>
                </div>
              </div>
            )}

            {/* 1. Format Selector (Short vs Long) */}
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-amber-400" />
                  Video Format & Aspect Ratio
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  {videoFormat === "long" ? "1920 × 1080 (16:9)" : "1080 × 1920 (9:16)"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleFormatChange("short")}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start gap-3 ${
                    videoFormat === "short"
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/20"
                      : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    videoFormat === "short"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}>
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-tight">Short Video</span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">9:16</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">Shorts, TikTok & Reels</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFormatChange("long")}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex items-start gap-3 ${
                    videoFormat === "long"
                      ? "bg-amber-500/10 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/20"
                      : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                    videoFormat === "long"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}>
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-tight">Long-Form</span>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">16:9</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">YouTube Widescreen 1080p</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Platform Destination Row */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-amber-400" />
                  Destination Platform
                </label>
                <span className="text-[10px] text-zinc-500">
                  {videoFormat === "long" ? "YouTube Only" : "Select Target Channel"}
                </span>
              </div>

              {videoFormat === "long" ? (
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-red-600/15 border border-red-500/25 flex items-center justify-center text-red-500">
                      <Film className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">YouTube Standard Video</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-red-500/10 text-red-400 border-red-500/20">
                          16:9 Landscape
                        </Badge>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Long videos are published strictly to YouTube landscape (1080p Full HD).
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetPlatform && setTargetPlatform("youtube")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetPlatform === "youtube"
                        ? "bg-red-500/15 border-red-500 text-white shadow-sm ring-1 ring-red-500/30"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white">YouTube Shorts</span>
                      {targetPlatform === "youtube" && <Check className="h-3 w-3 text-red-400" />}
                    </div>
                    <span className="text-[9px] text-red-400/90 font-medium">9:16 Shorts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlatform && setTargetPlatform("tiktok")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetPlatform === "tiktok"
                        ? "bg-cyan-500/15 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/30"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white">TikTok</span>
                      {targetPlatform === "tiktok" && <Check className="h-3 w-3 text-cyan-400" />}
                    </div>
                    <span className="text-[9px] text-cyan-400/90 font-medium">Direct Post</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPlatform && setTargetPlatform("instagram")}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      targetPlatform === "instagram"
                        ? "bg-pink-500/15 border-pink-500 text-white shadow-sm ring-1 ring-pink-500/30"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-white">Instagram</span>
                      {targetPlatform === "instagram" && <Check className="h-3 w-3 text-pink-400" />}
                    </div>
                    <span className="text-[9px] text-pink-400/90 font-medium">Reels Feed</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Topic & Curated Verticals */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      {studioMode === "story" ? "What's your animated story about?" : "What's your video about?"}
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      {studioMode === "story"
                        ? "Describe your characters, dialogue, action beats, and foley sound effects"
                        : "Enter a prompt or pick a topic below"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{topic.length}/300</span>
              </div>

              <div className="relative group">
                <Textarea
                  placeholder={
                    studioMode === "story"
                      ? storyStyle === "3d_cartoon"
                        ? "e.g. Shrek and Donkey discover a high-tech glowing cube in the swamp with funny banter, whooshes, and a loud crash..."
                        : storyStyle === "anime"
                        ? "e.g. Two rival anime swordsmen duel atop a neon Tokyo tower with clashing katanas, sonic booms, and dramatic dialogue..."
                        : storyStyle === "stickman"
                        ? "e.g. An epic stickman martial arts fight with flying roundhouse kicks, sonic flight whooshes, and impact hits..."
                        : "e.g. A 3D donghua cultivator takes flight with a sonic boom to battle a celestial dragon..."
                      : videoFormat === "long"
                      ? "e.g. A comprehensive documentary on how ancient Roman concrete self-healed underwater over thousands of years..."
                      : "e.g. 3 terrifying facts about the deep sea midnight zone that science still cannot explain..."
                  }
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`min-h-[105px] sm:min-h-[115px] pb-10 text-sm bg-black/40 border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20 resize-none rounded-xl leading-relaxed text-zinc-100 placeholder:text-zinc-600 font-sans transition-all ${
                    isDictating ? "border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-500/[0.03]" : ""
                  }`}
                  maxLength={300}
                />

                {/* Floating Dictation Action Bar (Bottom-Right of Textarea) */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 sm:gap-2">
                  {topic.length > 0 && !isDictating && (
                    <button
                      type="button"
                      onClick={() => setTopic("")}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
                      title="Clear prompt"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleDictation}
                    title={isDictating ? "Stop listening" : "Dictate prompt with voice"}
                    className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-semibold transition-all border shadow-sm ${
                      isDictating
                        ? "bg-red-500/20 border-red-500/50 text-red-300 animate-pulse ring-1 ring-red-500/30"
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border-white/[0.08]"
                    }`}
                  >
                    {isDictating ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span>Listening...</span>
                        <div className="flex items-end gap-[2px] h-3 ml-0.5">
                          <span className="w-[2px] bg-red-400 rounded-full eq-bar-1" />
                          <span className="w-[2px] bg-red-400 rounded-full eq-bar-2" />
                          <span className="w-[2px] bg-red-400 rounded-full eq-bar-3" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-amber-400" />
                        <span>Dictate</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dictation Toast Notice */}
                {dictationNotice && (
                  <div className="absolute -top-9 right-0 bg-zinc-900 text-amber-300 text-[11px] px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 z-10">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{dictationNotice}</span>
                  </div>
                )}
              </div>

              {/* Quick Ideas */}
              <div className="space-y-2 pt-1 min-w-0 w-full max-w-full">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                    Quick Ideas
                  </span>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">Popular formats</span>
                  <span className="text-[10px] text-amber-400/80 sm:hidden">Swipe →</span>
                </div>
                <div className="flex sm:grid sm:grid-cols-2 gap-2 overflow-x-auto snap-x no-scrollbar pb-1 w-full max-w-full min-w-0">
                  {EDITORIAL_TOPICS.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setTopic(item.topic)}
                      className="min-w-[210px] max-w-[230px] sm:min-w-0 sm:max-w-none snap-start shrink-0 sm:shrink p-3 rounded-xl text-left bg-black/30 border border-white/[0.06] hover:border-amber-500/35 hover:bg-white/[0.03] transition-all group relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-amber-400/90">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {videoFormat === "long" ? "60s+" : item.runtimeHint}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 group-hover:text-zinc-400">
                        {item.topic}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Adaptive Duration Selector */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Target Duration
                </label>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  ~{targetDuration}s
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                {currentDurations.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setTargetDuration(d.value)}
                    className={`py-2 sm:py-3 px-1 sm:px-3 rounded-xl border text-center transition-all ${
                      targetDuration === d.value
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-sm font-bold"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-bold tracking-tight">{d.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 truncate">{d.role}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Narrator Voice Selection with Audition Player */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-amber-400" />
                  Choose a Voice
                </label>
                <span className="text-[10px] text-zinc-500">
                  Tap play to audition
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {VOICES.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  const isAuditioning = auditionVoiceId === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500 shadow-sm"
                          : "bg-black/30 border-white/[0.06] hover:border-white/[0.14] text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <div
                            className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? "bg-amber-500 text-black"
                                : "bg-white/[0.08] text-zinc-300 group-hover:bg-white/[0.12]"
                            }`}
                          >
                            {v.initials}
                          </div>
                          <span className="text-xs font-bold text-white tracking-tight truncate">
                            {v.name}
                          </span>
                          {v.badge && (
                            <span className="text-[8px] sm:text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30 shrink-0">
                              {v.badge}
                            </span>
                          )}
                        </div>

                        {/* Audition Player Button */}
                        <button
                          type="button"
                          onClick={(e) => togglePlayVoiceSample(v.id, e)}
                          title={`Audition voice sample for ${v.name}`}
                          className={`h-5 sm:h-6 px-1.5 sm:px-2 rounded-md flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold transition-all border shrink-0 ${
                            isAuditioning
                              ? "bg-amber-500 text-black border-amber-400"
                              : "bg-white/[0.06] text-zinc-300 hover:text-white border-white/[0.08] hover:bg-white/[0.12]"
                          }`}
                        >
                          {isAuditioning ? (
                            <>
                              <div className="flex items-end gap-[2px] h-2.5 sm:h-3">
                                <span className="w-[2px] bg-black rounded-full eq-bar-1" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-2" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-3" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-4" />
                              </div>
                              <span className="hidden sm:inline">Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
                              <span className="hidden sm:inline">Play</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-1 sm:mt-2">
                        <p className="text-[10px] sm:text-[11px] font-semibold text-amber-400/90 truncate">{v.role}</p>
                        <p className="text-[9px] sm:text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{v.genre}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6. Auto-Publish Toggle to YouTube */}
            {setAutoPublishYouTube && (
              <div className="pt-3 border-t border-white/[0.06]">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">
                        {videoFormat === "long" ? "Auto-publish to YouTube Channel" : "Auto-upload to YouTube Shorts"}
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {videoFormat === "long"
                          ? "Automatically post as a 16:9 widescreen video to your connected YouTube channel."
                          : "Automatically upload to your connected YouTube channel once video generation finishes."}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPublishYouTube}
                    onChange={(e) => setAutoPublishYouTube(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full h-12 text-sm font-semibold rounded-xl"
                onClick={onGenerate}
                isLoading={isSubmitting || !!isRendering}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isRendering ? "Creating Video..." : `Create ${videoFormat === "long" ? "16:9 Video" : "Short Video"}`}
              </Button>
            </div>
          </div>

          {/* Creation Pipeline Stage Tracker (Real-Time 4-Stage Progression) */}
          <div className="studio-card rounded-2xl p-4 sm:p-5 space-y-4 min-w-0 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isRendering ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Generation Progress
                </h3>
              </div>
              {activeJob && (
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {activeJob.progress_pct}% Completed
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${activeJob ? activeJob.progress_pct : 0}%` }}
              />
            </div>

            {/* Discrete Pipeline Stages */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">01. SCRIPT</span>
                  {getStageStatus("scripting") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">Hook & Story</p>
                <span className={`text-[10px] ${getStageStatus("scripting") === "done" ? "text-emerald-400" : getStageStatus("scripting") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("scripting") === "done" ? "Ready" : getStageStatus("scripting") === "active" ? "Writing..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">02. AUDIO</span>
                  {getStageStatus("tts") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">Voiceover</p>
                <span className={`text-[10px] ${getStageStatus("tts") === "done" ? "text-emerald-400" : getStageStatus("tts") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("tts") === "done" ? "Ready" : getStageStatus("tts") === "active" ? "Recording..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">03. MEDIA</span>
                  {getStageStatus("sourcing") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">Visuals</p>
                <span className={`text-[10px] ${getStageStatus("sourcing") === "done" ? "text-emerald-400" : getStageStatus("sourcing") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("sourcing") === "done" ? "Ready" : getStageStatus("sourcing") === "active" ? "Sourcing..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">04. RENDER</span>
                  {getStageStatus("assembly") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">Assembly</p>
                <span className={`text-[10px] ${getStageStatus("assembly") === "done" ? "text-emerald-400" : getStageStatus("assembly") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("assembly") === "done" ? "Complete" : getStageStatus("assembly") === "active" ? "Rendering..." : "Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Canvas (Dynamic Smartphone 9:16 vs Widescreen 16:9) */}
        <div className={`lg:col-span-5 flex flex-col items-center min-w-0 w-full max-w-full ${mobileTab === "controls" ? "hidden lg:flex" : "flex"}`}>
          {/* ========================================================================= */}
          {/* CASE A: SHORT VIDEO (9:16 VERTICAL SMARTPHONE PREVIEW)                     */}
          {/* ========================================================================= */}
          {videoFormat === "short" ? (
            <div className="w-full max-w-[310px] sm:max-w-[340px] space-y-3">
              {/* Top Canvas Controls: Safe Zone Toggle & Status */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
                  Preview (9:16 Vertical)
                </span>

                <button
                  type="button"
                  onClick={() => setShowSafeZoneOverlay(!showSafeZoneOverlay)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    showSafeZoneOverlay
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/[0.08]"
                  }`}
                  title="Toggle TikTok / YouTube Shorts UI Safe Zone overlay"
                >
                  {showSafeZoneOverlay ? (
                    <>
                      <EyeOff className="h-3 w-3 text-amber-400" />
                      <span>Safe Zone: ON</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>Show Safe Zone</span>
                    </>
                  )}
                </button>
              </div>

              {/* Precision Hardware Bezel Container (Smartphone) */}
              <div className="relative w-full aspect-[9/16] sm:aspect-[9/18] rounded-[28px] sm:rounded-[48px] p-2.5 sm:p-3.5 hardware-bezel select-none max-h-[65vh] sm:max-h-none">
                {/* Inner High-Density Screen */}
                <div className="relative w-full h-full rounded-[20px] sm:rounded-[38px] overflow-hidden bg-black flex flex-col justify-between p-3 sm:p-4">
                  {/* Dynamic Island Sensor */}
                  <div className="relative z-30 mx-auto w-20 sm:w-24 h-4 sm:h-5 rounded-full bg-black flex items-center justify-end px-2 border border-white/[0.08]">
                    <div className="h-2 w-2 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>

                  {/* Video Playback or Cloud Rendering or Standby State */}
                  {videoSrc && activeJob?.status === "completed" ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-10 cursor-pointer"
                        onClick={togglePlay}
                      />

                      {/* Play/Pause Center Indicator */}
                      {!isPlaying && (
                        <button
                          onClick={togglePlay}
                          className="absolute inset-0 m-auto z-20 h-16 w-16 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform shadow-2xl"
                        >
                          <Play className="h-7 w-7 fill-white ml-1" />
                        </button>
                      )}

                      {/* Sound Mute Toggle */}
                      <button
                        onClick={toggleMute}
                        className="absolute top-12 right-4 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </>
                  ) : isRendering ? (
                    /* Active Cloud Rendering Screen */
                    <div className="absolute inset-0 bg-gradient-to-b from-[#131722] via-[#0d1017] to-black flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white tracking-tight">Generating 9:16 Short</p>
                        <p className="text-[11px] text-zinc-400">
                          Assembling scenes and syncing subtitles...
                        </p>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {activeJob?.progress_pct}% Completed
                      </span>
                    </div>
                  ) : (
                    /* Standby Canvas Screen */
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-[#101420] via-[#0c0f17] to-black z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.08),transparent_60%)]" />
                      </div>

                      <div className="relative z-10 my-auto text-center px-4 space-y-3">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-semibold tracking-wider uppercase border border-white/[0.08]">
                          Short Preview (9:16)
                        </span>
                        <div className="text-base font-bold text-zinc-200 leading-snug tracking-tight">
                          Your vertical video will appear here with animated subtitles.
                        </div>
                      </div>
                    </>
                  )}

                  {/* Safe Zone Overlay Guides */}
                  {showSafeZoneOverlay && (
                    <div className="absolute inset-0 z-25 pointer-events-none flex flex-col justify-between">
                      <div className="h-[15%] w-full safezone-guide-header flex items-center justify-center">
                        <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/90 bg-black/70 px-2 py-0.5 rounded border border-amber-500/30">
                          Platform Search & Header Space
                        </span>
                      </div>

                      <div className="flex-1 flex justify-between items-center px-2">
                        <div className="flex-1 h-full flex items-center justify-center p-2">
                          <div className="w-full h-4/5 border border-dashed border-amber-500/40 rounded-xl flex items-center justify-center">
                            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/80 bg-black/60 px-2 py-0.5 rounded">
                              Caption Safe Zone
                            </span>
                          </div>
                        </div>

                        <div className="w-[20%] h-full safezone-guide-actionbar flex items-center justify-center">
                          <span className="text-[8px] font-mono font-semibold uppercase tracking-widest text-amber-400/80 rotate-90 whitespace-nowrap bg-black/70 px-1 py-0.5 rounded">
                            Action Rail
                          </span>
                        </div>
                      </div>

                      <div className="h-[28%] w-full safezone-guide-footer flex items-center justify-center">
                        <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/90 bg-black/70 px-2 py-0.5 rounded border border-amber-500/30">
                          Meta & Sound Space
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Realistic Shorts / TikTok Native UI Overlay */}
                  <div className="relative z-20 flex items-end justify-between gap-3 mt-auto pointer-events-none">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-[10px]">
                          P
                        </div>
                        <span className="text-xs font-bold text-white shadow-sm">@postmatic</span>
                      </div>
                      <p className="text-[11px] text-zinc-200 line-clamp-2 leading-snug drop-shadow-md">
                        {topic.trim() ? topic : "Autonomous multi-scene video generation engine."}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-300">
                        <Music2 className="h-3 w-3 text-amber-400 animate-spin-slow" />
                        <span>Original Audio • Neural Voice</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2.5 text-white">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-8 w-8 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                          <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        </div>
                        <span className="text-[9px] font-bold">142K</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-8 w-8 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-bold">1.8K</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-8 w-8 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                          <Share2 className="h-4 w-4 text-amber-400" />
                        </div>
                        <span className="text-[9px] font-bold">Share</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* CASE B: LONG-FORM VIDEO (16:9 WIDESCREEN YOUTUBE PLAYER PREVIEW)           */
            /* ========================================================================= */
            <div className="w-full max-w-[490px] sm:max-w-[550px] space-y-3">
              {/* Top Canvas Controls: Widescreen Status */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5 text-red-500" />
                  YouTube Player (16:9 Widescreen)
                </span>

                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-600/15 text-red-400 border border-red-500/25">
                  <Radio className="h-3 w-3 text-red-400 animate-pulse" />
                  1080p FHD
                </span>
              </div>

              {/* Cinema Chassis / Bezel */}
              <div className="relative w-full rounded-[22px] sm:rounded-[28px] p-2.5 sm:p-3 hardware-bezel select-none shadow-2xl">
                {/* Top Camera Dot */}
                <div className="mx-auto mb-2 h-1.5 w-1.5 rounded-full bg-zinc-700 border border-white/10" />

                {/* Inner 16:9 Video Player Screen */}
                <div className="relative w-full aspect-video rounded-[14px] sm:rounded-[18px] overflow-hidden bg-black flex flex-col justify-between">
                  {videoSrc && activeJob?.status === "completed" ? (
                    <>
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-10 cursor-pointer"
                        onClick={togglePlay}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                      />

                      {/* Play/Pause Center Button Overlay */}
                      {!isPlaying && (
                        <button
                          onClick={togglePlay}
                          className="absolute inset-0 m-auto z-20 h-14 w-14 rounded-full bg-black/65 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform shadow-2xl"
                        >
                          <Play className="h-6 w-6 fill-white ml-0.5" />
                        </button>
                      )}

                      {/* Top Bar Overlay: Topic Title & Channel Pill */}
                      <div className="relative z-20 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-white drop-shadow truncate">
                            {topic.trim() ? topic : "YouTube Widescreen Feature Video"}
                          </p>
                          <span className="text-[10px] text-zinc-300 drop-shadow">PostMatic AI Production</span>
                        </div>
                        <button
                          onClick={toggleMute}
                          className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shrink-0"
                        >
                          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Bottom YouTube Style Controls Rail */}
                      <div className="relative z-20 p-2.5 sm:p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent space-y-1.5 mt-auto">
                        {/* Red Scrubber Timeline */}
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative cursor-pointer">
                          <div
                            className="h-full bg-red-600 rounded-full"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>

                        {/* Player Buttons Row */}
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2">
                            <button onClick={togglePlay} className="hover:text-amber-400 transition-colors">
                              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                            </button>
                            <button onClick={toggleMute} className="hover:text-amber-400 transition-colors">
                              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </button>
                            <span className="text-[10px] font-mono text-zinc-300">
                              {formatSeconds(currentTime)} / {formatSeconds(duration || targetDuration)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/15 text-white">
                              HD 1080p
                            </span>
                            <div className="h-2.5 w-5 bg-red-600 rounded flex items-center justify-center">
                              <Play className="h-2 w-2 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : isRendering ? (
                    /* Active Cloud Rendering Screen (16:9) */
                    <div className="absolute inset-0 bg-gradient-to-b from-[#131722] via-[#0d1017] to-black flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white tracking-tight">Generating 16:9 Widescreen Video</p>
                        <p className="text-[11px] text-zinc-400">
                          Sourcing landscape visuals & rendering high-def audio...
                        </p>
                      </div>
                      <span className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {activeJob?.progress_pct}% Completed
                      </span>
                    </div>
                  ) : (
                    /* Standby Canvas Screen (16:9) */
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-[#101420] via-[#0c0f17] to-black z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(239,68,68,0.08),transparent_60%)]" />
                      </div>

                      <div className="relative z-10 my-auto text-center px-6 space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/15 text-red-400 text-[10px] font-semibold tracking-wider uppercase border border-red-500/25">
                          <Film className="h-3 w-3" />
                          <span>YouTube 16:9 Landscape Widescreen</span>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-zinc-200 leading-snug tracking-tight max-w-md mx-auto">
                          Your full-length horizontal video will appear here in 1080p high definition.
                        </div>
                        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                          Captions are positioned comfortably in the lower third with cinematic margin.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Export & Action Buttons */}
          {activeJob && activeJob.status === "completed" && videoSrc && (
            <div className="flex items-center gap-2 w-full max-w-[340px] pt-2">
              <a
                href={videoSrc}
                download={`video_${(activeJob.job_id || activeJob.id || "export").slice(0, 8)}.mp4`}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" size="sm" className="w-full text-xs h-10 rounded-xl bg-white/[0.04] border-white/[0.1] hover:bg-white/[0.08]">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download MP4
                </Button>
              </a>

              {videoSrc.includes("youtube.com") ? (
                <a href={videoSrc} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full text-xs h-10 rounded-xl bg-red-600 hover:bg-red-700">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View on YouTube
                  </Button>
                </a>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenSocialModal}
                  className="flex-1 text-xs h-10 rounded-xl"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Distribute
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
