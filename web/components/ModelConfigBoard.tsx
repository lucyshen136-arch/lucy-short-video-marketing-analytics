"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/lib/i18n";
import type { ModelKeyPublic } from "@/lib/data/model-keys";

type Draft = {
  name: string;
  base_url: string;
  model_name: string;
  api_key: string;
  priority: string;
  timeout_seconds: string;
};

const emptyDraft: Draft = {
  name: "",
  base_url: "https://api.minimax.io/v1",
  model_name: "MiniMax-M2.7",
  api_key: "",
  priority: "0",
  timeout_seconds: "30",
};

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

function formatWhen(value: string | null, en: boolean) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(en ? "en" : "zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ModelConfigBoard({ locale }: { locale: Locale }) {
  const en = locale === "en";
  const [keys, setKeys] = useState<ModelKeyPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  async function reload() {
    setKeys((await send("/api/v1/model-keys")) as ModelKeyPublic[]);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, []);

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{en ? "Model config" : "模型配置"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {en
            ? "Usable keys are chosen from lowest priority to highest. The first enabled key that is not cooling is the primary key; the rest are backups. Auth failure, insufficient balance, or timeout cools that key and the next one is used."
            : "按优先级从小到大选择可用 key。第一把启用且未冷却的 key 是主 key，其余是从 key。鉴权失败、余额不足或超时时会换下一把，并让失败的 key 冷却一段时间。"}
        </p>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {keys.map((item) =>
          editing === item.id ? (
            <KeyForm
              key={item.id}
              en={en}
              initial={{
                name: item.name,
                base_url: item.base_url,
                model_name: item.model_name,
                api_key: "",
                priority: String(item.priority),
                timeout_seconds: String(item.timeout_seconds),
              }}
              submitLabel={en ? "Save" : "保存"}
              busy={busy}
              onCancel={() => setEditing(null)}
              onSubmit={(draft) =>
                run(async () => {
                  await send(`/api/v1/model-keys/${item.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      ...draft,
                      priority: Number(draft.priority),
                      timeout_seconds: Number(draft.timeout_seconds),
                      api_key: draft.api_key || undefined,
                    }),
                  });
                  setEditing(null);
                })
              }
            />
          ) : (
            <article key={item.id} className="flex min-h-72 flex-col rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{item.name}</h2>
                {item.primary && (
                  <span className="rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">{en ? "Primary" : "主 key"}</span>
                )}
                <span className={`text-sm ${item.status === "available" ? "text-emerald-600" : "text-slate-500"}`}>
                  {item.status === "available" ? (en ? "Available" : "可用") : item.status === "cooling" ? (en ? "Cooling" : "冷却中") : en ? "Disabled" : "已停用"}
                </span>
              </div>
              <p className="mt-2 break-all text-sm text-slate-500">{item.base_url}</p>
              <dl className="mt-4 grid flex-1 grid-cols-2 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">{en ? "Model" : "模型"}</dt>
                  <dd>{item.model_name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">API Key</dt>
                  <dd className="font-mono">{item.api_key_mask}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{en ? "Priority" : "优先级"}</dt>
                  <dd>{item.priority}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{en ? "Timeout" : "超时（秒）"}</dt>
                  <dd>{item.timeout_seconds}s</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{en ? "Last used" : "最近使用"}</dt>
                  <dd>{formatWhen(item.last_used_at, en)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{en ? "Cooling until" : "冷却至"}</dt>
                  <dd>{formatWhen(item.cooldown_until, en)}</dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  onClick={() =>
                    run(async () => {
                      const result = (await send(`/api/v1/model-keys/${item.id}/test`, { method: "POST" })) as { message: string; keys: ModelKeyPublic[] };
                      setKeys(result.keys);
                      setNotice(result.message);
                    })
                  }
                >
                  {en ? "Test" : "测试"}
                </button>
                <button type="button" disabled={busy} className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50" onClick={() => setEditing(item.id)}>
                  {en ? "Edit" : "编辑"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  onClick={() => run(() => send(`/api/v1/model-keys/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) }))}
                >
                  {item.enabled ? (en ? "Disable" : "停用") : en ? "Enable" : "启用"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                  onClick={() => {
                    if (window.confirm(en ? `Delete ${item.name}?` : `删除 ${item.name}？`)) {
                      void run(() => send(`/api/v1/model-keys/${item.id}`, { method: "DELETE" }));
                    }
                  }}
                >
                  {en ? "Delete" : "删除"}
                </button>
              </div>
            </article>
          ),
        )}
        {creating ? (
          <KeyForm
            en={en}
            initial={emptyDraft}
            submitLabel={en ? "Create" : "创建"}
            busy={busy}
            onCancel={() => setCreating(false)}
            onSubmit={(draft) =>
              run(async () => {
                await send("/api/v1/model-keys", {
                  method: "POST",
                  body: JSON.stringify({ ...draft, priority: Number(draft.priority), timeout_seconds: Number(draft.timeout_seconds) }),
                });
                setCreating(false);
              })
            }
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center hover:border-slate-400"
          >
            <span className="text-3xl text-slate-400">+</span>
            <span className="mt-3 font-semibold">{en ? "New key" : "新建 key"}</span>
            <span className="mt-1 max-w-xs text-sm text-slate-500">
              {en ? "Fill in the name, endpoint, and API key on the card." : "点击后在卡片内填写名称、接口与 API Key。"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function KeyForm({
  en,
  initial,
  submitLabel,
  busy,
  onCancel,
  onSubmit,
}: {
  en: boolean;
  initial: Draft;
  submitLabel: string;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState(initial);
  function set(key: keyof Draft, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  return (
    <form
      className="min-h-72 rounded-lg border bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      <div className="grid gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">{en ? "Name" : "名称"}</span>
          <input value={draft.name} onChange={(event) => set("name", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">{en ? "Endpoint" : "接口"}</span>
          <input value={draft.base_url} onChange={(event) => set("base_url", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">{en ? "Model" : "模型"}</span>
          <input value={draft.model_name} onChange={(event) => set("model_name", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" required />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">API Key</span>
          <input value={draft.api_key} onChange={(event) => set("api_key", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" placeholder={en ? "Leave blank to keep the current key" : "留空则不修改当前 key"} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">{en ? "Priority" : "优先级"}</span>
            <input value={draft.priority} onChange={(event) => set("priority", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">{en ? "Timeout (seconds)" : "超时（秒）"}</span>
            <input value={draft.timeout_seconds} onChange={(event) => set("timeout_seconds", event.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" />
          </label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy} className="rounded bg-slate-800 px-4 py-1.5 text-sm text-white disabled:opacity-50">{submitLabel}</button>
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-1.5 text-sm">{en ? "Cancel" : "取消"}</button>
      </div>
    </form>
  );
}
