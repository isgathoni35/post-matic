"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  Share2,
  Mic,
  Video,
  CheckCircle2,
  Heart,
  MessageCircle,
  Bookmark,
  Music2,
  TrendingUp,
  Flame,
  Volume2,
  Sliders,
  Check,
  X,
  Zap,
  Clock,
  Layers,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";

const PREVIEW_TOPICS = [
  {
    id: "ocean",
    label: "🌊 Deep Sea",
    title: "Why the Mariana Trench is Terrifying",
    hook: "At 36,000 feet deep, the pressure can crush a titanium submarine like a soda can...",
    keyword: "CRUSH",
    bgGradient: "from-blue-950 via-slate-950 to-black",
    radialColor: "rgba(56, 189, 248, 0.18)",
    likes: "248.5K",
    comments: "3,140",
    bookmarks: "42.8K",
    sound: "Original Audio - Cinematic Mystery",
  },
  {
    id: "psychology",
    label: "🧠 Dark Psychology",
    title: "The Subtle Trick of Eye Contact",
    hook: "If someone interrupts you, never raise your voice. Instead, hold unbroken eye contact and pause for 3 seconds...",
    keyword: "POWER",
    bgGradient: "from-purple-950 via-slate-950 to-black",
    radialColor: "rgba(168, 85, 247, 0.18)",
    likes: "512.9K",
    comments: "6,820",
    bookmarks: "89.4K",
    sound: "Original Audio - Suspense Pacing",
  },
  {
    id: "history",
    label: "🏛️ Ancient Rome",
    title: "The Mystery of Self-Healing Concrete",
    hook: "The Romans built harbors 2,000 years ago that are still standing today because of a chemical secret modern engineers lost...",
    keyword: "ANCIENT",
    bgGradient: "from-slate-900 via-stone-950 to-black",
    radialColor: "rgba(99, 102, 241, 0.18)",
    likes: "189.2K",
    comments: "1,940",
    bookmarks: "31.2K",
    sound: "Original Audio - Epic Narration",
  },
];

const BENTO_NICHES = [
  {
    icon: "🌊",
    title: "Deep Sea Mysteries",
    hook: "3 terrifying facts about the deep sea midnight zone that science still cannot explain...",
    views: "1.4M Avg",
    retention: "92% Retention",
    tag: "High Virality",
  },
  {
    icon: "🧠",
    title: "Dark Psychology",
    hook: "4 subtle body language cues that instantly reveal if someone is lying to your face...",
    views: "2.8M Avg",
    retention: "96% Retention",
    tag: "Trending Now",
  },
  {
    icon: "🏛️",
    title: "Ancient History",
    hook: "The bizarre reason ancient Roman concrete actually gets stronger the longer it sits in saltwater...",
    views: "980K Avg",
    retention: "88% Retention",
    tag: "Evergreen",
  },
  {
    icon: "🌌",
    title: "Cosmic Anomalies",
    hook: "What actually happens if two supermassive black holes collide at 99% the speed of light...",
    views: "3.2M Avg",
    retention: "95% Retention",
    tag: "Breakout Niche",
  },
];

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTopic = PREVIEW_TOPICS[activeTopicIndex];

  const voiceSampleMap: Record<string, string> = {
    ocean: "en-US-BrianMultilingualNeural",
    psychology: "en-US-AvaMultilingualNeural",
    history: "en-US-AndrewMultilingualNeural",
  };

  const playAudioForTopic = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const topicId = PREVIEW_TOPICS[index]?.id || "ocean";
    const voiceFile = voiceSampleMap[topicId] || "en-US-BrianMultilingualNeural";
    const audio = new Audio(`/audio/samples/${voiceFile}.mp3`);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    audio.play().catch(() => setIsPlayingAudio(false));
    audio.onended = () => setIsPlayingAudio(false);
  };

  const toggleAudio = (index?: number) => {
    const targetIdx = index !== undefined ? index : activeTopicIndex;
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      playAudioForTopic(targetIdx);
    }
  };

  const handleSelectTopic = (index: number) => {
    setActiveTopicIndex(index);
    if (isPlayingAudio) {
      playAudioForTopic(index);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative w-full max-w-full">
      {/* Warm Ambient Environmental Lighting (Contained within overflow-hidden boundary) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] max-w-[100vw] h-[650px] bg-gradient-to-b from-indigo-500/[0.06] via-indigo-500/[0.02] to-transparent blur-3xl" />
        <div className="absolute top-[450px] right-0 w-[600px] max-w-[100vw] h-[500px] bg-gradient-to-l from-indigo-500/[0.04] to-transparent blur-3xl" />
      </div>

      {/* Navigation Header - Aligned to max-w-6xl container */}
      <header className="sticky top-0 z-50 w-full h-14 sm:h-16 bg-[#0c0c0e]/95 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6">
        <div className="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
          {/* Bespoke Logo */}
          <BrandLogo size="sm" badgeText="Studio" />

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#demo" className="hover:text-white transition-colors">Live Preview</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#niches" className="hover:text-white transition-colors">Trending Niches</a>
            <a href="#workflow" className="hover:text-white transition-colors">Timeline Engine</a>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-24 rounded-lg bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <Link href="/studio">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold rounded-lg"
                >
                  Enter Studio
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs font-medium text-zinc-300 hover:text-white rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 px-4 text-xs font-semibold rounded-lg"
                  >
                    Start Free
                    <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="demo" className="relative pt-12 sm:pt-20 pb-20 px-6 sm:px-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left: Creator Value Proposition */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Contextual Status Badge */}
            <div>
              {user ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span>Welcome back, {user.email?.split("@")[0]}</span>
                  <span className="text-zinc-500">•</span>
                  <Link href="/studio" className="underline hover:text-white font-semibold">
                    Resume studio session →
                  </Link>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-300 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span>The Autonomous Short-Form Studio</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-indigo-400 font-semibold">Zero Video Editing Required</span>
                </div>
              )}
            </div>

            {/* Human-Centered Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Turn any idea into <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400">
                viral vertical videos
              </span>{" "}
              in 30 seconds.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              PostMatic writes viral hooks, narrates with human inflection, matches 4K B-roll clips, and burns kinetic subtitles — ready for YouTube Shorts, Reels, and TikTok.
            </p>

            {/* Interactive Preview Topic Selector Chips */}
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Tap a niche to preview live render simulation:
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {PREVIEW_TOPICS.map((topic, i) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(i)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTopicIndex === i
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span>{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href={user ? "/studio" : "/login"} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto h-12 px-7 text-sm font-semibold rounded-lg group"
                >
                  {user ? "Return to Your Studio" : "Start Creating For Free"}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto h-12 px-6 text-sm font-medium rounded-lg border-white/[0.08] hover:bg-white/[0.05]"
                >
                  <Play className="h-4 w-4 mr-2 text-indigo-400 fill-indigo-400" />
                  See Creation Architecture
                </Button>
              </a>
            </div>

            {/* Creator Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-3 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>94.2% Avg Watch Retention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>1080x1920 60FPS HD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1">
                  <span className="h-5 w-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <YouTubeIcon className="h-3 w-3 fill-current" />
                  </span>
                  <span className="h-5 w-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <TikTokIcon className="h-3 w-3 fill-current" />
                  </span>
                  <span className="h-5 w-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <InstagramIcon className="h-3 w-3 fill-current" />
                  </span>
                </div>
                <span>Multi-Platform Auto-Post</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Dynamic Interactive Smartphone Player Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[330px] aspect-[9/18.5] rounded-[48px] p-3.5 bg-gradient-to-b from-[#1a1a24] via-[#121218] to-[#0c0c10] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.9)] border border-white/[0.14]">
              {/* Inner Screen */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between p-4 select-none">
                {/* Simulated Visual Background for Selected Topic */}
                <div className={`absolute inset-0 bg-gradient-to-b ${activeTopic.bgGradient} opacity-90 transition-all duration-500`}>
                  <div
                    className="absolute inset-0 animate-pulse transition-all duration-700"
                    style={{
                      background: `radial-gradient(circle at 50% 35%, ${activeTopic.radialColor}, transparent 65%)`,
                    }}
                  />
                </div>

                {/* iPhone Dynamic Island */}
                <div className="relative z-30 mx-auto w-24 h-5 rounded-full bg-black flex items-center justify-between px-2.5 border border-white/[0.08]">
                  <div className="h-2 w-2 rounded-full bg-indigo-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>

                {/* Simulated Spoken Word Kinetic Caption Display */}
                <div className="relative z-20 my-auto text-center px-4 space-y-3">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase border border-indigo-500/30 backdrop-blur-md">
                    {activeTopic.title}
                  </span>
                  <div className="text-xl font-black text-white leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] uppercase tracking-tight font-sans">
                    "{activeTopic.hook}"
                  </div>
                  {/* Highlighted Word Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wide shadow-md">
                    <Zap className="h-3 w-3 fill-white" />
                    <span>{activeTopic.keyword}</span>
                  </div>
                </div>

                {/* Realistic Shorts UI Overlay */}
                <div className="relative z-20 flex items-end justify-between gap-3 mt-auto">
                  {/* Bottom Creator Info & Live Waveform */}
                  <div className="space-y-1.5 text-left max-w-[210px]">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-[11px] shadow-md">
                        P
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-white">@postmatic.studio</p>
                        <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-[9px] flex items-center justify-center text-white font-bold">
                          ✓
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-200 line-clamp-2 leading-relaxed">
                      {activeTopic.hook} #Shorts #Viral #PostMatic
                    </p>
                    
                    {/* Simulated Voice Audio Waveform (Interactive) */}
                    <button
                      type="button"
                      onClick={() => toggleAudio()}
                      className="flex items-center gap-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/[0.12] transition-all cursor-pointer text-left w-full group"
                    >
                      <div className="flex items-center gap-0.5 h-3.5">
                        <div className={`w-0.5 bg-indigo-400 rounded-full ${isPlayingAudio ? "wave-bar-1" : "h-1.5"}`} />
                        <div className={`w-0.5 bg-indigo-400 rounded-full ${isPlayingAudio ? "wave-bar-2" : "h-2.5"}`} />
                        <div className={`w-0.5 bg-indigo-400 rounded-full ${isPlayingAudio ? "wave-bar-3" : "h-1"}`} />
                        <div className={`w-0.5 bg-indigo-400 rounded-full ${isPlayingAudio ? "wave-bar-4" : "h-3"}`} />
                        <div className={`w-0.5 bg-indigo-400 rounded-full ${isPlayingAudio ? "wave-bar-5" : "h-1.5"}`} />
                      </div>
                      <span className="text-[9px] text-zinc-300 truncate font-mono flex-1">
                        {isPlayingAudio ? "Playing Voice Sample..." : "Studio Voice • Tap to Listen"}
                      </span>
                      {isPlayingAudio ? (
                        <Pause className="h-3 w-3 text-indigo-400 shrink-0" />
                      ) : (
                        <Play className="h-3 w-3 text-indigo-400 fill-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                  </div>

                  {/* Right Floating Actions */}
                  <div className="flex flex-col items-center gap-2.5 text-white">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-9 w-9 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      </div>
                      <span className="text-[9px] font-bold">{activeTopic.likes}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-9 w-9 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold">{activeTopic.comments}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-9 w-9 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                        <Bookmark className="h-4 w-4" />
                      </div>
                      <span className="text-[9px] font-bold">{activeTopic.bookmarks}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="h-9 w-9 rounded-full bg-white/[0.15] backdrop-blur-md flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-indigo-400" />
                      </div>
                      <span className="text-[9px] font-bold">Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tactile Bento Workflow Section */}
      <section id="how-it-works" className="py-24 px-6 sm:px-12 border-t border-white/[0.06] relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sliders className="h-3.5 w-3.5" />
              Inside the Creation Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Engineered for maximum watch-time.
            </h2>
            <p className="text-sm text-zinc-400">
              PostMatic synchronizes script structure, emotional narration, and 4K visual pacing automatically.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento 1: Script & Hook Architecture */}
            <div className="md:col-span-6 pm-surface border border-white/[0.06] p-6 sm:p-7 rounded-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">01. Viral Hook Architect</h3>
                    <p className="text-[11px] text-zinc-400">Retention-engineered narrative curves</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Natural Pacing
                </span>
              </div>

              {/* Simulated Script Pacing Beats */}
              <div className="space-y-2.5 pt-2 font-mono text-xs">
                <div className="p-3.5 rounded-lg bg-[#0c0c0e] border border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                      [0:00 - 0:03] The Pattern Interrupt
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      "At 36,000 feet deep, the pressure can crush a submarine..."
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold shrink-0">98% Retention</span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0c0c0e] border border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                      [0:03 - 0:18] Curiosity Escalation
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      "Sonar microphones just picked up a frequency that shouldn't exist..."
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold shrink-0">94% Retention</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Neural Voice & Inflection */}
            <div className="md:col-span-6 pm-surface border border-white/[0.06] p-6 sm:p-7 rounded-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">02. Neural Voice Studio</h3>
                    <p className="text-[11px] text-zinc-400">Zero robotic monotone speech</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  HD Audio
                </span>
              </div>

              {/* Interactive Voice Player Mockup */}
              <div
                onClick={() => toggleAudio(0)}
                className="p-4 rounded-lg bg-[#0c0c0e] border border-white/[0.06] space-y-3 cursor-pointer hover:border-indigo-500/40 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">Brian Multilingual (V2)</p>
                      <p className="text-[10px] text-zinc-400">Conversational Viral Narrator • Tap to audition</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                    <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse" : ""}`} />
                    <span className="text-[11px] font-mono">{isPlayingAudio ? "Playing" : "Audition"}</span>
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 flex items-center justify-between gap-1">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.round(Math.max(15, Math.sin(i * 0.45) * 85 + 15))}%`,
                        opacity: i % 2 === 0 ? 0.9 : 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bento 3: Multi-Track Video Timeline (Full Width) */}
            <div id="workflow" className="md:col-span-12 pm-surface border border-white/[0.06] p-6 sm:p-7 rounded-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">03. Automated Multi-Track Timeline</h3>
                    <p className="text-[11px] text-zinc-400">
                      Cloud FFmpeg orchestrates footage, subtitles, audio ducking, and rendering
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  Render Time: ~24 seconds
                </span>
              </div>

              {/* Visual Multi-Track Timeline */}
              <div className="rounded-lg bg-[#0c0c0e] border border-white/[0.06] p-4 space-y-2.5 timeline-track overflow-x-auto text-[11px]">
                <div className="min-w-[500px] space-y-2.5">
                  {/* Track 1: 4K Video Clips */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-cyan-400" />
                      Visuals
                    </span>
                    <div className="flex-1 grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                      <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 truncate">
                        Clip 1: Deep Trench
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 truncate">
                        Clip 2: Submarine Hull
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 truncate">
                        Clip 3: Sonar Radar
                      </div>
                      <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 truncate">
                        Clip 4: Bioluminescence
                      </div>
                    </div>
                  </div>

                  {/* Track 2: Voiceover Audio */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Mic className="h-3 w-3 text-indigo-400" />
                      Voiceover
                    </span>
                    <div className="flex-1 p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 truncate flex items-center justify-between">
                      <span className="text-xs">Voice Track (Studio Balanced Audio)</span>
                      <span className="text-[10px] text-indigo-400 font-mono">24.6s</span>
                    </div>
                  </div>

                  {/* Track 3: Kinetic Word Subtitles */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Film className="h-3 w-3 text-pink-400" />
                      Subtitles
                    </span>
                    <div className="flex-1 p-2 rounded-lg bg-pink-950/40 border border-pink-500/30 text-pink-300 truncate flex items-center justify-between">
                      <span className="text-xs">Animated Subtitles (Safe Zone Positioned)</span>
                      <span className="text-[10px] text-pink-400 font-mono">Synced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Niches Explorer Section */}
      <section id="niches" className="py-24 px-6 sm:px-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-2">
                <Flame className="h-4 w-4 text-indigo-400" />
                Validated Viral Formats
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Tested Niches for Faceless Creators
              </h2>
            </div>
            <Link href={user ? "/studio" : "/login"}>
              <Button variant="secondary" size="sm" className="text-xs h-9">
                Open Studio Console
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENTO_NICHES.map((niche) => (
              <div
                key={niche.title}
                className="pm-surface-interactive border border-white/[0.06] p-5 rounded-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{niche.icon}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {niche.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{niche.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    "{niche.hook}"
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span className="text-emerald-400 font-semibold">{niche.views}</span>
                    <span>{niche.retention}</span>
                  </div>
                  <Link href={user ? `/studio?topic=${encodeURIComponent(niche.hook)}` : `/login?next=${encodeURIComponent(`/studio?topic=${encodeURIComponent(niche.hook)}`)}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs h-8 bg-white/[0.04] hover:bg-primary hover:text-primary-foreground border-white/[0.08] transition-colors rounded-lg font-medium"
                    >
                      Use This Hook
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison: Traditional Editing vs PostMatic */}
      <section className="py-20 px-6 sm:px-12 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why creators switch from traditional editing
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              The comparison speaks for itself.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* Old Way */}
            <div className="p-5 sm:p-6 rounded-xl bg-red-950/10 border border-red-500/20 space-y-3">
              <span className="text-xs font-mono font-bold text-red-400 uppercase">The Old Way (3–5 Hours)</span>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Researching hooks on Reddit & forums</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Recording voiceovers with retakes and noise</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Sourcing 15 stock clips from different websites</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Manually syncing word-by-word subtitles in Premiere</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>20-minute local rendering and manual export</span>
                </li>
              </ul>
            </div>

            {/* PostMatic Way */}
            <div className="p-5 sm:p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">With PostMatic (30 Seconds)</span>
              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Enter 1 topic or pick a proven niche</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Neural voice talent with studio pacing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Matched 4K B-roll stitched automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Kinetic animated subtitles burned in at 60 FPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Published directly to YouTube Shorts with 1 click</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 px-6 sm:px-12 border-t border-white/[0.06] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Start Growing Today
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to scale your faceless channel on autopilot?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Create high-retention vertical videos with zero camera gear, zero voice recording, and zero editing software.
          </p>
          <div className="pt-2">
            <Link href={user ? "/studio" : "/login"}>
              <Button
                variant="primary"
                className="h-12 px-7 text-sm font-semibold rounded-lg group"
              >
                {user ? "Go to Your Studio Console" : "Launch Your Studio Now — It's Free"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 sm:px-12 text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <BrandLogo size="sm" badgeText="Studio" />
          <div className="flex items-center gap-6 text-zinc-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
            <a
              href="https://github.com/isgathoni35/post-matic"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
