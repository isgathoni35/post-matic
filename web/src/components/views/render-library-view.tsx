"use client";

import React, { useState } from "react";
import {
  Film,
  Play,
  Download,
  Share2,
  Trash2,
  Clock,
  Calendar,
  ExternalLink,
  Search,
  Sparkles,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BrandIcon } from "@/components/ui/brand-logo";
import { VideoJobResponse, publishVideoToPlatform } from "@/lib/api";
import { toast } from "sonner";

interface RenderLibraryViewProps {
  jobs: VideoJobResponse[];
  userId?: string;
  onRefreshJobs?: () => void;
  onSelectVideo: (job: VideoJobResponse) => void;
  onNavigateToStudio: () => void;
  onOpenSocialModal: () => void;
}

export function RenderLibraryView({
  jobs,
  userId,
  onRefreshJobs,
  onSelectVideo,
  onNavigateToStudio,
  onOpenSocialModal,
}: RenderLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModalVideo, setSelectedModalVideo] = useState<VideoJobResponse | null>(null);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);

  const completedJobs = jobs.filter(
    (j) => j.status === "completed" && j.video_url
  );

  const filteredJobs = completedJobs.filter((j) =>
    j.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyShareLink = (videoUrl: string) => {
    const fullUrl = videoUrl.startsWith("http")
      ? videoUrl
      : `${window.location.origin}${videoUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Video URL copied to clipboard!");
  };

  const handlePublish = async (jobId: string, platform: "youtube" | "tiktok" | "instagram") => {
    setPublishingPlatform(platform);
    const platformNames: Record<string, string> = {
      youtube: "YouTube Shorts",
      tiktok: "TikTok",
      instagram: "Instagram Reels",
    };
    const platformLabel = platformNames[platform] || platform;
    toast.loading(`Publishing to ${platformLabel}...`, { id: `publish-${jobId}-${platform}` });
    try {
      const res = await publishVideoToPlatform(jobId, platform, userId);
      const viewUrl = res.youtube_url || res.tiktok_url || res.instagram_url;
      toast.success(`Published to ${platformLabel}!`, {
        id: `publish-${jobId}-${platform}`,
        description: res.title || res.caption || `Your video is live on ${platformLabel}.`,
        action: viewUrl ? {
          label: `View on ${platformLabel}`,
          onClick: () => window.open(viewUrl, "_blank"),
        } : undefined,
      });
      if (onRefreshJobs) onRefreshJobs();
    } catch (err: any) {
      toast.error(`Publishing Failed`, {
        id: `publish-${jobId}-${platform}`,
        description: err.message || `Failed to publish to ${platformLabel}. Check your connected accounts.`,
        action: {
          label: "Distribution Channels",
          onClick: onOpenSocialModal,
        },
      });
    } finally {
      setPublishingPlatform(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Render Library & Gallery
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {completedJobs.length} Ready Videos
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Browse, preview, export, and distribute your rendered 9:16 vertical video assets.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
              className="h-9 text-xs bg-white/[0.03] border-white/[0.08] w-full"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToStudio}
            className="text-xs h-9 font-semibold shadow-lg shadow-amber-500/20 w-full sm:w-auto shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            New Video
          </Button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {completedJobs.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#0f131a] p-8 sm:p-12 text-center space-y-5 max-w-md mx-auto my-8 sm:my-12 shadow-2xl">
          <BrandIcon size="xl" glow={true} className="mx-auto shadow-2xl shadow-amber-500/20" />
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white">No Videos Rendered Yet</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your library is currently empty. Head to the Studio Console to generate your first automated short-form video.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToStudio}
            className="text-xs font-semibold h-10 px-6 shadow-xl shadow-amber-500/20"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Your First Video
          </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-xs font-mono">
          No rendered videos match your search query "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredJobs.map((job, idx) => {
            const jobId = job.job_id || (job as any).id || "";
            const displayId = jobId ? jobId.slice(0, 8) : `video-${idx}`;
            const rawUrl = job.video_url || "";
            const videoSrc = rawUrl.startsWith("http")
              ? rawUrl
              : rawUrl
              ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${rawUrl}`
              : "";

            return (
              <div
                key={jobId || `job-${idx}`}
                className="rounded-2xl bg-[#0f131a] border border-white/[0.08] hover:border-amber-500/40 transition-all duration-300 overflow-hidden group flex flex-col justify-between shadow-xl"
              >
                {/* 9:16 Video Poster Card */}
                <div
                  className="relative aspect-[9/16] bg-black/80 overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => setSelectedModalVideo(job)}
                >
                  <video
                    src={videoSrc}
                    preload="metadata"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Play hover icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="h-12 w-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/40 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 font-semibold border border-white/[0.08]">
                      9:16 Vertical
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 font-semibold border border-white/[0.08]">
                      {job.duration_seconds ? `${job.duration_seconds.toFixed(0)}s` : "25s"}
                    </span>
                  </div>

                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug drop-shadow-md">
                      {job.topic}
                    </p>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-3 bg-white/[0.01] border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] font-mono text-zinc-500 truncate">
                    #{displayId}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={videoSrc}
                      download={`video_${displayId}.mp4`}
                      target="_blank"
                      rel="noreferrer"
                      title="Download MP4"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyShareLink(videoSrc)}
                      title="Copy Link"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedModalVideo(job)}
                      className="h-7 px-2.5 text-[11px] font-semibold"
                    >
                      Play
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      )}

      {/* Video Playback Modal */}
      {selectedModalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b0e14] border border-white/[0.1] shadow-2xl p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-white/[0.08]">
              <div className="pr-2">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                  Video Inspector
                </span>
                <h2 className="text-sm sm:text-lg font-bold text-white mt-0.5 line-clamp-2">
                  {selectedModalVideo.topic}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalVideo(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-white/[0.12] bg-black shadow-2xl">
                <video
                  src={
                    selectedModalVideo.video_url?.startsWith("http")
                      ? selectedModalVideo.video_url
                      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${selectedModalVideo.video_url}`
                  }
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
              <span className="text-xs font-mono text-zinc-400">
                Duration: {selectedModalVideo.duration_seconds?.toFixed(1)}s • 1080x1920
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {(() => {
                  const modalJobId = selectedModalVideo.job_id || (selectedModalVideo as any).id || "";
                  const modalDisplayId = modalJobId ? modalJobId.slice(0, 8) : "video";
                  const modalRawUrl = selectedModalVideo.video_url || "";
                  const modalVideoSrc = modalRawUrl.startsWith("http")
                    ? modalRawUrl
                    : modalRawUrl
                    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${modalRawUrl}`
                    : "";

                  return (
                    <>
                      <a
                        href={modalVideoSrc}
                        download={`video_${modalDisplayId}.mp4`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none"
                      >
                        <Button variant="secondary" size="sm" className="w-full text-xs h-9 bg-white/[0.04] border-white/[0.08]">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Download MP4
                        </Button>
                      </a>
                      {/* YouTube */}
                      {modalRawUrl.includes("youtube.com") ? (
                        <a
                          href={modalRawUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full text-xs h-9 font-semibold bg-red-600 hover:bg-red-700 text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            YouTube
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "youtube")}
                          isLoading={publishingPlatform === "youtube"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1.5" />
                          YouTube
                        </Button>
                      )}

                      {/* TikTok */}
                      {modalRawUrl.includes("tiktok.com") ? (
                        <a
                          href={modalRawUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full text-xs h-9 font-semibold bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            TikTok
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "tiktok")}
                          isLoading={publishingPlatform === "tiktok"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1.5" />
                          TikTok
                        </Button>
                      )}

                      {/* Instagram Reels */}
                      {modalRawUrl.includes("instagram.com") ? (
                        <a
                          href={modalRawUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none"
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full text-xs h-9 font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Instagram
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "instagram")}
                          isLoading={publishingPlatform === "instagram"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1.5" />
                          Instagram
                        </Button>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
