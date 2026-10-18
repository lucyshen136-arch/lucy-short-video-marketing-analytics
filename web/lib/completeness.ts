import type { VideoRecord } from "@/lib/types";

const LAYERS = [
  {
    key: "meta",
    label: "元数据",
    fields: [
      "meta_platform",
      "meta_public_url",
      "meta_title",
      "meta_creator_name",
      "meta_publish_date",
      "meta_duration_seconds",
      "meta_collected_at",
      "meta_view_count",
      "meta_like_count",
      "meta_comment_count",
      "meta_save_count",
      "meta_share_count",
      "meta_follower_count",
      "meta_hashtags",
    ],
  },
  {
    key: "content",
    label: "内容",
    fields: [
      "content_type",
      "content_hook_type",
      "content_narrative_structure",
      "content_value_proposition",
      "content_persuasion",
      "content_evidence_type",
      "content_funnel_stage",
      "content_cta_type",
    ],
  },
  {
    key: "viewer",
    label: "个人反应",
    fields: [
      "viewer_continued_watching",
      "viewer_memory_score",
      "viewer_trust_score",
      "viewer_action_intent_score",
    ],
  },
  {
    key: "ai",
    label: "AI标注",
    fields: [
      "ai_content_type",
      "ai_hook_type",
      "ai_narrative_structure",
      "ai_value_proposition",
      "ai_persuasion",
      "ai_evidence_type",
      "ai_funnel_stage",
      "ai_cta_type",
      "ai_label_status",
    ],
  },
] as const satisfies readonly {
  key: string;
  label: string;
  fields: readonly (keyof VideoRecord)[];
}[];

export type CompletenessLayer = {
  key: string;
  label: string;
  fields: readonly string[];
};

export type LayerCompleteness = {
  key: string;
  label: string;
  missing: number;
  text: string;
};

function readField(video: VideoRecord, key: string): unknown {
  const column = video[key as keyof VideoRecord];
  if (isCollected(column)) return column;
  const extra = video.extra;
  if (extra && Object.prototype.hasOwnProperty.call(extra, key)) return extra[key];
  return column;
}

function isCollected(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

export function defaultCompletenessLayers(): CompletenessLayer[] {
  return LAYERS.map((layer) => ({ key: layer.key, label: layer.label, fields: layer.fields }));
}

export function layerCompleteness(video: VideoRecord, layers: readonly CompletenessLayer[] = LAYERS): LayerCompleteness[] {
  return layers.map((layer) => {
    const missing = layer.fields.filter((field) => !isCollected(readField(video, field))).length;
    return {
      key: layer.key,
      label: layer.label,
      missing,
      text: missing === 0 ? "完整" : `缺失（${missing}）`,
    };
  });
}

export type LayerQuality = {
  key: string;
  label: string;
  fieldCount: number;
  completeVideos: number;
  missingFields: number;
};

export type CollectionSummary = {
  total: number;
  fullyComplete: number;
  layers: LayerQuality[];
};

export function collectionSummary(
  videos: VideoRecord[],
  source: readonly CompletenessLayer[] = LAYERS,
): CollectionSummary {
  const layers = source.map((layer) => {
    let completeVideos = 0;
    let missingFields = 0;
    for (const video of videos) {
      const missing = layer.fields.filter((field) => !isCollected(readField(video, field))).length;
      missingFields += missing;
      if (missing === 0) completeVideos += 1;
    }
    return {
      key: layer.key,
      label: layer.label,
      fieldCount: layer.fields.length,
      completeVideos,
      missingFields,
    };
  });
  const fullyComplete = videos.filter((video) => layerCompleteness(video, source).every((layer) => layer.missing === 0)).length;
  return { total: videos.length, fullyComplete, layers };
}
