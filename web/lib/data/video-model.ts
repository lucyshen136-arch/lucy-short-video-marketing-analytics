import { BUILTIN_FIELD_KEYS, DEFAULT_MODEL, type ModelFieldKind } from "@/lib/default-model";
import { query } from "@/lib/db";
import { ensureAppSchema } from "@/lib/schema";
import { HttpError } from "@/lib/data/videos";

export type VideoModelField = {
  id: number;
  field_key: string;
  label: string;
  field_kind: string;
  required: boolean;
  sort_order: number;
  dictionary_slug: string | null;
  builtin: boolean;
};

export type VideoModelLayer = {
  id: number;
  layer_key: string;
  name: string;
  sort_order: number;
  fields: VideoModelField[];
};

const FIELD_KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;
const KINDS = new Set(["text", "number", "date", "datetime", "url", "enum"]);

type LayerRow = { id: number; layer_key: string; name: string; sort_order: number };
type FieldRow = VideoModelField & { layer_id: number };

function cleanKind(value: string): ModelFieldKind {
  if (!KINDS.has(value)) throw new HttpError(400, "字段类型无效");
  return value as ModelFieldKind;
}

export function completenessFromModel(model: { layers: VideoModelLayer[] }): { key: string; label: string; fields: string[] }[] {
  return model.layers.map((layer) => ({
    key: layer.layer_key,
    label: layer.name,
    fields: layer.fields.map((field) => field.field_key),
  }));
}

export async function getVideoModelDb(): Promise<{ layers: VideoModelLayer[] }> {
  await ensureAppSchema();
  const count = await query<{ count: string }>("SELECT count(*) FROM video_model_layers");
  if (Number(count.rows[0]?.count ?? 0) === 0) {
    for (const [layerIndex, layer] of DEFAULT_MODEL.entries()) {
      const inserted = await query<{ id: number }>(
        `INSERT INTO video_model_layers (layer_key, name, sort_order) VALUES ($1, $2, $3) RETURNING id`,
        [layer.layer_key, layer.name, layerIndex],
      );
      const layerId = inserted.rows[0].id;
      for (const [fieldIndex, item] of layer.fields.entries()) {
        await query(
          `INSERT INTO video_model_fields
             (layer_id, field_key, label, field_kind, required, sort_order, dictionary_slug, builtin)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
          [layerId, item.field_key, item.label, item.field_kind, item.required, fieldIndex, item.dictionary_slug],
        );
      }
    }
  }
  const layers = await query<LayerRow>("SELECT id, layer_key, name, sort_order FROM video_model_layers ORDER BY sort_order, id");
  const fields = await query<FieldRow>(
    `SELECT id, layer_id, field_key, label, field_kind, required, sort_order, dictionary_slug, builtin
       FROM video_model_fields ORDER BY sort_order, id`,
  );
  return {
    layers: layers.rows.map((layer) => ({
      ...layer,
      fields: fields.rows.filter((field) => field.layer_id === layer.id),
    })),
  };
}

export async function createLayerDb(name: string): Promise<VideoModelLayer> {
  const label = name.trim();
  if (!label) throw new HttpError(400, "层名称不能为空");
  await getVideoModelDb();
  const key = `layer_${Date.now().toString(36)}`;
  const sort = await query<{ max: number | null }>("SELECT max(sort_order) AS max FROM video_model_layers");
  const inserted = await query<LayerRow>(
    `INSERT INTO video_model_layers (layer_key, name, sort_order) VALUES ($1, $2, $3)
     RETURNING id, layer_key, name, sort_order`,
    [key, label, Number(sort.rows[0]?.max ?? 0) + 1],
  );
  return { ...inserted.rows[0], fields: [] };
}

export async function renameLayerDb(id: number, name: string): Promise<void> {
  const label = name.trim();
  if (!label) throw new HttpError(400, "层名称不能为空");
  await ensureAppSchema();
  const result = await query("UPDATE video_model_layers SET name = $1 WHERE id = $2", [label, id]);
  if (!result.rowCount) throw new HttpError(404, "层不存在");
}

export async function deleteLayerDb(id: number): Promise<void> {
  await ensureAppSchema();
  const result = await query("DELETE FROM video_model_layers WHERE id = $1", [id]);
  if (!result.rowCount) throw new HttpError(404, "层不存在");
}

export async function createFieldDb(layerId: number, input: {
  field_key: string;
  label: string;
  field_kind: string;
  required?: boolean;
  dictionary_slug?: string | null;
}): Promise<void> {
  const fieldKey = input.field_key.trim();
  const label = input.label.trim();
  if (!FIELD_KEY_RE.test(fieldKey)) throw new HttpError(400, "字段 key 只能用小写字母、数字和下划线");
  if (!label) throw new HttpError(400, "字段名称不能为空");
  const kind = cleanKind(input.field_kind);
  await ensureAppSchema();
  const layer = await query("SELECT id FROM video_model_layers WHERE id = $1", [layerId]);
  if (!layer.rowCount) throw new HttpError(404, "层不存在");
  const sort = await query<{ max: number | null }>(
    "SELECT max(sort_order) AS max FROM video_model_fields WHERE layer_id = $1",
    [layerId],
  );
  try {
    await query(
      `INSERT INTO video_model_fields
         (layer_id, field_key, label, field_kind, required, sort_order, dictionary_slug, builtin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        layerId,
        fieldKey,
        label,
        kind,
        Boolean(input.required),
        Number(sort.rows[0]?.max ?? 0) + 1,
        input.dictionary_slug || null,
        BUILTIN_FIELD_KEYS.has(fieldKey),
      ],
    );
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      throw new HttpError(409, "这一层已经有同名字段");
    }
    throw error;
  }
}

export async function updateFieldDb(
  id: number,
  input: { label?: string; field_kind?: string; required?: boolean; sort_order?: number; dictionary_slug?: string | null },
): Promise<void> {
  await ensureAppSchema();
  const sets: string[] = [];
  const values: unknown[] = [];
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) throw new HttpError(400, "字段名称不能为空");
    values.push(label);
    sets.push(`label = $${values.length}`);
  }
  if (input.field_kind !== undefined) {
    values.push(cleanKind(input.field_kind));
    sets.push(`field_kind = $${values.length}`);
  }
  if (input.required !== undefined) {
    values.push(Boolean(input.required));
    sets.push(`required = $${values.length}`);
  }
  if (input.sort_order !== undefined) {
    values.push(Number(input.sort_order) || 0);
    sets.push(`sort_order = $${values.length}`);
  }
  if (input.dictionary_slug !== undefined) {
    values.push(input.dictionary_slug || null);
    sets.push(`dictionary_slug = $${values.length}`);
  }
  if (!sets.length) return;
  values.push(id);
  const result = await query(`UPDATE video_model_fields SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
  if (!result.rowCount) throw new HttpError(404, "字段不存在");
}

export async function deleteFieldDb(id: number): Promise<void> {
  await ensureAppSchema();
  const result = await query("DELETE FROM video_model_fields WHERE id = $1", [id]);
  if (!result.rowCount) throw new HttpError(404, "字段不存在");
}
