import { collectPublicMetadata, type CollectedMeta, type PublicComment } from "@/lib/crawl";
import { labelCollectedItem, type AiLabelDraft } from "@/lib/collect-ai";
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
  ai_payload: (AiLabelDraft & { source_description: string | null; source_comments: PublicComment[] }) | null;
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

export async function updateCollectionJobDb(
  id: number,
  input: { name: string; site_url: string; keyword?: string; collect_count?: number },
): Promise<CollectionJob> {
  const name = input.name.trim();
  const siteUrl = input.site_url.trim();
  if (!name || !siteUrl) throw new HttpError(400, "name_url_required");
  const count = Math.max(1, Math.min(20, Number(input.collect_count) || 10));
  await ensureAppSchema();
  const result = await query<CollectionJob>(
    `UPDATE collection_jobs
        SET name = $2, site_url = $3, keyword = $4, collect_count = $5
      WHERE id = $1
      RETURNING id, name, site_url, keyword, collect_count, created_at`,
    [id, name, siteUrl, input.keyword?.trim() ?? "", count],
  );
  if (!result.rowCount) throw new HttpError(404, "job_missing");
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
                meta_share_count, meta_follower_count, meta_hashtags, imported_video_id, ai_payload, created_at
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

type StoredAi = NonNullable<CollectionItem["ai_payload"]>;

function emptyLabels(status: AiLabelDraft["ai_label_status"]): AiLabelDraft {
  return {
    ai_summary: null,
    ai_content_type: null,
    ai_hook_type: null,
    ai_narrative_structure: null,
    ai_value_proposition: null,
    ai_persuasion: null,
    ai_evidence_type: null,
    ai_funnel_stage: null,
    ai_cta_type: null,
    ai_label_status: status,
  };
}

function storeAi(item: CollectedMeta, labels: AiLabelDraft): StoredAi {
  return {
    ...labels,
    source_description: item.source_description,
    source_comments: item.source_comments ?? [],
  };
}

function splitInto<T>(items: T[], parts: number): T[][] {
  const groups: T[][] = Array.from({ length: parts }, () => []);
  items.forEach((item, index) => groups[index % parts].push(item));
  return groups.filter((group) => group.length > 0);
}

async function labelCollectedBatch(items: (CollectedMeta & { ai_payload?: StoredAi | null })[]): Promise<string> {
  const deadline = Date.now() + 300_000;
  let labeled = 0;
  let review = 0;
  let failed = 0;
  let unlabeled = 0;
  let noKey = false;
  for (const item of items) {
    if (noKey || Date.now() > deadline) {
      unlabeled += 1;
      item.ai_payload = storeAi(item, emptyLabels("not_labeled"));
      continue;
    }
    try {
      const labels = await labelCollectedItem({
        title: item.meta_title,
        description: item.source_description,
        hashtags: item.meta_hashtags,
        comments: item.source_comments ?? [],
      });
      item.ai_payload = storeAi(item, labels);
      if (labels.ai_label_status === "labeled") labeled += 1;
      else if (labels.ai_label_status === "needs_review") review += 1;
      else if (labels.ai_label_status === "failed") failed += 1;
      else unlabeled += 1;
    } catch (error) {
      if (error instanceof HttpError && error.message === "no_model_key") {
        noKey = true;
        unlabeled += 1;
        item.ai_payload = storeAi(item, emptyLabels("not_labeled"));
        continue;
      }
      failed += 1;
      item.ai_payload = storeAi(item, emptyLabels("failed"));
    }
  }
  return `labeled:${labeled}|review:${review}|failed:${failed}|unlabeled:${unlabeled}${noKey ? "|no_key:1" : ""}`;
}

export async function runCollectionJobDb(id: number): Promise<{ job: CollectionJob; batches: CollectionBatch[] }> {
  const detail = await getCollectionDetailDb(id);
  let collected: { items: (CollectedMeta & { ai_payload?: StoredAi | null })[]; note: string };
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
  const chunks = collected.items.length ? splitInto(collected.items, 5) : [[] as typeof collected.items];
  const labeledNotes = collected.items.length
    ? await Promise.all(chunks.map(async (chunk) => `${collected.note}|${await labelCollectedBatch(chunk)}`))
    : [collected.note];
  const usedNos = detail.batches.map((item) => item.batch_no);
  for (const [index, chunk] of chunks.entries()) {
    const note = labeledNotes[index] ?? collected.note;
    const batch = batchNo(usedNos);
    usedNos.push(batch);
    const inserted = await query<{ id: number }>(
      `INSERT INTO collection_batches (job_id, batch_no, item_count, note) VALUES ($1, $2, $3, $4) RETURNING id`,
      [id, batch, chunk.length, note],
    );
    for (const item of chunk) {
      await query(
        `INSERT INTO collection_items (
           batch_id, meta_platform, meta_public_url, meta_title, meta_creator_name, meta_publish_date,
           meta_duration_seconds, meta_view_count, meta_like_count, meta_comment_count, meta_save_count,
           meta_share_count, meta_follower_count, meta_hashtags, ai_payload
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)`,
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
          JSON.stringify(item.ai_payload ?? null),
        ],
      );
    }
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

const AI_EDITABLE = [
  "ai_summary",
  "ai_content_type",
  "ai_hook_type",
  "ai_narrative_structure",
  "ai_value_proposition",
  "ai_persuasion",
  "ai_evidence_type",
  "ai_funnel_stage",
  "ai_cta_type",
  "ai_label_status",
] as const;

export async function updateCollectionItemDb(id: number, input: Partial<CollectedMeta> & Partial<AiLabelDraft>): Promise<void> {
  await ensureAppSchema();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of ITEM_FIELDS) {
    if (input[key] !== undefined) {
      values.push(input[key] === "" ? null : input[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  const aiKeys = AI_EDITABLE.filter((key) => input[key] !== undefined);
  if (aiKeys.length) {
    const current = await getCollectionItemDb(id);
    const payload: Record<string, unknown> = {
      source_description: current.ai_payload?.source_description ?? current.source_description ?? null,
      source_comments: current.ai_payload?.source_comments ?? current.source_comments ?? [],
      ...(current.ai_payload ?? emptyLabels("not_labeled")),
    };
    for (const key of aiKeys) {
      const value = input[key];
      payload[key] = value === "" ? null : value;
    }
    values.push(JSON.stringify(payload));
    sets.push(`ai_payload = $${values.length}::jsonb`);
  }
  if (!sets.length) return;
  values.push(id);
  const result = await query(`UPDATE collection_items SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, "item_missing");
}

export async function deleteCollectionBatchDb(id: number): Promise<void> {
  await ensureAppSchema();
  const result = await query("DELETE FROM collection_batches WHERE id = $1", [id]);
  if (!result.rowCount) throw new HttpError(404, "batch_missing");
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
    const ai = item.ai_payload;
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
        ai_summary: ai?.ai_summary ?? null,
        ai_content_type: ai?.ai_content_type ?? null,
        ai_hook_type: ai?.ai_hook_type ?? null,
        ai_narrative_structure: ai?.ai_narrative_structure ?? null,
        ai_value_proposition: ai?.ai_value_proposition ?? null,
        ai_persuasion: ai?.ai_persuasion ?? null,
        ai_evidence_type: ai?.ai_evidence_type ?? null,
        ai_funnel_stage: ai?.ai_funnel_stage ?? null,
        ai_cta_type: ai?.ai_cta_type ?? null,
        ai_label_status: ai?.ai_label_status ?? null,
      });
      await query("UPDATE collection_items SET imported_video_id = $1 WHERE id = $2", [video.video_id, id]);
      imported.push(video.video_id);
    } catch (error) {
      skipped.push({ id, reason: "import_failed" });
    }
  }
  return { imported, skipped };
}
