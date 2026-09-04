"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar, ActiveWorkspaceView } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { generateVideoJob, getVideoJobStatus, VideoJobResponse, normalizeJob } from "@/lib/api";
import { SocialAccountsModal } from "@/components/social/social-accounts-modal";
import { StudioConsoleView, VOICES } from "@/components/views/studio-console-view";
import { RenderLibraryView } from "@/components/views/render-library-view";
import { JobQueueView } from "@/components/views/job-queue-view";
import { SocialChannelsView } from "@/components/views/social-channels-view";
import { EngineLogsView } from "@/components/views/engine-logs-view";
import { SettingsView } from "@/components/views/settings-view";
import { WorkspaceErrorBoundary } from "@/components/ui/error-boundary";
import { BrandIcon } from "@/components/ui/brand-logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function StudioPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const supabase = createClient();

  // Authentication Guard: Redirect unauthenticated visitors to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login?redirect=/studio");
    }
  }, [user, isLoading, router]);

  // Active Workspace Navigation View (persisted across sessions)
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>("studio");

  // Restore previous active workspace tab on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("postmatic_active_view") as ActiveWorkspaceView | null;
      if (saved && ["studio", "library", "queue", "social", "logs", "settings"].includes(saved)) {
        setActiveView(saved);
      }
    }
  }, []);

  const handleViewChange = (view: ActiveWorkspaceView) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      localStorage.setItem("postmatic_active_view", view);
    }
  };

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
      const errorDesc = urlParams.get("error_description");
      const warning = urlParams.get("warning");

      if (connected === "youtube") {
        if (warning) {
          toast.warning("YouTube Connected with Warning", {
            description: decodeURIComponent(warning),
            duration: 8000,
          });
        } else {
          toast.success("YouTube Channel Connected!", {
            description: channel
              ? `Connected to ${decodeURIComponent(channel)}`
              : "Channel is ready for autonomous uploads.",
            duration: 6000,
          });
        }
        window.history.replaceState({}, "", "/studio");
      } else if (error) {
        let title = "Social Connection Failed";
        let message = errorDesc ? decodeURIComponent(errorDesc) : decodeURIComponent(error);

        if (error === "access_denied") {
          title = "Authorization Cancelled";
          message = "You cancelled or denied the Google consent request.";
        } else if (error === "redirect_uri_mismatch") {
          title = "Google Configuration Error";
          message = "Redirect URI mismatch in Google Cloud Console. Verify authorized redirect URIs.";
        }

        toast.error(title, {
          description: message,
          duration: 9000,
        });
        window.history.replaceState({}, "", "/studio");
      }
    }
  }, []);

  // Fetch Jobs from Supabase
  const fetchUserJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("video_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        const normalized = data.map(normalizeJob);
        setJobs(normalized);
      }
    } catch (err: any) {
      console.warn("Could not fetch user jobs from Supabase:", err.message);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchUserJobs();
  }, [fetchUserJobs]);

  // Real-time Polling for Active Job
  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status === "completed" || activeJob.status === "failed") return;

    const targetJobId = activeJob.job_id || (activeJob as any).id;
    if (!targetJobId) return;

    const intervalId = setInterval(async () => {
      try {
        const updatedRaw = await getVideoJobStatus(targetJobId);
        const updated = normalizeJob(updatedRaw);
        setActiveJob(updated);

        // Update in list
        setJobs((prev) =>
          prev.map((j) => ((j.job_id || (j as any).id) === updated.job_id ? updated : j))
        );

        if (updated.status === "completed") {
          toast.success("Video Render Completed!", {
            description: `Duration: ${updated.duration_seconds || 0}s. Ready in your library!`,
          });
          fetchUserJobs();
        } else if (updated.status === "failed") {
          toast.error("Video Generation Failed", {
            description: updated.error_message || "An error occurred during rendering.",
          });
          fetchUserJobs();
        }
      } catch (e) {
        console.error("Failed polling job status:", e);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [activeJob, fetchUserJobs]);

  // Handle New Generation Submit
  const handleGenerateVideo = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a video idea or prompt.");
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

      const normalizedResponse = normalizeJob(response);
      setActiveJob(normalizedResponse);
      handleViewChange("studio");

      const displayId = normalizedResponse.job_id ? normalizedResponse.job_id.slice(0, 8) : "new";
      toast.success("Creation Pipeline Started!", {
        description: `Video job #${displayId} is now rendering in the cloud.`,
      });

      fetchUserJobs();
    } catch (err: any) {
      toast.error("Generation Request Failed", {
        description: err.message || "Failed to contact video engine.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectJobFromGalleryOrQueue = (job: VideoJobResponse) => {
    setActiveJob(normalizeJob(job));
    handleViewChange("studio");
  };

  // Loading / Auth Guard State
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090b10] text-zinc-300">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <BrandIcon size="lg" glow={true} className="shadow-2xl shadow-amber-500/25 animate-pulse" />
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <span>Loading PostMatic Studio...</span>
          </div>
        </div>
      </div>
    );
  }

  // Workspace Counts
  const activeJobsCount = jobs.filter(
    (j) => !["completed", "failed"].includes(j.status)
  ).length;
  const completedJobsCount = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-zinc-100">
      {/* Top Navigation Bar */}
      <Header onOpenSocialModal={() => setIsSocialModalOpen(true)} />

      {/* Main Studio Body: Sidebar + Dynamic Workspace Views */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Workspace Sidebar */}
        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          activeJobsCount={activeJobsCount}
          completedJobsCount={completedJobsCount}
        />

        {/* Dynamic Workspace View Container */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 min-w-0 overflow-y-auto">
          <WorkspaceErrorBoundary key={activeView} onReset={() => handleViewChange("studio")}>
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
                onNavigateToStudio={() => handleViewChange("studio")}
                onOpenSocialModal={() => setIsSocialModalOpen(true)}
              />
            )}

            {activeView === "queue" && (
              <JobQueueView
                jobs={jobs}
                onSelectJob={handleSelectJobFromGalleryOrQueue}
                onNavigateToStudio={() => handleViewChange("studio")}
              />
            )}

            {activeView === "social" && (
              <SocialChannelsView
                userId={user?.id}
                onOpenSocialModal={() => setIsSocialModalOpen(true)}
              />
            )}

            {activeView === "logs" && (
              <EngineLogsView activeJobId={activeJob?.job_id || (activeJob as any)?.id} />
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
          </WorkspaceErrorBoundary>
        </main>
      </div>

      {/* Persistent Mobile Bottom Navigation Dock (< md viewports) */}
      <MobileNav
        activeView={activeView}
        onViewChange={handleViewChange}
        activeJobsCount={activeJobsCount}
        completedJobsCount={completedJobsCount}
      />

      {/* Global OAuth / Social Connect Modal */}
      <SocialAccountsModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
      />
    </div>
  );
}
