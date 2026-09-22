"use client";

import React, { useState } from "react";
import {
  Terminal,
  RefreshCw,
  Trash2,
  Download,
  CheckCircle2,
  Cpu,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EngineLogsViewProps {
  activeJobId?: string;
}

export function EngineLogsView({ activeJobId }: EngineLogsViewProps) {
  const [logs] = useState([
    {
      time: "18:25:01.120",
      level: "INFO",
      module: "engine.pipeline",
      message: "FastAPI video pipeline initialized with zero-OpEx compute matrix.",
    },
    {
      time: "18:25:01.450",
      level: "SUCCESS",
      module: "engine.script_generator",
      message: "Gemini 3.7 Flash connected. JSON schema validation active.",
    },
    {
      time: "18:25:02.100",
      level: "INFO",
      module: "engine.tts_engine",
      message: "edge-tts socket pool established with sub-second word-boundary extraction.",
    },
    {
      time: "18:25:02.320",
      level: "INFO",
      module: "engine.media_downloader",
      message: "Pexels Video API v1 connected. 9:16 portrait filter configured.",
    },
    {
      time: "18:25:02.500",
      level: "SUCCESS",
      module: "engine.video_renderer",
      message: "Native FFmpeg 9:16 hardware encoder pipeline online.",
    },
    {
      time: "18:25:03.010",
      level: "INFO",
      module: "api.token_manager",
      message: "OAuth 2.0 token expiration verification worker scheduled.",
    },
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-[#6c5ce7]" />
              <span>Engine Telemetry & Logs</span>
            </h1>
            <Badge variant="success" pulse className="text-[10px] font-mono font-semibold">
              Live Stream
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Real-time stdout/stderr telemetry across Gemini LLM, edge-tts, Pexels CDN, and FFmpeg encoders.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs h-9 bg-white border-slate-200 hover:bg-slate-50 text-slate-800 font-medium shadow-2xs"
            onClick={() => {
              const text = logs.map((l) => `[${l.time}] [${l.level}] ${l.module}: ${l.message}`).join("\n");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "engine_telemetry.log";
              a.click();
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Terminal View Window */}
      <div className="rounded-2xl border border-slate-200 shadow-xs overflow-hidden font-mono text-xs bg-slate-950">
        {/* Terminal Titlebar */}
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 text-[11px] text-slate-800 font-mono font-semibold">
              postmatic-engine-daemon.stdout
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-700 font-medium">
            <Cpu className="h-3.5 w-3.5 text-[#6c5ce7]" />
            <span>Buffer: 6 events</span>
          </div>
        </div>

        {/* Log Entries */}
        <div className="p-4 sm:p-6 space-y-2.5 overflow-x-auto min-h-[360px] bg-slate-950">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-relaxed hover:bg-white/[0.04] p-1 rounded-md transition-colors font-mono">
              <span className="text-slate-500 select-none text-[11px] shrink-0">{log.time}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  log.level === "SUCCESS"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : log.level === "INFO"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {log.level}
              </span>
              <span className="text-purple-400 shrink-0 font-medium">{log.module}:</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-slate-400 pt-3 font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px]">Listening for active video generation events...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
