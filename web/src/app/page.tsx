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
  Star,
  ChevronDown,
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

const TESTIMONIALS_ROW_1 = [
  {
    name: "Marcus Vance",
    channel: "YouTube Shorts • 140k subs",
    avatar: "MV",
    color: "bg-purple-100 text-[#6c5ce7]",
    platform: "yt",
    stars: 5,
    text: "PostMatic literally runs my YouTube channel while I'm at my day job. Gained 42,000 subscribers in 6 weeks with the Dark Psychology engine.",
  },
  {
    name: "Elena Rostova",
    channel: "TikTok • 280k followers",
    avatar: "ER",
    color: "bg-emerald-100 text-emerald-700",
    platform: "tt",
    stars: 5,
    text: "The Hormozi subtitles and pattern interrupts actually keep retention above 92%. I fired my video editor and saved $1,800 every month.",
  },
  {
    name: "David K.",
    channel: "Instagram Reels • 95k followers",
    avatar: "DK",
    color: "bg-blue-100 text-blue-700",
    platform: "ig",
    stars: 5,
    text: "Set up 3 channels across TikTok and Shorts. 180+ videos published completely hands-free. Hit my first $4k month in creator fund payouts!",
  },
  {
    name: "Sarah Jenkins",
    channel: "YouTube Shorts • 88k subs",
    avatar: "SJ",
    color: "bg-amber-100 text-amber-700",
    platform: "yt",
    stars: 5,
    text: "I was skeptical about AI video, but the script cadence and scene pacing sound 100% human. Best SaaS tool I've invested in this year.",
  },
];

const TESTIMONIALS_ROW_2 = [
  {
    name: "Liam O'Connor",
    channel: "TikTok • 340k followers",
    avatar: "LO",
    color: "bg-rose-100 text-rose-700",
    platform: "tt",
    stars: 5,
    text: "Went from 0 to 850k views on TikTok in 14 days. The automated daily posting integration just works without touching a single button.",
  },
  {
    name: "Aisha Patel",
    channel: "Instagram Reels • 115k followers",
    avatar: "AP",
    color: "bg-indigo-100 text-indigo-700",
    platform: "ig",
    stars: 5,
    text: "Saved me easily 20 hours every single week. The automated hook formulas get comments and shares like crazy. Engagement is 4x my old reels.",
  },
  {
    name: "Julian Rivera",
    channel: "YouTube Shorts • 210k subs",
    avatar: "JR",
    color: "bg-teal-100 text-teal-700",
    platform: "yt",
    stars: 5,
    text: "The voiceover inflection blew me away. No robotic monotone cadence. My audience genuinely believes I have an entire studio production team.",
  },
  {
    name: "Chloe Martin",
    channel: "TikTok • 175k followers",
    avatar: "CM",
    color: "bg-violet-100 text-[#6c5ce7]",
    platform: "tt",
    stars: 5,
    text: "Autopilot mode is insane. I wake up in the morning, check my notifications, and see new videos already live and ranking on the For You page.",
  },
];

export default function LandingPage() {
  const { user, isLoading, signInWithOAuth } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = (index?: number) => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAudio(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const voiceFile = "en-US-BrianMultilingualNeural";
      const audio = new Audio(`/audio/samples/${voiceFile}.mp3`);
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.play().catch(() => setIsPlayingAudio(false));
      audio.onended = () => setIsPlayingAudio(false);
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
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-[#6c5ce7]/20 selection:text-[#6c5ce7] overflow-x-hidden relative w-full">
      {/* Subtle Grid Pattern Background with Radial Mask */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft purple radial haze behind hero */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-[#6c5ce7]/[0.08] rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto w-full h-full flex items-center justify-between">
          <BrandLogo size="sm" showBadge={false} />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#showcase" className="hover:text-slate-900 transition-colors">Showcase</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-24 rounded-xl bg-slate-100 animate-pulse" />
            ) : user ? (
              <Link href="/studio">
                <Button
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#6c5ce7] text-white hover:bg-[#5b4bc4] shadow-sm shadow-[#6c5ce7]/25 transition-all"
                >
                  Enter Studio
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signInWithOAuth("google")}
                  className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </Button>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#6c5ce7] text-white hover:bg-[#5b4bc4] shadow-sm shadow-[#6c5ce7]/25 transition-all"
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — Centered Single-Column Layout */}
      <section id="hero" className="relative pt-16 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-8 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        {/* Avatar Social Proof Pill */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 shadow-2xs mb-8 transition-transform hover:scale-[1.02]">
          <div className="flex items-center -space-x-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
              JD
            </div>
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
              EM
            </div>
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
              SA
            </div>
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
              KR
            </div>
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-rose-500 to-red-500 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
              99+
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="text-amber-400 font-bold text-sm tracking-tighter">★★★★★</span>
            <span>
              Trusted by <strong className="text-slate-900 font-bold">10,000+ creators</strong>
            </span>
          </div>
        </div>

        {/* Centered Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] max-w-4xl mx-auto mb-6">
          Create viral faceless videos on{" "}
          <span className="text-[#6c5ce7]">auto-pilot</span>
        </h1>

        {/* Muted Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          The autonomous AI engine that writes scripts, generates visuals, records voiceovers, adds dynamic captions, and schedules daily posts while you sleep.
        </p>

        {/* "Perfect for" Platform Icons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-9 text-xs text-slate-500 font-medium">
          <span className="mr-1">Perfect for</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
            <YouTubeIcon className="h-3.5 w-3.5 fill-[#FF0000]" />
            <span>YouTube Shorts</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
            <TikTokIcon className="h-3.5 w-3.5 fill-[#000000]" />
            <span>TikTok</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
            <InstagramIcon className="h-3.5 w-3.5 fill-[#E4405F]" />
            <span>Instagram Reels</span>
          </div>
        </div>

        {/* Primary Purple CTA */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto mb-10">
          <Link href={user ? "/studio" : "/login"} className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-8 text-base font-bold rounded-2xl bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-lg shadow-[#6c5ce7]/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Zap className="h-5 w-5 fill-white" />
              <span>Create your first video</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span>Get your generated video in less than 5 minutes</span>
            <span className="text-slate-300">•</span>
            <span>No credit card required</span>
          </p>
        </div>

        {/* Feature Checkmarks Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2.5 text-xs font-medium text-slate-500 pt-6 border-t border-slate-200/60 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Zero video editing required</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Autonomous daily auto-post</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>1080x1920 60FPS HD renders</span>
          </div>
        </div>
      </section>

      {/* Video Showcase Marquee: FacelessReels Style */}
      <section id="showcase" className="py-10 sm:py-16 bg-white relative overflow-hidden">
        {/* Doodle Arrow Annotation */}
        <div className="flex items-center justify-center gap-2.5 mb-8 select-none">
          <span className="text-sm font-semibold tracking-tight text-slate-500 italic">
            Creates videos for any niche
          </span>
          <svg
            className="w-7 h-7 text-[#6c5ce7] -rotate-12 translate-y-1"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 8C14 7 22 13 23 23"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 21L23.5 24L26 17.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Marquee Track Container with White Edge Gradient Masks */}
        <div className="relative w-full overflow-hidden">
          {/* Edge Fade Masks for clean light backdrop */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          <div className="animate-marquee gap-4 py-2">
            {[...MARQUEE_REELS, ...MARQUEE_REELS].map((reel, index) => (
              <div
                key={index}
                className="w-[180px] sm:w-[210px] aspect-[9/16] rounded-2xl overflow-hidden border border-slate-200/80 relative group shrink-0 bg-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 select-none cursor-pointer"
              >
                <img
                  src={reel.image}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Platform Badge Top-Right */}
                <div className="absolute top-3 right-3 z-20">
                  <span className="h-6 w-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-xs">
                    {reel.platform === "yt" && <YouTubeIcon className="h-3.5 w-3.5 fill-white" />}
                    {reel.platform === "tt" && <TikTokIcon className="h-3.5 w-3.5 fill-white" />}
                    {reel.platform === "ig" && <InstagramIcon className="h-3.5 w-3.5 fill-white" />}
                  </span>
                </div>

                {/* Clean Bottom Overlay with Niche Label & Play Hover Indicator */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3.5 flex flex-col justify-end z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-white/80">
                        Niche
                      </span>
                      <p className="text-sm font-bold text-white leading-tight drop-shadow-xs">
                        {reel.niche}
                      </p>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#6c5ce7] transition-all shadow-xs">
                      <Play className="h-3.5 w-3.5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof: We Actually Get Views & Stat Counters */}
      <section id="proof" className="py-24 px-6 sm:px-12 bg-gradient-to-b from-white via-slate-50/60 to-white border-t border-slate-200/80 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#6c5ce7]/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-16 relative z-10">
          {/* Centered Heading */}
          <div className="text-center space-y-3.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Proven Social Traction
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              We actually get <span className="text-[#6c5ce7]">views.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              PostMatic isn&apos;t just an automated video generator. Our scripts, hooks, and kinetic captions are engineered around algorithmic retention mechanics that regularly hit 6-figure and 7-figure view counts.
            </p>
          </div>

          {/* 3 Realist Analytics Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TikTok Analytics Card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-100/80 space-y-5 hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-xs">
                    <TikTokIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">@daily.stoic.mind</p>
                    <p className="text-[11px] text-slate-400">Dark Psychology Niche</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <TrendingUp className="h-3 w-3" /> +380%
                </span>
              </div>

              {/* View Count Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Reel Views</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">1,420,890</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Avg Retention</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">98.4%</div>
                </div>
              </div>

              {/* SVG Retention Graph */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Audience Retention Curve</span>
                  <span className="text-purple-600 font-mono text-[10px]">Hook Held: 99.1%</span>
                </div>
                <div className="h-20 w-full rounded-lg bg-slate-50/80 border border-slate-100 p-2 flex flex-col justify-end relative overflow-hidden">
                  <svg className="w-full h-14 overflow-visible" viewBox="0 0 300 60" fill="none">
                    <defs>
                      <linearGradient id="purpleGradientTT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 8 C 40 8, 70 14, 110 16 C 160 18, 220 22, 300 25 L 300 60 L 0 60 Z"
                      fill="url(#purpleGradientTT)"
                    />
                    <path
                      d="M0 8 C 40 8, 70 14, 110 16 C 160 18, 220 22, 300 25"
                      stroke="#6c5ce7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Hook Callout Marker */}
                    <circle cx="40" cy="8.5" r="3.5" fill="#6c5ce7" className="animate-pulse" />
                  </svg>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                    <span>0:00 (Hook)</span>
                    <span>0:18 (Climax)</span>
                    <span>0:34 (End)</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics Row */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Likes</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">142.8K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Comments</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">3.4K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Saves</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">28.6K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Shares</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">19.1K</p>
                </div>
              </div>
            </div>

            {/* YouTube Shorts Analytics Card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-100/80 space-y-5 hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xs">
                    <YouTubeIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">@cosmic_horizons</p>
                    <p className="text-[11px] text-slate-400">Deep Space & Sci-Fi</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <TrendingUp className="h-3 w-3" /> +520%
                </span>
              </div>

              {/* View Count Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Short Views</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">2,840,310</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Loop Rate</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">104.2%</div>
                </div>
              </div>

              {/* SVG Retention Graph */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Relative Viewer Retention</span>
                  <span className="text-purple-600 font-mono text-[10px]">Over 100% Loop</span>
                </div>
                <div className="h-20 w-full rounded-lg bg-slate-50/80 border border-slate-100 p-2 flex flex-col justify-end relative overflow-hidden">
                  <svg className="w-full h-14 overflow-visible" viewBox="0 0 300 60" fill="none">
                    <defs>
                      <linearGradient id="purpleGradientYT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 6 C 50 4, 100 10, 150 12 C 200 14, 250 16, 300 18 L 300 60 L 0 60 Z"
                      fill="url(#purpleGradientYT)"
                    />
                    <path
                      d="M0 6 C 50 4, 100 10, 150 12 C 200 14, 250 16, 300 18"
                      stroke="#6c5ce7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="4" r="3.5" fill="#6c5ce7" className="animate-pulse" />
                  </svg>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                    <span>0:00 (Hook)</span>
                    <span>0:24 (Story)</span>
                    <span>0:48 (Loop)</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics Row */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Likes</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">218.4K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Comments</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">4.8K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Shares</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">39.5K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Subs +</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">+14.2K</p>
                </div>
              </div>
            </div>

            {/* Instagram Reels Analytics Card */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-lg shadow-slate-100/80 space-y-5 hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                    <InstagramIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">@history_mysteries</p>
                    <p className="text-[11px] text-slate-400">History & Conspiracies</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <TrendingUp className="h-3 w-3" /> +295%
                </span>
              </div>

              {/* View Count Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Total Reel Plays</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">915,400</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Avg Watch Time</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">38.2s</div>
                </div>
              </div>

              {/* SVG Retention Graph */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Plays & Watch Duration</span>
                  <span className="text-purple-600 font-mono text-[10px]">91% Completion</span>
                </div>
                <div className="h-20 w-full rounded-lg bg-slate-50/80 border border-slate-100 p-2 flex flex-col justify-end relative overflow-hidden">
                  <svg className="w-full h-14 overflow-visible" viewBox="0 0 300 60" fill="none">
                    <defs>
                      <linearGradient id="purpleGradientIG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 10 C 60 10, 110 15, 170 18 C 220 20, 260 22, 300 28 L 300 60 L 0 60 Z"
                      fill="url(#purpleGradientIG)"
                    />
                    <path
                      d="M0 10 C 60 10, 110 15, 170 18 C 220 20, 260 22, 300 28"
                      stroke="#6c5ce7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="60" cy="10" r="3.5" fill="#6c5ce7" className="animate-pulse" />
                  </svg>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                    <span>0:00 (Hook)</span>
                    <span>0:21 (Plot)</span>
                    <span>0:42 (End)</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics Row */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Likes</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">87.2K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Comments</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">1.9K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Saves</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">34.1K</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Shares</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">12.8K</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat Counters: 2 Large Purple Numbers */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-100/80 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] to-indigo-500/[0.03] pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
              <div className="text-4xl sm:text-6xl font-black text-[#6c5ce7] tracking-tight">
                4,800+
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                Channels Automated
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                Creators &amp; media brands publishing faceless video channels hands-free.
              </p>
            </div>

            <div className="space-y-2 relative z-10 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-6 sm:pt-0 sm:pl-8">
              <div className="text-4xl sm:text-6xl font-black text-[#6c5ce7] tracking-tight">
                185,000+
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                Videos Autoposted
              </p>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
                High-retention vertical reels rendered in 1080x1920 60FPS and published.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works: 3 Alternating Steps Layout */}
      <section id="how-it-works" className="py-24 px-6 sm:px-12 bg-white border-t border-slate-200/80 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-[#6c5ce7]/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-24 relative z-10">
          {/* Centered Heading */}
          <div className="text-center space-y-3.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
              <Sliders className="h-3.5 w-3.5" />
              Simple 3-Step Workflow
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              How <span className="text-[#6c5ce7]">PostMatic</span> works
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              From raw idea to published viral short in less than 3 minutes. Zero cameras, zero editing timelines, and zero guesswork.
            </p>
          </div>

          {/* Step 1: Text Left, Mockup Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#6c5ce7] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-200/80">
                Step 01 • Niche Selection
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Choose a validated viral niche
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Select from 8 pre-calibrated viral content engines. PostMatic automatically applies algorithmic hook structures and cinematic SDXL visual prompts tailored to what is actively trending on TikTok and YouTube Shorts.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>8 pre-calibrated viral engines (Dark Psychology, Mysteries, Sci-Fi &amp; more)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Strict negative-prompt filters prevent distorted AI visuals</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Custom prompt override for any unique channel idea or brand</span>
                </li>
              </ul>
            </div>

            {/* Right Mockup: Niche Engine Selector */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 sm:p-6 shadow-lg shadow-slate-100/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Step 1 of 3: Select Engine</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-white border-2 border-[#6c5ce7] shadow-sm space-y-1.5 relative">
                    <div className="h-2 w-2 rounded-full bg-[#6c5ce7] absolute top-2.5 right-2.5" />
                    <span className="text-[10px] font-mono font-bold text-[#6c5ce7] uppercase">Active Engine</span>
                    <p className="text-xs font-bold text-slate-900">Dark Psychology</p>
                    <p className="text-[10px] text-slate-500">Curiosity &amp; Mindset</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 opacity-80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Available</span>
                    <p className="text-xs font-bold text-slate-800">Deep Sea Secrets</p>
                    <p className="text-[10px] text-slate-400">Ocean &amp; Mysteries</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 opacity-80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Available</span>
                    <p className="text-xs font-bold text-slate-800">Ancient Rome</p>
                    <p className="text-[10px] text-slate-400">Historical Facts</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5 opacity-80">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Available</span>
                    <p className="text-xs font-bold text-slate-800">Cosmic Horrors</p>
                    <p className="text-[10px] text-slate-400">Deep Space Lore</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-mono flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Schema: 3s Pattern Interrupt + Loop Hook</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">Calibrated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Mockup Left, Text Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Mockup: Script & Voice Audio Studio */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 sm:p-6 shadow-lg shadow-slate-100/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Step 2 of 3: Audio &amp; Caption Studio</span>
                </div>

                {/* Script Pacing Snippet */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-600 uppercase">[0:00 - 0:03] Pattern Interrupt Hook</span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">98% Retention</span>
                  </div>
                  <p className="text-xs text-slate-700 italic">
                    &ldquo;At 36,000 feet deep, the ocean pressure can crush a titanium submarine like a soda can...&rdquo;
                  </p>
                </div>

                {/* Interactive Audio Player */}
                <div
                  onClick={() => toggleAudio(0)}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-purple-300 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#6c5ce7] text-white flex items-center justify-center text-xs font-bold shadow-xs group-hover:scale-105 transition-transform">
                        {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-[#6c5ce7] transition-colors">Brian Multilingual (Studio V2)</p>
                        <p className="text-[10px] text-slate-500">Conversational Viral Narrator • Tap to audition</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                      <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "animate-pulse text-purple-600" : "text-slate-400"}`} />
                      <span className="text-[11px] font-mono">{isPlayingAudio ? "Playing" : "Audition"}</span>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="h-8 rounded-lg bg-slate-50 border border-slate-100 px-3 flex items-center justify-between gap-1 mt-3">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-[#6c5ce7] rounded-full transition-all duration-150"
                        style={{
                          height: `${Math.round(Math.max(15, Math.sin(i * 0.45) * 85 + 15))}%`,
                          opacity: i % 2 === 0 ? 0.9 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Subtitles: Hormozi Dynamic Word Highlight</span>
                  <span className="font-mono text-emerald-600 font-bold">Safe-Zone Positioned</span>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/80">
                Step 02 • Neural Studio
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI synthesizes script, voice, &amp; subtitles
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our pipeline writes high-retention scripts, generates natural conversational cadence voiceovers without robotic inflections, and syncs kinetic word-level highlighted captions automatically.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>First 3-second pattern-interrupt formula to halt scrolling thumbs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ultra-realistic studio neural narration in 12+ conversational styles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Dynamic Hormozi captions burned in with zero rendering lag</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3: Text Left, Mockup Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                Step 03 • Autopilot Posting
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Auto-publish daily while you sleep
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connect your YouTube Shorts, TikTok, and Instagram Reels channels once via official OAuth 2.0. PostMatic handles render execution on cloud runners and publishes at optimal peak engagement times automatically.
              </p>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>1-Click OAuth connection to YouTube, TikTok, and Instagram</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Hourly worker dispatcher triggers rendering &amp; uploading hands-free</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Optional &apos;Require Approval&apos; mode to review videos before publishing</span>
                </li>
              </ul>
            </div>

            {/* Right Mockup: Autopilot Dispatcher */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 sm:p-6 shadow-lg shadow-slate-100/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-medium">Step 3 of 3: Autopilot Deployment</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Series Autopilot Status</span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      AUTOPILOT: ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                      <YouTubeIcon className="h-4 w-4 fill-red-600" />
                      <span className="text-[10px] font-semibold text-slate-700">Connected</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                      <TikTokIcon className="h-4 w-4 fill-slate-900" />
                      <span className="text-[10px] font-semibold text-slate-700">Connected</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                      <InstagramIcon className="h-4 w-4 fill-rose-600" />
                      <span className="text-[10px] font-semibold text-slate-700">Connected</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Next Scheduled Release</span>
                    <span className="text-[11px] font-mono text-[#6c5ce7] font-bold">18:00 UTC (Today)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#6c5ce7] to-emerald-500 rounded-full w-full" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>1080x1920 60FPS Video Ready</span>
                    <span className="text-emerald-600 font-bold">1-Click Auto Dispatch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: High-Trust Matrix */}
      <section id="comparison" className="py-24 px-6 sm:px-12 bg-white border-t border-slate-200/80 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-slate-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto space-y-12 text-center relative z-10">
          <div className="space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
              <Layers className="h-3.5 w-3.5" />
              Why Creators Choose Us
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Stop wasting hours on <span className="text-[#6c5ce7]">tedious editing</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Compare the recurring monthly cost, turnaround latency, and creative burnout of traditional production methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch pt-4">
            {/* Column 1: Hiring Video Editors */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-100/80 space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                    Freelance Editors
                  </span>
                  <span className="text-xs font-bold text-slate-400 line-through">
                    $1,500+/mo
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hiring Freelancers</h3>
                  <p className="text-xs text-slate-500 mt-1">High overhead and unpredictable turnaround delays.</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Costly $50–$200 per single 60s video</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Endless revision loops and missed deadlines</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Inconsistent quality and tone shifts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>You still research hooks and write topics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>You still manually upload across 3 platforms</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-rose-600">
                <X className="h-4 w-4" />
                <span>High financial &amp; coordination cost</span>
              </div>
            </div>

            {/* Column 2: Doing it Yourself */}
            <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-lg shadow-slate-100/80 space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    DIY Editing
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    15+ hrs/week
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Doing It Yourself</h3>
                  <p className="text-xs text-slate-500 mt-1">Trading nights and weekends for slow channel growth.</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Browsing Reddit &amp; TikTok 3 hours for ideas</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Recording voiceovers with awkward retakes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Downloading B-roll clips from 5 different sites</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Manually timing subtitle keyframes in CapCut</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Creator burnout leading to abandoned channels</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <X className="h-4 w-4" />
                <span>Exhausting and unscalable</span>
              </div>
            </div>

            {/* Column 3: PostMatic Autopilot (Highlighted Border) */}
            <div className="p-7 rounded-2xl bg-white border-2 border-[#6c5ce7] shadow-xl shadow-purple-500/10 space-y-6 flex flex-col justify-between relative">
              {/* Highlight badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#6c5ce7] text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                100% Autonomous
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono font-bold text-[#6c5ce7] uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/80">
                    PostMatic Studio
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    $0 OpEx Free
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">PostMatic Autopilot</h3>
                  <p className="text-xs text-slate-500 mt-1">Viral faceless channels running hands-free 24/7.</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-800">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 font-bold" />
                    <span className="font-semibold text-slate-900">Pick a validated viral niche in 1 click</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Retention-tested hooks &amp; scripts generated in seconds</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Studio neural voiceovers with natural conversational cadence</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Hormozi kinetic captions &amp; 1080x1920 60FPS video rendering</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 font-bold" />
                    <span className="font-semibold text-slate-900">Daily autonomous publish to TikTok, YouTube &amp; IG</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-purple-100">
                <Link href="/studio">
                  <Button className="w-full h-10 text-xs font-bold rounded-xl bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 group">
                    <span>Create Your Series Now</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee Section */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-t border-slate-200/80 relative overflow-hidden">
        {/* Ambient glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 sm:px-12 text-center space-y-4 mb-14 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Creator Reviews
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Loved by thousands of <span className="text-[#6c5ce7]">faceless creators</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            See how solo creators, digital publishers, and media agencies use PostMatic to scale audience reach without touching video editors.
          </p>
        </div>

        {/* Marquee Track Container with White Edge Gradient Masks */}
        <div className="relative w-full overflow-hidden space-y-4">
          {/* Edge Fade Masks for clean light backdrop */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Row 1: Scrolling Left */}
          <div className="animate-marquee gap-5 py-1">
            {[...TESTIMONIALS_ROW_1, ...TESTIMONIALS_ROW_1].map((t, index) => (
              <div
                key={index}
                className="w-[320px] sm:w-[360px] p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-200 transition-all shrink-0 space-y-3.5 select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${t.color}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{t.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{t.channel}</p>
                    </div>
                  </div>
                  <span className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shadow-xs">
                    {t.platform === "yt" && <YouTubeIcon className="h-3.5 w-3.5 fill-red-600" />}
                    {t.platform === "tt" && <TikTokIcon className="h-3.5 w-3.5 fill-slate-900" />}
                    {t.platform === "ig" && <InstagramIcon className="h-3.5 w-3.5 fill-rose-600" />}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Row 2: Scrolling Right (Reverse) */}
          <div className="animate-marquee-reverse gap-5 py-1">
            {[...TESTIMONIALS_ROW_2, ...TESTIMONIALS_ROW_2].map((t, index) => (
              <div
                key={index}
                className="w-[320px] sm:w-[360px] p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-200 transition-all shrink-0 space-y-3.5 select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${t.color}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{t.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{t.channel}</p>
                    </div>
                  </div>
                  <span className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shadow-xs">
                    {t.platform === "yt" && <YouTubeIcon className="h-3.5 w-3.5 fill-red-600" />}
                    {t.platform === "tt" && <TikTokIcon className="h-3.5 w-3.5 fill-slate-900" />}
                    {t.platform === "ig" && <InstagramIcon className="h-3.5 w-3.5 fill-rose-600" />}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 px-6 sm:px-12 border-t border-slate-200/80 bg-slate-50/50">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to know
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
              Answers to common questions about PostMatic, account safety, and autonomous video publishing.
            </p>
          </div>

          <div className="space-y-3.5 text-left">
            {[
              {
                q: "Is it safe to connect my YouTube, TikTok, and Instagram accounts?",
                a: "Yes, 100%. PostMatic connects exclusively via official, verified OAuth 2.0 API integrations approved by Google, ByteDance (TikTok), and Meta. We never store or handle your account passwords, and you can revoke permissions with a single click at any time.",
              },
              {
                q: "Do these faceless videos actually get views and monetization?",
                a: "Yes. Every video is synthesized around tested viral retention mechanics: a pattern interrupt in the first 2 seconds, rapid scene transitions every 3 to 4 seconds, and dynamic kinetic captions positioned specifically to avoid platform UI overlays. Our users routinely surpass monetization thresholds within weeks.",
              },
              {
                q: "Can I preview and edit the videos before they get published?",
                a: "Absolutely. While PostMatic offers 100% Autopilot hands-free publishing, you can toggle 'Require Manual Approval' on any series to review generated scripts, audition narration, or swap visual scenes before the video goes live.",
              },
              {
                q: "Do I need a high-end graphics card or expensive software?",
                a: "Not at all. Video composition and heavy FFmpeg 1080x1920 60FPS compilation happen entirely in the cloud on our free-tier zero-OpEx infrastructure. You can manage your entire multi-channel empire directly from your smartphone or laptop.",
              },
              {
                q: "What niches perform best for faceless automation?",
                a: "Our 8 pre-calibrated engines focus on historically high-CPM and high-retention niches: Dark Psychology, Deep Sea Mysteries, Ancient History, Cosmic Horrors, Sci-Fi Lore, and Stoic Mindset. You can also craft custom prompt schemas for your own branded niche.",
              },
              {
                q: "How does the zero-OpEx architecture work?",
                a: "We leverage generous free tiers across modern serverless compute: Next.js on Vercel, Supabase database storage, Edge-TTS neural voice synthesis, and GitHub Actions cloud runners for FFmpeg rendering. You pay $0 in operational cloud fees.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-purple-200 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer select-none"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 transition-colors ${
                        openFaq === i ? "bg-[#6c5ce7]" : "bg-slate-300"
                      }`}
                    />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180 text-[#6c5ce7]" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 sm:px-6 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed pl-10 border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 px-6 sm:px-12 border-t border-slate-200/80 relative overflow-hidden bg-gradient-to-b from-white via-purple-50/40 to-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#6c5ce7]/[0.05] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[#6c5ce7] text-xs font-semibold shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Zero Financial Operational Cost ($0 OpEx)
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ready to launch your <span className="text-[#6c5ce7]">automated video channel?</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
            Create high-retention vertical videos with zero camera gear, zero voice recording, and zero editing software.
          </p>
          <div className="pt-3">
            <Link href={user ? "/studio" : "/login"}>
              <Button
                className="h-12 px-8 text-sm font-bold rounded-xl bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 mx-auto group"
              >
                {user ? "Open Studio Console" : "Launch Your First Series Free"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> Instant Cloud Setup</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> No Credit Card Required</span>
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500" /> $0 Operational Cost</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6 sm:px-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <BrandLogo size="sm" badgeText="Studio" />
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-slate-400 text-xs">
              © {new Date().getFullYear()} PostMatic. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-slate-600 font-medium">
            <a href="#how-it-works" className="hover:text-[#6c5ce7] transition-colors">How It Works</a>
            <a href="#showcase" className="hover:text-[#6c5ce7] transition-colors">Showcase</a>
            <a href="#faq" className="hover:text-[#6c5ce7] transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-[#6c5ce7] transition-colors">Sign In</Link>
            <Link href="/studio" className="hover:text-[#6c5ce7] transition-colors">Studio</Link>
            <a
              href="https://github.com/isgathoni35/post-matic"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#6c5ce7] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
