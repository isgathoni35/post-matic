"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Film,
  Sparkles,
  ArrowRight,
  Play,
  Share2,
  Mic,
  Video,
  CheckCircle2,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Music2,
  TrendingUp,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const SAMPLE_NICHES = [
  {
    icon: "🌊",
    title: "Deep Sea Mysteries",
    prompt: "3 terrifying facts about the deep sea midnight zone that science still cannot explain...",
    views: "1.4M views",
    tag: "High Retention",
  },
  {
    icon: "🧠",
    title: "Dark Psychology",
    prompt: "4 subtle psychological tricks that elite negotiators use to instantly win any room...",
    views: "2.8M views",
    tag: "Viral Potential",
  },
  {
    icon: "🏛️",
    title: "Ancient History",
    prompt: "The bizarre truth behind why ancient Roman concrete self-heals over thousands of years...",
    views: "980K views",
    tag: "Evergreen",
  },
  {
    icon: "🌌",
    title: "Cosmic Anomalies",
    prompt: "What happens if two supermassive black holes collide at 99% the speed of light...",
    views: "3.2M views",
    tag: "Trending",
  },
];

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const [activeNicheIndex, setActiveNicheIndex] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-amber-500/[0.07] via-indigo-500/[0.03] to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full h-18 studio-glass border-b border-white/[0.08] px-6 sm:px-12 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30 group-hover:scale-105 transition-transform">
            <Film className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">POST-MATIC</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 uppercase">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Automated Faceless Video SaaS</p>
          </div>
        </Link>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#niches" className="hover:text-white transition-colors">Trending Niches</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#publishing" className="hover:text-white transition-colors">YouTube Auto-Publish</a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-24 rounded-xl bg-white/[0.05] animate-pulse" />
          ) : user ? (
            <Link href="/studio">
              <Button
                variant="primary"
                size="sm"
                className="h-10 px-5 text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20"
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
                  className="h-9 text-xs font-medium text-zinc-300 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-9 px-4 text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Start Free
                  <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-6 sm:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {user ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-medium text-amber-300 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Welcome back, {user.email?.split("@")[0]}</span>
                <span className="text-zinc-500">•</span>
                <Link href="/studio" className="underline hover:text-white font-semibold">
                  Resume studio session →
                </Link>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-zinc-300 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Autonomous Short-Form Video Platform</span>
                <span className="text-amber-400 font-semibold">• 100% Free Compute</span>
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Turn any idea into <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                viral faceless videos
              </span>{" "}
              on autopilot.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Create high-retention 9:16 Shorts with realistic human narration, matched 4K B-roll, and kinetic animated subtitles — ready to publish to YouTube Shorts with one click.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href={user ? "/studio" : "/login"} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto h-13 px-8 text-sm font-semibold rounded-2xl shadow-xl shadow-amber-500/25 group"
                >
                  {user ? "Open Your Studio" : "Start Creating For Free"}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto h-13 px-6 text-sm font-medium rounded-2xl border-white/[0.08] hover:bg-white/[0.05]"
                >
                  <Play className="h-4 w-4 mr-2 text-amber-400 fill-amber-400" />
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Human Social Proof Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Editing Skills Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>1080x1920 60FPS HD</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Direct YouTube Shorts Upload</span>
              </div>
            </div>
          </div>

          {/* Hero Right Smartphone Mockup Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[320px] aspect-[9/18] rounded-[48px] p-3.5 bg-gradient-to-b from-[#2a3040] via-[#151924] to-[#0c0f16] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] border border-white/[0.16]">
              {/* Inner Screen Container */}
              <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-black flex flex-col justify-between p-4 select-none">
                {/* Simulated Video Visual Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-slate-900 to-black opacity-90">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.15),transparent_60%)] animate-pulse" />
                </div>

                {/* iPhone Dynamic Island */}
                <div className="relative z-20 mx-auto w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 border border-white/[0.08]">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>

                {/* Center Animated ASS Subtitle Preview */}
                <div className="relative z-10 my-auto text-center px-4 space-y-3">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-red-600/80 text-white text-[10px] font-bold tracking-wider uppercase">
                    Did You Know?
                  </span>
                  <div className="text-xl font-black text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase tracking-tight">
                    "At 36,000 feet deep, the pressure can crush a submarine like a soda can..."
                  </div>
                  <div className="inline-block px-3 py-1 rounded-md bg-amber-400 text-black font-extrabold text-sm uppercase tracking-wide shadow-lg">
                    PRESSURE
                  </div>
                </div>

                {/* Shorts Interface Overlay (Right Actions + Bottom Details) */}
                <div className="relative z-10 flex items-end justify-between gap-4">
                  {/* Bottom Creator Info */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-xs">
                        P
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">@postmatic.studio</p>
                        <p className="text-[10px] text-zinc-300">Deep Sea Mysteries</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-200 line-clamp-2 leading-relaxed">
                      What scientists just discovered in the Mariana Trench changes everything! 🌊 #Shorts #Mystery #Ocean
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-medium">
                      <Music2 className="h-3 w-3 animate-spin-slow text-amber-400" />
                      <span>Original Audio - Cinematic Narration</span>
                    </div>
                  </div>

                  {/* Right Floating Actions */}
                  <div className="flex flex-col items-center gap-3 shrink-0 text-white">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-full bg-white/[0.12] backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                      </div>
                      <span className="text-[10px] font-bold">248K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-full bg-white/[0.12] backdrop-blur-md flex items-center justify-center">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold">3.2K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-full bg-white/[0.12] backdrop-blur-md flex items-center justify-center">
                        <Bookmark className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold">42K</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-full bg-white/[0.12] backdrop-blur-md flex items-center justify-center">
                        <Share2 className="h-5 w-5 text-amber-400" />
                      </div>
                      <span className="text-[10px] font-bold">Share</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Human Workflow */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 border-t border-white/[0.06] bg-[#0c0f16]/60">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              The 30-Second Workflow
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From raw concept to published Short in 3 steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="studio-card p-6 sm:p-8 rounded-2xl space-y-4 relative group hover:border-amber-500/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-zinc-500 uppercase font-semibold">Step 01</span>
                <h3 className="text-lg font-bold text-white">Input Topic or Pick a Niche</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Type a prompt like "3 psychological tricks" or pick a pre-made viral topic from our curated categories.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="studio-card p-6 sm:p-8 rounded-2xl space-y-4 relative group hover:border-amber-500/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mic className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-zinc-500 uppercase font-semibold">Step 02</span>
                <h3 className="text-lg font-bold text-white">AI Narration & Visual Assembly</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The engine crafts a viral hook, synthesizes speech with human inflection, matches 4K clips, and burns subtitles.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="studio-card p-6 sm:p-8 rounded-2xl space-y-4 relative group hover:border-amber-500/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Share2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-zinc-500 uppercase font-semibold">Step 03</span>
                <h3 className="text-lg font-bold text-white">Review & 1-Click Publish</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Preview in your smartphone canvas, download the MP4, or automatically publish directly to your YouTube channel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Niches Explorer */}
      <section id="niches" className="py-20 px-6 sm:px-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Tested High-Engagement Topics
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Trending Niches for Faceless Creators
              </h2>
            </div>
            <Link href={user ? "/studio" : "/login"}>
              <Button variant="secondary" size="sm" className="text-xs h-9">
                Try Any Niche in Studio
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAMPLE_NICHES.map((niche, i) => (
              <div
                key={niche.title}
                className={`studio-card-interactive p-5 rounded-2xl space-y-3 cursor-pointer ${
                  activeNicheIndex === i ? "border-amber-500/40 bg-[#161c28]" : ""
                }`}
                onClick={() => setActiveNicheIndex(i)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{niche.icon}</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {niche.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{niche.title}</h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  "{niche.prompt}"
                </p>
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {niche.views}
                  </span>
                  <span>Average</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-6 sm:px-12 border-t border-white/[0.06] relative overflow-hidden bg-gradient-to-b from-[#090b10] to-[#121622]">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to grow your faceless channel on autopilot?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Join thousands of creators producing viral Shorts with zero camera gear, zero voice acting, and zero editing software.
          </p>
          <div className="pt-2">
            <Link href={user ? "/studio" : "/login"}>
              <Button
                variant="primary"
                className="h-13 px-8 text-sm font-semibold rounded-2xl shadow-xl shadow-amber-500/25 group"
              >
                {user ? "Go to Your Studio Console" : "Launch Your Studio Now — It's Free"}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6 sm:px-12 text-xs text-zinc-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-zinc-300">POST-MATIC</span>
            <span>— The Automated Faceless Video SaaS</span>
          </div>
          <div className="flex items-center gap-6">
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
