import type { VideoRecord } from "@/lib/types";

export const MIN_PAIRS = 3;

export const PLATFORM_LABEL: Record<string, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  bilibili: "Bilibili",
};

const RATE_FIELDS = [
  ["like_rate", "点赞率", "点赞 / 播放"],
  ["comment_rate", "评论率", "评论 / 播放"],
  ["save_rate", "收藏率", "收藏 / 播放"],
  ["share_rate", "分享率", "分享 / 播放"],
  ["engagement_rate", "互动率", "(点赞 + 评论 + 收藏 + 分享) / 播放"],
] as const;

export const FORMULAS = [
  {
    name: "采集间隔（天）",
    expression: "采集日期 − 发布日期",
    rule: "任一日期缺失则为空",
  },
  ...RATE_FIELDS.map(([, name, expression]) => ({
    name,
    expression,
    rule: "分子缺失，或播放量缺失、为 0，则为空。缺失不加进分子。",
  })),
  {
    name: "Spearman ρ",
    expression: "两边换成名次后，ρ = Σ(rx − rx̄)(ry − rȳ) / √[Σ(rx − rx̄)² Σ(ry − rȳ)²]",
    rule: `只在同一平台内、成对删除缺失后计算。有效配对少于 ${MIN_PAIRS} 不报告系数。`,
  },
  {
    name: "人机一致率",
    expression: "人工 code 与 AI code 相同的配对数 / 两边都已填写的配对数",
    rule: "AI 不是金标准，只和人工内容标签对照。",
  },
] as const;

export type DerivedMetrics = {
  video_id: string;
  platform: string;
  title: string;
  metrics_age_days: number | null;
  like_rate: number | null;
  comment_rate: number | null;
  save_rate: number | null;
  share_rate: number | null;
  engagement_rate: number | null;
};

export type AssociationResult = {
  id: string;
  platform: string;
  name: string;
  xLabel: string;
  yLabel: string;
  n: number;
  coefficient: number | null;
  status: "ok" | "insufficient" | "undefined";
};

export type AgreementField = {
  field: string;
  label: string;
  compared: number;
  matched: number;
  rate: number | null;
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

export function metricsAgeDays(collectedAt: string | null, publishDate: string | null): number | null {
  if (!collectedAt || !publishDate) return null;
  const collected = new Date(collectedAt);
  const published = new Date(`${publishDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(collected.getTime()) || Number.isNaN(published.getTime())) return null;
  return Math.round((collected.getTime() - published.getTime()) / 86_400_000);
}

export function deriveMetrics(video: VideoRecord): DerivedMetrics {
  const view = asNumber(video.meta_view_count);
  const like = asNumber(video.meta_like_count);
  const comment = asNumber(video.meta_comment_count);
  const save = asNumber(video.meta_save_count);
  const share = asNumber(video.meta_share_count);
  const engagementParts = [like, comment, save, share];
  const engagement =
    view !== null && view !== 0 && engagementParts.every((part) => part !== null)
      ? (engagementParts as number[]).reduce((sum, part) => sum + part, 0) / view
      : null;
  return {
    video_id: video.video_id,
    platform: video.meta_platform,
    title: video.meta_title,
    metrics_age_days: metricsAgeDays(video.meta_collected_at, video.meta_publish_date),
    like_rate: ratio(like, view),
    comment_rate: ratio(comment, view),
    save_rate: ratio(save, view),
    share_rate: ratio(share, view),
    engagement_rate: engagement,
  };
}

export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const mx = mean(xs);
  const my = mean(ys);
  let numerator = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    numerator += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return numerator / Math.sqrt(dx * dy);
}

export function ranks(values: number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const out = new Array<number>(values.length);
  let start = 0;
  while (start < order.length) {
    let end = start;
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end += 1;
    const rank = (start + end) / 2 + 1;
    for (let i = start; i <= end; i += 1) out[order[i].index] = rank;
    start = end + 1;
  }
  return out;
}

export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  return pearson(ranks(xs), ranks(ys));
}

const ASSOCIATIONS: {
  id: string;
  name: string;
  xLabel: string;
  yLabel: string;
  x: (video: VideoRecord) => number | null;
  y: (metrics: DerivedMetrics) => number | null;
}[] = [
  {
    name: "信任 × 点赞率",
    id: "trust_like",
    xLabel: "信任 1–5",
    yLabel: "点赞率",
    x: (video) => asNumber(video.viewer_trust_score),
    y: (metrics) => metrics.like_rate,
  },
  {
    name: "记忆 × 点赞率",
    id: "memory_like",
    xLabel: "记忆 1–5",
    yLabel: "点赞率",
    x: (video) => asNumber(video.viewer_memory_score),
    y: (metrics) => metrics.like_rate,
  },
  {
    name: "行动意愿 × 互动率",
    id: "action_engagement",
    xLabel: "行动意愿 1–5",
    yLabel: "互动率",
    x: (video) => asNumber(video.viewer_action_intent_score),
    y: (metrics) => metrics.engagement_rate,
  },
  {
    name: "信任 × 互动率",
    id: "trust_engagement",
    xLabel: "信任 1–5",
    yLabel: "互动率",
    x: (video) => asNumber(video.viewer_trust_score),
    y: (metrics) => metrics.engagement_rate,
  },
];

export function associationsByPlatform(videos: VideoRecord[]): AssociationResult[] {
  const platforms = [...new Set(videos.map((video) => video.meta_platform))];
  const results: AssociationResult[] = [];
  for (const platform of platforms) {
    const rows = videos.filter((video) => video.meta_platform === platform);
    for (const spec of ASSOCIATIONS) {
      const pairs = rows.flatMap((video) => {
        const x = spec.x(video);
        const y = spec.y(deriveMetrics(video));
        return x === null || y === null ? [] : [[x, y] as const];
      });
      const coefficient = spearman(
        pairs.map((pair) => pair[0]),
        pairs.map((pair) => pair[1]),
      );
      let status: AssociationResult["status"] = "ok";
      if (pairs.length < MIN_PAIRS) status = "insufficient";
      else if (coefficient === null) status = "undefined";
      results.push({
        id: spec.id,
        platform,
        name: spec.name,
        xLabel: spec.xLabel,
        yLabel: spec.yLabel,
        n: pairs.length,
        coefficient: status === "ok" ? coefficient : null,
        status,
      });
    }
  }
  return results;
}

const AI_FIELDS: { field: keyof VideoRecord; ai: keyof VideoRecord; label: string }[] = [
  { field: "content_type", ai: "ai_content_type", label: "内容类型" },
  { field: "content_hook_type", ai: "ai_hook_type", label: "Hook" },
  { field: "content_narrative_structure", ai: "ai_narrative_structure", label: "叙事结构" },
  { field: "content_value_proposition", ai: "ai_value_proposition", label: "价值主张" },
  { field: "content_persuasion", ai: "ai_persuasion", label: "说服机制" },
  { field: "content_evidence_type", ai: "ai_evidence_type", label: "证据方式" },
  { field: "content_funnel_stage", ai: "ai_funnel_stage", label: "漏斗阶段" },
  { field: "content_cta_type", ai: "ai_cta_type", label: "CTA" },
];

function filled(value: unknown): boolean {
  return !(value === null || value === undefined || (typeof value === "string" && value.trim() === ""));
}

export function aiAgreement(videos: VideoRecord[]): { overall: number | null; compared: number; fields: AgreementField[] } {
  let compared = 0;
  let matched = 0;
  const fields = AI_FIELDS.map((spec) => {
    let fieldCompared = 0;
    let fieldMatched = 0;
    for (const video of videos) {
      const human = video[spec.field];
      const ai = video[spec.ai];
      if (!filled(human) || !filled(ai)) continue;
      fieldCompared += 1;
      if (String(human) === String(ai)) fieldMatched += 1;
    }
    compared += fieldCompared;
    matched += fieldMatched;
    return {
      field: spec.field,
      label: spec.label,
      compared: fieldCompared,
      matched: fieldMatched,
      rate: fieldCompared === 0 ? null : fieldMatched / fieldCompared,
    };
  });
  return {
    overall: compared === 0 ? null : matched / compared,
    compared,
    fields,
  };
}

export function formatRate(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCoefficient(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(3);
}
