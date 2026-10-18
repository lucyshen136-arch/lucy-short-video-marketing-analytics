import Link from "next/link";

import { defaultCompletenessLayers, layerCompleteness, type CompletenessLayer } from "@/lib/completeness";
import { completenessFromModel, getVideoModelDb } from "@/lib/data/video-model";
import { listVideosDb } from "@/lib/data/videos";
import { getMessages } from "@/lib/locale";
import { contentLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const { locale, m } = await getMessages();
  let data;
  let error: string | null = null;
  let layers: CompletenessLayer[] = defaultCompletenessLayers();
  try {
    data = await listVideosDb(1, 50);
    layers = completenessFromModel(await getVideoModelDb());
  } catch (e) {
    error = e instanceof Error ? e.message : m.videos.apiError;
    data = { items: [], total: 0, page: 1, page_size: 50 };
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{m.videos.title}</h1>
        <Link href="/videos/new" className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
          {m.videos.add}
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
          {error} — {m.dbHint}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">{m.videos.titleCol}</th>
              <th className="px-3 py-2">{m.videos.platform}</th>
              <th className="px-3 py-2">{m.videos.creator}</th>
              <th className="px-3 py-2">{m.videos.published}</th>
              <th className="px-3 py-2">{m.videos.contentType}</th>
              <th className="px-3 py-2">{m.videos.trust}</th>
              {layers.map((layer) => (
                <th key={layer.key} className="px-3 py-2">{layer.label}</th>
              ))}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((v) => (
              <tr key={v.video_id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{v.video_id}</td>
                <td className="max-w-xs truncate px-3 py-2">{v.meta_title}</td>
                <td className="px-3 py-2">{m.platforms[v.meta_platform] ?? v.meta_platform}</td>
                <td className="px-3 py-2">{v.meta_creator_name}</td>
                <td className="px-3 py-2">{v.meta_publish_date}</td>
                <td className="px-3 py-2">{contentLabel("content_type", v.content_type, locale)}</td>
                <td className="px-3 py-2">{v.viewer_trust_score ?? "—"}</td>
                {layerCompleteness(v, layers).map((layer) => (
                  <td
                    key={layer.key}
                    className={`whitespace-nowrap px-3 py-2 ${layer.missing === 0 ? "text-emerald-700" : "text-amber-800"}`}
                  >
                    {layer.missing === 0 ? m.complete : m.missing(layer.missing)}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <Link href={`/videos/${v.video_id}`} className="text-blue-600 hover:underline">
                    {m.videos.detail}
                  </Link>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8 + layers.length} className="px-3 py-8 text-center text-slate-500">
                  {m.videos.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">{m.videos.total(data.total)}</p>
    </div>
  );
}
