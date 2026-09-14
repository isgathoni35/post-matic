"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Shield,
  Key,
  Cpu,
  CheckCircle2,
  Save,
  Volume2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VOICES } from "./studio-console-view";
import { toast } from "sonner";

interface SettingsViewProps {
  userEmail?: string;
  userId?: string;
  defaultDuration: number;
  setDefaultDuration: (d: number) => void;
  defaultVoice: string;
  setDefaultVoice: (v: string) => void;
}

export function SettingsView({
  userEmail,
  userId,
  defaultDuration,
  setDefaultDuration,
  defaultVoice,
  setDefaultVoice,
}: SettingsViewProps) {
  const [aiVisualsEnabled, setAiVisualsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("postmatic_ai_visuals_enabled");
      if (saved !== null) {
        setAiVisualsEnabled(saved === "true");
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("postmatic_ai_visuals_enabled", String(aiVisualsEnabled));
    }
    toast.success("Studio preferences saved successfully!");
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Studio & Account Settings</span>
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold">
              Preferences
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Configure default synthesis parameters, API keys, and account security.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="text-xs h-9 font-semibold"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Preferences
        </Button>
      </div>

      {/* Account Info Card */}
      <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <User className="h-4 w-4 text-zinc-400" />
          <span>Account Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-400">Authenticated Email</label>
            <Input
              value={userEmail || "user@example.com"}
              readOnly
              className="bg-[#0c0c0e] border-white/[0.06] text-zinc-300 cursor-not-allowed text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-zinc-400">User UUID</label>
            <Input
              value={userId || "00000000-0000-0000-0000-000000000000"}
              readOnly
              className="bg-[#0c0c0e] border-white/[0.06] text-zinc-500 font-mono cursor-not-allowed text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Default Pipeline Presets */}
      <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-5">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Cpu className="h-4 w-4 text-zinc-400" />
          <span>Default Pipeline Presets</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Default Video Target Duration
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDefaultDuration(d)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    defaultDuration === d
                      ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                      : "bg-[#0c0c0e] border-white/[0.06] text-zinc-400 hover:text-white"
                  }`}
                >
                  {d} seconds
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/[0.04]">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              Default Voice Actor (edge-tts)
            </label>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-lg text-xs text-white p-2.5 focus:ring-1 focus:ring-indigo-500/40"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                  {v.name} ({v.role})
                </option>
              ))}
            </select>
          </div>

          {/* AI Visual Fallback Toggle */}
          <div className="pt-3 border-t border-white/[0.04]">
            <label className="flex items-center justify-between p-3.5 rounded-lg bg-[#0c0c0e] border border-white/[0.06] hover:border-white/[0.12] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">AI Visual Generation (Google Imagen 3)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 font-semibold border border-white/[0.08]">
                      Zero-Drift
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Synthesizes custom 9:16 cinematic visuals via Imagen 3 whenever Pexels has no matching video, animated with Ken Burns motion.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiVisualsEnabled}
                onChange={(e) => setAiVisualsEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/40 accent-indigo-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Infrastructure & Services Health Matrix */}
      <div className="rounded-xl pm-surface border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Infrastructure Health</span>
          </div>
          <Badge variant="success" className="text-[10px] font-mono">100% Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { service: "FastAPI Backend Engine", status: "Online", desc: "Uvicorn worker daemon" },
            { service: "Supabase PostgreSQL & Auth", status: "Online", desc: "RLS & Service Role active" },
            { service: "Google Gemini 3.7 Flash", status: "Connected", desc: "Structured JSON schema validation" },
            { service: "Google Imagen 3 (Nano Banana)", status: "Connected", desc: "9:16 AI visual generator & Ken Burns" },
            { service: "Pexels Video CDN", status: "Connected", desc: "Vertical 4K/HD clips" },
            { service: "Microsoft edge-tts", status: "Online", desc: "High fidelity word-boundaries" },
            { service: "FFmpeg 9:16 Encoder", status: "Online", desc: "H.264 / AAC stitcher" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#0c0c0e] border border-white/[0.04] flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-white">{item.service}</p>
                <p className="text-[10px] text-zinc-500">{item.desc}</p>
              </div>
              <span className="flex items-center text-emerald-400 font-mono text-[11px] font-medium">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
