"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type { CollectionJob } from "@/lib/data/collections";
import { explainApiError } from "@/lib/ui-notes";

type Draft = { name: string; site_url: string; keyword: string; collect_count: string };

const emptyDraft: Draft = { name: "", site_url: "", keyword: "", collect_count: "10" };

const outlineButton = "inline-flex items-center rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50";
const primaryButton = "inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50";
const dangerButton = "inline-flex items-center rounded bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50";

async function send(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || response.statusText);
  return text ? JSON.parse(text) : null;
}

export default function CollectionBoard({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const [jobs, setJobs] = useState<CollectionJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  async function reload() {
    setJobs((await send("/api/v1/collections")) as CollectionJob[]);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(explainApiError(err.message, en)));
  }, []);

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? explainApiError(err.message, en) : en ? "Request failed" : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{en ? "Collection" : "数据采集"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {en
            ? "Each card is one collection setup. Collect reads the public page for metadata, the author's description, and up to five comments that the page itself shows, ranked by heat. It writes a synopsis from those sources, then fills the AI label fields from that synopsis. It does not log in or bypass access limits."
            : "每张卡片是一套采集配置。采集读取公开页面上的元数据、作者简介，以及页面自己露出的评论，按热度取前 5 条。先据此写内容简介，再从简介里填写 AI 标注。不登录，也不绕过访问限制。"}
        </p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <article key={job.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {editingId === job.id ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => {
                    await send(`/api/v1/collections/${job.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ ...draft, collect_count: Number(draft.collect_count) }),
                    });
                    setEditingId(null);
                    setDraft(emptyDraft);
                  });
                }}
              >
                <div className="grid gap-3 px-5 pb-6 pt-5">
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500">{en ? "Name" : "名称"}</span>
                    <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5" required />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-slate-500">{en ? "Site URL" : "网站地址"}</span>
                    <input value={draft.site_url} onChange={(event) => setDraft({ ...draft, site_url: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5" required />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500">{en ? "Keyword" : "关键字"}</span>
                      <input value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5" />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-slate-500">{en ? "Count" : "采集数量"}</span>
                      <input value={draft.collect_count} onChange={(event) => setDraft({ ...draft, collect_count: event.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5" />
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
                  <button type="submit" disabled={busy} className={primaryButton}>{en ? "Save" : "保存"}</button>
                  <button type="button" className={outlineButton} onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>{en ? "Cancel" : "取消"}</button>
                </div>
              </form>
            ) : (
              <>
                <div className="px-5 pb-6 pt-5">
                  <h2 className="text-base font-semibold text-slate-900">{job.name}</h2>
                  <p className="mt-1 break-all text-sm text-slate-500">{job.site_url}</p>
                  <dl className="mt-6 grid grid-cols-2 text-sm">
                    <div>
                      <dt className="text-slate-500">{en ? "Keyword" : "关键字"}</dt>
                      <dd className="mt-1 text-slate-900">{job.keyword || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">{en ? "Count" : "采集数量"}</dt>
                      <dd className="mt-1 text-slate-900">{job.collect_count}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4">
                  <Link href={`/collections/${job.id}`} className={outlineButton}>
                    {en ? "Details" : "采集明细"}
                  </Link>
                  <button
                    type="button"
                    disabled={busy}
                    className={primaryButton}
                    onClick={() => run(() => send(`/api/v1/collections/${job.id}/run`, { method: "POST" }))}
                  >
                    {en ? "Collect" : "采集"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={outlineButton}
                    onClick={() => {
                      setCreating(false);
                      setEditingId(job.id);
                      setDraft({
                        name: job.name,
                        site_url: job.site_url,
                        keyword: job.keyword,
                        collect_count: String(job.collect_count),
                      });
                    }}
                  >
                    {en ? "Edit" : "编辑"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={dangerButton}
                    onClick={() => {
                      if (window.confirm(en ? `Delete ${job.name}?` : `删除「${job.name}」？`)) {
                        void run(() => send(`/api/v1/collections/${job.id}`, { method: "DELETE" }));
                      }
                    }}
                  >
                    {en ? "Delete" : "删除"}
                  </button>
                </div>
              </>
            )}
          </article>
        ))}
        {creating ? (
          <form
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await send("/api/v1/collections", {
                  method: "POST",
                  body: JSON.stringify({ ...draft, collect_count: Number(draft.collect_count) }),
                });
                setDraft(emptyDraft);
                setCreating(false);
              });
            }}
          >
            <div className="grid gap-3 px-5 pb-6 pt-5">
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={en ? "Name" : "名称"} className="rounded border border-slate-300 px-2 py-2 text-sm" required />
              <input value={draft.site_url} onChange={(event) => setDraft({ ...draft, site_url: event.target.value })} placeholder={en ? "Video site URL" : "视频网站地址"} className="rounded border border-slate-300 px-2 py-2 text-sm" required />
              <input value={draft.keyword} onChange={(event) => setDraft({ ...draft, keyword: event.target.value })} placeholder={en ? "Keyword" : "关键字"} className="rounded border border-slate-300 px-2 py-2 text-sm" />
              <input value={draft.collect_count} onChange={(event) => setDraft({ ...draft, collect_count: event.target.value })} placeholder={en ? "Count" : "采集数量"} className="rounded border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button type="submit" disabled={busy} className={primaryButton}>{en ? "Create" : "创建"}</button>
              <button type="button" onClick={() => { setCreating(false); setDraft(emptyDraft); }} className={outlineButton}>{en ? "Cancel" : "取消"}</button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => { setEditingId(null); setCreating(true); }} className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center hover:border-slate-400">
            <span className="text-3xl text-slate-400">+</span>
            <span className="mt-3 font-semibold">{en ? "New collection" : "新建采集"}</span>
            <span className="mt-1 text-sm text-slate-500">{en ? "Name, site URL, keyword, and count." : "填写名称、网站地址、关键字和采集数量。"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
