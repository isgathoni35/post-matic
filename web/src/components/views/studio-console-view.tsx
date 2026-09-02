"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse } from "@/lib/api";

const TRENDING_NICHES = [
  { topic: "Why the Mariana Trench is terrifying and what lurks at the bottom", label: "🌊 Deep Sea", color: "from-blue-500/20 to-cyan-500/20 text-cyan-400" },
  { topic: "4 subtle psychological tricks that people with high emotional intelligence use", label: "🧠 Psychology", color: "from-purple-500/20 to-indigo-500/20 text-purple-400" },
  { topic: "How ancient Roman concrete self-heals over thousands of years", label: "🏛️ Ancient Rome", color: "from-amber-500/20 to-orange-500/20 text-amber-400" },
  { topic: "What actually happens if two supermassive black holes collide", label: "🌌 Cosmic Mystery", color: "from-violet-500/20 to-pink-500/20 text-pink-400" },
  { topic: "The 3 morning habits of ultra-wealthy investors that cost zero dollars", label: "💰 Wealth Mindset", color: "from-emerald-500/20 to-teal-500/20 text-emerald-400" },
];

export const VOICES = [
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep & Cinematic",
    genre: "Documentary, Mystery, Crime",
    badge: "Recommended",
    initials: "C",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "High-Energy & Dynamic",
    genre: "Viral TikTok, Hooks, Tech",
    badge: "Viral",
    initials: "G",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    role: "Warm & Conversational",
    genre: "Storytelling, Lifestyle, Facts",
    badge: "Popular",
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
  { value: 15, label: "15s", role: "Quick Hook" },
  { value: 25, label: "25s", role: "Viral Standard" },
  { value: 45, label: "45s", role: "Story Mode" },
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Create Vertical Video
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              9:16 Shorts
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Type an idea or choose a viral niche. The engine writes scenes, narrates, and edits your video in the cloud.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSocialModal}
            className="text-xs h-9 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08]"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            Social Channels
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerate}
            isLoading={isSubmitting || !!isRendering}
            className="text-xs h-9 font-semibold shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate Video
          </Button>
        </div>
      </div>

      {/* Main Studio Grid: Creation Parameters (Left) + Interactive Live Preview Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Topic & Prompt */}
          <div className="studio-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Video Topic & Concept</h2>
                  <p className="text-[11px] text-zinc-400">What is this video about?</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">{topic.length}/300</span>
            </div>

            <Textarea
              placeholder="e.g. 3 terrifying facts about the deep sea midnight zone that science still cannot explain..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[110px] text-sm bg-black/40 border-white/[0.08] focus:border-amber-500/40 focus:ring-amber-500/20 resize-none rounded-xl leading-relaxed"
              maxLength={300}
            />

            {/* Trending Niches Presets */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <span>Trending Niche Ideas (Click to use)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_NICHES.map((niche) => (
                  <button
                    key={niche.label}
                    type="button"
                    onClick={() => setTopic(niche.topic)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/[0.08] hover:border-amber-500/30 hover:bg-white/[0.07] text-zinc-300 hover:text-white transition-all text-left flex items-center gap-1.5"
                  >
                    <span>{niche.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Duration Selector */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Target Duration
                </label>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  ~{targetDuration}s runtime
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setTargetDuration(d.value)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all ${
                      targetDuration === d.value
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-sm"
                        : "bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="text-sm font-bold">{d.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{d.role}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Actor Selector */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-amber-400" />
                Narrator Voice Talent
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedVoice === v.id
                        ? "bg-amber-500/10 border-amber-500 shadow-sm"
                        : "bg-black/30 border-white/[0.06] hover:border-white/[0.14] text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-black">
                          {v.initials}
                        </div>
                        <span className="text-xs font-bold text-white">{v.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400">
                        {v.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-amber-400">{v.role}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{v.genre}</p>
                  </button>
                ))}
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
                          1-Click
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Directly upload to your connected YouTube channel once rendering completes
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

          {/* Creation Pipeline Stage Tracker */}
          <div className="studio-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Creation Progress
                </h3>
              </div>
              {activeJob && (
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {activeJob.progress_pct}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${activeJob ? activeJob.progress_pct : 0}%` }}
              />
            </div>

            {/* Stage Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">01. Script</span>
                <p className="text-[11px] font-semibold text-zinc-300">Viral Hook</p>
                <span className={`text-[10px] font-mono ${getStageStatus("scripting") === "done" ? "text-emerald-400" : getStageStatus("scripting") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("scripting") === "done" ? "✓ Done" : getStageStatus("scripting") === "active" ? "Writing..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">02. Voice</span>
                <p className="text-[11px] font-semibold text-zinc-300">Narration</p>
                <span className={`text-[10px] font-mono ${getStageStatus("tts") === "done" ? "text-emerald-400" : getStageStatus("tts") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("tts") === "done" ? "✓ Done" : getStageStatus("tts") === "active" ? "Recording..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">03. Footage</span>
                <p className="text-[11px] font-semibold text-zinc-300">4K B-Roll</p>
                <span className={`text-[10px] font-mono ${getStageStatus("sourcing") === "done" ? "text-emerald-400" : getStageStatus("sourcing") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("sourcing") === "done" ? "✓ Done" : getStageStatus("sourcing") === "active" ? "Curating..." : "Standby"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono">04. Assembly</span>
                <p className="text-[11px] font-semibold text-zinc-300">Captions & Edit</p>
                <span className={`text-[10px] font-mono ${getStageStatus("assembly") === "done" ? "text-emerald-400" : getStageStatus("assembly") === "active" ? "text-amber-400 animate-pulse" : "text-zinc-600"}`}>
                  {getStageStatus("assembly") === "done" ? "✓ Done" : getStageStatus("assembly") === "active" ? "Editing..." : "Standby"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Shorts Smartphone Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] space-y-4">
            {/* Phone Bezel */}
            <div className="relative w-full aspect-[9/18] rounded-[48px] p-3.5 bg-gradient-to-b from-[#252b3b] via-[#141824] to-[#0a0d14] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] border border-white/[0.14]">
              {/* Inner Screen */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between p-4 select-none">
                {/* Dynamic Island */}
                <div className="relative z-30 mx-auto w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 border border-white/[0.08]">
                  <div className="h-2 w-2 rounded-full bg-emerald-500/80" />
                </div>

                {/* Video Playback or Standby State */}
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

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto z-20 h-16 w-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform"
                      >
                        <Play className="h-7 w-7 fill-white ml-1" />
                      </button>
                    )}

                    {/* Sound Toggle */}
                    <button
                      onClick={toggleMute}
                      className="absolute top-12 right-4 z-20 h-8 w-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
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
                      <p className="text-sm font-bold text-white">Rendering Your Video</p>
                      <p className="text-[11px] text-zinc-400">
                        Offloaded to 7 GB cloud runner
                      </p>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                      {activeJob?.progress_pct}% Completed
                    </span>
                  </div>
                ) : (
                  /* Idle Standby Screen (Simulated Aesthetic Preview) */
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-950/70 via-slate-900 to-black z-0">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.12),transparent_60%)] animate-pulse" />
                    </div>

                    <div className="relative z-10 my-auto text-center px-4 space-y-3">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold tracking-wider uppercase border border-amber-500/30">
                        Live Preview Canvas
                      </span>
                      <div className="text-lg font-black text-white leading-tight uppercase tracking-tight">
                        "Your rendered video will play here automatically with animated subtitles."
                      </div>
                    </div>
                  </>
                )}

                {/* Realistic Shorts UI Overlay */}
                <div className="relative z-20 flex items-end justify-between gap-3 mt-auto">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-[10px]">
                        P
                      </div>
                      <p className="text-xs font-bold text-white">@postmatic.studio</p>
                    </div>
                    <p className="text-[10px] text-zinc-300 line-clamp-1">
                      {topic || "Generated high-retention vertical Short"}
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

            {/* Bottom Actions under Phone */}
            {activeJob && activeJob.status === "completed" && videoSrc && (
              <div className="flex items-center gap-2 w-full pt-1">
                <a
                  href={videoSrc}
                  download={`video_${activeJob.job_id.slice(0, 8)}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" size="sm" className="w-full text-xs h-10 rounded-xl">
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
                    Publish to YouTube
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
