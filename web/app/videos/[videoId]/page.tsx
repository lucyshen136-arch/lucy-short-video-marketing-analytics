import Link from "next/link";
import { notFound } from "next/navigation";

import { getVideoModelDb, type VideoModelField } from "@/lib/data/video-model";
import { getVideoDb, HttpError } from "@/lib/data/videos";
import { getMessages } from "@/lib/locale";
import { contentLabel, viewerEnumLabel, viewerScoreLabel } from "@/lib/labels";
import type { Locale } from "@/lib/i18n";
import type { VideoRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <dl className="grid gap-2 text-sm md:grid-cols-2">{children}</dl>
    </section>
  );
}

function fieldValue(video: VideoRecord, key: string): unknown {
  const column = video[key as keyof VideoRecord];
  if (column !== null && column !== undefined && column !== "") return column;
  const extra = video.extra?.[key];
  return extra === undefined ? column : extra;
}

function displayField(video: VideoRecord, field: VideoModelField, locale: Locale, platforms: Record<string, string>) {
  const value = fieldValue(video, field.field_key);
  if (value === null || value === undefined || value === "") return "—";
  if (field.field_key === "meta_platform") return platforms[String(value)] ?? String(value);
  if (field.field_key === "viewer_continued_watching") return viewerEnumLabel(field.field_key, String(value), locale);
  if (field.field_key.endsWith("_score") && typeof value === "number") return viewerScoreLabel(field.field_key, value, locale);
  if (field.dictionary_slug || field.field_kind === "enum") {
    return contentLabel(field.field_key, String(value), locale);
  }
  return String(value);
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

export default async function VideoDetailPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const { locale, m } = await getMessages();
  const d = m.detail;
  let video;
  try {
    video = await getVideoDb(videoId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }
  const model = await getVideoModelDb();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{video.meta_title}</h1>
          <p className="font-mono text-sm text-slate-500">{video.video_id}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/videos/${video.video_id}/edit`} className="rounded border px-3 py-2 text-sm hover:bg-slate-50">
            {d.edit}
          </Link>
          <a
            href={video.meta_public_url}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900"
          >
            {d.openLink}
          </a>
        </div>
      </div>

      <Section title={d.governance}>
        <Item label={d.selectionReason} value={video.selection_reason} />
        <Item label="source_kind" value={video.source_kind} />
      </Section>

      {model.layers.map((layer) => (
        <Section key={layer.id} title={layer.name}>
          {layer.fields.map((field) => (
            <Item
              key={field.field_key}
              label={field.label}
              value={displayField(video, field, locale, m.platforms)}
            />
          ))}
        </Section>
      ))}
    </div>
  );
}
