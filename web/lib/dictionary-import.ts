type DictValue = {
  code?: string;
  score?: number;
  label_zh?: string;
  definition?: string;
  [key: string]: unknown;
};

type FieldMeta = {
  label_zh?: string;
  field_kind?: string;
  question?: string;
  values?: DictValue[];
  sentinel_values?: DictValue[];
  anchors?: DictValue[];
  [key: string]: unknown;
};

export type ParsedDictionary = {
  set: {
    slug: string;
    name: string;
    description: string | null;
    version: string | null;
    source_doc: string | null;
    scope: string | null;
    extra: Record<string, unknown>;
  };
  fields: {
    field_key: string;
    label_zh: string;
    field_kind: string;
    question: string | null;
    extra: Record<string, unknown>;
  }[];
  items: {
    field_key: string;
    code: string;
    label_zh: string;
    definition: string | null;
    sort_order: number;
    extra: Record<string, unknown>;
  }[];
};

function itemFromValue(fieldKey: string, value: DictValue, sortOrder: number) {
  let code = value.code;
  let order = sortOrder;
  if (code === undefined && value.score !== undefined) {
    code = String(value.score);
    order = Number(value.score);
  }
  if (!code) {
    throw new Error(`${fieldKey} item is missing code/score`);
  }
  const extra: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (!["code", "label_zh", "definition", "score"].includes(key)) extra[key] = val;
  }
  return {
    field_key: fieldKey,
    code: String(code),
    label_zh: value.label_zh || String(code),
    definition: value.definition ?? null,
    sort_order: order,
    extra,
  };
}

export function parseLabelDictionary(slug: string, name: string, payload: Record<string, unknown>): ParsedDictionary {
  const fieldsOut: ParsedDictionary["fields"] = [];
  const itemsOut: ParsedDictionary["items"] = [];
  const fields = (payload.fields ?? {}) as Record<string, FieldMeta>;
  for (const [fieldKey, meta] of Object.entries(fields)) {
    const reserved = new Set(["values", "sentinel_values", "anchors", "label_zh", "field_kind", "question"]);
    const extra: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(meta)) {
      if (!reserved.has(key)) extra[key] = val;
    }
    fieldsOut.push({
      field_key: fieldKey,
      label_zh: meta.label_zh || fieldKey,
      field_kind: meta.field_kind || "enum",
      question: meta.question ?? null,
      extra,
    });
    const rawItems = meta.values || meta.sentinel_values || meta.anchors || [];
    rawItems.forEach((value, index) => {
      itemsOut.push(itemFromValue(fieldKey, value, index + 1));
    });
  }
  const extra: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (!["version", "source_doc", "scope", "fields"].includes(key)) extra[key] = val;
  }
  return {
    set: {
      slug,
      name,
      description: (payload.scope as string) ?? null,
      version: (payload.version as string) ?? null,
      source_doc: (payload.source_doc as string) ?? null,
      scope: (payload.scope as string) ?? null,
      extra,
    },
    fields: fieldsOut,
    items: itemsOut,
  };
}
