"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { CollectedMeta, PublicComment } from "@/lib/crawl";
import type { Locale } from "@/lib/i18n";
import { aiChoices, contentLabel } from "@/lib/labels";
import { modelFieldName } from "@/lib/model-labels";
import { explainApiError } from "@/lib/ui-notes";

const FIELDS: { key: keyof CollectedMeta; label: string; labelEn: string }[] = [
  { key: "meta_platform", label: "平台", labelEn: "Platform" },
  { key: "meta_public_url", label: "公开链接", labelEn: "URL" },
  { key: "meta_title", label: "标题", labelEn: "Title" },
  { key: "meta_creator_name", label: "作者", labelEn: "Creator" },
  { key: "meta_publish_date", label: "发布日期", labelEn: "Published" },
  { key: "meta_duration_seconds", label: "时长（秒）", labelEn: "Duration (seconds)" },
  { key: "meta_view_count", label: "播放量", labelEn: "Views" },
  { key: "meta_like_count", label: "点赞", labelEn: "Likes" },
  { key: "meta_comment_count", label: "评论", labelEn: "Comments" },
  { key: "meta_save_count", label: "收藏", labelEn: "Saves" },
  { key: "meta_share_count", label: "分享", labelEn: "Shares" },
  { key: "meta_follower_count", label: "粉丝量", labelEn: "Followers" },
  { key: "meta_hashtags", label: "话题", labelEn: "Hashtags" },
];

const AI_ENUMS = [
  ["ai_content_type", "内容类型"],
  ["ai_hook_type", "Hook"],
  ["ai_narrative_structure", "叙事结构"],
  ["ai_persuasion", "说服机制"],
  ["ai_evidence_type", "证据方式"],
  ["ai_funnel_stage", "漏斗阶段"],
  ["ai_cta_type", "CTA"],
  ["ai_label_status", "AI 标注状态"],
] as const;

const AI_TEXT = [
  { key: "ai_summary", label: "内容简介", labelEn: "Synopsis" },
  { key: "ai_value_proposition", label: "价值主张", labelEn: "Value proposition" },
] as const;

type AiState = Record<(typeof AI_ENUMS)[number][0] | (typeof AI_TEXT)[number]["key"], string>;

const emptyAi = (): AiState => ({
  ai_summary: "",
  ai_value_proposition: "",
  ai_content_type: "",
  ai_hook_type: "",
  ai_narrative_structure: "",
  ai_persuasion: "",
  ai_evidence_type: "",
  ai_funnel_stage: "",
  ai_cta_type: "",
  ai_label_status: "",
});

export default function CollectionItemEditor({ locale, jobId, itemId }: { locale: Locale; jobId: number; itemId: number }) {
  const en = locale === "en";
  const editing = useSearchParams().get("edit") === "1";
  const [item, setItem] = useState<Record<string, string>>({});
  const [ai, setAi] = useState<AiState>(emptyAi);
  const [description, setDescription] = useState<string | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [imported, setImported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/collection-items/${itemId}`)
      .then((response) => response.json())
      .then((row: CollectedMeta & { imported_video_id?: string | null; ai_payload?: (Partial<AiState> & { source_description?: string | null; source_comments?: PublicComment[] }) | null }) => {
        const next: Record<string, string> = {};
        for (const field of FIELDS) next[field.key] = row[field.key] == null ? "" : String(row[field.key]);
        setItem(next);
        const payload = row.ai_payload;
        const nextAi = emptyAi();
        if (payload) {
          for (const key of Object.keys(nextAi) as (keyof AiState)[]) {
            const value = payload[key];
            nextAi[key] = value == null ? "" : String(value);
          }
        }
        setAi(nextAi);
        setDescription(payload?.source_description ?? null);
        setComments(payload?.source_comments ?? []);
        setImported(row.imported_video_id ?? null);
      })
      .catch((err: Error) => setError(explainApiError(err.message, en)));
  }, [itemId]);

  async function save(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload: Record<string, string | number | null> = {};
    for (const field of FIELDS) {
      const raw = item[field.key] ?? "";
      payload[field.key] = raw === "" ? null : field.key.endsWith("_count") || field.key.endsWith("_seconds") ? Number(raw) : raw;
    }
    for (const key of Object.keys(ai) as (keyof AiState)[]) payload[key] = ai[key] === "" ? null : ai[key];
    const response = await fetch(`/api/v1/collection-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!response.ok) {
      setError(explainApiError(await response.text(), en));
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <Link href={`/collections/${jobId}`} className="text-sm text-blue-700 hover:underline">
        {en ? "← Batch list" : "← 返回批次"}
      </Link>
      <h1 className="text-2xl font-semibold">{editing ? (en ? "Edit collected item" : "编辑采集记录") : en ? "Collected item" : "采集详情"}</h1>
      {imported && (
        <p className="text-sm text-slate-600">
          {en ? "In the video list as" : "已进入视频列表"} <Link href={`/videos/${imported}`} className="text-blue-700 hover:underline">{imported}</Link>
        </p>
      )}
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{en ? "Saved" : "已保存"}</p>}
      <form onSubmit={save} className="grid gap-3 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="mb-1 block text-slate-500">{en ? field.labelEn : field.label}</span>
            {editing ? (
              <input value={item[field.key] ?? ""} onChange={(event) => setItem((prev) => ({ ...prev, [field.key]: event.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5" />
            ) : (
              <span className="block break-words font-medium">{item[field.key] || "—"}</span>
            )}
          </label>
        ))}
      </form>
      <section className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">{en ? "AI labels" : "AI 标注"}</h2>
        <div>
          <h3 className="text-sm text-slate-500">{en ? "Author description on the page" : "页面上的作者简介"}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm">{description || "—"}</p>
        </div>
        <div>
          <h3 className="text-sm text-slate-500">{en ? "Top comments by heat" : "评论热度前 5"}</h3>
          {comments.length === 0 ? (
            <p className="mt-1 text-sm">—</p>
          ) : (
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
              {comments.map((comment) => (
                <li key={`${comment.heat}-${comment.text}`}>
                  {comment.text} <span className="text-slate-500">{en ? `heat ${comment.heat}` : `热度 ${comment.heat}`}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        {AI_TEXT.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="mb-1 block text-slate-500">{en ? field.labelEn : field.label}</span>
            {editing ? (
              <textarea value={ai[field.key]} onChange={(event) => setAi((prev) => ({ ...prev, [field.key]: event.target.value }))} rows={field.key === "ai_summary" ? 5 : 2} className="w-full rounded border border-slate-300 px-2 py-1.5" />
            ) : (
              <span className="block whitespace-pre-wrap font-medium">{ai[field.key] || "—"}</span>
            )}
          </label>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          {AI_ENUMS.map(([field, label]) => (
            <label key={field} className="block text-sm">
              <span className="mb-1 block text-slate-500">{modelFieldName(locale, field, label)}</span>
              {editing ? (
                <select value={ai[field]} onChange={(event) => setAi((prev) => ({ ...prev, [field]: event.target.value }))} className="w-full rounded border border-slate-300 px-2 py-1.5">
                  <option value="">{en ? "Blank" : "留空"}</option>
                  {aiChoices(field, locale).map((choice) => (
                    <option key={choice.code} value={choice.code}>{choice.label}</option>
                  ))}
                </select>
              ) : (
                <span className="block font-medium">{ai[field] ? contentLabel(field, ai[field], locale) : "—"}</span>
              )}
            </label>
          ))}
        </div>
        {editing && (
          <button type="button" disabled={busy} onClick={() => void save()} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            {en ? "Save" : "保存"}
          </button>
        )}
      </section>
    </div>
  );
}
