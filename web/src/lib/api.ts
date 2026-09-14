/**
 * API client module for communicating with the PostMatic FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface CustomCharacterPayload {
  name: string;
  voice?: string;
  image_data?: string;
  visual_notes?: string;
  subtitle_color?: string;
}

export interface GenerateVideoPayload {
  topic: string;
  duration?: number;
  target_duration?: number;
  voice?: string;
  user_id?: string;
  publish_youtube?: boolean;
  privacy?: string;
  video_format?: "short" | "long";
  target_platform?: "youtube" | "tiktok" | "instagram";
  mode?: "shorts" | "story";
  story_style?: "anime" | "donghua" | "stickman" | "3d_cartoon";
  characters?: CustomCharacterPayload[];
}

export interface VideoJobResponse {
  job_id: string;
  id?: string;
  topic: string;
  status: "pending" | "scripting" | "synthesizing" | "sourcing_media" | "rendering" | "completed" | "failed";
  progress_pct: number;
  created_at: string;
  updated_at: string;
  video_url?: string | null;
  duration_seconds?: number | null;
  file_size_bytes?: number | null;
  error_message?: string | null;
}

/**
 * Normalizes a video job record coming from Supabase or the FastAPI backend,
 * ensuring that both job_id and id are reliably populated.
 */
export function normalizeJob(raw: Partial<VideoJobResponse> | { [key: string]: unknown }): VideoJobResponse {
  const item = raw as Partial<VideoJobResponse> & { [key: string]: unknown };
  const resolvedId = String(item.job_id || item.id || "");
  return {
    job_id: resolvedId,
    id: resolvedId,
    topic: (item.topic as string) || "Untitled Video",
    status: (item.status as VideoJobResponse["status"]) || "pending",
    progress_pct: typeof item.progress_pct === "number" ? item.progress_pct : 0,
    created_at: (item.created_at as string) || new Date().toISOString(),
    updated_at: (item.updated_at as string) || new Date().toISOString(),
    video_url: (item.video_url as string) || null,
    duration_seconds: typeof item.duration_seconds === "number" ? item.duration_seconds : null,
    file_size_bytes: typeof item.file_size_bytes === "number" ? item.file_size_bytes : null,
    error_message: (item.error_message as string) || null,
  };
}




/**
 * Dispatches a new automated video generation job to the FastAPI backend.
 */
export async function generateVideoJob(payload: GenerateVideoPayload): Promise<VideoJobResponse> {
  const response = await fetch(`${API_BASE_URL}/api/video/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Failed to dispatch video generation job";
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMessage = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore parse failure
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Polls the current status and stage of a video generation job.
 */
export async function getVideoJobStatus(jobId: string): Promise<VideoJobResponse> {
  const response = await fetch(`${API_BASE_URL}/api/video/status/${jobId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status for job ${jobId}`);
  }

  return response.json();
}

export interface SocialAccount {
  id: string;
  user_id?: string | null;
  platform: string;
  account_name?: string | null;
  has_refresh_token: boolean;
  token_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the Google OAuth 2.0 consent URL for YouTube.
 */
export async function getYouTubeAuthUrl(userId?: string): Promise<{ auth_url: string; platform: string }> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/social/youtube/auth-url${params}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    let errMsg = "Failed to generate YouTube authorization URL";
    try {
      const errData = await response.json();
      if (errData.detail) errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Fetches the TikTok OAuth consent URL.
 */
export async function getTikTokAuthUrl(userId?: string): Promise<{ auth_url: string; platform: string }> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/social/tiktok/auth-url${params}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    let errMsg = "Failed to generate TikTok authorization URL";
    try {
      const errData = await response.json();
      if (errData.detail) errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Fetches the Instagram/Meta OAuth consent URL.
 */
export async function getInstagramAuthUrl(userId?: string): Promise<{ auth_url: string; platform: string }> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/social/instagram/auth-url${params}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    let errMsg = "Failed to generate Instagram authorization URL";
    try {
      const errData = await response.json();
      if (errData.detail) errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Retrieves the user's connected social media publishing accounts.
 */
export async function getConnectedSocialAccounts(userId?: string): Promise<SocialAccount[]> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/social/accounts${params}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve connected social accounts");
  }

  return response.json();
}

/**
 * Disconnects and deletes a social account connection.
 */
export async function disconnectSocialAccount(accountId: string, userId?: string): Promise<void> {
  const params = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE_URL}/api/social/accounts/${accountId}${params}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to disconnect social account ${accountId}`);
  }
}

export interface PublishVideoResult {
  status: string;
  message: string;
  video_id?: string;
  publish_id?: string;
  media_id?: string;
  youtube_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  title?: string;
  caption?: string;
  privacy_status?: string;
  platform?: string;
}

/**
 * Publishes an existing completed video to a connected social platform ('youtube', 'tiktok', 'instagram').
 */
export async function publishVideoToPlatform(
  jobId: string,
  platform: "youtube" | "tiktok" | "instagram",
  userId?: string,
  privacy: string = "public"
): Promise<PublishVideoResult> {
  const response = await fetch(`${API_BASE_URL}/api/social/publish/${jobId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      platform,
      privacy,
    }),
  });

  if (!response.ok) {
    let errMsg = `Failed to publish video to ${platform}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

/**
 * Publishes an existing completed video to YouTube Shorts (legacy alias).
 */
export async function publishVideoToYouTube(
  jobId: string,
  userId?: string,
  privacy: string = "public"
): Promise<PublishVideoResult> {
  return publishVideoToPlatform(jobId, "youtube", userId, privacy);
}
