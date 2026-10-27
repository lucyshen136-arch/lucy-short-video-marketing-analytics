import { contentLabel, viewerEnumLabel, viewerScoreLabel } from "@/lib/labels";
import { modelFieldName } from "@/lib/model-labels";
import type { Locale } from "@/lib/i18n";
import type { VideoRecord } from "@/lib/types";

const PAIRS: {
  from: keyof VideoRecord;
  fromStored: string;
  to: keyof VideoRecord;
  toStored: string;
  toKind: "enum" | "score";
}[] = [
  { from: "content_hook_type", fromStored: "Hook", to: "viewer_continued_watching", toStored: "完看情况", toKind: "enum" },
  { from: "content_hook_type", fromStored: "Hook", to: "viewer_memory_score", toStored: "记忆", toKind: "score" },
  { from: "content_narrative_structure", fromStored: "叙事结构", to: "viewer_continued_watching", toStored: "完看情况", toKind: "enum" },
  { from: "content_narrative_structure", fromStored: "叙事结构", to: "viewer_memory_score", toStored: "记忆", toKind: "score" },
  { from: "content_evidence_type", fromStored: "证据方式", to: "viewer_trust_score", toStored: "信任", toKind: "score" },
  { from: "content_persuasion", fromStored: "说服机制", to: "viewer_trust_score", toStored: "信任", toKind: "score" },
  { from: "content_funnel_stage", fromStored: "漏斗阶段", to: "viewer_action_intent_score", toStored: "行动意愿", toKind: "score" },
  { from: "content_cta_type", fromStored: "CTA", to: "viewer_action_intent_score", toStored: "行动意愿", toKind: "score" },
];

const LEFT_ORDER = [
  "content_hook_type",
  "content_narrative_structure",
  "content_evidence_type",
  "content_persuasion",
  "content_funnel_stage",
  "content_cta_type",
];

const RIGHT_ORDER = ["viewer_continued_watching", "viewer_memory_score", "viewer_trust_score", "viewer_action_intent_score"];

export const FIELD_COLOR: Record<string, string> = {
  content_hook_type: "#1d4ed8",
  content_narrative_structure: "#0f766e",
  content_evidence_type: "#c2410c",
  content_persuasion: "#7c3aed",
  content_funnel_stage: "#be185d",
  content_cta_type: "#0369a1",
};

export type SankeyNode = { id: string; field: string; label: string; value: number; color: string };
export type SankeyLink = { source: string; target: string; value: number; color: string };

function textValue(video: VideoRecord, field: keyof VideoRecord, kind: "enum" | "score"): string | null {
  const raw = video[field];
  if (raw == null || raw === "") return null;
  if (kind === "score") {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 5) return null;
    return String(n);
  }
  return String(raw);
}

function displayValue(field: string, value: string, kind: "enum" | "score", locale: Locale): string {
  if (kind === "score") return viewerScoreLabel(field, Number(value), locale);
  if (field.startsWith("viewer_")) return viewerEnumLabel(field, value, locale);
  return contentLabel(field, value, locale);
}

function sortNodes(nodes: SankeyNode[], order: string[]): SankeyNode[] {
  return [...nodes].sort((a, b) => {
    const ai = order.indexOf(a.field);
    const bi = order.indexOf(b.field);
    if (ai !== bi) return ai - bi;
    return b.value - a.value || a.label.localeCompare(b.label, "zh");
  });
}

export function contentReactionFlows(videos: VideoRecord[], locale: Locale): { left: SankeyNode[]; right: SankeyNode[]; links: SankeyLink[] } {
  const counts = new Map<string, { from: string; fromStored: string; fromValue: string; to: string; toStored: string; toKind: "enum" | "score"; toValue: string; n: number }>();
  for (const video of videos) {
    for (const pair of PAIRS) {
      const fromValue = textValue(video, pair.from, "enum");
      const toValue = textValue(video, pair.to, pair.toKind);
      if (!fromValue || !toValue) continue;
      const key = `${pair.from}::${fromValue}|${pair.to}::${toValue}`;
      const row = counts.get(key);
      if (row) row.n += 1;
      else {
        counts.set(key, {
          from: pair.from,
          fromStored: pair.fromStored,
          fromValue,
          to: pair.to,
          toStored: pair.toStored,
          toKind: pair.toKind,
          toValue,
          n: 1,
        });
      }
    }
  }

  const leftMap = new Map<string, SankeyNode>();
  const rightMap = new Map<string, SankeyNode>();
  const links: SankeyLink[] = [];
  for (const row of counts.values()) {
    const source = `${row.from}::${row.fromValue}`;
    const target = `${row.to}::${row.toValue}`;
    const color = FIELD_COLOR[row.from] ?? "#1d4ed8";
    const leftLabel = `${modelFieldName(locale, row.from, row.fromStored)} · ${displayValue(row.from, row.fromValue, "enum", locale)}`;
    const rightLabel = `${modelFieldName(locale, row.to, row.toStored)} · ${displayValue(row.to, row.toValue, row.toKind, locale)}`;
    const left = leftMap.get(source) ?? { id: source, field: row.from, label: leftLabel, value: 0, color };
    left.value += row.n;
    leftMap.set(source, left);
    const right = rightMap.get(target) ?? { id: target, field: row.to, label: rightLabel, value: 0, color: "#475569" };
    right.value += row.n;
    rightMap.set(target, right);
    links.push({ source, target, value: row.n, color });
  }

  return {
    left: sortNodes([...leftMap.values()], LEFT_ORDER),
    right: sortNodes([...rightMap.values()], RIGHT_ORDER),
    links: links.sort((a, b) => b.value - a.value),
  };
}
