import { query } from "@/lib/db";

let ready: Promise<void> | null = null;

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS video_model_layers (
     id SERIAL PRIMARY KEY,
     layer_key VARCHAR(64) UNIQUE NOT NULL,
     name VARCHAR(128) NOT NULL,
     sort_order INT NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS video_model_fields (
     id SERIAL PRIMARY KEY,
     layer_id INT NOT NULL REFERENCES video_model_layers(id) ON DELETE CASCADE,
     field_key VARCHAR(64) NOT NULL,
     label VARCHAR(128) NOT NULL,
     field_kind VARCHAR(32) NOT NULL DEFAULT 'text',
     required BOOLEAN NOT NULL DEFAULT FALSE,
     sort_order INT NOT NULL DEFAULT 0,
     dictionary_slug VARCHAR(64),
     builtin BOOLEAN NOT NULL DEFAULT FALSE,
     UNIQUE (layer_id, field_key)
   )`,
  `ALTER TABLE videos ADD COLUMN IF NOT EXISTS extra JSONB`,
  `CREATE TABLE IF NOT EXISTS model_api_keys (
     id SERIAL PRIMARY KEY,
     name VARCHAR(128) NOT NULL,
     base_url TEXT NOT NULL,
     model_name VARCHAR(128) NOT NULL,
     api_key TEXT NOT NULL,
     priority INT NOT NULL DEFAULT 0,
     timeout_seconds INT NOT NULL DEFAULT 30,
     enabled BOOLEAN NOT NULL DEFAULT TRUE,
     last_used_at TIMESTAMPTZ,
     cooldown_until TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS collection_jobs (
     id SERIAL PRIMARY KEY,
     name VARCHAR(128) NOT NULL,
     site_url TEXT NOT NULL,
     keyword TEXT NOT NULL DEFAULT '',
     collect_count INT NOT NULL DEFAULT 10,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS collection_batches (
     id SERIAL PRIMARY KEY,
     job_id INT NOT NULL REFERENCES collection_jobs(id) ON DELETE CASCADE,
     batch_no VARCHAR(32) NOT NULL,
     item_count INT NOT NULL DEFAULT 0,
     note TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS collection_items (
     id SERIAL PRIMARY KEY,
     batch_id INT NOT NULL REFERENCES collection_batches(id) ON DELETE CASCADE,
     meta_platform VARCHAR(64),
     meta_public_url TEXT,
     meta_title TEXT,
     meta_creator_name TEXT,
     meta_publish_date DATE,
     meta_duration_seconds INT,
     meta_view_count BIGINT,
     meta_like_count BIGINT,
     meta_comment_count BIGINT,
     meta_save_count BIGINT,
     meta_share_count BIGINT,
     meta_follower_count BIGINT,
     meta_hashtags TEXT,
     imported_video_id VARCHAR(64),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
];

export function ensureAppSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      for (const statement of STATEMENTS) {
        await query(statement);
      }
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}
