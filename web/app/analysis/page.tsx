import { Bars } from "@/components/analysis/Bars";
import {
  FORMULAS,
  MIN_PAIRS,
  PLATFORM_LABEL,
  aiAgreement,
  associationsByPlatform,
  deriveMetrics,
  formatCoefficient,
  formatRate,
} from "@/lib/analysis";
import { collectionSummary } from "@/lib/completeness";
import { listAllVideosDb } from "@/lib/data/videos";
import { WATCHING_LABEL, contentLabel } from "@/lib/labels";
import type { VideoRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function platformName(code: string): string {
  return PLATFORM_LABEL[code] ?? code;
}

function countLabels(videos: VideoRecord[], field: keyof VideoRecord, dictionaryField: string) {
  const counts = new Map<string, number>();
  for (const video of videos) {
    const raw = video[field];
    const label = contentLabel(dictionaryField, typeof raw === "string" ? raw : null);
    if (label === "—") continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

export default async function AnalysisPage() {
  let videos: VideoRecord[] = [];
  let error: string | null = null;
  try {
    videos = await listAllVideosDb();
  } catch (e) {
    error = e instanceof Error ? e.message : "无法连接数据库";
  }

  const summary = collectionSummary(videos);
  const derived = videos.map((video) => ({ video, metrics: deriveMetrics(video) }));
  const associations = associationsByPlatform(videos);
  const agreement = aiAgreement(videos);
  const qualityMax = Math.max(summary.total, 1);
  const contentCounts = countLabels(videos, "content_type", "content_type");
  const contentMax = Math.max(1, ...contentCounts.map((item) => item.value));
  const platforms = [...new Set(videos.map((video) => video.meta_platform))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">数据分析</h1>
        <p className="mt-1 text-sm text-slate-600">
          按数据字典计算衍生指标和同平台关联。关联不是因果。跨平台播放量不放在一起比较。
        </p>
      </div>

      {error && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          {error} — 请确认已配置 DATABASE_URL（Vercel 环境变量或 web/.env.local）。
        </p>
      )}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm text-slate-500">视频数量</h2>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.total}</p>
        <p className="mt-2 text-sm text-slate-600">
          四层都完整的视频 {summary.fullyComplete} / {summary.total}
        </p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">采集质量</h2>
        <div className="grid gap-6 p-4 md:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2">层级</th>
                  <th className="px-3 py-2">每条字段数</th>
                  <th className="px-3 py-2">完整视频</th>
                  <th className="px-3 py-2">缺失字段</th>
                </tr>
              </thead>
              <tbody>
                {summary.layers.map((layer) => (
                  <tr key={layer.key} className="border-b last:border-0">
                    <td className="px-3 py-2">{layer.label}</td>
                    <td className="px-3 py-2">{layer.fieldCount}</td>
                    <td className="px-3 py-2">
                      {layer.completeVideos} / {summary.total}
                    </td>
                    <td className="px-3 py-2">{layer.missingFields === 0 ? "无缺失" : layer.missingFields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Bars
            items={summary.layers.map((layer) => ({
              label: layer.label,
              value: layer.completeVideos,
              max: qualityMax,
              caption: `${layer.completeVideos} / ${summary.total} 完整`,
            }))}
          />
        </div>
        <p className="px-4 pb-3 text-xs text-slate-500">空值计为缺失。数值 0 视为已采集。</p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">关联公式</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2">指标</th>
                <th className="px-4 py-2">公式</th>
                <th className="px-4 py-2">空值规则</th>
              </tr>
            </thead>
            <tbody>
              {FORMULAS.map((formula) => (
                <tr key={formula.name} className="border-b last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 font-medium">{formula.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{formula.expression}</td>
                  <td className="px-4 py-2 text-slate-600">{formula.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">衍生指标</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">平台</th>
                <th className="px-3 py-2">采集间隔（天）</th>
                <th className="px-3 py-2">点赞率</th>
                <th className="px-3 py-2">评论率</th>
                <th className="px-3 py-2">收藏率</th>
                <th className="px-3 py-2">分享率</th>
                <th className="px-3 py-2">互动率</th>
              </tr>
            </thead>
            <tbody>
              {derived.map(({ metrics }) => (
                <tr key={metrics.video_id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{metrics.video_id}</td>
                  <td className="px-3 py-2">{platformName(metrics.platform)}</td>
                  <td className="px-3 py-2">{metrics.metrics_age_days ?? "—"}</td>
                  <td className="px-3 py-2">{formatRate(metrics.like_rate)}</td>
                  <td className="px-3 py-2">{formatRate(metrics.comment_rate)}</td>
                  <td className="px-3 py-2">{formatRate(metrics.save_rate)}</td>
                  <td className="px-3 py-2">{formatRate(metrics.share_rate)}</td>
                  <td className="px-3 py-2">{formatRate(metrics.engagement_rate)}</td>
                </tr>
              ))}
              {derived.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                    暂无视频。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">同平台比率</h2>
        {platforms.length === 0 ? (
          <p className="text-sm text-slate-500">还没有可绘制的比率。</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {platforms.map((platform) => {
              const rows = derived.filter((row) => row.metrics.platform === platform && row.metrics.like_rate !== null);
              const observed = rows.flatMap((row) =>
                [row.metrics.like_rate, row.metrics.engagement_rate].filter((value) => value !== null),
              );
              const max = Math.max(0.001, ...observed);
              return (
                <div key={platform}>
                  <h3 className="mb-2 text-sm font-medium text-slate-700">{platformName(platform)}</h3>
                  <Bars
                    items={rows.flatMap((row) => {
                      const bars = [
                        {
                          label: `${row.metrics.video_id} 点赞率`,
                          value: row.metrics.like_rate ?? 0,
                          max,
                          caption: formatRate(row.metrics.like_rate),
                        },
                      ];
                      if (row.metrics.engagement_rate !== null) {
                        bars.push({
                          label: `${row.metrics.video_id} 互动率`,
                          value: row.metrics.engagement_rate,
                          max,
                          caption: formatRate(row.metrics.engagement_rate),
                        });
                      }
                      return bars;
                    })}
                  />
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">播放量缺失或为 0 的视频不进入图。不同平台的条形不共用刻度比较。</p>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">内容类型分布</h2>
        <Bars
          items={contentCounts.map((item) => ({
            label: item.label,
            value: item.value,
            max: contentMax,
            caption: String(item.value),
          }))}
        />
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">内容与个人反应对照</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">平台</th>
                <th className="px-3 py-2">内容类型</th>
                <th className="px-3 py-2">Hook</th>
                <th className="px-3 py-2">漏斗</th>
                <th className="px-3 py-2">完看</th>
                <th className="px-3 py-2">记忆</th>
                <th className="px-3 py-2">信任</th>
                <th className="px-3 py-2">行动意愿</th>
                <th className="px-3 py-2">点赞率</th>
              </tr>
            </thead>
            <tbody>
              {derived.map(({ video, metrics }) => (
                <tr key={video.video_id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{video.video_id}</td>
                  <td className="px-3 py-2">{platformName(video.meta_platform)}</td>
                  <td className="px-3 py-2">{contentLabel("content_type", video.content_type)}</td>
                  <td className="px-3 py-2">{contentLabel("content_hook_type", video.content_hook_type)}</td>
                  <td className="px-3 py-2">{contentLabel("content_funnel_stage", video.content_funnel_stage)}</td>
                  <td className="px-3 py-2">
                    {video.viewer_continued_watching
                      ? (WATCHING_LABEL[video.viewer_continued_watching] ?? video.viewer_continued_watching)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{video.viewer_memory_score ?? "—"}</td>
                  <td className="px-3 py-2">{video.viewer_trust_score ?? "—"}</td>
                  <td className="px-3 py-2">{video.viewer_action_intent_score ?? "—"}</td>
                  <td className="px-3 py-2">{formatRate(metrics.like_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-slate-500">这是逐条对照，不是分组推断。个人反应只代表 Lucy 一人。</p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">同平台 Spearman 关联</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">平台</th>
                <th className="px-3 py-2">配对</th>
                <th className="px-3 py-2">有效 n</th>
                <th className="px-3 py-2">ρ</th>
                <th className="px-3 py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              {associations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    暂无视频。
                  </td>
                </tr>
              )}
              {associations.map((row) => (
                <tr key={`${row.platform}-${row.name}`} className="border-b last:border-0">
                  <td className="px-3 py-2">{platformName(row.platform)}</td>
                  <td className="px-3 py-2">
                    {row.name}
                    <span className="ml-2 text-xs text-slate-500">
                      {row.xLabel}，{row.yLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.n}</td>
                  <td className="px-3 py-2 font-mono">{formatCoefficient(row.coefficient)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.status === "insufficient" && `样本不足（少于 ${MIN_PAIRS} 对）`}
                    {row.status === "undefined" && "名次没有变化，系数无定义"}
                    {row.status === "ok" && "同平台描述性关联"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">人工标签与 AI 标签一致率</h2>
        <p className="px-4 pt-3 text-sm text-slate-600">
          总体一致率 {agreement.overall === null ? "—" : formatRate(agreement.overall)}（已对照 {agreement.compared}{" "}
          个字段）
        </p>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">字段</th>
                <th className="px-3 py-2">已对照</th>
                <th className="px-3 py-2">相同</th>
                <th className="px-3 py-2">一致率</th>
              </tr>
            </thead>
            <tbody>
              {agreement.fields.map((field) => (
                <tr key={field.field} className="border-b last:border-0">
                  <td className="px-3 py-2">{field.label}</td>
                  <td className="px-3 py-2">{field.compared}</td>
                  <td className="px-3 py-2">{field.matched}</td>
                  <td className="px-3 py-2">{formatRate(field.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
