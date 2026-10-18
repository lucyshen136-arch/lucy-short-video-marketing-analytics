"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type { VideoModelField, VideoModelLayer } from "@/lib/data/video-model";

const KINDS = ["text", "number", "date", "datetime", "url", "enum"] as const;

async function send(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || response.statusText);
  return response.json();
}

export default function ModelStudio({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const [layers, setLayers] = useState<VideoModelLayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, { field_key: string; label: string; field_kind: string; dictionary_slug: string }>>({});

  async function reload() {
    const data = (await send("/api/v1/model")) as { layers: VideoModelLayer[] };
    setLayers(data.layers);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, []);

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : en ? "Request failed" : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{en ? "Video model" : "视频模型"}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            {en
              ? "Each layer has its own name and fields. The video list, forms, and collection import follow this model. Built-in fields stay mapped to the video table."
              : "每一层单独命名，并在层里设计字段。视频列表的完整度、录入表单和采集导入都按这个模型来。内置字段仍对应视频表里的列。"}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          onClick={() => {
            const name = window.prompt(en ? "Layer name" : "层名称");
            if (name) void run(() => send("/api/v1/model/layers", { method: "POST", body: JSON.stringify({ name }) }));
          }}
        >
          {en ? "Add layer" : "添加层"}
        </button>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {layers.map((layer) => {
        const draft = drafts[layer.id] ?? { field_key: "", label: "", field_kind: "text", dictionary_slug: "" };
        return (
          <section key={layer.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-500">{en ? "Layer name" : "层名称"}</span>
                <input
                  defaultValue={layer.name}
                  key={`${layer.id}-${layer.name}`}
                  onBlur={(event) => {
                    if (event.target.value.trim() && event.target.value.trim() !== layer.name) {
                      void run(() =>
                        send(`/api/v1/model/layers/${layer.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ name: event.target.value }),
                        }),
                      );
                    }
                  }}
                  className="rounded border border-slate-300 px-2 py-1.5 text-lg font-medium"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                className="text-sm text-red-700 hover:underline disabled:opacity-50"
                onClick={() => {
                  if (window.confirm(en ? `Delete layer ${layer.name}?` : `删除层「${layer.name}」？`)) {
                    void run(() => send(`/api/v1/model/layers/${layer.id}`, { method: "DELETE" }));
                  }
                }}
              >
                {en ? "Delete layer" : "删除层"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">key</th>
                    <th className="px-3 py-2">{en ? "Name" : "名称"}</th>
                    <th className="px-3 py-2">{en ? "Kind" : "类型"}</th>
                    <th className="px-3 py-2">{en ? "Dictionary" : "字典"}</th>
                    <th className="px-3 py-2">{en ? "Required" : "必填"}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {layer.fields.map((field) => (
                    <FieldRow key={field.id} field={field} busy={busy} en={en} onSave={(body) => run(() => send(`/api/v1/model/fields/${field.id}`, { method: "PATCH", body: JSON.stringify(body) }))} onDelete={() => run(() => send(`/api/v1/model/fields/${field.id}`, { method: "DELETE" }))} />
                  ))}
                </tbody>
              </table>
            </div>
            <form
              className="mt-4 grid gap-3 md:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await send(`/api/v1/model/layers/${layer.id}/fields`, {
                    method: "POST",
                    body: JSON.stringify({ ...draft, dictionary_slug: draft.dictionary_slug || null }),
                  });
                  setDrafts((prev) => ({ ...prev, [layer.id]: { field_key: "", label: "", field_kind: "text", dictionary_slug: "" } }));
                });
              }}
            >
              <input value={draft.field_key} onChange={(event) => setDrafts((prev) => ({ ...prev, [layer.id]: { ...draft, field_key: event.target.value } }))} placeholder="field_key" className="rounded border border-slate-300 px-2 py-2 text-sm" required />
              <input value={draft.label} onChange={(event) => setDrafts((prev) => ({ ...prev, [layer.id]: { ...draft, label: event.target.value } }))} placeholder={en ? "Field name" : "字段名称"} className="rounded border border-slate-300 px-2 py-2 text-sm" required />
              <select value={draft.field_kind} onChange={(event) => setDrafts((prev) => ({ ...prev, [layer.id]: { ...draft, field_kind: event.target.value } }))} className="rounded border border-slate-300 px-2 py-2 text-sm">
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
              <select value={draft.dictionary_slug} onChange={(event) => setDrafts((prev) => ({ ...prev, [layer.id]: { ...draft, dictionary_slug: event.target.value } }))} className="rounded border border-slate-300 px-2 py-2 text-sm">
                <option value="">{en ? "No dictionary" : "不绑字典"}</option>
                <option value="content">content</option>
                <option value="viewer">viewer</option>
                <option value="ai">ai</option>
              </select>
              <button type="submit" disabled={busy} className="rounded bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">
                {en ? "Add field" : "添加字段"}
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}

function FieldRow({
  field,
  busy,
  en,
  onSave,
  onDelete,
}: {
  field: VideoModelField;
  busy: boolean;
  en: boolean;
  onSave: (body: { label: string; field_kind: string; required: boolean; dictionary_slug: string | null }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(field.label);
  const [kind, setKind] = useState(field.field_kind);
  const [dictionary, setDictionary] = useState(field.dictionary_slug ?? "");
  const [required, setRequired] = useState(field.required);
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-2 font-mono text-xs">{field.field_key}</td>
      <td className="px-3 py-2">
        <input value={label} onChange={(event) => setLabel(event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1" />
      </td>
      <td className="px-3 py-2">
        <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded border border-slate-300 px-2 py-1">
          {KINDS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select value={dictionary} onChange={(event) => setDictionary(event.target.value)} className="rounded border border-slate-300 px-2 py-1">
          <option value="">—</option>
          <option value="content">content</option>
          <option value="viewer">viewer</option>
          <option value="ai">ai</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-3">
          <button type="button" disabled={busy} className="text-blue-700 hover:underline disabled:opacity-50" onClick={() => onSave({ label, field_kind: kind, required, dictionary_slug: dictionary || null })}>
            {en ? "Save" : "保存"}
          </button>
          <button type="button" disabled={busy} className="text-red-700 hover:underline disabled:opacity-50" onClick={onDelete}>
            {en ? "Delete" : "删除"}
          </button>
        </div>
      </td>
    </tr>
  );
}
