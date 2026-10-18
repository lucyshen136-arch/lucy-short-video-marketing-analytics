export type ModelFieldKind = "text" | "number" | "date" | "datetime" | "url" | "enum";

export type ModelFieldDef = {
  field_key: string;
  label: string;
  field_kind: ModelFieldKind;
  required: boolean;
  dictionary_slug: string | null;
};

export type ModelLayerDef = {
  layer_key: string;
  name: string;
  fields: ModelFieldDef[];
};

function field(
  field_key: string,
  label: string,
  field_kind: ModelFieldKind,
  required = false,
  dictionary_slug: string | null = null,
): ModelFieldDef {
  return { field_key, label, field_kind, required, dictionary_slug };
}

export const DEFAULT_MODEL: ModelLayerDef[] = [
  {
    layer_key: "meta",
    name: "元数据",
    fields: [
      field("meta_platform", "平台", "enum", true),
      field("meta_public_url", "公开链接", "url", true),
      field("meta_title", "标题", "text", true),
      field("meta_creator_name", "作者昵称", "text", true),
      field("meta_publish_date", "发布日期", "date", true),
      field("meta_duration_seconds", "时长（秒）", "number"),
      field("meta_collected_at", "采集时间", "datetime"),
      field("meta_view_count", "播放量", "number"),
      field("meta_like_count", "点赞", "number"),
      field("meta_comment_count", "评论", "number"),
      field("meta_save_count", "收藏", "number"),
      field("meta_share_count", "分享", "number"),
      field("meta_follower_count", "粉丝量", "number"),
      field("meta_hashtags", "话题标签", "text"),
    ],
  },
  {
    layer_key: "content",
    name: "内容",
    fields: [
      field("content_type", "内容类型", "enum", false, "content"),
      field("content_hook_type", "Hook", "enum", false, "content"),
      field("content_narrative_structure", "叙事结构", "enum", false, "content"),
      field("content_value_proposition", "价值主张", "text", false, "content"),
      field("content_persuasion", "说服机制", "enum", false, "content"),
      field("content_evidence_type", "证据方式", "enum", false, "content"),
      field("content_funnel_stage", "漏斗阶段", "enum", false, "content"),
      field("content_cta_type", "CTA", "enum", false, "content"),
    ],
  },
  {
    layer_key: "viewer",
    name: "个人反应",
    fields: [
      field("viewer_continued_watching", "完看情况", "enum", false, "viewer"),
      field("viewer_memory_score", "记忆", "number", false, "viewer"),
      field("viewer_trust_score", "信任", "number", false, "viewer"),
      field("viewer_action_intent_score", "行动意愿", "number", false, "viewer"),
    ],
  },
  {
    layer_key: "ai",
    name: "AI标注",
    fields: [
      field("ai_label_status", "AI 标注状态", "enum", false, "ai"),
      field("ai_content_type", "内容类型", "enum", false, "ai"),
      field("ai_hook_type", "Hook", "enum", false, "ai"),
      field("ai_narrative_structure", "叙事结构", "enum", false, "ai"),
      field("ai_value_proposition", "价值主张", "text", false, "ai"),
      field("ai_persuasion", "说服机制", "enum", false, "ai"),
      field("ai_evidence_type", "证据方式", "enum", false, "ai"),
      field("ai_funnel_stage", "漏斗阶段", "enum", false, "ai"),
      field("ai_cta_type", "CTA", "enum", false, "ai"),
      field("ai_summary", "内容简介", "text"),
    ],
  },
];

export const BUILTIN_FIELD_KEYS = new Set(DEFAULT_MODEL.flatMap((layer) => layer.fields.map((item) => item.field_key)));
