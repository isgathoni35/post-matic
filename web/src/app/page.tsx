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
  ShieldCheck,
  Eye,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";

interface Topic {
  id: string;
  label: string;
  niche: string;
  title: string;
  hook: string;
  keyword: string;
  image: string;
  voice: string;
  voiceName: string;
  sound: string;
  views: string;
  retention: string;
  likes: string;
  comments: string;
  bookmarks: string;
}

const PREVIEW_TOPICS: Topic[] = [
  {
    id: "ocean",
    label: "🌊 Deep Sea",
    niche: "Deep Sea Mysteries",
    title: "Why the Mariana Trench is Terrifying",
    hook: "At 36,000 feet deep, water pressure can crush a titanium submarine like a soda can...",
    keyword: "CRUSH",
    image: "/images/previews/ocean.jpg",
    voice: "en-US-BrianMultilingualNeural",
    voiceName: "Brian Multilingual (Cinematic Deep)",
    sound: "Original Sound • Deep Ocean Drone",
    views: "1.4M views",
    retention: "94% retention",
    likes: "248.5K",
    comments: "3,140",
    bookmarks: "42.8K",
  },
  {
    id: "psychology",
    label: "🧠 Dark Psychology",
    niche: "Dark Psychology",
    title: "The Silence Power Play",
    hook: "If someone interrupts you, never raise your voice. Look directly between their eyes and hold silence for 3 seconds...",
    keyword: "SILENCE",
    image: "/images/previews/psychology.jpg",
    voice: "en-US-AvaMultilingualNeural",
    voiceName: "Ava Multilingual (Hypnotic Suspense)",
    sound: "Original Sound • Dark Mindset Noir",
    views: "2.8M views",
    retention: "96% retention",
    likes: "512.9K",
    comments: "6,820",
    bookmarks: "89.4K",
  },
  {
    id: "rome",
    label: "🏛️ Ancient Rome",
    niche: "Ancient History",
    title: "The Lost Roman Concrete Formula",
    hook: "Roman harbors built 2,000 years ago are still rock solid today because of a chemical secret modern engineers lost...",
    keyword: "SECRET",
    image: "/images/previews/rome.jpg",
    voice: "en-US-AndrewMultilingualNeural",
    voiceName: "Andrew Multilingual (Authoritative Lore)",
    sound: "Original Sound • Roman Empire Drums",
    views: "980K views",
    retention: "88% retention",
    likes: "189.2K",
    comments: "1,940",
    bookmarks: "31.2K",
  },
  {
    id: "cosmic",
    label: "🌌 Cosmic Horrors",
    niche: "Space Anomalies",
    title: "The Void That Swallows Stars",
    hook: "If two supermassive black holes collide at 99% light speed, the gravity shockwave vibrates across every atom in space...",
    keyword: "SHOCKWAVE",
    image: "/images/previews/cosmic.jpg",
    voice: "en-US-ChristopherNeural",
    voiceName: "Christopher (Sci-Fi Narrator)",
    sound: "Original Sound • Interstellar Frequency",
    views: "3.2M views",
    retention: "95% retention",
    likes: "674.1K",
    comments: "8,920",
    bookmarks: "112.5K",
  },
];

const MARQUEE_REELS = [
  {
    title: "Mariana Trench Depth",
    niche: "Deep Sea",
    views: "1.4M",
    retention: "94%",
    image: "/images/previews/ocean.jpg",
    platform: "yt",
  },
  {
    title: "The Silence Rule",
    niche: "Dark Psychology",
    views: "2.8M",
    retention: "96%",
    image: "/images/previews/psychology.jpg",
    platform: "tt",
  },
  {
    title: "Roman Seawater Concrete",
    niche: "Ancient Rome",
    views: "980K",
    retention: "88%",
    image: "/images/previews/rome.jpg",
    platform: "ig",
  },
  {
    title: "Black Hole Collision",
    niche: "Cosmic Horrors",
    views: "3.2M",
    retention: "95%",
    image: "/images/previews/cosmic.jpg",
    platform: "yt",
  },
  {
    title: "The Uncanny Valley Shift",
    niche: "Psychology",
    views: "1.9M",
    retention: "93%",
    image: "/images/previews/psychology.jpg",
    platform: "tt",
  },
  {
    title: "Lost Megastructure of Rome",
    niche: "Ancient History",
    views: "1.1M",
    retention: "90%",
    image: "/images/previews/rome.jpg",
    platform: "ig",
  },
  {
    title: "Creatures of Midnight Zone",
    niche: "Deep Sea",
    views: "2.3M",
    retention: "95%",
    image: "/images/previews/ocean.jpg",
    platform: "yt",
  },
  {
    title: "The Great Attractor Mystery",
    niche: "Cosmic Lore",
    views: "3.5M",
    retention: "97%",
    image: "/images/previews/cosmic.jpg",
    platform: "tt",
  },
];

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeTopic = PREVIEW_TOPICS[activeTopicIndex];

  const playAudioForTopic = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const topic = PREVIEW_TOPICS[index];
    const voiceFile = topic?.voice || "en-US-BrianMultilingualNeural";
    const audio = new Audio(`/audio/samples/${voiceFile}.mp3`);
    audioRef.current = audio;
    setIsPlayingAudio(true);
    setAudioProgress(0);

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.play().catch(() => setIsPlayingAudio(false));
    audio.onended = () => {
      setIsPlayingAudio(false);
      setAudioProgress(0);
    };
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
    setHasLiked(false);
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
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-zinc-700 selection:text-white overflow-x-hidden relative w-full">
      {/* Subtle Structural Ambient Background (No tacky purple haze) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle top spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full h-16 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
          <BrandLogo size="sm" badgeText="Studio" />

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
            <a href="#demo" className="hover:text-white transition-colors">Reel Preview</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Pipeline</a>
            <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-24 rounded-lg bg-white/[0.05] animate-pulse" />
            ) : user ? (
              <Link href="/studio">
                <Button
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-xs"
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
                    className="h-9 text-xs font-medium text-zinc-400 hover:text-white rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-xs"
                  >
                    Start Free
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="demo" className="relative pt-12 sm:pt-16 pb-16 px-6 sm:px-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Clear, High-Converting Creator Copy */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Status / Announcement Pill */}
            <div>
              {user ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/60 border border-white/[0.1] text-xs font-medium text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Logged in as {user.email?.split("@")[0]}</span>
                  <span className="text-zinc-600">•</span>
                  <Link href="/studio" className="text-white hover:underline font-semibold flex items-center gap-1">
                    Open Studio →
                  </Link>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>The Autonomous Short-Form Engine</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">Zero Video Editing Required</span>
                </div>
              )}
            </div>

            {/* Authoritative, Non-AI Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Automated faceless channels that{" "}
              <span className="text-white underline decoration-zinc-600 decoration-wavy underline-offset-8">
                actually get views.
              </span>
            </h1>

            {/* Clear Value Proposition */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              PostMatic plans viral hooks, generates cinematic visuals, records neural voiceovers, and burns kinetic subtitles—then automatically schedules daily posts to YouTube Shorts, TikTok, and Instagram.
            </p>

            {/* Interactive Niche Selector Tabs */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-zinc-400">
                  Select a proven niche to preview output:
                </span>
                <span className="hidden sm:inline text-zinc-400 font-mono text-[11px]">
                  {activeTopic.views} • {activeTopic.retention}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PREVIEW_TOPICS.map((topic, i) => {
                  const isActive = activeTopicIndex === i;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSelectTopic(i)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                        isActive
                          ? "bg-zinc-800/90 border-white/20 text-white shadow-md ring-1 ring-white/20"
                          : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="text-xs font-semibold truncate">{topic.label}</span>
                      <span className="text-[10px] font-mono text-zinc-400 truncate">
                        {topic.views}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Buttons: Stark, confident monochrome */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link href={user ? "/studio" : "/login"} className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto h-12 px-7 text-sm font-bold rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  Create Your First Reel Free
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto h-12 px-6 text-sm font-medium rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Play className="h-3.5 w-3.5 fill-current text-zinc-400" />
                  See Creation Architecture
                </Button>
              </a>
            </div>

            {/* Authentic Proof Points */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-2 text-xs text-zinc-400 font-medium">
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
                  <span className="h-5 w-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
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

          {/* Right Column: Real 9:16 Video Player Showcase (Photorealistic & Tactile) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] rounded-[48px] p-3 bg-gradient-to-b from-[#222226] via-[#141416] to-[#0c0c0e] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.95)] border border-white/[0.12]">
              {/* Phone Inner Screen */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between select-none">
                {/* Real Cinematic Background Image with Ken-Burns Motion */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={activeTopic.image}
                    alt={activeTopic.title}
                    className={`w-full h-full object-cover object-center transition-all duration-1000 ${
                      isPlayingAudio ? "scale-110 brightness-90" : "scale-100 brightness-85"
                    }`}
                  />
                  {/* Cinematic Vignettes for Top/Bottom Reading Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />
                </div>

                {/* iPhone Dynamic Island & Status Bar */}
                <div className="relative z-30 pt-3 px-6 flex items-center justify-between text-[11px] text-zinc-300 font-semibold font-mono">
                  <span>9:41</span>
                  <div className="w-24 h-5 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-between px-3 border border-white/[0.08]">
                    <div className="h-2 w-2 rounded-full bg-zinc-600" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 rounded-xs border border-zinc-400 p-0.5 flex items-center">
                      <div className="w-full h-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Tap-to-Play Center Overlay (Interactive) */}
                <div
                  onClick={() => toggleAudio()}
                  className="relative z-20 my-auto text-center px-4 py-8 cursor-pointer group"
                >
                  {/* Topic Pill */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold tracking-wide uppercase border border-white/20 backdrop-blur-md shadow-lg">
                      <Flame className="h-3 w-3 text-amber-400" />
                      {activeTopic.niche}
                    </span>
                  </div>

                  {/* Hormozi Style High-Retention Dynamic Captions */}
                  <div className="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight font-sans drop-shadow-[0_2px_12px_rgba(0,0,0,1)]">
                    "{activeTopic.hook.split(activeTopic.keyword)[0]}
                    <span className="inline-block mx-1 px-2.5 py-0.5 rounded-md bg-yellow-400 text-black font-black text-xl shadow-[0_4px_16px_rgba(250,204,21,0.4)] animate-bounce">
                      {activeTopic.keyword}
                    </span>
                    {activeTopic.hook.split(activeTopic.keyword)[1]}"
                  </div>

                  {/* Central Play/Pause Disc Overlay (Discreet when playing) */}
                  <div className="mt-6 flex justify-center">
                    <div
                      className={`h-14 w-14 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all ${
                        isPlayingAudio
                          ? "opacity-0 hover:opacity-100 scale-90"
                          : "opacity-90 hover:opacity-100 hover:scale-105 shadow-xl"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <Pause className="h-6 w-6 text-white" />
                      ) : (
                        <Play className="h-6 w-6 text-white ml-0.5 fill-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Authentic Shorts/TikTok Bottom & Right UI Overlay */}
                <div className="relative z-30 p-4 pt-0">
                  <div className="flex items-end justify-between gap-3">
                    {/* Creator Metadata */}
                    <div className="space-y-2 text-left max-w-[215px]">
                      {/* Creator Tag & Verified Badge */}
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-white text-zinc-950 flex items-center justify-center font-extrabold text-[10px] shadow-md border border-white/30">
                          P
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold text-white drop-shadow-md">@postmatic.ai</p>
                          <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-[9px] flex items-center justify-center text-white font-bold">
                            ✓
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                          Follow
                        </span>
                      </div>

                      {/* Hook & Tags */}
                      <p className="text-[11px] text-zinc-200 line-clamp-2 leading-relaxed drop-shadow-md">
                        {activeTopic.hook} #Shorts #ViralNiche #Faceless
                      </p>

                      {/* Interactive Voice Audition Bar */}
                      <button
                        type="button"
                        onClick={() => toggleAudio()}
                        className="flex items-center gap-2 p-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 transition-all cursor-pointer text-left w-full group shadow-md"
                      >
                        <div className="flex items-center gap-0.5 h-3.5">
                          <div className={`w-0.5 bg-yellow-400 rounded-full ${isPlayingAudio ? "wave-bar-1" : "h-1.5"}`} />
                          <div className={`w-0.5 bg-yellow-400 rounded-full ${isPlayingAudio ? "wave-bar-2" : "h-2.5"}`} />
                          <div className={`w-0.5 bg-yellow-400 rounded-full ${isPlayingAudio ? "wave-bar-3" : "h-1"}`} />
                          <div className={`w-0.5 bg-yellow-400 rounded-full ${isPlayingAudio ? "wave-bar-4" : "h-3"}`} />
                          <div className={`w-0.5 bg-yellow-400 rounded-full ${isPlayingAudio ? "wave-bar-5" : "h-1.5"}`} />
                        </div>
                        <span className="text-[10px] text-zinc-200 truncate font-mono flex-1">
                          {isPlayingAudio ? "Playing Voice Sample..." : activeTopic.voiceName}
                        </span>
                        {isPlayingAudio ? (
                          <Pause className="h-3 w-3 text-yellow-400 shrink-0" />
                        ) : (
                          <Play className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0 group-hover:scale-110 transition-transform" />
                        )}
                      </button>
                    </div>

                    {/* Right Engagement Action Rail */}
                    <div className="flex flex-col items-center gap-3 text-white pb-1">
                      {/* Heart Button */}
                      <button
                        type="button"
                        onClick={() => setHasLiked(!hasLiked)}
                        className="flex flex-col items-center gap-0.5 cursor-pointer group"
                      >
                        <div className={`h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110 ${
                          hasLiked ? "bg-red-500/20 text-red-500" : "bg-black/50 text-white border border-white/10"
                        }`}>
                          <Heart className={`h-4 w-4 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                        </div>
                        <span className="text-[9px] font-bold">
                          {hasLiked ? "Liked" : activeTopic.likes}
                        </span>
                      </button>

                      {/* Comment */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-9 w-9 rounded-full bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-bold">{activeTopic.comments}</span>
                      </div>

                      {/* Bookmark */}
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="h-9 w-9 rounded-full bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center">
                          <Bookmark className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-bold">{activeTopic.bookmarks}</span>
                      </div>

                      {/* Spinning Vinyl Record (Sound) */}
                      <div className="pt-1">
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 p-1 border border-white/20 shadow-lg ${
                          isPlayingAudio ? "animate-spin-slow" : ""
                        }`}>
                          <div className="w-full h-full rounded-full border border-dashed border-white/40 flex items-center justify-center">
                            <Disc className="h-4 w-4 text-zinc-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrubber Progress Line at the very bottom */}
                  <div className="w-full h-1 bg-white/20 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-150"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Horizontal Marquee: Live Proof of Generated Videos */}
      <section id="showcase" className="py-12 border-y border-white/[0.06] bg-zinc-950/40 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              Proven High-Retention Formats
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Reels engineered to hold viewer attention past 90%.
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Updated daily across 40+ niche channels
          </span>
        </div>

        {/* Marquee Track Container */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee gap-4 py-2">
            {[...MARQUEE_REELS, ...MARQUEE_REELS].map((reel, index) => (
              <div
                key={index}
                className="w-[200px] sm:w-[220px] aspect-[9/15] rounded-2xl overflow-hidden border border-white/[0.08] relative group shrink-0 bg-zinc-900 shadow-lg"
              >
                <img
                  src={reel.image}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-80 group-hover:brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-md border border-white/10">
                      {reel.niche}
                    </span>
                    <span className="h-5 w-5 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                      {reel.platform === "yt" && <YouTubeIcon className="h-3 w-3 fill-red-400" />}
                      {reel.platform === "tt" && <TikTokIcon className="h-3 w-3 fill-cyan-400" />}
                      {reel.platform === "ig" && <InstagramIcon className="h-3 w-3 fill-pink-400" />}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                      {reel.title}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                      <span className="text-emerald-400 font-bold">{reel.views}</span>
                      <span>{reel.retention}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tactile Creation Pipeline Bento Section */}
      <section id="how-it-works" className="py-24 px-6 sm:px-12 border-t border-white/[0.06] relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-semibold">
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
            <div className="md:col-span-6 bg-zinc-900/60 border border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">01. Viral Hook Architect</h3>
                    <p className="text-[11px] text-zinc-400">Retention-engineered narrative curves</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Pattern Interrupt
                </span>
              </div>

              {/* Simulated Script Pacing Beats */}
              <div className="space-y-2.5 pt-2 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-[#0c0c0e] border border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      [0:00 - 0:03] The Pattern Interrupt
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      "At 36,000 feet deep, the pressure can crush a submarine..."
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold shrink-0">98% Retention</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0c0c0e] border border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      [0:03 - 0:18] Curiosity Escalation
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      "Sonar microphones just picked up a frequency that shouldn't exist..."
                    </p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold shrink-0">94% Retention</span>
                </div>
              </div>
            </div>

            {/* Bento 2: Neural Voice & Inflection */}
            <div className="md:col-span-6 bg-zinc-900/60 border border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">02. Neural Voice Studio</h3>
                    <p className="text-[11px] text-zinc-400">Zero robotic monotone speech</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  HD Narration
                </span>
              </div>

              {/* Interactive Voice Player Mockup */}
              <div
                onClick={() => toggleAudio(0)}
                className="p-4 rounded-xl bg-[#0c0c0e] border border-white/[0.06] space-y-3 cursor-pointer hover:border-white/20 transition-colors group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-white text-zinc-950 flex items-center justify-center text-xs font-bold shadow-sm">
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-zinc-300 transition-colors">Brian Multilingual (Studio V2)</p>
                      <p className="text-[10px] text-zinc-400">Conversational Viral Narrator • Tap to audition</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                    <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse text-amber-400" : ""}`} />
                    <span className="text-[11px] font-mono">{isPlayingAudio ? "Auditioning" : "Audition"}</span>
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 flex items-center justify-between gap-1">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-zinc-400 rounded-full transition-all duration-150"
                      style={{
                        height: `${Math.round(Math.max(15, Math.sin(i * 0.45) * 85 + 15))}%`,
                        opacity: i % 2 === 0 ? 0.9 : 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bento 3: Multi-Track Video Timeline (Full Width) */}
            <div id="workflow" className="md:col-span-12 bg-zinc-900/60 border border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">03. Automated Multi-Track Engine</h3>
                    <p className="text-[11px] text-zinc-400">
                      FFmpeg synchronizes footage, subtitles, audio ducking, and render export
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
                  Render Execution: ~24 seconds
                </span>
              </div>

              {/* Visual Multi-Track Timeline */}
              <div className="rounded-xl bg-[#0c0c0e] border border-white/[0.06] p-4 space-y-2.5 timeline-track overflow-x-auto text-[11px]">
                <div className="min-w-[500px] space-y-2.5">
                  {/* Track 1: 4K Video Clips */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Video className="h-3 w-3 text-cyan-400" />
                      Visuals
                    </span>
                    <div className="flex-1 grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                      <div className="p-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 truncate">
                        Clip 1: Deep Trench
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 truncate">
                        Clip 2: Submarine Hull
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 truncate">
                        Clip 3: Sonar Radar
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 truncate">
                        Clip 4: Bioluminescence
                      </div>
                    </div>
                  </div>

                  {/* Track 2: Voiceover Audio */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Mic className="h-3 w-3 text-amber-400" />
                      Voiceover
                    </span>
                    <div className="flex-1 p-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-200 truncate flex items-center justify-between">
                      <span className="text-xs font-sans">Voice Track (Studio Balanced Narration)</span>
                      <span className="text-[10px] text-zinc-400 font-mono">24.6s</span>
                    </div>
                  </div>

                  {/* Track 3: Kinetic Word Subtitles */}
                  <div className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-zinc-400 text-[10px] uppercase font-semibold flex items-center gap-1.5">
                      <Film className="h-3 w-3 text-emerald-400" />
                      Subtitles
                    </span>
                    <div className="flex-1 p-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-200 truncate flex items-center justify-between">
                      <span className="text-xs font-sans">Hormozi Word-Sync (Safe-Zone Positioned)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Auto-Burned</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: High-Trust Matrix */}
      <section id="comparison" className="py-20 px-6 sm:px-12 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why creators replace traditional editing
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Compare the cost, turnaround, and operational friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Column 1: Hiring Video Editors */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-4">
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
                Hiring Editors ($1,500/mo)
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Costly $50–$200 per single video</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Endless revisions & lost days</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>Inconsistent quality & missed deadlines</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>You still write the hooks yourself</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span>You still upload manually every day</span>
                </li>
              </ul>
            </div>

            {/* Column 2: Doing it Yourself */}
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-4">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                DIY Editing (Burnout)
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Browsing Reddit 3 hours for video ideas</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Recording voiceovers with awkward retakes</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Downloading stock clips from 5 sites</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Manually timing subtitle keyframes in CapCut</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>10+ hours a week lost to mundane editing</span>
                </li>
              </ul>
            </div>

            {/* Column 3: PostMatic Autopilot */}
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-white/20 space-y-4 relative shadow-xl">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                PostMatic Studio (Autopilot)
              </span>
              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Pick a validated viral niche in 1 click</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Retention-tested scripts generated instantly</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Natural neural narration with studio cadence</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Hormozi subtitles & 4K visuals matched</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">Daily auto-publish to TikTok/YT/IG</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 px-6 sm:px-12 border-t border-white/[0.06] bg-zinc-950/40">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">Everything you need to know about PostMatic automation.</p>
          </div>

          <div className="space-y-3 text-left">
            {[
              {
                q: "Is it safe to connect my YouTube, TikTok, and Instagram accounts?",
                a: "Yes. PostMatic connects exclusively via official OAuth 2.0 APIs approved by Google, TikTok, and Meta. We never store or handle your account passwords, and tokens can be revoked with a single click at any time."
              },
              {
                q: "Do these faceless videos actually get views and monetization?",
                a: "Yes. We engineer our prompt schemas around high-retention formulas: pattern interrupts in the first 2 seconds, high-frequency visual scene cuts every 3 to 4 seconds, and dynamic keyword-highlighted captions that keep viewer thumbs from scrolling away."
              },
              {
                q: "Can I preview and review the videos before they go live?",
                a: "Absolutely. While you can run PostMatic on 100% Autopilot, you can also enable 'Require Approval' in your dashboard to review generated videos, adjust narration, or swap visuals before scheduling."
              },
              {
                q: "Do I need a high-end graphics card to render the videos?",
                a: "Not at all. The heavy video rendering and FFmpeg compilation happen entirely in the cloud on our zero-OpEx infrastructure. You can schedule and run an entire video empire from your phone."
              }
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-2 hover:bg-zinc-900/70 transition-colors">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  {faq.q}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed pl-3.5">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 px-6 sm:px-12 border-t border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-[#09090b] to-zinc-950">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.1] text-zinc-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Zero Financial Operational Cost ($0 OpEx)
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to launch your automated video channel?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Create high-retention vertical videos with zero camera gear, zero voice recording, and zero editing software.
          </p>
          <div className="pt-3">
            <Link href={user ? "/studio" : "/login"}>
              <Button
                className="h-12 px-8 text-sm font-bold rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto group"
              >
                {user ? "Open Studio Console" : "Launch Your First Series Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
