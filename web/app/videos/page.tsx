import Link from "next/link";

import { listVideos } from "@/lib/api";

export default async function VideosPage() {
  let data;
  let error: string | null = null;
  try {
    data = await listVideos(1, 50);
  } catch (e) {
    error = e instanceof Error ? e.message : "无法连接 API";
    data = { items: [], total: 0, page: 1, page_size: 50 };
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">视频列表</h1>
        <Link href="/videos/new" className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
          添加视频
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
          {error} — 请确认 Docker Postgres 与 API 已启动（见 docs/web_local_dev.md）。
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">标题</th>
              <th className="px-3 py-2">平台</th>
              <th className="px-3 py-2">作者</th>
              <th className="px-3 py-2">发布</th>
              <th className="px-3 py-2">内容类型</th>
              <th className="px-3 py-2">信任</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((v) => (
              <tr key={v.video_id} className="border-b last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{v.video_id}</td>
                <td className="max-w-xs truncate px-3 py-2">{v.meta_title}</td>
                <td className="px-3 py-2">{v.meta_platform}</td>
                <td className="px-3 py-2">{v.meta_creator_name}</td>
                <td className="px-3 py-2">{v.meta_publish_date}</td>
                <td className="px-3 py-2">{v.content_type ?? "—"}</td>
                <td className="px-3 py-2">{v.viewer_trust_score ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link href={`/videos/${v.video_id}`} className="text-blue-600 hover:underline">
                    详情
                  </Link>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  暂无视频。添加第一条或运行 seed 脚本。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">共 {data.total} 条</p>
    </div>
  );
}
