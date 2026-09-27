import contentDictionary from "../../data/content_label_dictionary.json";
import viewerDictionary from "../../data/viewer_label_dictionary.json";
import { query } from "@/lib/db";
import { parseLabelDictionary } from "@/lib/dictionary-import";
import type {
  DictionaryFieldRecord,
  DictionaryItemRecord,
  DictionarySetRecord,
  DictionarySetSummary,
  LabelDictionary,
} from "@/lib/types";
import { HttpError } from "@/lib/data/videos";

type SetRow = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  version: string | null;
  source_doc: string | null;
  scope: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type FieldRow = {
  id: number;
  set_id: number;
  field_key: string;
  label_zh: string;
  field_kind: string;
  question: string | null;
  extra: Record<string, unknown> | null;
};

type ItemRow = {
  id: number;
  field_id: number;
  code: string;
  label_zh: string;
  definition: string | null;
  sort_order: number;
  extra: Record<string, unknown> | null;
};

export async function listDictionarySetsDb(): Promise<DictionarySetSummary[]> {
  const result = await query<SetRow & { field_count: string | number; item_count: string | number }>(
    `SELECT s.*,
            (SELECT count(*) FROM dictionary_fields f WHERE f.set_id = s.id) AS field_count,
            (SELECT count(*) FROM dictionary_items i
               JOIN dictionary_fields f ON i.field_id = f.id
              WHERE f.set_id = s.id) AS item_count
       FROM dictionary_sets s
       ORDER BY s.id ASC`,
  );
  return result.rows.map((row) => ({
    ...row,
    extra: row.extra,
    field_count: Number(row.field_count ?? 0),
    item_count: Number(row.item_count ?? 0),
  }));
}

async function loadFields(setId: number): Promise<DictionaryFieldRecord[]> {
  const fields = await query<FieldRow>(
    "SELECT * FROM dictionary_fields WHERE set_id = $1 ORDER BY id ASC",
    [setId],
  );
  const items = await query<ItemRow>(
    `SELECT i.* FROM dictionary_items i
       JOIN dictionary_fields f ON i.field_id = f.id
      WHERE f.set_id = $1
      ORDER BY i.sort_order ASC, i.id ASC`,
    [setId],
  );
  const byField = new Map<number, DictionaryItemRecord[]>();
  for (const item of items.rows) {
    const list = byField.get(item.field_id) ?? [];
    list.push(item);
    byField.set(item.field_id, list);
  }
  return fields.rows.map((field) => ({
    ...field,
    items: byField.get(field.id) ?? [],
  }));
}

export async function getDictionarySetDb(slug: string): Promise<DictionarySetRecord> {
  const result = await query<SetRow>("SELECT * FROM dictionary_sets WHERE slug = $1", [slug]);
  if (!result.rowCount) {
    throw new HttpError(404, "Dictionary set not found");
  }
  const row = result.rows[0];
  return { ...row, fields: await loadFields(row.id) };
}

export async function createDictionarySetDb(payload: {
  slug: string;
  name: string;
  description?: string | null;
  version?: string | null;
  source_doc?: string | null;
  scope?: string | null;
}): Promise<DictionarySetRecord> {
  if (!/^[a-z0-9_-]+$/.test(payload.slug)) {
    throw new HttpError(400, "slug must match ^[a-z0-9_-]+$");
  }
  if (!payload.name?.trim()) {
    throw new HttpError(400, "name is required");
  }
  const existing = await query("SELECT id FROM dictionary_sets WHERE slug = $1", [payload.slug]);
  if (existing.rowCount) {
    throw new HttpError(409, "slug already exists");
  }
  await query(
    `INSERT INTO dictionary_sets (slug, name, description, version, source_doc, scope)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      payload.slug,
      payload.name.trim(),
      payload.description ?? null,
      payload.version ?? null,
      payload.source_doc ?? null,
      payload.scope ?? null,
    ],
  );
  return getDictionarySetDb(payload.slug);
}

export async function updateDictionarySetDb(
  slug: string,
  payload: {
    name: string;
    description?: string | null;
    version?: string | null;
    source_doc?: string | null;
    scope?: string | null;
  },
): Promise<DictionarySetRecord> {
  if (!payload.name?.trim()) {
    throw new HttpError(400, "name is required");
  }
  const result = await query(
    `UPDATE dictionary_sets
        SET name = $1, description = $2, version = $3, source_doc = $4, scope = $5, updated_at = now()
      WHERE slug = $6`,
    [
      payload.name.trim(),
      payload.description ?? null,
      payload.version ?? null,
      payload.source_doc ?? null,
      payload.scope ?? null,
      slug,
    ],
  );
  if (!result.rowCount) {
    throw new HttpError(404, "Dictionary set not found");
  }
  return getDictionarySetDb(slug);
}

export async function deleteDictionarySetDb(slug: string): Promise<void> {
  const result = await query("DELETE FROM dictionary_sets WHERE slug = $1", [slug]);
  if (!result.rowCount) {
    throw new HttpError(404, "Dictionary set not found");
  }
}

export async function createFieldDb(
  slug: string,
  payload: { field_key: string; label_zh: string; field_kind?: string; question?: string | null },
) {
  const set = await getDictionarySetDb(slug);
  if (set.fields.some((f) => f.field_key === payload.field_key)) {
    throw new HttpError(409, "field_key already exists");
  }
  const result = await query<FieldRow>(
    `INSERT INTO dictionary_fields (set_id, field_key, label_zh, field_kind, question)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [set.id, payload.field_key, payload.label_zh, payload.field_kind || "enum", payload.question ?? null],
  );
  return { ...result.rows[0], items: [] };
}

export async function updateFieldDb(
  slug: string,
  fieldKey: string,
  payload: { label_zh: string; field_kind?: string; question?: string | null },
) {
  const set = await getDictionarySetDb(slug);
  const field = set.fields.find((f) => f.field_key === fieldKey);
  if (!field) throw new HttpError(404, "field not found in this set");
  const result = await query<FieldRow>(
    `UPDATE dictionary_fields
        SET label_zh = $1, field_kind = $2, question = $3
      WHERE id = $4
      RETURNING *`,
    [payload.label_zh, payload.field_kind || "enum", payload.question ?? null, field.id],
  );
  return { ...result.rows[0], items: field.items };
}

export async function deleteFieldDb(slug: string, fieldKey: string) {
  const set = await getDictionarySetDb(slug);
  const field = set.fields.find((f) => f.field_key === fieldKey);
  if (!field) throw new HttpError(404, "field not found in this set");
  await query("DELETE FROM dictionary_fields WHERE id = $1", [field.id]);
}

export async function createItemDb(
  slug: string,
  payload: { field_key: string; code: string; label_zh: string; definition?: string | null; sort_order?: number },
) {
  const set = await getDictionarySetDb(slug);
  const field = set.fields.find((f) => f.field_key === payload.field_key);
  if (!field) throw new HttpError(404, "field not found in this set");
  if (field.items.some((item) => item.code === payload.code)) {
    throw new HttpError(409, "code already exists in this field");
  }
  let sortOrder = payload.sort_order ?? 0;
  if (!sortOrder) {
    sortOrder = Math.max(0, ...field.items.map((i) => i.sort_order)) + 1;
  }
  const result = await query<ItemRow>(
    `INSERT INTO dictionary_items (field_id, code, label_zh, definition, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [field.id, payload.code, payload.label_zh, payload.definition ?? null, sortOrder],
  );
  return result.rows[0];
}

export async function updateItemDb(
  itemId: number,
  payload: { code: string; label_zh: string; definition?: string | null; sort_order: number },
) {
  const result = await query<ItemRow>(
    `UPDATE dictionary_items
        SET code = $1, label_zh = $2, definition = $3, sort_order = $4
      WHERE id = $5
      RETURNING *`,
    [payload.code, payload.label_zh, payload.definition ?? null, payload.sort_order, itemId],
  );
  if (!result.rowCount) throw new HttpError(404, "Item not found");
  return result.rows[0];
}

export async function deleteItemDb(itemId: number) {
  const result = await query("DELETE FROM dictionary_items WHERE id = $1", [itemId]);
  if (!result.rowCount) throw new HttpError(404, "Item not found");
}

function setAsLabelJson(set: DictionarySetRecord): LabelDictionary & Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const field of set.fields) {
    const values = field.items.map((item) => ({
      code: item.code,
      label_zh: item.label_zh,
      definition: item.definition,
      ...(item as DictionaryItemRecord & { extra?: Record<string, unknown> }),
    }));
    const fieldBody: Record<string, unknown> = {
      label_zh: field.label_zh,
      field_kind: field.field_kind,
      question: field.question,
    };
    if (field.field_kind === "ordinal_score") {
      fieldBody.anchors = field.items.map((item) => ({
        score: /^\d+$/.test(item.code) ? Number(item.code) : item.code,
        label_zh: item.label_zh,
        definition: item.definition,
      }));
    } else if (field.field_kind === "free_text") {
      fieldBody.sentinel_values = values.map((v) => ({
        code: v.code,
        label_zh: v.label_zh,
        definition: v.definition,
      }));
    } else {
      fieldBody.values = values.map((v) => ({
        code: v.code,
        label_zh: v.label_zh,
        definition: v.definition,
      }));
    }
    fields[field.field_key] = fieldBody;
  }
  return {
    version: set.version,
    source_doc: set.source_doc,
    scope: set.scope,
    fields: fields as LabelDictionary["fields"],
  };
}

export async function getLabelDictionaryDb(slug: "content" | "viewer") {
  try {
    const set = await getDictionarySetDb(slug);
    return setAsLabelJson(set);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      const payload = slug === "content" ? contentDictionary : viewerDictionary;
      return payload as unknown as LabelDictionary;
    }
    throw error;
  }
}

async function upsertParsed(parsed: ReturnType<typeof parseLabelDictionary>) {
  const existing = await query<SetRow>("SELECT * FROM dictionary_sets WHERE slug = $1", [parsed.set.slug]);
  let setId: number;
  if (!existing.rowCount) {
    const inserted = await query<{ id: number }>(
      `INSERT INTO dictionary_sets (slug, name, description, version, source_doc, scope, extra)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id`,
      [
        parsed.set.slug,
        parsed.set.name,
        parsed.set.description,
        parsed.set.version,
        parsed.set.source_doc,
        parsed.set.scope,
        JSON.stringify(parsed.set.extra),
      ],
    );
    setId = inserted.rows[0].id;
  } else {
    setId = existing.rows[0].id;
    await query(
      `UPDATE dictionary_sets
          SET name = $1, description = $2, version = $3, source_doc = $4, scope = $5, extra = $6::jsonb, updated_at = now()
        WHERE id = $7`,
      [
        parsed.set.name,
        parsed.set.description,
        parsed.set.version,
        parsed.set.source_doc,
        parsed.set.scope,
        JSON.stringify(parsed.set.extra),
        setId,
      ],
    );
  }

  const currentFields = await query<FieldRow>("SELECT * FROM dictionary_fields WHERE set_id = $1", [setId]);
  const fieldsByKey = new Map(currentFields.rows.map((f) => [f.field_key, f]));
  for (const field of parsed.fields) {
    const found = fieldsByKey.get(field.field_key);
    if (!found) {
      const inserted = await query<FieldRow>(
        `INSERT INTO dictionary_fields (set_id, field_key, label_zh, field_kind, question, extra)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING *`,
        [setId, field.field_key, field.label_zh, field.field_kind, field.question, JSON.stringify(field.extra)],
      );
      fieldsByKey.set(field.field_key, inserted.rows[0]);
    } else {
      await query(
        `UPDATE dictionary_fields
            SET label_zh = $1, field_kind = $2, question = $3, extra = $4::jsonb
          WHERE id = $5`,
        [field.label_zh, field.field_kind, field.question, JSON.stringify(field.extra), found.id],
      );
    }
  }

  const items = await query<ItemRow>(
    `SELECT i.* FROM dictionary_items i
       JOIN dictionary_fields f ON i.field_id = f.id
      WHERE f.set_id = $1`,
    [setId],
  );
  const itemKey = (fieldId: number, code: string) => `${fieldId}:${code}`;
  const itemsByKey = new Map(items.rows.map((i) => [itemKey(i.field_id, i.code), i]));
  for (const item of parsed.items) {
    const field = fieldsByKey.get(item.field_key);
    if (!field) continue;
    const found = itemsByKey.get(itemKey(field.id, item.code));
    if (!found) {
      await query(
        `INSERT INTO dictionary_items (field_id, code, label_zh, definition, sort_order, extra)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [field.id, item.code, item.label_zh, item.definition, item.sort_order, JSON.stringify(item.extra)],
      );
    } else {
      await query(
        `UPDATE dictionary_items
            SET label_zh = $1, definition = $2, sort_order = $3, extra = $4::jsonb
          WHERE id = $5`,
        [item.label_zh, item.definition, item.sort_order, JSON.stringify(item.extra), found.id],
      );
    }
  }
}

export async function importProjectDictionariesDb(): Promise<DictionarySetSummary[]> {
  const sources = [
    { slug: "content", name: "内容与营销", payload: contentDictionary as Record<string, unknown> },
    { slug: "viewer", name: "个人反应", payload: viewerDictionary as Record<string, unknown> },
  ];
  for (const source of sources) {
    await upsertParsed(parseLabelDictionary(source.slug, source.name, source.payload));
  }
  return listDictionarySetsDb();
}
