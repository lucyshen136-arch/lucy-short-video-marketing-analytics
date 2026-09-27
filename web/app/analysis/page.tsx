import { collectionSummary } from "@/lib/completeness";
import { listAllVideosDb } from "@/lib/data/videos";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  let summary = collectionSummary([]);
  let error: string | null = null;
  try {
    summary = collectionSummary(await listAllVideosDb());
  } catch (e) {
    error = e instanceof Error ? e.message : "无法连接数据库";
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">数据分析</h1>

      {error && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
          {error} — 请确认已配置 DATABASE_URL（Vercel 环境变量或 web/.env.local）。
        </p>
      )}

      <section className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm text-slate-500">视频数量</h2>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.total}</p>
        <p className="mt-2 text-sm text-slate-600">
          四层都完整的视频 {summary.fullyComplete} / {summary.total}
        </p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">采集质量</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2">层级</th>
                <th className="px-4 py-2">每条字段数</th>
                <th className="px-4 py-2">完整视频</th>
                <th className="px-4 py-2">缺失字段</th>
              </tr>
            </thead>
            <tbody>
              {summary.layers.map((layer) => (
                <tr key={layer.key} className="border-b last:border-0">
                  <td className="px-4 py-2">{layer.label}</td>
                  <td className="px-4 py-2">{layer.fieldCount}</td>
                  <td className={`px-4 py-2 ${layer.completeVideos === summary.total && summary.total > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                    {layer.completeVideos} / {summary.total}
                  </td>
                  <td className={`px-4 py-2 ${layer.missingFields === 0 ? "text-emerald-700" : "text-amber-800"}`}>
                    {layer.missingFields === 0 ? "无缺失" : layer.missingFields}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-slate-500">空值计为缺失。数值 0 视为已采集。</p>
      </section>
    </div>
  );
}
