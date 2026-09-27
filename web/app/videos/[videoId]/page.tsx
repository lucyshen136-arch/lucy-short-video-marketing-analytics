import Link from "next/link";
import { notFound } from "next/navigation";

import { getVideoDb, HttpError } from "@/lib/data/videos";
import { getMessages } from "@/lib/locale";
import { contentLabel, viewerEnumLabel, viewerScoreLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <dl className="grid gap-2 text-sm md:grid-cols-2">{children}</dl>
    </section>
  );
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

      <Section title={d.layer1}>
        <Item label={m.videos.platform} value={m.platforms[video.meta_platform] ?? video.meta_platform} />
        <Item label={d.creator} value={video.meta_creator_name} />
        <Item label={d.publishDate} value={video.meta_publish_date} />
        <Item label={d.duration} value={video.meta_duration_seconds} />
        <Item label={d.collectedAt} value={video.meta_collected_at} />
        <Item label={d.views} value={video.meta_view_count} />
        <Item label={d.likes} value={video.meta_like_count} />
        <Item label={d.comments} value={video.meta_comment_count} />
        <Item label={d.saves} value={video.meta_save_count} />
        <Item label={d.shares} value={video.meta_share_count} />
        <Item label={d.followers} value={video.meta_follower_count} />
        <Item label={d.hashtags} value={video.meta_hashtags} />
      </Section>

      <Section title={d.layer2}>
        <Item label={d.contentType} value={contentLabel("content_type", video.content_type, locale)} />
        <Item label={d.hook} value={contentLabel("content_hook_type", video.content_hook_type, locale)} />
        <Item label={d.narrative} value={contentLabel("content_narrative_structure", video.content_narrative_structure, locale)} />
        <Item label={d.value} value={contentLabel("content_value_proposition", video.content_value_proposition, locale)} />
        <Item label={d.persuasion} value={contentLabel("content_persuasion", video.content_persuasion, locale)} />
        <Item label={d.evidence} value={contentLabel("content_evidence_type", video.content_evidence_type, locale)} />
        <Item label={d.funnel} value={contentLabel("content_funnel_stage", video.content_funnel_stage, locale)} />
        <Item label={d.cta} value={contentLabel("content_cta_type", video.content_cta_type, locale)} />
      </Section>

      <Section title={d.layer3}>
        <Item label={d.watching} value={viewerEnumLabel("viewer_continued_watching", video.viewer_continued_watching, locale)} />
        <Item label={d.memory} value={viewerScoreLabel("viewer_memory_score", video.viewer_memory_score, locale)} />
        <Item label={d.trust} value={viewerScoreLabel("viewer_trust_score", video.viewer_trust_score, locale)} />
        <Item label={d.action} value={viewerScoreLabel("viewer_action_intent_score", video.viewer_action_intent_score, locale)} />
      </Section>

      <Section title={d.layer4}>
        <Item label="ai_label_status" value={video.ai_label_status} />
        <Item label="ai_content_type" value={contentLabel("content_type", video.ai_content_type, locale)} />
        <Item label="ai_hook_type" value={contentLabel("content_hook_type", video.ai_hook_type, locale)} />
      </Section>
    </div>
  );
}
