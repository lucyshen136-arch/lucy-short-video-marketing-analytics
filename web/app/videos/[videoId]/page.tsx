import Link from "next/link";
import { notFound } from "next/navigation";

import { getVideo } from "@/lib/api";

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
  let video;
  try {
    video = await getVideo(videoId);
  } catch {
    notFound();
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
            编辑
          </Link>
          <a
            href={video.meta_public_url}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-900"
          >
            打开链接
          </a>
        </div>
      </div>

      <Section title="治理">
        <Item label="入选理由" value={video.selection_reason} />
        <Item label="source_kind" value={video.source_kind} />
      </Section>

      <Section title="第 1 层 · meta">
        <Item label="平台" value={video.meta_platform} />
        <Item label="作者" value={video.meta_creator_name} />
        <Item label="发布日期" value={video.meta_publish_date} />
        <Item label="时长（秒）" value={video.meta_duration_seconds} />
        <Item label="采集时间" value={video.meta_collected_at} />
        <Item label="播放量" value={video.meta_view_count} />
        <Item label="点赞" value={video.meta_like_count} />
        <Item label="评论" value={video.meta_comment_count} />
        <Item label="收藏" value={video.meta_save_count} />
        <Item label="分享" value={video.meta_share_count} />
        <Item label="粉丝" value={video.meta_follower_count} />
        <Item label="话题" value={video.meta_hashtags} />
      </Section>

      <Section title="第 2 层 · content">
        <Item label="内容类型" value={video.content_type} />
        <Item label="Hook" value={video.content_hook_type} />
        <Item label="叙事" value={video.content_narrative_structure} />
        <Item label="价值主张" value={video.content_value_proposition} />
        <Item label="说服" value={video.content_persuasion} />
        <Item label="证据" value={video.content_evidence_type} />
        <Item label="漏斗" value={video.content_funnel_stage} />
        <Item label="CTA" value={video.content_cta_type} />
      </Section>

      <Section title="第 3 层 · viewer">
        <Item label="完看" value={video.viewer_continued_watching} />
        <Item label="记忆" value={video.viewer_memory_score} />
        <Item label="信任" value={video.viewer_trust_score} />
        <Item label="行动意愿" value={video.viewer_action_intent_score} />
      </Section>

      <Section title="第 4 层 · ai">
        <Item label="ai_label_status" value={video.ai_label_status} />
        <Item label="ai_content_type" value={video.ai_content_type} />
        <Item label="ai_hook_type" value={video.ai_hook_type} />
      </Section>
    </div>
  );
}
