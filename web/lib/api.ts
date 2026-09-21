import type {
  DictionaryFieldRecord,
  DictionaryItemRecord,
  DictionarySetRecord,
  DictionarySetSummary,
  LabelDictionary,
  VideoListResponse,
  VideoRecord,
} from "./types";

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

export function listDictionarySets(): Promise<DictionarySetSummary[]> {
  return request("/api/v1/dictionary-sets");
}

export function getDictionarySet(slug: string): Promise<DictionarySetRecord> {
  return request(`/api/v1/dictionary-sets/${encodeURIComponent(slug)}`);
}

export function createDictionarySet(payload: {
  slug: string;
  name: string;
  description?: string;
  version?: string;
  source_doc?: string;
  scope?: string;
}): Promise<DictionarySetRecord> {
  return request("/api/v1/dictionary-sets", { method: "POST", body: JSON.stringify(payload) });
}

export function updateDictionarySet(
  slug: string,
  payload: {
    name: string;
    description?: string | null;
    version?: string | null;
    source_doc?: string | null;
    scope?: string | null;
  },
): Promise<DictionarySetRecord> {
  return request(`/api/v1/dictionary-sets/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDictionarySet(slug: string): Promise<void> {
  return request(`/api/v1/dictionary-sets/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

export function importDictionarySetsFromFiles(): Promise<DictionarySetSummary[]> {
  return request("/api/v1/dictionary-sets/import-from-files", { method: "POST" });
}

export function createDictionaryField(
  slug: string,
  payload: { field_key: string; label_zh: string; field_kind: string; question?: string },
): Promise<DictionaryFieldRecord> {
  return request(`/api/v1/dictionary-sets/${encodeURIComponent(slug)}/fields`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDictionaryField(
  slug: string,
  fieldKey: string,
  payload: { label_zh: string; field_kind: string; question?: string | null },
): Promise<DictionaryFieldRecord> {
  return request(
    `/api/v1/dictionary-sets/${encodeURIComponent(slug)}/fields/${encodeURIComponent(fieldKey)}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function deleteDictionaryField(slug: string, fieldKey: string): Promise<void> {
  return request(
    `/api/v1/dictionary-sets/${encodeURIComponent(slug)}/fields/${encodeURIComponent(fieldKey)}`,
    { method: "DELETE" },
  );
}

export function createDictionaryItem(
  slug: string,
  payload: { field_key: string; code: string; label_zh: string; definition?: string; sort_order?: number },
): Promise<DictionaryItemRecord> {
  return request(`/api/v1/dictionary-sets/${encodeURIComponent(slug)}/items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDictionaryItem(
  itemId: number,
  payload: { code: string; label_zh: string; definition?: string | null; sort_order: number },
): Promise<DictionaryItemRecord> {
  return request(`/api/v1/dictionary-sets/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDictionaryItem(itemId: number): Promise<void> {
  return request(`/api/v1/dictionary-sets/items/${itemId}`, { method: "DELETE" });
}
