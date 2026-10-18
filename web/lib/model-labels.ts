import type { Locale } from "@/lib/i18n";

const LAYERS: Record<string, string> = {
  meta: "Metadata",
  content: "Content",
  viewer: "Personal reaction",
  ai: "AI labels",
};

const FIELDS: Record<string, string> = {
  meta_platform: "Platform",
  meta_public_url: "Public URL",
  meta_title: "Title",
  meta_creator_name: "Creator",
  meta_publish_date: "Publish date",
  meta_duration_seconds: "Duration (seconds)",
  meta_collected_at: "Collected at",
  meta_view_count: "Views",
  meta_like_count: "Likes",
  meta_comment_count: "Comments",
  meta_save_count: "Saves",
  meta_share_count: "Shares",
  meta_follower_count: "Followers",
  meta_hashtags: "Hashtags",
  content_type: "Content type",
  content_hook_type: "Hook",
  content_narrative_structure: "Narrative",
  content_value_proposition: "Value proposition",
  content_persuasion: "Persuasion",
  content_evidence_type: "Evidence",
  content_funnel_stage: "Funnel stage",
  content_cta_type: "CTA",
  viewer_continued_watching: "Watching",
  viewer_memory_score: "Memory",
  viewer_trust_score: "Trust",
  viewer_action_intent_score: "Intent to act",
  ai_label_status: "AI label status",
  ai_content_type: "Content type",
  ai_hook_type: "Hook",
  ai_narrative_structure: "Narrative",
  ai_value_proposition: "Value proposition",
  ai_persuasion: "Persuasion",
  ai_evidence_type: "Evidence",
  ai_funnel_stage: "Funnel stage",
  ai_cta_type: "CTA",
  ai_summary: "Synopsis",
};

const KINDS: Record<string, { zh: string; en: string }> = {
  text: { zh: "纯文本", en: "Plain text" },
  number: { zh: "数字", en: "Number" },
  date: { zh: "日期", en: "Date" },
  datetime: { zh: "日期时间", en: "Date and time" },
  url: { zh: "链接", en: "URL" },
  enum: { zh: "枚举", en: "Enum" },
};

export function modelLayerName(locale: Locale, key: string, stored: string): string {
  if (locale !== "en") return stored;
  return LAYERS[key] ?? stored;
}

export function modelFieldName(locale: Locale, key: string, stored: string): string {
  if (locale !== "en") return stored;
  return FIELDS[key] ?? stored;
}

export function modelKindName(locale: Locale, kind: string): string {
  const row = KINDS[kind];
  if (!row) return kind;
  return locale === "en" ? row.en : row.zh;
}

export function englishFieldName(key: string): string | undefined {
  return FIELDS[key];
}

export function englishLayerName(key: string): string | undefined {
  return LAYERS[key];
}
