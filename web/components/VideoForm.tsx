"use client";

import { useEffect, useMemo, useState } from "react";

import { getContentDictionary, getViewerDictionary } from "@/lib/api";
import { messages, type Locale } from "@/lib/i18n";
import { optionDisplay } from "@/lib/labels";
import type { LabelDictionary, VideoRecord } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  locale: Locale;
  initial?: VideoRecord;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
};

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getContentDictionary(), getViewerDictionary()])
      .then(([c, v]) => {
        setContentDict(c);
        setViewerDict(v);
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

  const viewerWatching = (
    viewerDict?.fields.viewer_continued_watching?.values ??
    viewerDict?.fields.viewer_continued_watching?.sentinel_values ??
    []
  ).map((v) => ({ code: String(v.code ?? ""), label_zh: v.label_zh }));

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

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{f.layer1}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{f.platform} *</span>
            <select
              value={form.meta_platform}
              onChange={(e) => onChange("meta_platform", e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1.5"
              required
            >
              {platforms.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <TextField label={f.title} name="meta_title" value={form.meta_title} onChange={onChange} required />
          <TextField label={f.url} name="meta_public_url" value={form.meta_public_url} onChange={onChange} required />
          <TextField label={f.creator} name="meta_creator_name" value={form.meta_creator_name} onChange={onChange} required />
          <TextField label={f.publishDate} name="meta_publish_date" type="date" value={form.meta_publish_date} onChange={onChange} required />
          <TextField label={f.duration} name="meta_duration_seconds" value={form.meta_duration_seconds} onChange={onChange} />
          <TextField label={f.collectedAt} name="meta_collected_at" value={form.meta_collected_at} onChange={onChange} />
          <TextField label={f.views} name="meta_view_count" value={form.meta_view_count} onChange={onChange} />
          <TextField label={f.likes} name="meta_like_count" value={form.meta_like_count} onChange={onChange} />
          <TextField label={f.comments} name="meta_comment_count" value={form.meta_comment_count} onChange={onChange} />
          <TextField label={f.saves} name="meta_save_count" value={form.meta_save_count} onChange={onChange} />
          <TextField label={f.shares} name="meta_share_count" value={form.meta_share_count} onChange={onChange} />
          <TextField label={f.followers} name="meta_follower_count" value={form.meta_follower_count} onChange={onChange} />
          <TextField label={f.hashtags} name="meta_hashtags" value={form.meta_hashtags} onChange={onChange} />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{f.layer2}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label={f.contentType} name="content_type" value={form.content_type} onChange={onChange} options={contentOptions.content_type ?? []} blank={f.blank} locale={locale} />
          <SelectField label={f.hook} name="content_hook_type" value={form.content_hook_type} onChange={onChange} options={contentOptions.content_hook_type ?? []} blank={f.blank} locale={locale} />
          <SelectField label={f.narrative} name="content_narrative_structure" value={form.content_narrative_structure} onChange={onChange} options={contentOptions.content_narrative_structure ?? []} blank={f.blank} locale={locale} />
          <TextField label={f.value} name="content_value_proposition" value={form.content_value_proposition} onChange={onChange} />
          <SelectField label={f.persuasion} name="content_persuasion" value={form.content_persuasion} onChange={onChange} options={contentOptions.content_persuasion ?? []} blank={f.blank} locale={locale} />
          <SelectField label={f.evidence} name="content_evidence_type" value={form.content_evidence_type} onChange={onChange} options={contentOptions.content_evidence_type ?? []} blank={f.blank} locale={locale} />
          <SelectField label={f.funnel} name="content_funnel_stage" value={form.content_funnel_stage} onChange={onChange} options={contentOptions.content_funnel_stage ?? []} blank={f.blank} locale={locale} />
          <SelectField label={f.cta} name="content_cta_type" value={form.content_cta_type} onChange={onChange} options={contentOptions.content_cta_type ?? []} blank={f.blank} locale={locale} />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{f.layer3}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <SelectField label={f.watching} name="viewer_continued_watching" value={form.viewer_continued_watching} onChange={onChange} options={viewerWatching} blank={f.blank} locale={locale} />
          <TextField label={f.memory} name="viewer_memory_score" value={form.viewer_memory_score} onChange={onChange} />
          <TextField label={f.trust} name="viewer_trust_score" value={form.viewer_trust_score} onChange={onChange} />
          <TextField label={f.action} name="viewer_action_intent_score" value={form.viewer_action_intent_score} onChange={onChange} />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{f.layer4}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="ai_content_type" name="ai_content_type" value={form.ai_content_type} onChange={onChange} />
          <TextField label="ai_hook_type" name="ai_hook_type" value={form.ai_hook_type} onChange={onChange} />
          <TextField label="ai_narrative_structure" name="ai_narrative_structure" value={form.ai_narrative_structure} onChange={onChange} />
          <TextField label="ai_value_proposition" name="ai_value_proposition" value={form.ai_value_proposition} onChange={onChange} />
          <TextField label="ai_persuasion" name="ai_persuasion" value={form.ai_persuasion} onChange={onChange} />
          <TextField label="ai_evidence_type" name="ai_evidence_type" value={form.ai_evidence_type} onChange={onChange} />
          <TextField label="ai_funnel_stage" name="ai_funnel_stage" value={form.ai_funnel_stage} onChange={onChange} />
          <TextField label="ai_cta_type" name="ai_cta_type" value={form.ai_cta_type} onChange={onChange} />
          <TextField label="ai_label_status" name="ai_label_status" value={form.ai_label_status} onChange={onChange} />
        </div>
      </section>

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
