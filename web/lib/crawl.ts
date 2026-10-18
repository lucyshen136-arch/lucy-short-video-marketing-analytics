export type CollectedMeta = {
  meta_platform: string | null;
  meta_public_url: string;
  meta_title: string | null;
  meta_creator_name: string | null;
  meta_publish_date: string | null;
  meta_duration_seconds: number | null;
  meta_view_count: number | null;
  meta_like_count: number | null;
  meta_comment_count: number | null;
  meta_save_count: number | null;
  meta_share_count: number | null;
  meta_follower_count: number | null;
  meta_hashtags: string | null;
};

const VIDEO_HREF = /\/video\/|\/note\/|\/explore\/|\/reel\/|\/watch|BV[0-9A-Za-z]{6,}|\/status\//i;

export function assertPublicHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("bad_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("public_only");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.startsWith("127.")
  ) {
    throw new Error("localhost");
  }
  const parts = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    const privateRange =
      a === 10 ||
      a === 0 ||
      (a === 192 && b === 168) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 169 && b === 254);
    if (privateRange) {
      throw new Error("private");
    }
  }
  return url;
}

export function platformFromUrl(raw: string): string | null {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (host.endsWith("douyin.com") || host.endsWith("iesdouyin.com")) return "douyin";
    if (host.endsWith("xiaohongshu.com") || host.endsWith("xhslink.com")) return "xiaohongshu";
    if (host.endsWith("bilibili.com") || host === "b23.tv") return "bilibili";
  } catch {
    return null;
  }
  return null;
}

export function listingUrl(siteUrl: string, keyword: string): string {
  const url = assertPublicHttpUrl(siteUrl);
  const trimmed = keyword.trim();
  if (!trimmed || VIDEO_HREF.test(`${url.pathname}${url.search}`)) {
    return url.toString();
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host.endsWith("bilibili.com")) {
    return `https://search.bilibili.com/all?keyword=${encodeURIComponent(trimmed)}`;
  }
  if (host.endsWith("douyin.com")) {
    return `https://www.douyin.com/search/${encodeURIComponent(trimmed)}`;
  }
  if (host.endsWith("xiaohongshu.com")) {
    return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(trimmed)}`;
  }
  if (![...url.searchParams.values()].some((value) => value.includes(trimmed))) {
    url.searchParams.set("keyword", trimmed);
  }
  return url.toString();
}

function decode(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, key: string): string | null {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
    "i",
  );
  const match = html.match(pattern);
  const value = decode(match?.[1] || match?.[2] || "");
  return value || null;
}

function jsonLdNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        if (Array.isArray(record["@graph"])) {
          for (const child of record["@graph"]) {
            if (child && typeof child === "object") nodes.push(child as Record<string, unknown>);
          }
        } else {
          nodes.push(record);
        }
      }
    } catch {
      continue;
    }
  }
  return nodes;
}

function asType(node: Record<string, unknown>): string {
  const value = node["@type"];
  return Array.isArray(value) ? value.join(" ") : String(value ?? "");
}

function personName(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

function durationSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value !== "string") return null;
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function countFor(node: Record<string, unknown>, names: string[]): number | null {
  const stats = node.interactionStatistic;
  const list = Array.isArray(stats) ? stats : stats ? [stats] : [];
  for (const stat of list) {
    if (!stat || typeof stat !== "object") continue;
    const record = stat as Record<string, unknown>;
    const interaction = record.interactionType;
    const label =
      typeof interaction === "string"
        ? interaction
        : interaction && typeof interaction === "object"
          ? String((interaction as { "@type"?: unknown })["@type"] ?? "")
          : "";
    if (!names.some((name) => label.toLowerCase().includes(name))) continue;
    const count = Number(record.userInteractionCount);
    if (Number.isFinite(count)) return count;
  }
  return null;
}

function blankMeta(url: string): CollectedMeta {
  return {
    meta_platform: platformFromUrl(url),
    meta_public_url: url,
    meta_title: null,
    meta_creator_name: null,
    meta_publish_date: null,
    meta_duration_seconds: null,
    meta_view_count: null,
    meta_like_count: null,
    meta_comment_count: null,
    meta_save_count: null,
    meta_share_count: null,
    meta_follower_count: null,
    meta_hashtags: null,
  };
}

export function parseDetail(html: string, pageUrl: string): CollectedMeta {
  const item = blankMeta(pageUrl);
  item.meta_title = metaContent(html, "og:title") ?? decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  if (!item.meta_title) item.meta_title = null;
  const video = jsonLdNodes(html).find((node) => /videoobject/i.test(asType(node)));
  if (video) {
    if (typeof video.name === "string" && video.name.trim()) item.meta_title = video.name.trim();
    if (typeof video.url === "string") {
      try {
        item.meta_public_url = new URL(video.url, pageUrl).toString();
        item.meta_platform = platformFromUrl(item.meta_public_url) ?? item.meta_platform;
      } catch {
        /* keep the page url */
      }
    }
    item.meta_creator_name = personName(video.author) ?? personName(video.creator);
    item.meta_publish_date = dateOnly(video.uploadDate);
    item.meta_duration_seconds = durationSeconds(video.duration);
    item.meta_view_count = countFor(video, ["watch", "view"]);
    item.meta_like_count = countFor(video, ["like"]);
    item.meta_comment_count = countFor(video, ["comment"]);
    item.meta_share_count = countFor(video, ["share"]);
    if (Array.isArray(video.keywords)) item.meta_hashtags = video.keywords.map(String).join(" ");
    else if (typeof video.keywords === "string") item.meta_hashtags = video.keywords;
  }
  return item;
}

export function parseListing(html: string, pageUrl: string, limit: number): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const push = (href: string) => {
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    let absolute: string;
    try {
      absolute = new URL(href, pageUrl).toString();
      assertPublicHttpUrl(absolute);
    } catch {
      return;
    }
    if (seen.has(absolute)) return;
    seen.add(absolute);
    found.push(absolute);
  };

  for (const node of jsonLdNodes(html)) {
    if (typeof node.url === "string" && /videoobject|itemlist|listitem/i.test(asType(node))) push(node.url);
    if (Array.isArray(node.itemListElement)) {
      for (const child of node.itemListElement) {
        if (child && typeof child === "object" && typeof (child as { url?: unknown }).url === "string") {
          push((child as { url: string }).url);
        }
      }
    }
  }

  const anchor = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(anchor)) {
    if (VIDEO_HREF.test(match[1])) push(match[1]);
    if (found.length >= limit * 3) break;
  }
  const videoLinks = found.filter((href) => VIDEO_HREF.test(href));
  return (videoLinks.length ? videoLinks : found).slice(0, limit);
}

async function readPublicHtml(raw: string, timeoutMs: number): Promise<{ url: string; html: string }> {
  let current = assertPublicHttpUrl(raw).toString();
  for (let hop = 0; hop < 3; hop += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "LucyVideoResearch/1.0 (public page metadata)",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect");
      current = assertPublicHttpUrl(new URL(location, current).toString()).toString();
      continue;
    }
    if (!response.ok) throw new Error(`http:${response.status}`);
    const html = (await response.text()).slice(0, 1_500_000);
    return { url: current, html };
  }
  throw new Error("redirects");
}

export async function collectPublicMetadata(input: {
  siteUrl: string;
  keyword: string;
  limit: number;
}): Promise<{ items: CollectedMeta[]; note: string }> {
  const limit = Math.max(1, Math.min(20, Math.floor(input.limit) || 1));
  const started = Date.now();
  const deadline = started + 25_000;
  const firstUrl = listingUrl(input.siteUrl, input.keyword);
  const page = await readPublicHtml(firstUrl, 8_000);
  const self = parseDetail(page.html, page.url);
  const links = parseListing(page.html, page.url, limit).filter((href) => href !== page.url);
  const items: CollectedMeta[] = [];
  if (self.meta_title && (VIDEO_HREF.test(page.url) || links.length === 0)) {
    items.push(self);
  }
  for (const href of links) {
    if (items.length >= limit || Date.now() > deadline) break;
    try {
      const detail = await readPublicHtml(href, 6_000);
      const parsed = parseDetail(detail.html, detail.url);
      if (!parsed.meta_title) parsed.meta_title = self.meta_title;
      items.push(parsed);
    } catch {
      items.push(blankMeta(href));
    }
  }
  const keyword = input.keyword.trim().toLowerCase();
  const ordered = keyword
    ? [
        ...items.filter((item) => `${item.meta_title ?? ""} ${item.meta_public_url}`.toLowerCase().includes(keyword)),
        ...items.filter((item) => !`${item.meta_title ?? ""} ${item.meta_public_url}`.toLowerCase().includes(keyword)),
      ]
    : items;
  const chosen = ordered.filter((item) => item.meta_title || item.meta_public_url).slice(0, limit);
  const note = chosen.length ? `count:${chosen.length}` : "empty";
  return { items: chosen, note };
}
