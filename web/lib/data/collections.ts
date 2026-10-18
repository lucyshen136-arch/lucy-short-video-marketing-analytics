import { collectPublicMetadata, type CollectedMeta } from "@/lib/crawl";
import { query } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";
import { createVideoDb, HttpError } from "@/lib/data/videos";

export type CollectionJob = {
  id: number;
  name: string;
  site_url: string;
  keyword: string;
  collect_count: number;
  created_at: string;
};

export type CollectionItem = CollectedMeta & {
  id: number;
  batch_id: number;
  imported_video_id: string | null;
  created_at: string;
};

export type CollectionBatch = {
  id: number;
  batch_no: string;
  item_count: number;
  note: string | null;
  created_at: string;
  items: CollectionItem[];
};

const ITEM_FIELDS = [
  "meta_platform",
  "meta_public_url",
  "meta_title",
  "meta_creator_name",
  "meta_publish_date",
  "meta_duration_seconds",
  "meta_view_count",
  "meta_like_count",
  "meta_comment_count",
  "meta_save_count",
  "meta_share_count",
  "meta_follower_count",
  "meta_hashtags",
] as const;

function batchNo(existing: string[]): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const base = `${pick("year")}${pick("month")}${pick("day")}-${pick("hour")}${pick("minute")}${pick("second")}`;
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export async function listCollectionJobsDb(): Promise<CollectionJob[]> {
  await ensureAppSchema();
  const result = await query<CollectionJob>(
    `SELECT id, name, site_url, keyword, collect_count, created_at
       FROM collection_jobs ORDER BY id DESC`,
  );
  return result.rows;
}

export async function createCollectionJobDb(input: {
  name: string;
  site_url: string;
  keyword?: string;
  collect_count?: number;
}): Promise<CollectionJob> {
  const name = input.name.trim();
  const siteUrl = input.site_url.trim();
  if (!name || !siteUrl) throw new HttpError(400, "name_url_required");
  const count = Math.max(1, Math.min(20, Number(input.collect_count) || 10));
  await ensureAppSchema();
  const result = await query<CollectionJob>(
    `INSERT INTO collection_jobs (name, site_url, keyword, collect_count)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, site_url, keyword, collect_count, created_at`,
    [name, siteUrl, input.keyword?.trim() ?? "", count],
  );
  return result.rows[0];
}

export async function deleteCollectionJobDb(id: number): Promise<void> {
  await ensureAppSchema();
  const result = await query("DELETE FROM collection_jobs WHERE id = $1", [id]);
  if (!result.rowCount) throw new HttpError(404, "job_missing");
}

export async function getCollectionDetailDb(id: number): Promise<{ job: CollectionJob; batches: CollectionBatch[] }> {
  await ensureAppSchema();
  const jobs = await query<CollectionJob>(
    `SELECT id, name, site_url, keyword, collect_count, created_at FROM collection_jobs WHERE id = $1`,
    [id],
  );
  const job = jobs.rows[0];
  if (!job) throw new HttpError(404, "job_missing");
  const batches = await query<Omit<CollectionBatch, "items">>(
    `SELECT id, batch_no, item_count, note, created_at
       FROM collection_batches WHERE job_id = $1 ORDER BY created_at DESC, id DESC`,
    [id],
  );
  const items = batches.rowCount
    ? await query<CollectionItem>(
        `SELECT id, batch_id, meta_platform, meta_public_url, meta_title, meta_creator_name, meta_publish_date,
                meta_duration_seconds, meta_view_count, meta_like_count, meta_comment_count, meta_save_count,
                meta_share_count, meta_follower_count, meta_hashtags, imported_video_id, created_at
           FROM collection_items
          WHERE batch_id = ANY($1::int[])
          ORDER BY id ASC`,
        [batches.rows.map((batch) => batch.id)],
      )
    : { rows: [] as CollectionItem[] };
  return {
    job,
    batches: batches.rows.map((batch) => ({
      ...batch,
      items: items.rows.filter((item) => item.batch_id === batch.id),
    })),
  };
}

export async function runCollectionJobDb(id: number): Promise<{ job: CollectionJob; batches: CollectionBatch[] }> {
  const detail = await getCollectionDetailDb(id);
  let collected;
  try {
    collected = await collectPublicMetadata({
      siteUrl: detail.job.site_url,
      keyword: detail.job.keyword,
      limit: detail.job.collect_count,
    });
  } catch (error) {
    collected = {
      items: [],
      note: error instanceof Error ? error.message : "collect_failed",
    };
  }
  const batch = batchNo(detail.batches.map((item) => item.batch_no));
  const inserted = await query<{ id: number }>(
    `INSERT INTO collection_batches (job_id, batch_no, item_count, note) VALUES ($1, $2, $3, $4) RETURNING id`,
    [id, batch, collected.items.length, collected.note],
  );
  for (const item of collected.items) {
    await query(
      `INSERT INTO collection_items (
         batch_id, meta_platform, meta_public_url, meta_title, meta_creator_name, meta_publish_date,
         meta_duration_seconds, meta_view_count, meta_like_count, meta_comment_count, meta_save_count,
         meta_share_count, meta_follower_count, meta_hashtags
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        inserted.rows[0].id,
        item.meta_platform,
        item.meta_public_url,
        item.meta_title,
        item.meta_creator_name,
        item.meta_publish_date,
        item.meta_duration_seconds,
        item.meta_view_count,
        item.meta_like_count,
        item.meta_comment_count,
        item.meta_save_count,
        item.meta_share_count,
        item.meta_follower_count,
        item.meta_hashtags,
      ],
    );
  }
  return getCollectionDetailDb(id);
}

export async function getCollectionItemDb(id: number): Promise<CollectionItem & { job_id: number }> {
  await ensureAppSchema();
  const result = await query<CollectionItem & { job_id: number }>(
    `SELECT i.*, b.job_id
       FROM collection_items i
       JOIN collection_batches b ON b.id = i.batch_id
      WHERE i.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) throw new HttpError(404, "item_missing");
  return row;
}

export async function updateCollectionItemDb(id: number, input: Partial<CollectedMeta>): Promise<void> {
  await ensureAppSchema();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of ITEM_FIELDS) {
    if (input[key] !== undefined) {
      values.push(input[key] === "" ? null : input[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return;
  values.push(id);
  const result = await query(`UPDATE collection_items SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, "item_missing");
}

export async function deleteCollectionItemDb(id: number): Promise<void> {
  await ensureAppSchema();
  const existing = await getCollectionItemDb(id);
  await query("DELETE FROM collection_items WHERE id = $1", [id]);
  await query(
    `UPDATE collection_batches
        SET item_count = (SELECT count(*) FROM collection_items WHERE batch_id = $1)
      WHERE id = $1`,
    [existing.batch_id],
  );
}

function videoIdFor(itemId: number): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");
  return `C${day}${itemId}`;
}

export async function importCollectionItemsDb(ids: number[]): Promise<{ imported: string[]; skipped: { id: number; reason: string }[] }> {
  const imported: string[] = [];
  const skipped: { id: number; reason: string }[] = [];
  for (const id of ids) {
    let item: CollectionItem;
    try {
      item = await getCollectionItemDb(id);
    } catch {
      skipped.push({ id, reason: "not_found" });
      continue;
    }
    if (item.imported_video_id) {
      skipped.push({ id, reason: "already_imported" });
      continue;
    }
    if (!item.meta_title || !item.meta_public_url) {
      skipped.push({ id, reason: "missing_title" });
      continue;
    }
    if (!item.meta_platform || !["douyin", "xiaohongshu", "bilibili"].includes(item.meta_platform)) {
      skipped.push({ id, reason: "platform" });
      continue;
    }
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
    try {
      const video = await createVideoDb({
        video_id: videoIdFor(id),
        selection_reason: "数据采集导入",
        source_kind: "collected",
        meta_platform: item.meta_platform,
        meta_public_url: item.meta_public_url,
        meta_title: item.meta_title,
        meta_creator_name: item.meta_creator_name || "未知",
        meta_publish_date: item.meta_publish_date || today,
        meta_duration_seconds: item.meta_duration_seconds,
        meta_collected_at: new Date().toISOString(),
        meta_view_count: item.meta_view_count,
        meta_like_count: item.meta_like_count,
        meta_comment_count: item.meta_comment_count,
        meta_save_count: item.meta_save_count,
        meta_share_count: item.meta_share_count,
        meta_follower_count: item.meta_follower_count,
        meta_hashtags: item.meta_hashtags,
      });
      await query("UPDATE collection_items SET imported_video_id = $1 WHERE id = $2", [video.video_id, id]);
      imported.push(video.video_id);
    } catch (error) {
      skipped.push({ id, reason: "import_failed" });
    }
  }
  return { imported, skipped };
}
