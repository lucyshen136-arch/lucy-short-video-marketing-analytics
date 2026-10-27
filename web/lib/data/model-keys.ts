import { query } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";
import { HttpError } from "@/lib/data/videos";

export type ModelKeyPublic = {
  id: number;
  name: string;
  base_url: string;
  model_name: string;
  api_key_mask: string;
  priority: number;
  timeout_seconds: number;
  enabled: boolean;
  last_used_at: string | null;
  cooldown_until: string | null;
  primary: boolean;
  status: "available" | "disabled" | "cooling";
};

type KeyRow = {
  id: number;
  name: string;
  base_url: string;
  model_name: string;
  api_key: string;
  priority: number;
  timeout_seconds: number;
  enabled: boolean;
  last_used_at: string | null;
  cooldown_until: string | null;
};

const COOLDOWN_MS = 10 * 60 * 1000;

function maskKey(value: string): string {
  const tail = value.slice(-4);
  return `••••${tail}`;
}

function cooling(row: KeyRow): boolean {
  if (!row.cooldown_until) return false;
  return new Date(row.cooldown_until).getTime() > Date.now();
}

function present(rows: KeyRow[]): ModelKeyPublic[] {
  const primaryId = rows.find((row) => row.enabled && !cooling(row))?.id ?? null;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    base_url: row.base_url,
    model_name: row.model_name,
    api_key_mask: maskKey(row.api_key),
    priority: row.priority,
    timeout_seconds: row.timeout_seconds,
    enabled: row.enabled,
    last_used_at: row.last_used_at,
    cooldown_until: cooling(row) ? row.cooldown_until : null,
    primary: row.id === primaryId,
    status: !row.enabled ? "disabled" : cooling(row) ? "cooling" : "available",
  }));
}

async function listRows(): Promise<KeyRow[]> {
  await ensureAppSchema();
  const result = await query<KeyRow>(
    `SELECT id, name, base_url, model_name, api_key, priority, timeout_seconds, enabled, last_used_at, cooldown_until
       FROM model_api_keys
      ORDER BY priority ASC, id ASC`,
  );
  return result.rows;
}

export async function listModelKeysDb(): Promise<ModelKeyPublic[]> {
  return present(await listRows());
}

function cleanUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new HttpError(400, "https_url");
  }
  if (url.protocol !== "https:") throw new HttpError(400, "https_only");
  return url.toString().replace(/\/$/, "");
}

export async function createModelKeyDb(input: {
  name: string;
  base_url: string;
  model_name: string;
  api_key: string;
  priority?: number;
  timeout_seconds?: number;
}): Promise<ModelKeyPublic[]> {
  const name = input.name.trim();
  const modelName = input.model_name.trim();
  const apiKey = input.api_key.trim();
  if (!name || !modelName || !apiKey) throw new HttpError(400, "key_required");
  const timeout = Math.max(5, Math.min(120, Number(input.timeout_seconds) || 30));
  await ensureAppSchema();
  await query(
    `INSERT INTO model_api_keys (name, base_url, model_name, api_key, priority, timeout_seconds)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name, cleanUrl(input.base_url), modelName, apiKey, Number(input.priority) || 0, timeout],
  );
  return listModelKeysDb();
}

export async function updateModelKeyDb(
  id: number,
  input: {
    name?: string;
    base_url?: string;
    model_name?: string;
    api_key?: string;
    priority?: number;
    timeout_seconds?: number;
    enabled?: boolean;
  },
): Promise<ModelKeyPublic[]> {
  await ensureAppSchema();
  const sets: string[] = ["updated_at = now()"];
  const values: unknown[] = [];
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new HttpError(400, "name_required");
    values.push(name);
    sets.push(`name = $${values.length}`);
  }
  if (input.base_url !== undefined) {
    values.push(cleanUrl(input.base_url));
    sets.push(`base_url = $${values.length}`);
  }
  if (input.model_name !== undefined) {
    const modelName = input.model_name.trim();
    if (!modelName) throw new HttpError(400, "model_required");
    values.push(modelName);
    sets.push(`model_name = $${values.length}`);
  }
  if (input.api_key !== undefined && input.api_key.trim()) {
    values.push(input.api_key.trim());
    sets.push(`api_key = $${values.length}`);
  }
  if (input.priority !== undefined) {
    values.push(Number(input.priority) || 0);
    sets.push(`priority = $${values.length}`);
  }
  if (input.timeout_seconds !== undefined) {
    values.push(Math.max(5, Math.min(120, Number(input.timeout_seconds) || 30)));
    sets.push(`timeout_seconds = $${values.length}`);
  }
  if (input.enabled !== undefined) {
    values.push(Boolean(input.enabled));
    sets.push(`enabled = $${values.length}`);
    if (input.enabled) sets.push("cooldown_until = NULL");
  }
  values.push(id);
  const result = await query(`UPDATE model_api_keys SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, "key_missing");
  return listModelKeysDb();
}

export async function deleteModelKeyDb(id: number): Promise<ModelKeyPublic[]> {
  await ensureAppSchema();
  const result = await query("DELETE FROM model_api_keys WHERE id = $1", [id]);
  if (!result.rowCount) throw new HttpError(404, "key_missing");
  return listModelKeysDb();
}

function shouldCool(status: number): boolean {
  return status === 401 || status === 402 || status === 403 || status === 408 || status === 429;
}

export async function testModelKeyDb(id: number): Promise<{ ok: boolean; message: string; keys: ModelKeyPublic[] }> {
  await ensureAppSchema();
  const found = await query<KeyRow>(
    `SELECT id, name, base_url, model_name, api_key, priority, timeout_seconds, enabled, last_used_at, cooldown_until
       FROM model_api_keys WHERE id = $1`,
    [id],
  );
  const row = found.rows[0];
  if (!row) throw new HttpError(404, "key_missing");
  const endpoint = `${row.base_url.replace(/\/$/, "")}/chat/completions`;
  let ok = false;
  let message = "request";
  let cool = false;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(row.timeout_seconds * 1000),
      headers: {
        Authorization: `Bearer ${row.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: row.model_name,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });
    if (response.ok) {
      ok = true;
      message = "ok";
    } else {
      cool = shouldCool(response.status) || response.status >= 500;
      message = cool ? `cooled:${response.status}` : `http:${response.status}`;
    }
  } catch (error) {
    cool = true;
    message = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "request";
  }
  await query(
    `UPDATE model_api_keys
        SET last_used_at = now(),
            updated_at = now(),
            enabled = CASE WHEN $2::boolean THEN TRUE ELSE enabled END,
            cooldown_until = CASE WHEN $2::boolean THEN NULL ELSE $3::timestamptz END
      WHERE id = $1`,
    [id, ok, cool ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null],
  );
  return { ok, message, keys: await listModelKeysDb() };
}

async function rememberKeyUse(id: number, ok: boolean, cool: boolean): Promise<void> {
  await query(
    `UPDATE model_api_keys
        SET last_used_at = now(),
            updated_at = now(),
            cooldown_until = CASE WHEN $2::boolean THEN NULL ELSE $3::timestamptz END
      WHERE id = $1`,
    [id, ok, cool ? new Date(Date.now() + COOLDOWN_MS).toISOString() : null],
  );
}

export async function completeChat(prompt: string): Promise<string> {
  const rows = (await listRows()).filter((row) => row.enabled && !cooling(row));
  if (!rows.length) throw new HttpError(503, "no_model_key");
  let last = "request";
  for (const row of rows) {
    const endpoint = `${row.base_url.replace(/\/$/, "")}/chat/completions`;
    let ok = false;
    let cool = false;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(Math.min(row.timeout_seconds, 60) * 1000),
        headers: {
          Authorization: `Bearer ${row.api_key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: row.model_name,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });
      if (!response.ok) {
        cool = shouldCool(response.status) || response.status >= 500;
        last = cool ? `cooled:${response.status}` : `http:${response.status}`;
        await rememberKeyUse(row.id, false, cool);
        continue;
      }
      const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const text = body.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        last = "empty";
        await rememberKeyUse(row.id, false, false);
        continue;
      }
      ok = true;
      await rememberKeyUse(row.id, true, false);
      return text;
    } catch (error) {
      cool = true;
      last = error instanceof Error && error.name === "TimeoutError" ? "timeout" : "request";
      await rememberKeyUse(row.id, false, true);
    }
    if (ok) break;
  }
  throw new HttpError(502, last);
}
