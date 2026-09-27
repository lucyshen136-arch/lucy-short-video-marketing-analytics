import { query } from "@/lib/db";
import type { VideoListResponse, VideoRecord } from "@/lib/types";

const VIDEO_COLUMNS = [
  "video_id",
  "selection_reason",
  "source_kind",
  "meta_platform",
  "meta_public_url",
  "meta_title",
  "meta_creator_name",
  "meta_publish_date",
  "meta_duration_seconds",
  "meta_collected_at",
  "meta_view_count",
  "meta_like_count",
  "meta_comment_count",
  "meta_save_count",
  "meta_share_count",
  "meta_follower_count",
  "meta_hashtags",
  "content_type",
  "content_hook_type",
  "content_narrative_structure",
  "content_value_proposition",
  "content_persuasion",
  "content_evidence_type",
  "content_funnel_stage",
  "content_cta_type",
  "viewer_continued_watching",
  "viewer_memory_score",
  "viewer_trust_score",
  "viewer_action_intent_score",
  "ai_content_type",
  "ai_hook_type",
  "ai_narrative_structure",
  "ai_value_proposition",
  "ai_persuasion",
  "ai_evidence_type",
  "ai_funnel_stage",
  "ai_cta_type",
  "ai_label_status",
  "created_at",
  "updated_at",
] as const;

const WRITABLE = VIDEO_COLUMNS.filter((c) => c !== "created_at" && c !== "updated_at");
const PLATFORMS = new Set(["douyin", "xiaohongshu", "bilibili"]);
const VIDEO_ID_RE = /^[A-Z0-9_-]+$/;

function mapVideo(row: Record<string, unknown>): VideoRecord {
  const out = { ...row } as VideoRecord;
  if (out.meta_publish_date) {
    out.meta_publish_date = String(out.meta_publish_date).slice(0, 10);
  }
  return out;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function listVideosDb(page = 1, pageSize = 20): Promise<VideoListResponse> {
  const offset = (page - 1) * pageSize;
  const count = await query<{ count: string | number }>("SELECT count(*) FROM videos");
  const total = Number(count.rows[0]?.count ?? 0);
  const result = await query(
    `SELECT * FROM videos
     ORDER BY meta_publish_date DESC, video_id ASC
     OFFSET $1 LIMIT $2`,
    [offset, pageSize],
  );
  return {
    items: result.rows.map((row) => mapVideo(row)),
    total,
    page,
    page_size: pageSize,
  };
}

export async function getVideoDb(videoId: string): Promise<VideoRecord> {
  const result = await query("SELECT * FROM videos WHERE video_id = $1", [videoId]);
  if (!result.rowCount) {
    throw new HttpError(404, "Video not found");
  }
  return mapVideo(result.rows[0]);
}

function requireCreate(payload: Record<string, unknown>) {
  const videoId = String(payload.video_id ?? "").trim();
  if (!VIDEO_ID_RE.test(videoId)) {
    throw new HttpError(400, "video_id must match ^[A-Z0-9_-]+$");
  }
  if (!String(payload.selection_reason ?? "").trim()) {
    throw new HttpError(400, "selection_reason is required");
  }
  if (!PLATFORMS.has(String(payload.meta_platform ?? ""))) {
    throw new HttpError(400, "meta_platform must be douyin, xiaohongshu, or bilibili");
  }
  for (const key of ["meta_public_url", "meta_title", "meta_creator_name", "meta_publish_date"] as const) {
    if (!String(payload[key] ?? "").trim()) {
      throw new HttpError(400, `${key} is required`);
    }
  }
}

export async function createVideoDb(payload: Record<string, unknown>): Promise<VideoRecord> {
  requireCreate(payload);
  const existing = await query("SELECT video_id FROM videos WHERE video_id = $1", [payload.video_id]);
  if (existing.rowCount) {
    throw new HttpError(409, "video_id already exists");
  }
  const cols = WRITABLE.filter((col) => col === "video_id" || col in payload);
  const values = cols.map((col) => (payload[col] === "" ? null : (payload[col] ?? null)));
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const result = await query(
    `INSERT INTO videos (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values,
  );
  return mapVideo(result.rows[0]);
}

export async function updateVideoDb(videoId: string, payload: Record<string, unknown>): Promise<VideoRecord> {
  if (!String(payload.selection_reason ?? "").trim()) {
    throw new HttpError(400, "selection_reason is required");
  }
  if (payload.meta_platform && !PLATFORMS.has(String(payload.meta_platform))) {
    throw new HttpError(400, "meta_platform must be douyin, xiaohongshu, or bilibili");
  }
  const cols = WRITABLE.filter((col) => col !== "video_id" && col in payload);
  if (!cols.length) {
    return getVideoDb(videoId);
  }
  const assignments = cols.map((col, i) => `${col} = $${i + 1}`);
  const values = cols.map((col) => (payload[col] === "" ? null : (payload[col] ?? null)));
  values.push(videoId);
  const result = await query(
    `UPDATE videos SET ${assignments.join(", ")}, updated_at = now()
     WHERE video_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rowCount) {
    throw new HttpError(404, "Video not found");
  }
  return mapVideo(result.rows[0]);
}

export async function deleteVideoDb(videoId: string): Promise<void> {
  const result = await query("DELETE FROM videos WHERE video_id = $1", [videoId]);
  if (!result.rowCount) {
    throw new HttpError(404, "Video not found");
  }
}
