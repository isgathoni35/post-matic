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
        return <Badge variant="outline" className="text-[10px] font-mono text-slate-700 border-slate-300 bg-slate-100 font-semibold">Queued</Badge>;
      default:
        return (
          <Badge variant="primary" pulse className="text-[10px] font-mono">
            {status.replace("_", " ")}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#6c5ce7]" />
              <span>Pipeline Execution Queue</span>
            </h1>
            <Badge variant="primary" pulse className="text-[10px] font-mono font-semibold">
              Live Monitor
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Real-time status tracking for distributed video synthesis, media sourcing, and FFmpeg render jobs.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
          {[
            { id: "all", label: "All", count: jobs.length },
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                statusFilter === f.id
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-700 hover:text-slate-900 font-medium"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No Jobs In This Queue</p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Start a video generation job from the Studio Console to view live progress.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToStudio}
              className="text-xs font-semibold h-9 px-5 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Go to Studio
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 font-mono text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Job ID</th>
                  <th className="py-3.5 px-4">Prompt / Topic</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Progress</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job, idx) => {
                  const jobId = job.job_id || (job as any).id || "";
                  const displayId = jobId ? jobId.slice(0, 8) : `job-${idx}`;
                  let timeStr = "-";
                  try {
                    if (job.created_at) {
                      timeStr = new Date(job.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });
                    }
                  } catch {
                    timeStr = "-";
                  }

                  return (
                    <tr
                      key={jobId || `job-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-4 px-4 font-mono text-slate-700 font-semibold">
                        #{displayId}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {job.topic}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-[#6c5ce7] transition-all duration-300"
                              style={{ width: `${job.progress_pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-800">{job.progress_pct}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-700 font-medium">
                        {job.duration_seconds ? `${job.duration_seconds.toFixed(1)}s` : "-"}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 text-[11px] font-medium">
                        {timeStr}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectJob(job)}
                            className="h-7 px-2.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
                          >
                            <Film className="h-3 w-3 mr-1" />
                            Inspect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
