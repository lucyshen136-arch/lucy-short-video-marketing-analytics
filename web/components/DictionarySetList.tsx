"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createDictionarySet,
  deleteDictionarySet,
  importDictionarySetsFromFiles,
  listDictionarySets,
} from "@/lib/api";
import type { DictionarySetSummary } from "@/lib/types";
import { messages, type Locale } from "@/lib/i18n";

function emptyCreate() {
  return { slug: "", name: "", description: "", version: "1.0.0" };
}

export default function DictionarySetList({ locale }: { locale: Locale }) {
  const d = messages[locale].dictionaries;
  const router = useRouter();
  const [sets, setSets] = useState<DictionarySetSummary[]>([]);
  const [form, setForm] = useState(emptyCreate);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function refresh() {
    const data = await listDictionarySets();
    setSets(data);
    setLoaded(true);
  }

  useEffect(() => {
    refresh().catch((e: Error) => {
      setError(e.message);
      setLoaded(true);
    });
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createDictionarySet({
        slug: form.slug.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        version: form.version.trim() || undefined,
      });
      setForm(emptyCreate());
      router.push(`/dictionaries/${created.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.createFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    setBusy(true);
    setError(null);
    try {
      const data = await importDictionarySetsFromFiles();
      setSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.importFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(slug: string, name: string) {
    if (!confirm(d.confirmDeleteSet(name))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDictionarySet(slug);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.deleteFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{d.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{d.intro}</p>
        </div>
        <button
          type="button"
          onClick={onImport}
          disabled={busy}
          className="min-h-11 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? d.working : d.import}
        </button>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">{d.createTitle}</h2>
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.slug} *</span>
            <input
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
              placeholder="content"
              required
              pattern="[a-z0-9_-]+"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.name} *</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
              placeholder={d.namePlaceholder}
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">{d.description}</span>
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.version}</span>
            <input
              value={form.version}
              onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {d.create}
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {sets.map((row) => (
          <article key={row.slug} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">{row.name}</h2>
                <p className="font-mono text-xs text-slate-500">{row.slug}</p>
              </div>
              <Link
                href={`/dictionaries/${row.slug}`}
                className="min-h-11 rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {d.configure}
              </Link>
            </div>
            <p className="mt-2 text-sm text-slate-600">{row.description || d.noDescription}</p>
            <p className="mt-3 text-sm text-slate-500">
              {d.counts(row.field_count, row.item_count)}
              {row.version ? ` · v${row.version}` : ""}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(row.slug, row.name)}
              className="mt-3 min-h-11 text-sm text-red-700 hover:underline disabled:opacity-50"
            >
              {d.deleteSet}
            </button>
          </article>
        ))}
        {sets.length === 0 && (
          <p className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-500 md:col-span-2">
            {loaded ? d.empty : d.loading}
          </p>
        )}
      </div>
    </div>
  );
}
