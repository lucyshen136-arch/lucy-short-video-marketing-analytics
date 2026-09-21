import type { LabelDictionary, VideoListResponse, VideoRecord } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export function listVideos(page = 1, pageSize = 20): Promise<VideoListResponse> {
  return request(`/api/v1/videos?page=${page}&page_size=${pageSize}`);
}

export function getVideo(videoId: string): Promise<VideoRecord> {
  return request(`/api/v1/videos/${encodeURIComponent(videoId)}`);
}

export function createVideo(payload: Partial<VideoRecord> & { video_id: string; selection_reason: string }): Promise<VideoRecord> {
  return request("/api/v1/videos", { method: "POST", body: JSON.stringify(payload) });
}

export function updateVideo(videoId: string, payload: Partial<VideoRecord> & { selection_reason: string }): Promise<VideoRecord> {
  return request(`/api/v1/videos/${encodeURIComponent(videoId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteVideo(videoId: string): Promise<void> {
  return request(`/api/v1/videos/${encodeURIComponent(videoId)}`, { method: "DELETE" });
}

export function getContentDictionary(): Promise<LabelDictionary> {
  return request("/api/v1/dictionaries/content");
}

export function getViewerDictionary(): Promise<LabelDictionary> {
  return request("/api/v1/dictionaries/viewer");
}
