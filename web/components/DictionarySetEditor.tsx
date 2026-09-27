"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createDictionaryField,
  createDictionaryItem,
  deleteDictionaryField,
  deleteDictionaryItem,
  deleteDictionarySet,
  getDictionarySet,
  updateDictionaryField,
  updateDictionaryItem,
  updateDictionarySet,
} from "@/lib/api";
import type { DictionaryItemRecord, DictionarySetRecord } from "@/lib/types";
import { messages, type Locale, type Messages } from "@/lib/i18n";

type DictCopy = Messages["dictionaries"];

function fieldKinds(copy: DictCopy) {
  return [
    { code: "enum", label: copy.kinds.enum },
    { code: "free_text", label: copy.kinds.free_text },
    { code: "ordinal_score", label: copy.kinds.ordinal_score },
  ];
}

type ItemDraft = {
  code: string;
  label_zh: string;
  definition: string;
  sort_order: string;
};

const emptyItem: ItemDraft = { code: "", label_zh: "", definition: "", sort_order: "" };

export default function DictionarySetEditor({ slug, locale }: { slug: string; locale: Locale }) {
  const d = messages[locale].dictionaries;
  const router = useRouter();
  const [data, setData] = useState<DictionarySetRecord | null>(null);
  const [meta, setMeta] = useState({ name: "", description: "", version: "", source_doc: "", scope: "" });
  const [newField, setNewField] = useState({
    field_key: "",
    label_zh: "",
    field_kind: "enum",
    question: "",
  });
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [editing, setEditing] = useState<Record<string, number | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const row = await getDictionarySet(slug);
    setData(row);
    setMeta({
      name: row.name,
      description: row.description ?? "",
      version: row.version ?? "",
      source_doc: row.source_doc ?? "",
      scope: row.scope ?? "",
    });
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, [slug]);

  function draftFor(fieldKey: string): ItemDraft {
    return itemDrafts[fieldKey] ?? emptyItem;
  }

  function setDraft(fieldKey: string, patch: Partial<ItemDraft>) {
    setItemDrafts((prev) => ({ ...prev, [fieldKey]: { ...draftFor(fieldKey), ...patch } }));
  }

  function startEdit(fieldKey: string, item: DictionaryItemRecord) {
    setEditing((prev) => ({ ...prev, [fieldKey]: item.id }));
    setDraft(fieldKey, {
      code: item.code,
      label_zh: item.label_zh,
      definition: item.definition ?? "",
      sort_order: String(item.sort_order),
    });
  }

  async function onSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const row = await updateDictionarySet(slug, {
        name: meta.name.trim(),
        description: meta.description.trim() || null,
        version: meta.version.trim() || null,
        source_doc: meta.source_doc.trim() || null,
        scope: meta.scope.trim() || null,
      });
      setData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : d.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onAddField(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createDictionaryField(slug, {
        field_key: newField.field_key.trim(),
        label_zh: newField.label_zh.trim(),
        field_kind: newField.field_kind,
        question: newField.question.trim() || undefined,
      });
      setNewField({ field_key: "", label_zh: "", field_kind: "enum", question: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.addFieldFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveField(fieldKey: string, labelZh: string, fieldKind: string, question: string) {
    setBusy(true);
    setError(null);
    try {
      await updateDictionaryField(slug, fieldKey, {
        label_zh: labelZh,
        field_kind: fieldKind,
        question: question || null,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.updateFieldFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteField(fieldKey: string) {
    if (!confirm(d.confirmDeleteField(fieldKey))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDictionaryField(slug, fieldKey);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.deleteFieldFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveItem(fieldKey: string) {
    const draft = draftFor(fieldKey);
    if (!draft.code.trim() || !draft.label_zh.trim()) {
      setError(d.codeAndLabelRequired);
      return;
    }
    setBusy(true);
    setError(null);
    const editingId = editing[fieldKey];
    try {
      if (editingId) {
        await updateDictionaryItem(editingId, {
          code: draft.code.trim(),
          label_zh: draft.label_zh.trim(),
          definition: draft.definition.trim() || null,
          sort_order: Number(draft.sort_order || 0),
        });
      } else {
        await createDictionaryItem(slug, {
          field_key: fieldKey,
          code: draft.code.trim(),
          label_zh: draft.label_zh.trim(),
          definition: draft.definition.trim() || undefined,
          sort_order: Number(draft.sort_order || 0),
        });
      }
      setEditing((prev) => ({ ...prev, [fieldKey]: null }));
      setDraft(fieldKey, emptyItem);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.saveItemFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteItem(item: DictionaryItemRecord) {
    if (!confirm(d.confirmDeleteItem(item.code))) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDictionaryItem(item.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : d.deleteItemFailed);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteSet() {
    if (!confirm(d.confirmDeleteWhole(data?.name ?? slug))) return;
    setBusy(true);
    try {
      await deleteDictionarySet(slug);
      router.push("/dictionaries");
    } catch (err) {
      setError(err instanceof Error ? err.message : d.deleteFailed);
      setBusy(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-slate-500">{error ?? d.loading}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dictionaries" className="text-sm text-blue-700 hover:underline">
            {d.back}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{data.name}</h1>
          <p className="font-mono text-xs text-slate-500">{data.slug}</p>
        </div>
        <button
          type="button"
          onClick={onDeleteSet}
          disabled={busy}
          className="min-h-11 rounded border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {d.deleteThisSet}
        </button>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">{d.setInfo}</h2>
        <form onSubmit={onSaveMeta} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.name} *</span>
            <input
              value={meta.name}
              onChange={(e) => setMeta((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.version}</span>
            <input
              value={meta.version}
              onChange={(e) => setMeta((prev) => ({ ...prev, version: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">{d.description}</span>
            <input
              value={meta.description}
              onChange={(e) => setMeta((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.sourceDoc}</span>
            <input
              value={meta.source_doc}
              onChange={(e) => setMeta((prev) => ({ ...prev, source_doc: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.scope}</span>
            <input
              value={meta.scope}
              onChange={(e) => setMeta((prev) => ({ ...prev, scope: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <div>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {d.saveSet}
            </button>
          </div>
        </form>
      </section>

      {data.fields.map((field) => (
        <FieldEditor
          key={field.id}
          field={field}
          draft={draftFor(field.field_key)}
          editingId={editing[field.field_key] ?? null}
          busy={busy}
          onDraft={(patch) => setDraft(field.field_key, patch)}
          onStartEdit={(item) => startEdit(field.field_key, item)}
          onCancelEdit={() => {
            setEditing((prev) => ({ ...prev, [field.field_key]: null }));
            setDraft(field.field_key, emptyItem);
          }}
          onSaveItem={() => onSaveItem(field.field_key)}
          onDeleteItem={onDeleteItem}
          onSaveField={(labelZh, kind, question) => onSaveField(field.field_key, labelZh, kind, question)}
          onDeleteField={() => onDeleteField(field.field_key)}
          copy={d}
        />
      ))}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-medium">{d.addField}</h2>
        <form onSubmit={onAddField} className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.fieldKey} *</span>
            <input
              value={newField.field_key}
              onChange={(e) => setNewField((prev) => ({ ...prev, field_key: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
              placeholder="content_hook_type"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.chineseName} *</span>
            <input
              value={newField.label_zh}
              onChange={(e) => setNewField((prev) => ({ ...prev, label_zh: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.kind}</span>
            <select
              value={newField.field_kind}
              onChange={(e) => setNewField((prev) => ({ ...prev, field_kind: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            >
              {fieldKinds(d).map((kind) => (
                <option key={kind.code} value={kind.code}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">{d.question}</span>
            <input
              value={newField.question}
              onChange={(e) => setNewField((prev) => ({ ...prev, question: e.target.value }))}
              className="w-full rounded border border-slate-300 px-2 py-2"
            />
          </label>
          <div>
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {d.addFieldButton}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FieldEditor({
  field,
  draft,
  editingId,
  busy,
  copy,
  onDraft,
  onStartEdit,
  onCancelEdit,
  onSaveItem,
  onDeleteItem,
  onSaveField,
  onDeleteField,
}: {
  field: DictionarySetRecord["fields"][number];
  draft: ItemDraft;
  editingId: number | null;
  busy: boolean;
  copy: DictCopy;
  onDraft: (patch: Partial<ItemDraft>) => void;
  onStartEdit: (item: DictionaryItemRecord) => void;
  onCancelEdit: () => void;
  onSaveItem: () => void;
  onDeleteItem: (item: DictionaryItemRecord) => void;
  onSaveField: (labelZh: string, kind: string, question: string) => void;
  onDeleteField: () => void;
}) {
  const [labelZh, setLabelZh] = useState(field.label_zh);
  const [kind, setKind] = useState(field.field_kind);
  const [question, setQuestion] = useState(field.question ?? "");

  useEffect(() => {
    setLabelZh(field.label_zh);
    setKind(field.field_kind);
    setQuestion(field.question ?? "");
  }, [field.id, field.label_zh, field.field_kind, field.question]);

  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{field.label_zh}</h2>
          <p className="font-mono text-xs text-slate-500">{field.field_key}</p>
        </div>
        <button
          type="button"
          onClick={onDeleteField}
          disabled={busy}
          className="min-h-11 text-sm text-red-700 hover:underline disabled:opacity-50"
        >
          {copy.deleteField}
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.chineseName}</span>
          <input
            value={labelZh}
            onChange={(e) => setLabelZh(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.kind}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2"
          >
            {fieldKinds(copy).map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.question}</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => onSaveField(labelZh, kind, question)}
        className="mb-4 min-h-11 rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
      >
        {copy.saveField}
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">code</th>
              <th className="px-3 py-2">{copy.chineseLabel}</th>
              <th className="px-3 py-2">{copy.definition}</th>
              <th className="px-3 py-2">{copy.sort}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {field.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                <td className="px-3 py-2">{item.label_zh}</td>
                <td className="max-w-md px-3 py-2 text-slate-600">{item.definition ?? "—"}</td>
                <td className="px-3 py-2">{item.sort_order}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="min-h-11 text-blue-700 hover:underline"
                      onClick={() => onStartEdit(item)}
                    >
                      {copy.edit}
                    </button>
                    <button
                      type="button"
                      className="min-h-11 text-red-700 hover:underline"
                      onClick={() => onDeleteItem(item)}
                    >
                      {copy.deleteItem}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {field.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  {copy.noItems}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">code *</span>
          <input
            value={draft.code}
            onChange={(e) => onDraft({ code: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.chineseLabel} *</span>
          <input
            value={draft.label_zh}
            onChange={(e) => onDraft({ label_zh: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.definition}</span>
          <input
            value={draft.definition}
            onChange={(e) => onDraft({ definition: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">{copy.sort}</span>
          <input
            value={draft.sort_order}
            onChange={(e) => onDraft({ sort_order: e.target.value })}
            className="w-full rounded border border-slate-300 px-2 py-2"
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onSaveItem}
          className="min-h-11 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {editingId ? copy.saveEdit : copy.addItem}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="min-h-11 rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            {copy.cancelEdit}
          </button>
        )}
      </div>
    </section>
  );
}
