import { query } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";
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
  if (typeof out.extra === "string") {
    try {
      out.extra = JSON.parse(out.extra) as VideoRecord["extra"];
    } catch {
      out.extra = null;
    }
  }
  return out;
}

function extraFrom(payload: Record<string, unknown>): Record<string, unknown> | null {
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!WRITABLE.includes(key as (typeof WRITABLE)[number]) && key !== "extra" && key !== "created_at" && key !== "updated_at") {
      extra[key] = value === "" ? null : value;
    }
  }
  return Object.keys(extra).length ? extra : null;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function listVideosDb(page = 1, pageSize = 20): Promise<VideoListResponse> {
  await ensureAppSchema();
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

export async function listAllVideosDb(): Promise<VideoRecord[]> {
  await ensureAppSchema();
  const result = await query(
    `SELECT * FROM videos
     ORDER BY meta_publish_date DESC, video_id ASC`,
  );
  return result.rows.map((row) => mapVideo(row));
}

export async function getVideoDb(videoId: string): Promise<VideoRecord> {
  await ensureAppSchema();
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
  await ensureAppSchema();
  requireCreate(payload);
  const existing = await query("SELECT video_id FROM videos WHERE video_id = $1", [payload.video_id]);
  if (existing.rowCount) {
    throw new HttpError(409, "video_id already exists");
  }
  const extra = extraFrom(payload);
  const cols: string[] = WRITABLE.filter((col) => col === "video_id" || col in payload);
  if (extra) cols.push("extra");
  const values = cols.map((col) => (col === "extra" ? JSON.stringify(extra) : payload[col] === "" ? null : (payload[col] ?? null)));
  const placeholders = cols.map((col, i) => (col === "extra" ? `$${i + 1}::jsonb` : `$${i + 1}`));
  const result = await query(
    `INSERT INTO videos (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values,
  );
  return mapVideo(result.rows[0]);
}

export async function updateVideoDb(videoId: string, payload: Record<string, unknown>): Promise<VideoRecord> {
  await ensureAppSchema();
  if (!String(payload.selection_reason ?? "").trim()) {
    throw new HttpError(400, "selection_reason is required");
  }
  if (payload.meta_platform && !PLATFORMS.has(String(payload.meta_platform))) {
    throw new HttpError(400, "meta_platform must be douyin, xiaohongshu, or bilibili");
  }
  const extra = extraFrom(payload);
  const cols: string[] = WRITABLE.filter((col) => col !== "video_id" && col in payload);
  if (extra) cols.push("extra");
  if (!cols.length) {
    return getVideoDb(videoId);
  }
  const assignments = cols.map((col, i) => (col === "extra" ? `extra = $${i + 1}::jsonb` : `${col} = $${i + 1}`));
  const values = cols.map((col) => (col === "extra" ? JSON.stringify(extra) : payload[col] === "" ? null : (payload[col] ?? null)));
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
