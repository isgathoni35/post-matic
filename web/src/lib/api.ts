/**
 * API client module for communicating with the PostMatic FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerateVideoPayload {
  topic: string;
  target_duration?: number;
  voice?: string;
  user_id?: string;
}

export interface VideoJobResponse {
  job_id: string;
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
    throw new Error("Failed to generate YouTube authorization URL");
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
