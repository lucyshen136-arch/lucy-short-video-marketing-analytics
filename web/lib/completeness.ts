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
    label: "反应",
    fields: [
      "viewer_continued_watching",
      "viewer_memory_score",
      "viewer_trust_score",
      "viewer_action_intent_score",
    ],
  },
  {
    key: "ai",
    label: "AI",
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

export type LayerCompleteness = {
  key: (typeof LAYERS)[number]["key"];
  label: string;
  missing: number;
  text: string;
};

function isCollected(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

export function layerCompleteness(video: VideoRecord): LayerCompleteness[] {
  return LAYERS.map((layer) => {
    const missing = layer.fields.filter((field) => !isCollected(video[field])).length;
    return {
      key: layer.key,
      label: layer.label,
      missing,
      text: missing === 0 ? "完整" : `缺失（${missing}）`,
    };
  });
}

export type LayerQuality = {
  key: LayerCompleteness["key"];
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

export function collectionSummary(videos: VideoRecord[]): CollectionSummary {
  const layers = LAYERS.map((layer) => {
    let completeVideos = 0;
    let missingFields = 0;
    for (const video of videos) {
      const missing = layer.fields.filter((field) => !isCollected(video[field])).length;
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
  const fullyComplete = videos.filter((video) => layerCompleteness(video).every((layer) => layer.missing === 0)).length;
  return { total: videos.length, fullyComplete, layers };
}
