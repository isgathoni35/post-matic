"use client";

import React, { useState } from "react";
import {
  Film,
  Video,
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
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";

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
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-[#6c5ce7]" />
              <span>Render Library & Gallery</span>
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border-emerald-300">
              {completedJobs.length} Ready Videos
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
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
              icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
              className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 w-full focus-visible:border-[#6c5ce7]"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToStudio}
            className="text-xs h-9 font-semibold w-full sm:w-auto shrink-0 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            New Video
          </Button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {completedJobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8 sm:my-12">
          <BrandIcon size="xl" glow={false} className="mx-auto" />
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">No Videos Rendered Yet</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your library is currently empty. Head to the Studio Console to generate your first automated short-form video.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToStudio}
            className="text-xs font-semibold h-9 px-4 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Your First Video
          </Button>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs font-mono">
          No rendered videos match your search query "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                className="rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col justify-between shadow-2xs"
              >
                {/* 9:16 Video Poster Card */}
                <div
                  className="relative aspect-[9/16] bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center"
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
                    <div className="h-10 w-10 rounded-full bg-[#6c5ce7] text-white flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Badges on top */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-semibold border border-white/10">
                      9:16 Vertical
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white font-semibold border border-white/10">
                      {job.duration_seconds ? `${job.duration_seconds.toFixed(0)}s` : "25s"}
                    </span>
                  </div>

                  {/* Title overlay at bottom */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {job.topic}
                    </p>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    #{displayId}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={videoSrc}
                      download={`video_${displayId}.mp4`}
                      target="_blank"
                      rel="noreferrer"
                      title="Download MP4"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyShareLink(videoSrc)}
                      title="Copy Link"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedModalVideo(job)}
                      className="h-7 px-2.5 text-[11px] font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-2xs rounded-lg"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="pr-2">
                <span className="text-[10px] font-mono text-[#6c5ce7] uppercase tracking-wider font-semibold">
                  Video Inspector
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 line-clamp-2">
                  {selectedModalVideo.topic}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalVideo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-[9/16] rounded-xl overflow-hidden border border-slate-200 bg-black shadow-md">
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs font-mono text-slate-500">
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
                        <Button variant="secondary" size="sm" className="w-full text-xs h-9 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200">
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
                            className="w-full text-xs h-9 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                          >
                            <YouTubeIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            <span>View on YouTube</span>
                            <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "youtube")}
                          isLoading={publishingPlatform === "youtube"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                        >
                          <YouTubeIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          Publish to YouTube
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
                            className="w-full text-xs h-9 font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs"
                          >
                            <TikTokIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            <span>View on TikTok</span>
                            <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "tiktok")}
                          isLoading={publishingPlatform === "tiktok"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs"
                        >
                          <TikTokIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          Publish to TikTok
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
                            className="w-full text-xs h-9 font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-xs"
                          >
                            <InstagramIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            <span>View on Instagram</span>
                            <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handlePublish(modalJobId, "instagram")}
                          isLoading={publishingPlatform === "instagram"}
                          className="flex-1 sm:flex-none text-xs h-9 font-semibold bg-pink-600 hover:bg-pink-700 text-white shadow-xs"
                        >
                          <InstagramIcon className="h-3.5 w-3.5 mr-1.5 fill-current" />
                          Publish to Instagram
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
