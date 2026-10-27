import { Bars } from "@/components/analysis/Bars";
import { DerivedContrastTable } from "@/components/analysis/DerivedContrastTable";
import { Pie } from "@/components/analysis/Pie";
import { aiAgreement, deriveMetrics, formatRate } from "@/lib/analysis";
import { collectionSummary, defaultCompletenessLayers, type CompletenessLayer } from "@/lib/completeness";
import { listAllVideosDb } from "@/lib/data/videos";
import { completenessFromModel, getVideoModelDb } from "@/lib/data/video-model";
import { getMessages } from "@/lib/locale";
import { contentLabel, viewerEnumLabel } from "@/lib/labels";
import { modelLayerName } from "@/lib/model-labels";
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
  let layers: CompletenessLayer[] = defaultCompletenessLayers();
  try {
    videos = await listAllVideosDb();
    layers = completenessFromModel(await getVideoModelDb());
  } catch (e) {
    error = e instanceof Error ? e.message : a.dbError;
  }

  const summary = collectionSummary(videos, layers);
  const derived = videos.map((video) => ({ video, metrics: deriveMetrics(video) }));
  const agreement = aiAgreement(videos);
  const qualityMax = Math.max(summary.total, 1);
  const contentCounts = countLabels(videos, "content_type", "content_type", locale);

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

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.quality}</h2>
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <h3 className="text-sm text-slate-500">{a.videoCount}</h3>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.total}</p>
            <p className="mt-2 text-sm text-slate-600">{a.fullyComplete(summary.fullyComplete, summary.total)}</p>
          </div>
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
                    <td className="px-3 py-2">{modelLayerName(locale, layer.key, layer.label)}</td>
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
              label: modelLayerName(locale, layer.key, layer.label),
              value: layer.completeVideos,
              max: qualityMax,
              caption: a.completeCaption(layer.completeVideos, summary.total),
            }))}
          />
        </div>
        <p className="px-4 pb-3 text-xs text-slate-500">{a.qualityNote}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,1fr)] lg:items-stretch">
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">{a.contentDistribution}</h2>
          <Pie empty={a.noChartValues} items={contentCounts} />
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
      </div>

      <section className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b px-4 py-3 text-lg font-medium">{a.derivedContrast}</h2>
        <DerivedContrastTable
          locale={locale}
          empty={a.noVideos}
          prev={a.pagePrev}
          next={a.pageNext}
          columns={[
            "ID",
            m.videos.platform,
            m.videos.contentType,
            "Hook",
            m.detail.funnel,
            a.watching,
            a.memory,
            a.trust,
            a.action,
            a.ageDays,
            a.likeRate,
            a.commentRate,
            a.saveRate,
            a.shareRate,
            a.engagementRate,
          ]}
          rows={derived.map(({ video, metrics }) => ({
            id: video.video_id,
            cells: [
              video.video_id,
              platformName(video.meta_platform, m.platforms),
              contentLabel("content_type", video.content_type, locale),
              contentLabel("content_hook_type", video.content_hook_type, locale),
              contentLabel("content_funnel_stage", video.content_funnel_stage, locale),
              viewerEnumLabel("viewer_continued_watching", video.viewer_continued_watching, locale),
              video.viewer_memory_score == null ? "—" : String(video.viewer_memory_score),
              video.viewer_trust_score == null ? "—" : String(video.viewer_trust_score),
              video.viewer_action_intent_score == null ? "—" : String(video.viewer_action_intent_score),
              metrics.metrics_age_days == null ? "—" : String(metrics.metrics_age_days),
              formatRate(metrics.like_rate),
              formatRate(metrics.comment_rate),
              formatRate(metrics.save_rate),
              formatRate(metrics.share_rate),
              formatRate(metrics.engagement_rate),
            ],
          }))}
        />
        <p className="px-4 pb-3 text-xs text-slate-500">{a.contrastNote}</p>
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
