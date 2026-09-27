import { Bars } from "@/components/analysis/Bars";
import { MIN_PAIRS, aiAgreement, associationsByPlatform, deriveMetrics, formatCoefficient, formatRate } from "@/lib/analysis";
import { collectionSummary } from "@/lib/completeness";
import { listAllVideosDb } from "@/lib/data/videos";
import { getMessages } from "@/lib/locale";
import { contentLabel, viewerEnumLabel } from "@/lib/labels";
import type { Locale } from "@/lib/i18n";
import type { VideoRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function platformName(code: string, labels: Record<string, string>): string {
  return labels[code] ?? code;
}

function countLabels(videos: VideoRecord[], field: keyof VideoRecord, dictionaryField: string, locale: Locale) {
  const counts = new Map<string, number>();
  for (const video of videos) {
    const raw = video[field];
    const label = contentLabel(dictionaryField, typeof raw === "string" ? raw : null, locale);
    if (label === "—") continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value }));
}

export default async function AnalysisPage() {
  const { locale, m } = await getMessages();
  const a = m.analysis;
  let videos: VideoRecord[] = [];
  let error: string | null = null;
  try {
    videos = await listAllVideosDb();
  } catch (e) {
    error = e instanceof Error ? e.message : a.dbError;
  }

  const summary = collectionSummary(videos);
  const derived = videos.map((video) => ({ video, metrics: deriveMetrics(video) }));
  const associations = associationsByPlatform(videos);
  const agreement = aiAgreement(videos);
  const qualityMax = Math.max(summary.total, 1);
  const contentCounts = countLabels(videos, "content_type", "content_type", locale);
  const contentMax = Math.max(1, ...contentCounts.map((item) => item.value));
  const platforms = [...new Set(videos.map((video) => video.meta_platform))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{a.intro}</p>
      </div>

      {error && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          {error} — {m.dbHint}
        </p>
      )}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm text-slate-500">{a.videoCount}</h2>
        <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.total}</p>
        <p className="mt-2 text-sm text-slate-600">{a.fullyComplete(summary.fullyComplete, summary.total)}</p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.quality}</h2>
        <div className="grid gap-6 p-4 md:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2">{a.layer}</th>
                  <th className="px-3 py-2">{a.fieldsEach}</th>
                  <th className="px-3 py-2">{a.completeVideos}</th>
                  <th className="px-3 py-2">{a.missingFields}</th>
                </tr>
              </thead>
              <tbody>
                {summary.layers.map((layer) => (
                  <tr key={layer.key} className="border-b last:border-0">
                    <td className="px-3 py-2">{m.layers[layer.key]}</td>
                    <td className="px-3 py-2">{layer.fieldCount}</td>
                    <td className="px-3 py-2">
                      {layer.completeVideos} / {summary.total}
                    </td>
                    <td className="px-3 py-2">{layer.missingFields === 0 ? m.noMissing : layer.missingFields}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Bars
            empty={a.noChartValues}
            items={summary.layers.map((layer) => ({
              label: m.layers[layer.key],
              value: layer.completeVideos,
              max: qualityMax,
              caption: a.completeCaption(layer.completeVideos, summary.total),
            }))}
          />
        </div>
        <p className="px-4 pb-3 text-xs text-slate-500">{a.qualityNote}</p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.formulas}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2">{a.metric}</th>
                <th className="px-4 py-2">{a.formula}</th>
                <th className="px-4 py-2">{a.nullRule}</th>
              </tr>
            </thead>
            <tbody>
              {a.formulaRows.map((formula) => (
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
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.derived}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">{m.videos.platform}</th>
                <th className="px-3 py-2">{a.ageDays}</th>
                <th className="px-3 py-2">{a.likeRate}</th>
                <th className="px-3 py-2">{a.commentRate}</th>
                <th className="px-3 py-2">{a.saveRate}</th>
                <th className="px-3 py-2">{a.shareRate}</th>
                <th className="px-3 py-2">{a.engagementRate}</th>
              </tr>
            </thead>
            <tbody>
              {derived.map(({ metrics }) => (
                <tr key={metrics.video_id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{metrics.video_id}</td>
                  <td className="px-3 py-2">{platformName(metrics.platform, m.platforms)}</td>
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
                    {a.noVideos}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{a.platformRates}</h2>
        {platforms.length === 0 ? (
          <p className="text-sm text-slate-500">{a.noRates}</p>
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
                  <h3 className="mb-2 text-sm font-medium text-slate-700">{platformName(platform, m.platforms)}</h3>
                  <Bars
                    items={rows.flatMap((row) => {
                      const bars = [
                        {
                          label: a.likeRateOf(row.metrics.video_id),
                          value: row.metrics.like_rate ?? 0,
                          max,
                          caption: formatRate(row.metrics.like_rate),
                        },
                      ];
                      if (row.metrics.engagement_rate !== null) {
                        bars.push({
                          label: a.engagementRateOf(row.metrics.video_id),
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
        <p className="mt-3 text-xs text-slate-500">{a.rateNote}</p>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">{a.contentDistribution}</h2>
        <Bars
          empty={a.noChartValues}
          items={contentCounts.map((item) => ({
            label: item.label,
            value: item.value,
            max: contentMax,
            caption: String(item.value),
          }))}
        />
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.contrast}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">{m.videos.platform}</th>
                <th className="px-3 py-2">{m.videos.contentType}</th>
                <th className="px-3 py-2">Hook</th>
                <th className="px-3 py-2">{m.detail.funnel}</th>
                <th className="px-3 py-2">{a.watching}</th>
                <th className="px-3 py-2">{a.memory}</th>
                <th className="px-3 py-2">{a.trust}</th>
                <th className="px-3 py-2">{a.action}</th>
                <th className="px-3 py-2">{a.likeRate}</th>
              </tr>
            </thead>
            <tbody>
              {derived.map(({ video, metrics }) => (
                <tr key={video.video_id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{video.video_id}</td>
                  <td className="px-3 py-2">{platformName(video.meta_platform, m.platforms)}</td>
                  <td className="px-3 py-2">{contentLabel("content_type", video.content_type, locale)}</td>
                  <td className="px-3 py-2">{contentLabel("content_hook_type", video.content_hook_type, locale)}</td>
                  <td className="px-3 py-2">{contentLabel("content_funnel_stage", video.content_funnel_stage, locale)}</td>
                  <td className="px-3 py-2">
                    {viewerEnumLabel("viewer_continued_watching", video.viewer_continued_watching, locale)}
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
        <p className="px-4 py-3 text-xs text-slate-500">{a.contrastNote}</p>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.spearman}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">{m.videos.platform}</th>
                <th className="px-3 py-2">{a.pair}</th>
                <th className="px-3 py-2">{a.pairN}</th>
                <th className="px-3 py-2">ρ</th>
                <th className="px-3 py-2">{a.note}</th>
              </tr>
            </thead>
            <tbody>
              {associations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    {a.noVideos}
                  </td>
                </tr>
              )}
              {associations.map((row) => (
                <tr key={`${row.platform}-${row.name}`} className="border-b last:border-0">
                  <td className="px-3 py-2">{platformName(row.platform, m.platforms)}</td>
                  <td className="px-3 py-2">
                    {a.pairs[row.id]?.name ?? row.name}
                    <span className="ml-2 text-xs text-slate-500">
                      {a.pairs[row.id]?.x ?? row.xLabel}
                      {locale === "zh" ? "，" : ", "}
                      {a.pairs[row.id]?.y ?? row.yLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2">{row.n}</td>
                  <td className="px-3 py-2 font-mono">{formatCoefficient(row.coefficient)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.status === "insufficient" && a.insufficient(MIN_PAIRS)}
                    {row.status === "undefined" && a.undefinedCoeff}
                    {row.status === "ok" && a.descriptive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.agreementTitle}</h2>
        <p className="px-4 pt-3 text-sm text-slate-600">
          {a.agreementOverall(agreement.overall === null ? "—" : formatRate(agreement.overall), agreement.compared)}
        </p>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-100 text-slate-600">
              <tr>
                <th className="px-3 py-2">{a.field}</th>
                <th className="px-3 py-2">{a.compared}</th>
                <th className="px-3 py-2">{a.matched}</th>
                <th className="px-3 py-2">{a.agreementRate}</th>
              </tr>
            </thead>
            <tbody>
              {agreement.fields.map((field) => (
                <tr key={field.field} className="border-b last:border-0">
                  <td className="px-3 py-2">{a.fields[field.field] ?? field.label}</td>
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
