import type { Locale } from "@/lib/i18n";
import contentDictionary from "../data/content_label_dictionary.json";
import viewerDictionary from "../data/viewer_label_dictionary.json";

type Option = { code?: string; score?: number; label_zh: string };
type Field = { values?: Option[]; sentinel_values?: Option[]; anchors?: Option[] };
type Dictionary = { fields: Record<string, Field> };

const contentFields = (contentDictionary as Dictionary).fields;
const viewerFields = (viewerDictionary as Dictionary).fields;

function options(fields: Record<string, Field>, field: string): Option[] {
  const meta = fields[field];
  if (!meta) return [];
  return [...(meta.values ?? []), ...(meta.sentinel_values ?? []), ...(meta.anchors ?? [])];
}

const EN: Record<string, Record<string, string>> = {
  content_type: {
    travel_vlog: "Travel vlog",
    food_review: "Food review",
    beauty_review: "Beauty review",
    knowledge_explainer: "Explainer",
    film_tv_commentary: "Film and TV commentary",
    anime_comic_commentary: "Anime and comics commentary",
    lifestyle_review: "Lifestyle",
    product_review: "Product review",
    entertainment_clip: "Entertainment clip",
    brand_promo: "Brand promotion",
    other: "Other",
  },
  content_hook_type: {
    question: "Question",
    result_first: "Result first",
    conflict_contrast: "Conflict or contrast",
    strong_visual: "Strong visual",
  },
  content_narrative_structure: {
    result_then_process: "Result, then process",
    chronological: "Chronological",
    before_after: "Before / after",
    problem_solution: "Problem and solution",
    listicle: "List",
    other: "Other",
  },
  content_value_proposition: { none_clear: "No clear claim" },
  content_persuasion: {
    authority: "Authority",
    demonstration: "Demonstration",
    social_proof: "Social proof",
    scarcity_urgency: "Scarcity or deadline",
    story_resonance: "Story resonance",
    none_clear: "No clear persuasion",
  },
  content_evidence_type: {
    before_after: "Before / after",
    usage_process: "Usage process",
    verifiable_detail: "Verifiable detail",
    data_or_source: "Data or source",
    verbal_only: "Verbal claim only",
  },
  content_funnel_stage: { awareness: "Awareness", consideration: "Consideration", conversion: "Conversion" },
  content_cta_type: {
    none: "No CTA",
    follow: "Follow",
    like: "Like",
    comment_keyword: "Comment a keyword",
    profile_link: "Open profile or link",
    search_keyword: "Search a keyword",
    share: "Share",
    purchase: "Purchase",
  },
  viewer_continued_watching: { finished: "Finished", half_left: "Left halfway", left_early: "Left early" },
  viewer_memory_score: {
    "1": "Cannot recall it",
    "2": "Faint impression",
    "3": "Remember the topic",
    "4": "Remember a key image",
    "5": "Clear impression",
  },
  viewer_trust_score: {
    "1": "Not credible",
    "2": "Leaning not credible",
    "3": "Mixed",
    "4": "Mostly credible",
    "5": "Very credible",
  },
  viewer_action_intent_score: {
    "1": "No intent to act",
    "2": "Very weak intent",
    "3": "Somewhat interested",
    "4": "Strong intent",
    "5": "Ready to act",
  },
};

function localized(field: string, key: string, zhLabel: string | undefined, locale: Locale): string {
  if (locale === "en") return EN[field]?.[key] ?? zhLabel ?? key;
  return zhLabel ?? key;
}

export function optionDisplay(field: string, code: string, labelZh: string, locale: Locale): string {
  return `${localized(field, code, labelZh, locale)} (${code})`;
}

export function contentLabel(field: string, code: string | null | undefined, locale: Locale = "zh"): string {
  if (!code) return "—";
  const match = options(contentFields, field).find((item) => item.code === code);
  return localized(field, code, match?.label_zh, locale);
}

export function viewerEnumLabel(field: string, code: string | null | undefined, locale: Locale = "zh"): string {
  if (!code) return "—";
  const match = options(viewerFields, field).find((item) => item.code === code);
  return localized(field, code, match?.label_zh, locale);
}

export function viewerScoreLabel(field: string, score: number | null | undefined, locale: Locale = "zh"): string {
  if (score === null || score === undefined) return "—";
  const match = options(viewerFields, field).find((item) => item.score === Number(score));
  const label = localized(field, String(score), match?.label_zh, locale);
  return locale === "en" ? `${label} (${score})` : `${label}（${score}）`;
}

export const WATCHING_LABEL: Record<string, string> = Object.fromEntries(
  (viewerFields.viewer_continued_watching?.values ?? [])
    .filter((item) => item.code)
    .map((item) => [item.code as string, item.label_zh]),
);
