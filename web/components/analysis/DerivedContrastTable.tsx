"use client";

import { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n";

const PAGE_SIZE = 10;

export function DerivedContrastTable({
  locale,
  columns,
  rows,
  empty,
  prev,
  next,
}: {
  locale: Locale;
  columns: string[];
  rows: { id: string; cells: string[] }[];
  empty: string;
  prev: string;
  next: string;
}) {
  const en = locale === "en";
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const current = Math.min(page, pages);
  const slice = useMemo(() => {
    const start = (current - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, current]);
  const from = rows.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, rows.length);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              {columns.map((label, index) => (
                <th key={`${index}-${label}`} className="px-3 py-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${index}`} className={`px-3 py-2 ${index === 0 ? "font-mono text-xs" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-slate-600">
        <p>
          {en
            ? `${from}–${to} of ${rows.length}`
            : `第 ${from}–${to} 条，共 ${rows.length} 条`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-h-11 rounded border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={current <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {prev}
          </button>
          <span className="min-w-24 text-center">
            {en ? `Page ${current} / ${pages}` : `第 ${current} / ${pages} 页`}
          </span>
          <button
            type="button"
            className="min-h-11 rounded border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={current >= pages || rows.length === 0}
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
          >
            {next}
          </button>
        </div>
      </div>
    </div>
  );
}
