"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { CollectedMeta } from "@/lib/crawl";
import type { Locale } from "@/lib/i18n";

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

export default function CollectionItemEditor({ locale, jobId, itemId }: { locale: Locale; jobId: number; itemId: number }) {
  const en = locale === "en";
  const editing = useSearchParams().get("edit") === "1";
  const [item, setItem] = useState<Record<string, string>>({});
  const [imported, setImported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/collection-items/${itemId}`)
      .then((response) => response.json())
      .then((row: CollectedMeta & { imported_video_id?: string | null }) => {
        const next: Record<string, string> = {};
        for (const field of FIELDS) next[field.key] = row[field.key] == null ? "" : String(row[field.key]);
        setItem(next);
        setImported(row.imported_video_id ?? null);
      })
      .catch((err: Error) => setError(err.message));
  }, [itemId]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const payload: Record<string, string | number | null> = {};
    for (const field of FIELDS) {
      const raw = item[field.key] ?? "";
      payload[field.key] = raw === "" ? null : field.key.endsWith("_count") || field.key.endsWith("_seconds") ? Number(raw) : raw;
    }
    const response = await fetch(`/api/v1/collection-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!response.ok) {
      setError(await response.text());
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
        {editing && (
          <div className="md:col-span-2">
            <button type="submit" disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {en ? "Save" : "保存"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
