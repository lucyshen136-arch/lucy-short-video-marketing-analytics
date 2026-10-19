"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type { CollectionBatch, CollectionJob } from "@/lib/data/collections";
import { collectionNote, explainApiError, skipReason } from "@/lib/ui-notes";

async function send(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(typeof body?.detail === "string" ? body.detail : text || response.statusText);
  return body;
}

export default function CollectionDetail({ locale, jobId }: { locale: Locale; jobId: number }) {
  const en = locale === "en";
  const [job, setJob] = useState<CollectionJob | null>(null);
  const [batches, setBatches] = useState<CollectionBatch[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const data = (await send(`/api/v1/collections/${jobId}`)) as { job: CollectionJob; batches: CollectionBatch[] };
    setJob(data.job);
    setBatches(data.batches);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(explainApiError(err.message, en)));
  }, [jobId]);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  async function importSelected() {
    if (!selected.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = (await send("/api/v1/collection-items/import", {
        method: "POST",
        body: JSON.stringify({ ids: selected }),
      })) as { imported: string[]; skipped: { id: number; reason: string }[] };
      setNotice(
        en
          ? `Added ${result.imported.length}. Skipped ${result.skipped.length}.${result.skipped.length ? ` ${result.skipped.map((item) => `#${item.id} ${skipReason(item.reason, true)}`).join(" ")}` : ""}`
          : `已加入视频列表 ${result.imported.length} 条，跳过 ${result.skipped.length} 条。${result.skipped.map((item) => `#${item.id} ${skipReason(item.reason, false)}`).join(" ")}`,
      );
      setSelected([]);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? explainApiError(err.message, en) : en ? "Import failed" : "导入失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm(en ? "Delete this row?" : "删除这条采集记录？")) return;
    setBusy(true);
    try {
      await send(`/api/v1/collection-items/${id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? explainApiError(err.message, en) : en ? "Delete failed" : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  if (!job && !error) return <p className="text-sm text-slate-500">{en ? "Loading…" : "加载中…"}</p>;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/collections" className="text-sm text-blue-700 hover:underline">
          {en ? "← All collections" : "← 全部采集"}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{job?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {job?.site_url} · {job?.keyword || (en ? "no keyword" : "无关键字")} · {job?.collect_count}
        </p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <button type="button" disabled={busy || selected.length === 0} onClick={() => void importSelected()} className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">
        {en ? "Add selected to the video list" : "批量添加到视频列表"}
      </button>
      {batches.length === 0 && <p className="rounded border border-dashed bg-white p-8 text-center text-sm text-slate-500">{en ? "No batches yet. Run collection from the card." : "还没有批次。回到卡片上点采集。"}</p>}
      {batches.map((batch) => (
        <section key={batch.id} className="rounded-lg border bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="font-medium">{en ? "Batch" : "批次"} {batch.batch_no}</h2>
              <p className="text-sm text-slate-500">{collectionNote(batch.note, en)}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              className="rounded bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              onClick={() => {
                const ok = window.confirm(
                  en
                    ? `Delete batch ${batch.batch_no}? Videos already in the list stay there.`
                    : `删除批次 ${batch.batch_no}？已经加入视频列表的视频会保留。`,
                );
                if (!ok) return;
                setBusy(true);
                setError(null);
                void send(`/api/v1/collection-batches/${batch.id}`, { method: "DELETE" })
                  .then(async () => {
                    setSelected((prev) => prev.filter((id) => !batch.items.some((item) => item.id === id)));
                    await reload();
                  })
                  .catch((err: unknown) => {
                    setError(err instanceof Error ? explainApiError(err.message, en) : en ? "Delete failed" : "删除失败");
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {en ? "Delete batch" : "删除批次"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">{en ? "Title" : "标题"}</th>
                  <th className="px-3 py-2">{en ? "Platform" : "平台"}</th>
                  <th className="px-3 py-2">{en ? "Creator" : "作者"}</th>
                  <th className="px-3 py-2">{en ? "Published" : "发布"}</th>
                  <th className="px-3 py-2">{en ? "Views" : "播放"}</th>
                  <th className="px-3 py-2">{en ? "Video" : "视频"}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {batch.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} disabled={Boolean(item.imported_video_id)} />
                    </td>
                    <td className="max-w-xs truncate px-3 py-2">{item.meta_title || "—"}</td>
                    <td className="px-3 py-2">{item.meta_platform || "—"}</td>
                    <td className="px-3 py-2">{item.meta_creator_name || "—"}</td>
                    <td className="px-3 py-2">{item.meta_publish_date || "—"}</td>
                    <td className="px-3 py-2">{item.meta_view_count ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.imported_video_id || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-3 whitespace-nowrap">
                        <Link href={`/collections/${jobId}/items/${item.id}`} className="text-blue-700 hover:underline">{en ? "View" : "查看详情"}</Link>
                        <Link href={`/collections/${jobId}/items/${item.id}?edit=1`} className="text-blue-700 hover:underline">{en ? "Edit" : "编辑"}</Link>
                        <button type="button" className="text-red-700 hover:underline" onClick={() => void remove(item.id)}>{en ? "Delete" : "删除"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {batch.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">{en ? "This batch is empty." : "这一批没有采集到记录。"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
