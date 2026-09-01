"use client";

import React, { useState } from "react";
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
  Maximize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkle,
  Radio,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse } from "@/lib/api";

const STARTER_TOPICS = [
  { topic: "Why the Mariana Trench is terrifying", category: "Deep Ocean" },
  { topic: "Ancient Roman concrete that self-heals over centuries", category: "History" },
  { topic: "Dark psychology tricks salespeople use every day", category: "Psychology" },
  { topic: "What actually happens when two supermassive black holes collide", category: "Cosmos" },
  { topic: "The bizarre psychological illusion of the Mandela Effect", category: "Mysteries" },
];

export const VOICES = [
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep Documentary Male",
    desc: "Authoritative, cinematic, and captivating voice ideal for facts & documentaries.",
    tag: "Recommended",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "High Energy Male",
    desc: "Dynamic, fast-paced voice tailored for viral TikTok & Shorts hooks.",
    tag: "Viral",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    role: "Warm & Natural Female",
    desc: "Clear, conversational, and highly engaging tone for lifestyle and education.",
    tag: "Popular",
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    role: "British Storyteller Female",
    desc: "Sophisticated and articulate narration with an authentic British cadence.",
    tag: "Narrative",
  },
];

interface StudioConsoleViewProps {
  topic: string;
  setTopic: (t: string) => void;
  targetDuration: number;
  setTargetDuration: (d: number) => void;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
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
  isSubmitting,
  activeJob,
  onGenerate,
  onOpenSocialModal,
}: StudioConsoleViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

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

  const getStageBadge = (stageStatus: "pending" | "active" | "done" | "failed") => {
    if (stageStatus === "active") {
      return (
        <span className="flex items-center text-amber-400 text-[11px] font-mono font-medium">
          <Loader2 className="h-3 w-3 animate-spin mr-1 text-amber-400" />
          Processing
        </span>
      );
    }
    if (stageStatus === "done") {
      return (
        <span className="flex items-center text-emerald-400 text-[11px] font-mono font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Done
        </span>
      );
    }
    if (stageStatus === "failed") {
      return (
        <span className="flex items-center text-red-400 text-[11px] font-mono font-medium">
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          Failed
        </span>
      );
    }
    return <span className="text-zinc-500 text-[11px] font-mono">Standby</span>;
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Studio Video Composer
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              9:16 Vertical Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Generate high-retention vertical videos orchestrated via Gemini 1.5/3.7, edge-tts, Pexels HD clips, and FFmpeg.
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
            Publishing Channels
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onGenerate}
            isLoading={isSubmitting}
            className="text-xs h-9 font-semibold shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Render Video
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Studio Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prompt Studio Card */}
          <div className="rounded-2xl p-6 bg-[#0f131a] border border-white/[0.08] shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Video Topic & Creative Prompt
                </label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Enter a theme, factual mystery, or script prompt. The engine writes scenes and synchronizes visuals.
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                {topic.length}/300
              </span>
            </div>

            <div className="space-y-3">
              <Textarea
                placeholder="e.g. 3 terrifying facts about the deep sea midnight zone that science still cannot explain..."
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={300}
                className="w-full bg-black/40 border-white/[0.08] focus:border-amber-500/50 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-amber-500/30 p-3.5"
              />

              {/* Curated Prompt Inspirations */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Curated Inspirations
                </span>
                <div className="flex flex-wrap gap-2">
                  {STARTER_TOPICS.map((item) => (
                    <button
                      key={item.topic}
                      type="button"
                      onClick={() => setTopic(item.topic)}
                      className="text-xs bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-500/30 text-zinc-300 px-3 py-1.5 rounded-lg border border-white/[0.06] transition-all text-left flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-mono text-amber-400 font-semibold">
                        {item.category}:
                      </span>
                      <span className="truncate max-w-[240px]">{item.topic}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Duration Preset Selector */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Target Duration
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {targetDuration} seconds (~{Math.round(targetDuration * 2.6)} spoken words)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {[15, 25, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTargetDuration(sec)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                      targetDuration === sec
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-sm font-bold">{sec}s</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {sec === 15 ? "Quick Hook" : sec === 25 ? "Viral Standard" : sec === 45 ? "Story" : "Deep Dive"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Actor Selector Cards */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5 text-amber-400" />
                Voice Synthesis Actor (edge-tts)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all space-y-1.5 ${
                      selectedVoice === v.id
                        ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        selectedVoice === v.id
                          ? "bg-amber-500/20 text-amber-300 font-semibold"
                          : "bg-white/[0.04] text-zinc-400"
                      }`}>
                        {v.tag}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-amber-400">{v.role}</p>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full h-12 text-sm font-semibold shadow-xl shadow-amber-500/20 rounded-xl"
                onClick={onGenerate}
                isLoading={isSubmitting}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate & Render 9:16 Video
              </Button>
            </div>
          </div>

          {/* Real-time Pipeline Orchestration Stages Card */}
          <div className="rounded-2xl p-5 bg-[#0f131a] border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white tracking-tight uppercase tracking-wider">
                  Pipeline Execution Monitor
                </span>
              </div>
              {activeJob?.status === "completed" ? (
                <Badge variant="success" className="text-[10px] font-mono">100% Completed</Badge>
              ) : activeJob?.status === "failed" ? (
                <Badge variant="destructive" className="text-[10px] font-mono">Failed</Badge>
              ) : activeJob ? (
                <Badge variant="primary" pulse className="text-[10px] font-mono">
                  Processing ({activeJob.progress_pct}%)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono">Idle</Badge>
              )}
            </div>

            {/* 4 Execution Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">1. SCRIPT</span>
                  {getStageBadge(getStageStatus("scripting"))}
                </div>
                <p className="text-xs font-semibold text-white">Gemini LLM</p>
                <p className="text-[10px] text-zinc-500">Pydantic Schema</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">2. AUDIO</span>
                  {getStageBadge(getStageStatus("tts"))}
                </div>
                <p className="text-xs font-semibold text-white">edge-tts</p>
                <p className="text-[10px] text-zinc-500">.ASS Offsets</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">3. MEDIA</span>
                  {getStageBadge(getStageStatus("sourcing"))}
                </div>
                <p className="text-xs font-semibold text-white">Pexels 4K</p>
                <p className="text-[10px] text-zinc-500">Vertical HD</p>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">4. RENDER</span>
                  {getStageBadge(getStageStatus("assembly"))}
                </div>
                <p className="text-xs font-semibold text-white">FFmpeg 9:16</p>
                <p className="text-[10px] text-zinc-500">Burn Captions</p>
              </div>
            </div>

            {activeJob?.error_message && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                Pipeline Error: {activeJob.error_message}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pro 9:16 Smartphone Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl p-6 bg-[#0f131a] border border-white/[0.08] shadow-2xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Film className="h-4 w-4 text-amber-400" />
                Live 9:16 Video Canvas
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400">
                1080 × 1920 MP4
              </span>
            </div>

            {/* Smartphone Device Frame */}
            <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-[32px] border-4 border-zinc-800 bg-black shadow-2xl shadow-black/80 flex flex-col items-center justify-between p-2.5 overflow-hidden group">
              {/* Dynamic Island / Top Notch */}
              <div className="w-20 h-4 bg-zinc-950 rounded-full border border-white/[0.06] z-30 absolute top-3 flex items-center justify-end px-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse" />
              </div>

              {/* Video Player or Interactive State */}
              {videoSrc && activeJob?.status === "completed" ? (
                <div className="w-full h-full rounded-[24px] overflow-hidden relative flex items-center justify-center bg-zinc-950">
                  <video
                    ref={videoRef}
                    key={videoSrc}
                    src={videoSrc}
                    playsInline
                    autoPlay
                    loop
                    className="w-full h-full object-cover rounded-[24px]"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Video Control Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 z-20 pointer-events-none">
                    <div className="flex justify-end pointer-events-auto">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-center pointer-events-auto">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="h-12 w-12 rounded-full bg-amber-500/90 text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-amber-500/30"
                      >
                        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 pointer-events-auto">
                      <span>{activeJob.duration_seconds?.toFixed(1)}s</span>
                      <span className="text-amber-400 font-semibold">1080x1920</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full rounded-[24px] bg-gradient-to-b from-zinc-900/60 via-black to-zinc-950 flex flex-col items-center justify-center p-4 text-center space-y-4">
                  {activeJob && ["scripting", "synthesizing", "sourcing_media", "rendering", "pending"].includes(activeJob.status) ? (
                    <div className="space-y-3">
                      <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                        <Loader2 className="h-7 w-7 animate-spin" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-wider">
                          {activeJob.status.replace("_", " ")}
                        </p>
                        <p className="text-[11px] font-mono text-amber-400 mt-1">
                          {activeJob.progress_pct}% Completed
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Live Canvas Standby</p>
                        <p className="text-[11px] text-zinc-400 max-w-[180px] mt-1">
                          Rendered video with synchronized ASS subtitles will play here automatically.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Simulated Dynamic Subtitles */}
                  <div className="w-full bg-black/80 backdrop-blur-md rounded-xl p-2.5 border border-white/[0.08] text-center mt-auto">
                    <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider uppercase">
                      [DYNAMIC WORD SUBTITLES]
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Download & Export CTA */}
            <div className="w-full max-w-[280px] mt-4 space-y-2">
              {videoSrc && activeJob?.status === "completed" ? (
                <a
                  href={videoSrc}
                  download={`video_${activeJob.job_id.slice(0, 8)}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block"
                >
                  <Button variant="primary" size="sm" className="w-full text-xs font-semibold h-10 shadow-lg shadow-amber-500/20">
                    <Download className="h-4 w-4 mr-1.5" />
                    Download 1080x1920 MP4
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" size="sm" disabled className="w-full text-xs h-10 bg-white/[0.02] border-white/[0.06]">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export Disabled (Idle)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
