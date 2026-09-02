"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar, ActiveWorkspaceView } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { generateVideoJob, getVideoJobStatus, VideoJobResponse } from "@/lib/api";
import { SocialAccountsModal } from "@/components/social/social-accounts-modal";
import { StudioConsoleView, VOICES } from "@/components/views/studio-console-view";
import { RenderLibraryView } from "@/components/views/render-library-view";
import { JobQueueView } from "@/components/views/job-queue-view";
import { SocialChannelsView } from "@/components/views/social-channels-view";
import { EngineLogsView } from "@/components/views/engine-logs-view";
import { SettingsView } from "@/components/views/settings-view";
import { toast } from "sonner";

export default function StudioDashboard() {
  const { user } = useAuth();
  const supabase = createClient();

  // Active Workspace Navigation View
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>("studio");

  // Form Parameters
  const [topic, setTopic] = useState("");
  const [targetDuration, setTargetDuration] = useState(25);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [autoPublishYouTube, setAutoPublishYouTube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // Active Job and User Jobs List
  const [activeJob, setActiveJob] = useState<VideoJobResponse | null>(null);
  const [jobs, setJobs] = useState<VideoJobResponse[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  const activeJobRef = useRef<VideoJobResponse | null>(null);
  activeJobRef.current = activeJob;

  // Handle OAuth callback URL notifications
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const connected = urlParams.get("connected");
      const channel = urlParams.get("channel");
      const error = urlParams.get("error");

      if (connected === "youtube") {
        toast.success("YouTube Channel Connected!", {
          description: channel
            ? `Successfully linked to channel: ${channel}`
            : "Authorized for automated video uploading.",
        });
        setActiveView("social");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        toast.error("OAuth Authorization Failed", {
          description: `Google error code: ${error}`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Fetch recent jobs from Supabase strictly scoped to authenticated user
  const fetchUserJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        console.warn("Could not fetch user jobs from Supabase:", error.message);
      } else if (data) {
        const formatted: VideoJobResponse[] = data.map((row) => ({
          job_id: row.id,
          topic: row.topic,
          status: row.status,
          progress_pct: row.progress_pct || 0,
          created_at: row.created_at,
          updated_at: row.updated_at,
          video_url: row.video_url,
          duration_seconds: row.duration_seconds,
          file_size_bytes: row.file_size_bytes,
          error_message: row.error_message,
        }));
        setJobs(formatted);

        // If no active job set yet, default to most recent completed or active one
        if (!activeJobRef.current && formatted.length > 0) {
          setActiveJob(formatted[0]);
        }
      }
    } catch (err) {
      console.warn("Exception fetching user jobs:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) {
      fetchUserJobs();

      // Subscribe to Supabase Realtime for video_jobs table updates for current user
      const channel = supabase
        .channel(`video_jobs_user_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "video_jobs",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new === "object") {
              const newRow = payload.new as Record<string, any>;
              const updatedJob: VideoJobResponse = {
                job_id: newRow.id,
                topic: newRow.topic,
                status: newRow.status,
                progress_pct: newRow.progress_pct || 0,
                created_at: newRow.created_at,
                updated_at: newRow.updated_at,
                video_url: newRow.video_url,
                duration_seconds: newRow.duration_seconds,
                file_size_bytes: newRow.file_size_bytes,
                error_message: newRow.error_message,
              };

              if (activeJobRef.current?.job_id === updatedJob.job_id) {
                setActiveJob(updatedJob);
              }

              fetchUserJobs();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchUserJobs, supabase, user]);

  // Polling fallback while active job is processing
  useEffect(() => {
    if (
      !activeJob ||
      activeJob.status === "completed" ||
      activeJob.status === "failed"
    ) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const latest = await getVideoJobStatus(activeJob.job_id);
        setActiveJob(latest);

        if (latest.status === "completed") {
          toast.success("Video Rendered Successfully!", {
            description: `Job #${latest.job_id.slice(0, 8)} is ready for playback & export.`,
          });
          fetchUserJobs();
        } else if (latest.status === "failed") {
          toast.error("Video Generation Failed", {
            description: latest.error_message || "An unexpected error occurred.",
          });
          fetchUserJobs();
        }
      } catch (err) {
        console.warn("Polling error for job:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [activeJob, fetchUserJobs]);

  // Handle New Generation Submit
  const handleGenerateVideo = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a video concept or prompt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await generateVideoJob({
        topic: topic.trim(),
        target_duration: targetDuration,
        voice: selectedVoice,
        user_id: user?.id,
        publish_youtube: autoPublishYouTube,
      });

      setActiveJob(response);
      setActiveView("studio");

      toast.success("Orchestration Pipeline Initialized!", {
        description: `Job #${response.job_id.slice(0, 8)} started in background.`,
      });

      fetchUserJobs();
    } catch (err: any) {
      toast.error("Generation Request Failed", {
        description: err.message || "Failed to contact FastAPI engine.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectJobFromGalleryOrQueue = (job: VideoJobResponse) => {
    setActiveJob(job);
    setActiveView("studio");
  };

  const activeJobsCount = jobs.filter((j) =>
    ["pending", "scripting", "synthesizing", "sourcing_media", "rendering"].includes(
      j.status
    )
  ).length;

  const completedJobsCount = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#07090d] text-zinc-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <Header onOpenSocialModal={() => setIsSocialModalOpen(true)} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Interactive Workspace Sidebar */}
        <Sidebar
          activeView={activeView}
          onViewChange={(v) => setActiveView(v)}
          activeJobsCount={activeJobsCount}
          completedJobsCount={completedJobsCount}
        />

        {/* Dynamic Workspace View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeView === "studio" && (
            <StudioConsoleView
              topic={topic}
              setTopic={setTopic}
              targetDuration={targetDuration}
              setTargetDuration={setTargetDuration}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              autoPublishYouTube={autoPublishYouTube}
              setAutoPublishYouTube={setAutoPublishYouTube}
              isSubmitting={isSubmitting}
              activeJob={activeJob}
              onGenerate={handleGenerateVideo}
              onOpenSocialModal={() => setIsSocialModalOpen(true)}
            />
          )}

          {activeView === "library" && (
            <RenderLibraryView
              jobs={jobs}
              userId={user?.id}
              onRefreshJobs={fetchUserJobs}
              onSelectVideo={handleSelectJobFromGalleryOrQueue}
              onNavigateToStudio={() => setActiveView("studio")}
              onOpenSocialModal={() => setIsSocialModalOpen(true)}
            />
          )}

          {activeView === "queue" && (
            <JobQueueView
              jobs={jobs}
              onSelectJob={handleSelectJobFromGalleryOrQueue}
              onNavigateToStudio={() => setActiveView("studio")}
            />
          )}

          {activeView === "social" && (
            <SocialChannelsView
              userId={user?.id}
              onOpenSocialModal={() => setIsSocialModalOpen(true)}
            />
          )}

          {activeView === "logs" && (
            <EngineLogsView activeJobId={activeJob?.job_id} />
          )}

          {activeView === "settings" && (
            <SettingsView
              userEmail={user?.email}
              userId={user?.id}
              defaultDuration={targetDuration}
              setDefaultDuration={setTargetDuration}
              defaultVoice={selectedVoice}
              setDefaultVoice={setSelectedVoice}
            />
          )}
        </main>
      </div>

      {/* Social Accounts Modal */}
      <SocialAccountsModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        userId={user?.id}
      />
    </div>
  );
}
