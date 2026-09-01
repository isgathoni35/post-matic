"use client";

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download,
  RotateCcw,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoJobResponse } from "@/lib/api";

interface JobQueueViewProps {
  jobs: VideoJobResponse[];
  onSelectJob: (job: VideoJobResponse) => void;
  onNavigateToStudio: () => void;
}

export function JobQueueView({
  jobs,
  onSelectJob,
  onNavigateToStudio,
}: JobQueueViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return ["pending", "scripting", "synthesizing", "sourcing_media", "rendering"].includes(j.status);
    if (statusFilter === "completed") return j.status === "completed";
    if (statusFilter === "failed") return j.status === "failed";
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="text-[10px] font-mono">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive" className="text-[10px] font-mono">Failed</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-[10px] font-mono text-zinc-400">Queued</Badge>;
      default:
        return (
          <Badge variant="primary" pulse className="text-[10px] font-mono">
            {status.replace("_", " ")}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Pipeline Execution Queue
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time status tracking for distributed video synthesis, media sourcing, and FFmpeg render jobs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.08]">
          {[
            { id: "all", label: "All Jobs", count: jobs.length },
            {
              id: "active",
              label: "Active",
              count: jobs.filter((j) => ["pending", "scripting", "synthesizing", "sourcing_media", "rendering"].includes(j.status)).length,
            },
            {
              id: "completed",
              label: "Completed",
              count: jobs.filter((j) => j.status === "completed").length,
            },
            {
              id: "failed",
              label: "Failed",
              count: jobs.filter((j) => j.status === "failed").length,
            },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? "bg-white/[0.1] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-[#0f131a] border border-white/[0.08] shadow-2xl overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No Jobs In This Queue</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Start a video generation job from the Studio Console to view live progress.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToStudio}
              className="text-xs font-semibold h-9 px-5"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Go to Studio
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/30 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Job ID</th>
                  <th className="py-3.5 px-4 font-semibold">Prompt / Topic</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Progress</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.job_id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-4 font-mono text-zinc-400 font-medium">
                      #{job.job_id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-4 font-medium text-white max-w-xs truncate">
                      {job.topic}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                            style={{ width: `${job.progress_pct}%` }}
                          />
                        </div>
                        <span className="text-[10px]">{job.progress_pct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-400">
                      {job.duration_seconds ? `${job.duration_seconds.toFixed(1)}s` : "-"}
                    </td>
                    <td className="py-4 px-4 font-mono text-zinc-500 text-[11px]">
                      {new Date(job.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectJob(job)}
                          className="h-7 px-2.5 text-[11px] bg-white/[0.03] border-white/[0.06]"
                        >
                          <Film className="h-3 w-3 mr-1" />
                          Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
