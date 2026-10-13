import { createHash } from "node:crypto";
import { callDataApi } from "./_core/dataApi";

const MAX_REFERENCE_VIDEOS = 24;
const MAX_CHUNK_CHARACTERS = 900;
const CHUNK_OVERLAP = 120;
const MAX_DESCRIPTION_CHARACTERS = 2_400;
const REFERENCE_RETENTION_DAYS = 30;

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "and", "are", "because", "been", "before", "being", "between", "build", "channel", "content", "could", "does", "each", "from", "have", "into", "just", "more", "most", "only", "over", "this", "that", "their", "then", "there", "these", "they", "through", "today", "under", "video", "what", "when", "where", "which", "with", "will", "would", "your",
]);

export type ReferenceSourceType = "channel_metadata" | "video_metadata";

export type ReferenceVideoInput = {
  youtubeVideoId: string;
  title: string;
  description: string;
  sourceUrl: string;
  publishedAt: Date | null;
  publishedLabel: string;
  durationSeconds: number;
  viewCount: number | null;
  format: "video" | "short" | "live";
};

export type ReferenceChunkInput = {
  youtubeVideoId: string | null;
  sourceType: ReferenceSourceType;
  chunkIndex: number;
  chunkText: string;
  normalizedText: string;
  tokenEstimate: number;
  contentHash: string;
};

export type ReferenceIngestion = {
  normalizedUrl: string;
  youtubeChannelId: string;
  channelTitle: string;
  channelUrl: string;
  handle: string | null;
  description: string;
  subscriberCount: number | null;
  totalViews: number | null;
  tags: string[];
  videos: ReferenceVideoInput[];
  chunks: ReferenceChunkInput[];
  syncedAt: Date;
  expiresAt: Date;
};

export type ReferenceReport = {
  channel: {
    id: number;
    title: string;
    url: string;
    handle: string | null;
    subscriberCount: number | null;
    totalViews: number | null;
    isSaved: boolean;
    lastSyncedAt: Date;
    expiresAt: Date;
  };
  metrics: {
    videoCount: number;
    cadence: string;
    topicPillars: number;
    coverage: number;
    indexedChunks: number;
  };
  topics: Array<{ label: string; count: number }>;
  positioningPattern: string;
  sourcePolicy: string;
  recentVideos: Array<{ title: string; url: string; publishedLabel: string; format: string }>;
};

export type RankedReferenceChunk = {
  chunkId: number;
  score: number;
  title: string | null;
  sourceUrl: string | null;
  sourceType: ReferenceSourceType;
  excerpt: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toDate(value: unknown): Date | null {
  const numeric = asNumber(value);
  if (numeric === null || numeric <= 0) return null;
  const milliseconds = numeric > 10_000_000_000 ? numeric : numeric * 1_000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shortText(value: string, maxLength = MAX_DESCRIPTION_CHARACTERS): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function normalizeWhitespace(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function contentHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function titleCase(value: string): string {
  return value.split(" ").filter(Boolean).map(word => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join(" ");
}

function getHandle(url: string): string | null {
  const match = url.match(/\/@([A-Za-z0-9._-]+)/);
  return match?.[1] ? `@${match[1]}` : null;
}

function canonicalChannelUrl(value: string): string {
  const input = value.trim();
  if (!input) throw new Error("A YouTube channel URL or @handle is required.");
  if (input.startsWith("@")) return `https://www.youtube.com/${input}`;

  const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  const host = url.hostname.toLowerCase();
  const approvedHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
  if (!approvedHosts.has(host)) throw new Error("Reference accepts a YouTube channel URL or @handle only.");

  const path = url.pathname.replace(/\/+$/, "");
  if (!/^\/@[A-Za-z0-9._-]+$/.test(path) && !/^\/(channel|c|user)\/[A-Za-z0-9._-]+$/i.test(path)) {
    throw new Error("Enter a channel URL such as youtube.com/@channel or an @handle.");
  }
  return `https://www.youtube.com${path}`;
}

export function normalizePublicChannelInput(value: string): string {
  return canonicalChannelUrl(value);
}

export function chunkPublicMetadata(text: string, maxCharacters = MAX_CHUNK_CHARACTERS, overlap = CHUNK_OVERLAP): string[] {
  const cleaned = shortText(text, MAX_DESCRIPTION_CHARACTERS).replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxCharacters) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(cleaned.length, start + maxCharacters);
    if (end < cleaned.length) {
      const boundary = cleaned.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(maxCharacters * 0.6)) end = boundary;
    }
    const chunk = cleaned.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

function inferFormat(record: UnknownRecord): ReferenceVideoInput["format"] {
  const badges = asArray(record.badges).map(value => asString(value).toLowerCase());
  if (record.isLiveNow === true || badges.some(badge => badge.includes("live"))) return "live";
  const duration = asNumber(record.lengthSeconds) ?? 0;
  if (duration > 0 && duration <= 90) return "short";
  return "video";
}

function parseVideo(value: unknown): ReferenceVideoInput | null {
  const container = asRecord(value);
  const record = isRecord(container.video) ? container.video : container;
  const youtubeVideoId = asString(record.videoId);
  const title = asString(record.title);
  if (!youtubeVideoId || !title) return null;

  const description = shortText(asString(record.description) || asString(record.descriptionSnippet));
  const publishedAt = toDate(record.published);
  const publishedLabel = asString(record.publishedText) || asString(record.publishedTimeText) || (publishedAt ? publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent upload");
  const stats = asRecord(record.stats);

  return {
    youtubeVideoId,
    title,
    description,
    sourceUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
    publishedAt,
    publishedLabel,
    durationSeconds: asNumber(record.lengthSeconds) ?? 0,
    viewCount: asNumber(record.viewCount) ?? asNumber(stats.views),
    format: inferFormat(record),
  };
}

function belongsToChannel(value: unknown, youtubeChannelId: string): boolean {
  const video = asRecord(asRecord(value).video);
  const author = asRecord(video.author);
  return asString(author.channelId) === youtubeChannelId;
}

function mergeVideos(videos: ReferenceVideoInput[]): ReferenceVideoInput[] {
  const byId = new Map<string, ReferenceVideoInput>();
  for (const video of videos) {
    const current = byId.get(video.youtubeVideoId);
    if (!current || video.description.length > current.description.length) {
      byId.set(video.youtubeVideoId, video);
    }
  }
  return Array.from(byId.values())
    .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))
    .slice(0, MAX_REFERENCE_VIDEOS);
}

function extractTopics(text: string, limit = 6): Array<{ label: string; count: number }> {
  const frequency = new Map<string, number>();
  for (const token of normalizeWhitespace(text).split(" ")) {
    if ((token.length < 4 && token !== "ai") || STOP_WORDS.has(token) || /^\d+$/.test(token)) continue;
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }
  return Array.from(frequency.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label: titleCase(label), count }));
}

function calculateCadence(videos: ReferenceVideoInput[]): string {
  const dated = videos.filter((video) => video.publishedAt).map(video => video.publishedAt!.getTime()).sort((a, b) => a - b);
  if (dated.length < 2) return "Recent metadata";
  const spanWeeks = Math.max(1, (dated.at(-1)! - dated[0]!) / (7 * 24 * 60 * 60 * 1_000));
  return `${(dated.length / spanWeeks).toFixed(1)} / wk`;
}

function calculateCoverage(channelDescription: string, videos: ReferenceVideoInput[]): number {
  if (videos.length === 0) return channelDescription ? 25 : 15;
  const describedVideoRatio = videos.filter(video => video.description.length >= 40).length / videos.length;
  const durationRatio = videos.filter(video => video.durationSeconds > 0).length / videos.length;
  return Math.min(92, Math.max(20, Math.round(20 + describedVideoRatio * 55 + durationRatio * 12 + (channelDescription ? 10 : 0))));
}

function buildChunks(channelDescription: string, channelTitle: string, tags: string[], videos: ReferenceVideoInput[]): ReferenceChunkInput[] {
  const chunks: ReferenceChunkInput[] = [];
  const add = (sourceType: ReferenceSourceType, youtubeVideoId: string | null, text: string) => {
    const sectionChunks = chunkPublicMetadata(text);
    sectionChunks.forEach((chunkText, chunkIndex) => {
      const normalizedText = normalizeWhitespace(chunkText);
      chunks.push({
        youtubeVideoId,
        sourceType,
        chunkIndex,
        chunkText,
        normalizedText,
        tokenEstimate: normalizedText ? normalizedText.split(" ").length : 0,
        contentHash: contentHash(chunkText),
      });
    });
  };

  const channelText = [`Channel: ${channelTitle}`, channelDescription ? `Description: ${channelDescription}` : "", tags.length ? `Topics: ${tags.join(", ")}` : ""].filter(Boolean).join("\n");
  if (channelText.trim()) add("channel_metadata", null, channelText);

  for (const video of videos) {
    const videoText = [`Video title: ${video.title}`, video.description ? `Public description: ${video.description}` : "", `Format: ${video.format}`].filter(Boolean).join("\n");
    add("video_metadata", video.youtubeVideoId, videoText);
  }

  return chunks.slice(0, 80);
}

export async function ingestPublicReferenceChannel(input: string): Promise<ReferenceIngestion> {
  const normalizedUrl = normalizePublicChannelInput(input);
  const detailsPayload = asRecord(await callDataApi("Youtube/get_channel_details", {
    query: { id: normalizedUrl, hl: "en" },
  }));

  const youtubeChannelId = asString(detailsPayload.authorId) || asString(detailsPayload.channelId);
  if (!youtubeChannelId) throw new Error("SignalVault could not resolve a channel ID from that public YouTube source.");

  const uploadsPayload = asRecord(await callDataApi("Youtube/get_channel_videos", {
    query: { id: youtubeChannelId, filter: "videos_latest", hl: "en", gl: "US" },
  }).catch(() => ({})));
  const nextCursor = asString(uploadsPayload.cursorNext);
  const nextUploadsPayload = nextCursor ? asRecord(await callDataApi("Youtube/get_channel_videos", {
    query: { id: youtubeChannelId, filter: "videos_latest", cursor: nextCursor, hl: "en", gl: "US" },
  }).catch(() => ({}))) : {};

  const latestVideos = asArray(detailsPayload.latestVideos).map(parseVideo).filter((video): video is ReferenceVideoInput => Boolean(video));
  const listedVideos = [...asArray(uploadsPayload.contents), ...asArray(nextUploadsPayload.contents)]
    .map(parseVideo)
    .filter((video): video is ReferenceVideoInput => Boolean(video));
  const channelTitle = asString(detailsPayload.author) || asString(detailsPayload.title) || getHandle(normalizedUrl) || "Public YouTube channel";
  const searchPayload = latestVideos.length + listedVideos.length === 0
    ? asRecord(await callDataApi("Youtube/search", { query: { q: channelTitle, hl: "en", gl: "US" } }).catch(() => ({})))
    : {};
  const searchedVideos = asArray(searchPayload.contents)
    .filter((item) => belongsToChannel(item, youtubeChannelId))
    .map(parseVideo)
    .filter((video): video is ReferenceVideoInput => Boolean(video));
  const videos = mergeVideos([...latestVideos, ...listedVideos, ...searchedVideos]);
  const canonicalBaseUrl = asString(detailsPayload.canonicalBaseUrl);
  const channelUrl = asString(detailsPayload.authorUrl).startsWith("http")
    ? asString(detailsPayload.authorUrl)
    : canonicalBaseUrl
      ? `https://www.youtube.com${canonicalBaseUrl.startsWith("/") ? canonicalBaseUrl : `/${canonicalBaseUrl}`}`
      : normalizedUrl;
  const description = shortText(asString(detailsPayload.description));
  const tags = [...asArray(detailsPayload.tags), ...asArray(detailsPayload.keywords)].map(asString).filter(Boolean).slice(0, 30);
  const stats = asRecord(detailsPayload.stats);
  const syncedAt = new Date();
  const expiresAt = new Date(syncedAt.getTime() + REFERENCE_RETENTION_DAYS * 24 * 60 * 60 * 1_000);

  return {
    normalizedUrl,
    youtubeChannelId,
    channelTitle,
    channelUrl,
    handle: asString(detailsPayload.username) || getHandle(channelUrl) || getHandle(normalizedUrl),
    description,
    subscriberCount: asNumber(detailsPayload.subCount) ?? asNumber(stats.subscribers),
    totalViews: asNumber(detailsPayload.totalViews) ?? asNumber(stats.views),
    tags,
    videos,
    chunks: buildChunks(description, channelTitle, tags, videos),
    syncedAt,
    expiresAt,
  };
}

export function buildReferenceReport(ingestion: ReferenceIngestion, channelId: number, isSaved = false): ReferenceReport {
  const combinedText = [ingestion.description, ...ingestion.videos.map(video => `${video.title} ${video.description}`)].join(" ");
  const topics = extractTopics(combinedText);
  const topicNames = topics.slice(0, 3).map(topic => topic.label.toLowerCase());
  const formatMix = ingestion.videos.reduce<Record<string, number>>((counts, video) => {
    counts[video.format] = (counts[video.format] ?? 0) + 1;
    return counts;
  }, {});
  const dominantFormat = Object.entries(formatMix).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "video";
  const positioningPattern = topicNames.length
    ? `Public metadata clusters around ${topicNames.join(", ")}. Recent titles and descriptions favor ${dominantFormat} content; use this as a reference pattern, not as private transcript evidence.`
    : "The channel exposes limited public metadata. Treat this scan as inventory-level inspiration rather than a knowledge claim.";

  return {
    channel: {
      id: channelId,
      title: ingestion.channelTitle,
      url: ingestion.channelUrl,
      handle: ingestion.handle,
      subscriberCount: ingestion.subscriberCount,
      totalViews: ingestion.totalViews,
      isSaved,
      lastSyncedAt: ingestion.syncedAt,
      expiresAt: ingestion.expiresAt,
    },
    metrics: {
      videoCount: ingestion.videos.length,
      cadence: calculateCadence(ingestion.videos),
      topicPillars: topics.length,
      coverage: calculateCoverage(ingestion.description, ingestion.videos),
      indexedChunks: ingestion.chunks.length,
    },
    topics,
    positioningPattern,
    sourcePolicy: "Metadata-only reference index. No private captions or transcript claims. Records expire or refresh after 30 days.",
    recentVideos: ingestion.videos.slice(0, 5).map(video => ({ title: video.title, url: video.sourceUrl, publishedLabel: video.publishedLabel, format: video.format })),
  };
}

export function rankReferenceChunks(
  query: string,
  chunks: Array<{ id: number; chunkText: string; normalizedText: string; sourceType: ReferenceSourceType; title: string | null; sourceUrl: string | null }>,
): RankedReferenceChunk[] {
  const queryTerms = Array.from(new Set(normalizeWhitespace(query).split(" ").filter(term => term.length >= 3 && !STOP_WORDS.has(term))));
  if (queryTerms.length === 0) return [];

  return chunks
    .map((chunk) => {
      const haystack = ` ${chunk.normalizedText} `;
      const titleText = normalizeWhitespace(chunk.title ?? "");
      const hits = queryTerms.reduce((total, term) => total + (haystack.includes(` ${term} `) ? 1 : 0), 0);
      const titleHits = queryTerms.reduce((total, term) => total + (titleText.includes(term) ? 1 : 0), 0);
      const score = Math.round((hits / queryTerms.length) * 80 + (titleHits / queryTerms.length) * 20);
      return {
        chunkId: chunk.id,
        score,
        title: chunk.title,
        sourceUrl: chunk.sourceUrl,
        sourceType: chunk.sourceType,
        excerpt: chunk.chunkText.length > 340 ? `${chunk.chunkText.slice(0, 337).trimEnd()}…` : chunk.chunkText,
      };
    })
    .filter(chunk => chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.chunkId - right.chunkId)
    .slice(0, 5);
}

export function formatReferenceCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
