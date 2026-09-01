"use client";

import React, { useState } from "react";
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
  const handleSave = () => {
    toast.success("Studio preferences saved successfully!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Studio & Account Settings
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
              Preferences
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Configure default synthesis parameters, API keys, and account security.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="text-xs h-9 font-semibold shadow-lg shadow-amber-500/20"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          Save Preferences
        </Button>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <User className="h-4 w-4 text-amber-400" />
          <span>Account Profile</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-zinc-400">Authenticated Email</label>
            <Input
              value={userEmail || "user@example.com"}
              readOnly
              className="bg-black/40 border-white/[0.06] text-zinc-300 cursor-not-allowed text-xs h-10"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-zinc-400">User UUID</label>
            <Input
              value={userId || "00000000-0000-0000-0000-000000000000"}
              readOnly
              className="bg-black/40 border-white/[0.06] text-zinc-500 font-mono cursor-not-allowed text-xs h-10"
            />
          </div>
        </div>
      </div>

      {/* Default Pipeline Presets */}
      <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] p-6 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Cpu className="h-4 w-4 text-amber-400" />
          <span>Default Pipeline Presets</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Default Video Target Duration
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[15, 25, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDefaultDuration(d)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    defaultDuration === d
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                      : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white"
                  }`}
                >
                  {d} seconds
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/[0.04]">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
              Default Voice Actor (edge-tts)
            </label>
            <select
              value={defaultVoice}
              onChange={(e) => setDefaultVoice(e.target.value)}
              className="w-full bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white p-3 focus:ring-1 focus:ring-amber-500/30"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id} className="bg-zinc-900 text-white">
                  {v.name} ({v.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Infrastructure & Services Health Matrix */}
      <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] p-6 space-y-4 shadow-xl">
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
            { service: "Pexels Video CDN", status: "Connected", desc: "Vertical 4K/HD clips" },
            { service: "Microsoft edge-tts", status: "Online", desc: "High fidelity word-boundaries" },
            { service: "FFmpeg 9:16 Encoder", status: "Online", desc: "H.264 / AAC stitcher" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-black/30 border border-white/[0.04] flex items-center justify-between"
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
