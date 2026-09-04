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
  Eye,
  EyeOff,
  Check,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse } from "@/lib/api";

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
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep & Cinematic",
    genre: "Documentary, Mystery, True Crime",
    badge: "Cinema Pro",
    initials: "C",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "High-Energy & Dynamic",
    genre: "Viral TikTok, Modern Hooks, Tech",
    badge: "Viral Punch",
    initials: "G",
  },
  {
    id: "en-US-EricNeural",
    name: "Eric",
    role: "Authoritative & Deep",
    genre: "Finance, Deep Tech, Investigative",
    badge: "Authority",
    initials: "E",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    role: "Warm & Conversational",
    genre: "Storytelling, Psychology, Lifestyle",
    badge: "Editorial",
    initials: "J",
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    role: "British Storyteller",
    genre: "History, Philosophy, Lore",
    badge: "Narrative",
    initials: "S",
  },
];

const DURATIONS = [
  { value: 15, label: "15s", role: "Punchy Hook" },
  { value: 25, label: "25s", role: "Viral Standard" },
  { value: 45, label: "45s", role: "Narrative Arc" },
  { value: 60, label: "60s", role: "Deep Dive" },
];

interface StudioConsoleViewProps {
  topic: string;
  setTopic: (t: string) => void;
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
}

export function StudioConsoleView({
  topic,
  setTopic,
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
}: StudioConsoleViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState(false);
  const [auditionVoiceId, setAuditionVoiceId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"controls" | "canvas">("controls");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

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
      auditionAudioRef.current?.pause();
      setAuditionVoiceId(null);
    } else {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }
      const audio = new Audio(`/audio/samples/${voiceId}.mp3`);
      auditionAudioRef.current = audio;
      audio.play().catch((err) => {
        console.warn("Audio audition error:", err);
      });
      setAuditionVoiceId(voiceId);
      audio.onended = () => setAuditionVoiceId(null);
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

  const isRendering = activeJob && !["completed", "failed"].includes(activeJob.status);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full max-w-full min-w-0">
      {/* Studio View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Studio Director
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              9:16 Shorts
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            Direct multi-scene vertical videos with sample-accurate audio-caption sync, 4K b-roll curation, and zero-loss FFmpeg encoding.
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
            className="flex-1 sm:flex-initial text-xs h-9 font-semibold shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {isRendering ? "Rendering..." : "Generate Video"}
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
          <span>Console Controls</span>
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
          <Smartphone className="h-3.5 w-3.5" />
          <span>Preview Canvas</span>
          {isRendering && (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping absolute top-2 right-4" />
          )}
        </button>
      </div>

      {/* Main Studio Grid: Controls Deck (Left) + Hardware Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full max-w-full min-w-0">
        {/* Left Column: Input Form Controls */}
        <div className={`lg:col-span-7 space-y-5 sm:space-y-6 min-w-0 w-full max-w-full ${mobileTab === "canvas" ? "hidden lg:block" : "block"}`}>
          {/* Section: Topic & Curated Verticals */}
          <div className="studio-card rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 min-w-0 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Concept & Direction</h2>
                  <p className="text-[11px] text-zinc-400">Specify your thesis or choose an editorial vertical</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{topic.length}/300</span>
            </div>

            <Textarea
              placeholder="e.g. 3 terrifying facts about the deep sea midnight zone that science still cannot explain..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[95px] sm:min-h-[105px] text-sm bg-black/40 border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20 resize-none rounded-xl leading-relaxed text-zinc-100 placeholder:text-zinc-600 font-sans"
              maxLength={300}
            />

            {/* Curated Editorial Verticals (Swipeable strip on mobile) */}
            <div className="space-y-2 pt-1 min-w-0 w-full max-w-full">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  Curated Editorial Verticals
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">High Retention Formats</span>
                <span className="text-[10px] text-amber-400/80 font-mono sm:hidden">Swipe →</span>
              </div>
              <div className="flex sm:grid sm:grid-cols-2 gap-2 overflow-x-auto snap-x no-scrollbar pb-1 w-full max-w-full min-w-0">
                {EDITORIAL_TOPICS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      setTopic(item.topic);
                      if (item.runtimeHint === "45s") setTargetDuration(45);
                      else setTargetDuration(25);
                    }}
                    className="min-w-[210px] max-w-[230px] sm:min-w-0 sm:max-w-none snap-start shrink-0 sm:shrink p-3 rounded-xl text-left bg-black/30 border border-white/[0.06] hover:border-amber-500/35 hover:bg-white/[0.03] transition-all group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 font-semibold">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.runtimeHint}
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

            {/* Target Duration Selector (4 clean pills in single row) */}
            <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Target Runtime
                </label>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  ~{targetDuration}s
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                {DURATIONS.map((d) => (
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

            {/* Narrator Voice Casting Deck with Audition Audio Player */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-amber-400" />
                  Narrator Casting Deck
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  Click icon to audition sample
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOICES.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  const isAuditioning = auditionVoiceId === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500 shadow-sm"
                          : "bg-black/30 border-white/[0.06] hover:border-white/[0.14] text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? "bg-amber-500 text-black"
                                : "bg-white/[0.08] text-zinc-300 group-hover:bg-white/[0.12]"
                            }`}
                          >
                            {v.initials}
                          </div>
                          <span className="text-xs font-bold text-white tracking-tight">
                            {v.name}
                          </span>
                        </div>

                        {/* Audition Player Button */}
                        <button
                          type="button"
                          onClick={(e) => togglePlayVoiceSample(v.id, e)}
                          title={`Audition voice sample for ${v.name}`}
                          className={`h-6 px-2 rounded-md flex items-center gap-1.5 text-[10px] font-mono font-semibold transition-all border ${
                            isAuditioning
                              ? "bg-amber-500 text-black border-amber-400"
                              : "bg-white/[0.06] text-zinc-300 hover:text-white border-white/[0.08] hover:bg-white/[0.12]"
                          }`}
                        >
                          {isAuditioning ? (
                            <>
                              <div className="flex items-end gap-[2px] h-3">
                                <span className="w-[2px] bg-black rounded-full eq-bar-1" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-2" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-3" />
                                <span className="w-[2px] bg-black rounded-full eq-bar-4" />
                              </div>
                              <span>Playing</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>Audition</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-[11px] font-semibold text-amber-400/90">{v.role}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{v.genre}</p>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                          {v.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-Publish Toggle to YouTube Shorts */}
            {setAutoPublishYouTube && (
              <div className="pt-3 border-t border-white/[0.06]">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Auto-Publish to YouTube Shorts</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                          Zero-Click
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Directly deliver to your connected YouTube channel once video assembly completes
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
                className="w-full h-12 text-sm font-semibold shadow-xl shadow-amber-500/20 rounded-xl"
                onClick={onGenerate}
                isLoading={isSubmitting || !!isRendering}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isRendering ? "Rendering Video in Cloud..." : "Generate & Render 9:16 Video"}
              </Button>
            </div>
          </div>

          {/* Creation Pipeline Stage Tracker (Linear / Vercel Aesthetic) */}
          <div className="studio-card rounded-2xl p-4 sm:p-5 space-y-4 min-w-0 w-full max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isRendering ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Engine Pipeline Execution
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
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 transition-all duration-500 rounded-full"
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
                <p className="text-[11px] font-semibold text-zinc-300">Viral Hook</p>
                <span className={`text-[10px] font-mono ${getStageStatus("scripting") === "done" ? "text-emerald-400" : getStageStatus("scripting") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("scripting") === "done" ? "Generated" : getStageStatus("scripting") === "active" ? "Authoring..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">02. AUDIO</span>
                  {getStageStatus("tts") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">Neural TTS</p>
                <span className={`text-[10px] font-mono ${getStageStatus("tts") === "done" ? "text-emerald-400" : getStageStatus("tts") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("tts") === "done" ? "Synthesized" : getStageStatus("tts") === "active" ? "Recording..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">03. MEDIA</span>
                  {getStageStatus("sourcing") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">4K Curations</p>
                <span className={`text-[10px] font-mono ${getStageStatus("sourcing") === "done" ? "text-emerald-400" : getStageStatus("sourcing") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("sourcing") === "done" ? "Downloaded" : getStageStatus("sourcing") === "active" ? "Acquiring..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">04. RENDER</span>
                  {getStageStatus("assembly") === "done" && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold text-zinc-300">FFmpeg Assembly</p>
                <span className={`text-[10px] font-mono ${getStageStatus("assembly") === "done" ? "text-emerald-400" : getStageStatus("assembly") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("assembly") === "done" ? "Encoded" : getStageStatus("assembly") === "active" ? "Muxing..." : "Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Smartphone Canvas */}
        <div className={`lg:col-span-5 flex flex-col items-center min-w-0 w-full max-w-full ${mobileTab === "controls" ? "hidden lg:flex" : "flex"}`}>
          <div className="w-full max-w-[310px] sm:max-w-[340px] space-y-3">
            {/* Top Canvas Controls: Safe Zone Toggle & Status */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-zinc-500" />
                9:16 Canvas
              </span>

              <button
                type="button"
                onClick={() => setShowSafeZoneOverlay(!showSafeZoneOverlay)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all ${
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
                    <span>Safe Zone Guide</span>
                  </>
                )}
              </button>
            </div>

            {/* Precision Hardware Bezel Container */}
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
                      <p className="text-sm font-bold text-white tracking-tight">Rendering Studio Master</p>
                      <p className="text-[11px] text-zinc-400">
                        Executing multi-scene stitch & ASS caption burn
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
                      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold tracking-wider uppercase font-mono border border-amber-500/30">
                        Master Canvas
                      </span>
                      <div className="text-base font-bold text-zinc-200 leading-snug tracking-tight">
                        Rendered vertical video will preview here with synced typography captions.
                      </div>
                    </div>
                  </>
                )}

                {/* Professional Safe Zone Overlay Guides */}
                {showSafeZoneOverlay && (
                  <div className="absolute inset-0 z-25 pointer-events-none flex flex-col justify-between">
                    {/* Top Platform UI Danger Zone */}
                    <div className="h-[15%] w-full safezone-guide-header flex items-center justify-center">
                      <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/90 bg-black/70 px-2 py-0.5 rounded border border-amber-500/30">
                        Platform Search & Header Space
                      </span>
                    </div>

                    {/* Middle Safe Bounds */}
                    <div className="flex-1 flex justify-between items-center px-2">
                      <div className="flex-1 h-full flex items-center justify-center p-2">
                        <div className="w-full h-4/5 border border-dashed border-amber-500/40 rounded-xl flex items-center justify-center">
                          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/80 bg-black/60 px-2 py-0.5 rounded">
                            Caption Safe Zone
                          </span>
                        </div>
                      </div>

                      {/* Right Action Rail Danger Zone */}
                      <div className="w-[20%] h-full safezone-guide-actionbar flex items-center justify-center">
                        <span className="text-[8px] font-mono font-semibold uppercase tracking-widest text-amber-400/80 rotate-90 whitespace-nowrap bg-black/70 px-1 py-0.5 rounded">
                          Action Rail
                        </span>
                      </div>
                    </div>

                    {/* Bottom Platform UI Danger Zone */}
                    <div className="h-[28%] w-full safezone-guide-footer flex items-center justify-center">
                      <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-amber-400/90 bg-black/70 px-2 py-0.5 rounded border border-amber-500/30">
                        Meta & Sound Disc Space
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

            {/* Quick Export & Cloud Actions */}
            {activeJob && activeJob.status === "completed" && videoSrc && (
              <div className="flex items-center gap-2 w-full pt-2">
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
    </div>
  );
}
