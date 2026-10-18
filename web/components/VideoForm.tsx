"use client";

import { useEffect, useMemo, useState } from "react";

import { getContentDictionary, getViewerDictionary } from "@/lib/api";
import { DEFAULT_MODEL } from "@/lib/default-model";
import { messages, type Locale } from "@/lib/i18n";
import { optionDisplay } from "@/lib/labels";
import type { VideoModelField, VideoModelLayer } from "@/lib/data/video-model";
import type { LabelDictionary, VideoRecord } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  locale: Locale;
  initial?: VideoRecord;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const FALLBACK_LAYERS: VideoModelLayer[] = DEFAULT_MODEL.map((layer, layerIndex) => ({
  id: -(layerIndex + 1),
  layer_key: layer.layer_key,
  name: layer.name,
  sort_order: layerIndex,
  fields: layer.fields.map((field, fieldIndex) => ({
    id: -(layerIndex + 1) * 100 - fieldIndex,
    field_key: field.field_key,
    label: field.label,
    field_kind: field.field_kind,
    required: field.required,
    sort_order: fieldIndex,
    dictionary_slug: field.dictionary_slug,
    builtin: true,
  })),
}));

function emptyForm(): Record<string, string> {
  return {
    video_id: "",
    selection_reason: "",
    source_kind: "observed",
    meta_platform: "douyin",
    meta_public_url: "",
    meta_title: "",
    meta_creator_name: "",
    meta_publish_date: "",
    meta_duration_seconds: "",
    meta_collected_at: "",
    meta_view_count: "",
    meta_like_count: "",
    meta_comment_count: "",
    meta_save_count: "",
    meta_share_count: "",
    meta_follower_count: "",
    meta_hashtags: "",
    content_type: "",
    content_hook_type: "",
    content_narrative_structure: "",
    content_value_proposition: "",
    content_persuasion: "",
    content_evidence_type: "",
    content_funnel_stage: "",
    content_cta_type: "",
    viewer_continued_watching: "",
    viewer_memory_score: "",
    viewer_trust_score: "",
    viewer_action_intent_score: "",
    ai_content_type: "",
    ai_hook_type: "",
    ai_narrative_structure: "",
    ai_value_proposition: "",
    ai_persuasion: "",
    ai_evidence_type: "",
    ai_funnel_stage: "",
    ai_cta_type: "",
    ai_label_status: "",
  };
}

function toForm(record: VideoRecord): Record<string, string> {
  const base = emptyForm();
  for (const key of Object.keys(base)) {
    const val = record[key as keyof VideoRecord];
    if (val === null || val === undefined) {
      base[key] = "";
    } else {
      base[key] = String(val);
    }
  }
  return base;
}

function toPayload(form: Record<string, string>, mode: "create" | "edit") {
  const numericFields = new Set([
    "meta_duration_seconds",
    "meta_view_count",
    "meta_like_count",
    "meta_comment_count",
    "meta_save_count",
    "meta_share_count",
    "meta_follower_count",
    "viewer_memory_score",
    "viewer_trust_score",
    "viewer_action_intent_score",
  ]);
  const payload: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(form)) {
    if (mode === "edit" && key === "video_id") continue;
    if (raw === "") {
      payload[key] = null;
      continue;
    }
    if (numericFields.has(key)) {
      payload[key] = Number(raw);
    } else {
      payload[key] = raw;
    }
  }
  return payload;
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  blank,
  locale,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: { code: string; label_zh: string }[];
  blank: string;
  locale: Locale;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1.5"
      >
        <option value="">{blank}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {optionDisplay(name, o.code, o.label_zh, locale)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-600">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        required={required}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1.5"
      />
    </label>
  );
}

export default function VideoForm({ mode, locale, initial, onSubmit, onDelete }: Props) {
  const f = messages[locale].form;
  const platforms = [
    { code: "douyin", label: messages[locale].platforms.douyin },
    { code: "xiaohongshu", label: messages[locale].platforms.xiaohongshu },
    { code: "bilibili", label: messages[locale].platforms.bilibili },
  ];
  const [form, setForm] = useState<Record<string, string>>(() =>
    initial ? toForm(initial) : emptyForm(),
  );
  const [contentDict, setContentDict] = useState<LabelDictionary | null>(null);
  const [viewerDict, setViewerDict] = useState<LabelDictionary | null>(null);
  const [aiDict, setAiDict] = useState<LabelDictionary | null>(null);
  const [model, setModel] = useState<VideoModelLayer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      getContentDictionary(),
      getViewerDictionary(),
      fetch("/api/v1/dictionaries/ai").then((response) => (response.ok ? response.json() : null)),
      fetch("/api/v1/model").then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([c, v, ai, modelBody]) => {
        setContentDict(c);
        setViewerDict(v);
        setAiDict(ai as LabelDictionary | null);
        const layers = (modelBody as { layers?: VideoModelLayer[] } | null)?.layers;
        if (layers?.length) {
          setModel(layers);
          setForm((prev) => {
            const next = { ...prev };
            for (const layer of layers) {
              for (const field of layer.fields) {
                if (!(field.field_key in next)) next[field.field_key] = "";
              }
            }
            return next;
          });
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const contentOptions = useMemo(() => {
    if (!contentDict) return {} as Record<string, { code: string; label_zh: string }[]>;
    const out: Record<string, { code: string; label_zh: string }[]> = {};
    for (const [field, meta] of Object.entries(contentDict.fields)) {
      const rows = meta.values ?? meta.sentinel_values ?? meta.anchors ?? [];
      if (rows.length) {
        out[field] = rows.map((v) => ({
          code: String(v.code ?? v.score ?? ""),
          label_zh: v.label_zh,
        }));
      }
    }
    return out;
  }, [contentDict]);

  const dictionaryOptions = useMemo(() => {
    const out: Record<string, { code: string; label_zh: string }[]> = { ...contentOptions };
    for (const dict of [viewerDict, aiDict]) {
      if (!dict) continue;
      for (const [field, meta] of Object.entries(dict.fields)) {
        const rows = meta.values ?? meta.sentinel_values ?? meta.anchors ?? [];
        if (rows.length) {
          out[field] = rows.map((row) => ({
            code: String(row.code ?? row.score ?? ""),
            label_zh: row.label_zh,
          }));
        }
      }
    }
    return out;
  }, [aiDict, contentOptions, viewerDict]);

  function renderModelField(field: VideoModelField) {
    if (field.field_key === "meta_platform") {
      return (
        <label key={field.field_key} className="block text-sm">
          <span className="mb-1 block text-slate-600">{field.label}{field.required ? " *" : ""}</span>
          <select value={form.meta_platform} onChange={(e) => onChange("meta_platform", e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" required={field.required}>
            {platforms.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </select>
        </label>
      );
    }
    const options = dictionaryOptions[field.field_key] ?? [];
    if (field.field_kind === "enum" && options.length) {
      return (
        <SelectField
          key={field.field_key}
          label={field.label}
          name={field.field_key}
          value={form[field.field_key] ?? ""}
          onChange={onChange}
          options={options}
          blank={f.blank}
          locale={locale}
        />
      );
    }
    return (
      <TextField
        key={field.field_key}
        label={field.label}
        name={field.field_key}
        type={field.field_kind === "date" ? "date" : "text"}
        value={form[field.field_key] ?? ""}
        onChange={onChange}
        required={field.required}
      />
    );
  }

  function onChange(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(toPayload(form, mode));
    } catch (err) {
      setError(err instanceof Error ? err.message : f.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{f.governance}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {mode === "create" && (
            <TextField label="video_id" name="video_id" value={form.video_id} onChange={onChange} required />
          )}
          <TextField
            label={f.selectionReason}
            name="selection_reason"
            value={form.selection_reason}
            onChange={onChange}
            required
          />
          <TextField label="source_kind" name="source_kind" value={form.source_kind} onChange={onChange} />
        </div>
      </section>

      {(model ?? FALLBACK_LAYERS).map((layer) => (
        <section key={layer.id} className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">{layer.name}</h2>
          <div className="grid gap-3 md:grid-cols-2">{layer.fields.map((field) => renderModelField(field))}</div>
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? f.saving : f.save}
        </button>
        {onDelete && (
          <button
            type="button"
            disabled={busy}
            className="rounded border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(f.confirmDelete(form.video_id || initial?.video_id || ""))) return;
              setBusy(true);
              try {
                await onDelete();
              } catch (err) {
                setError(err instanceof Error ? err.message : f.deleteFailed);
                setBusy(false);
              }
            }}
          >
            {f.delete}
          </button>
        )}
      </div>
    </form>
  );
}
