/**
 * Minimal YouTube Data API v3 client used by the Reference pipeline.
 * Requires YOUTUBE_API_KEY (Google Cloud console → APIs & Services → YouTube Data API v3).
 * Typical channel scan cost: ~3–4 quota units out of the default 10,000/day.
 */
import { ENV } from "./_core/env";

const API_BASE = "https://www.googleapis.com/youtube/v3";

type Json = Record<string, any>;

async function yt(path: string, params: Record<string, string | number | undefined>): Promise<Json> {
  if (!ENV.youtubeApiKey) throw new Error("YOUTUBE_API_KEY is not configured.");
  const url = new URL(`${API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  url.searchParams.set("key", ENV.youtubeApiKey);
  const response = await fetch(url);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`YouTube API request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }
  return (await response.json()) as Json;
}

function parseIsoDuration(value: string | undefined): number {
  const match = value?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, d, h, m, s] = match.map(part => Number(part ?? 0));
  return d * 86_400 + h * 3_600 + m * 60 + s;
}

function parseKeywords(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(value.matchAll(/"([^"]+)"|(\S+)/g)).map(match => (match[1] ?? match[2] ?? "").trim()).filter(Boolean);
}

/** Resolve a canonical youtube.com channel URL (/@handle, /channel/ID, /user/NAME, /c/NAME) to a channel resource. */
async function resolveChannel(channelUrl: string): Promise<Json | null> {
  const part = "snippet,statistics,contentDetails,brandingSettings";
  const path = new URL(channelUrl).pathname;
  const [, kind, rawValue] = path.match(/^\/(@|channel\/|user\/|c\/)(.+)$/i) ?? [];
  const value = decodeURIComponent(rawValue ?? "");
  if (!kind || !value) return null;

  let params: Record<string, string>;
  if (kind === "@") params = { forHandle: `@${value}` };
  else if (kind.toLowerCase() === "channel/") params = { id: value };
  else if (kind.toLowerCase() === "user/") params = { forUsername: value };
  else {
    const search = await yt("search", { part: "snippet", type: "channel", q: value, maxResults: 1 });
    const id = search.items?.[0]?.snippet?.channelId ?? search.items?.[0]?.id?.channelId;
    if (!id) return null;
    params = { id };
  }
  const result = await yt("channels", { part, ...params });
  return result.items?.[0] ?? null;
}

export type YoutubeChannelSnapshot = {
  details: Json;
  videos: Json[];
};

/**
 * Returns channel details and recent uploads in the record shape the Reference pipeline parses
 * (authorId/author/description/keywords/subCount/totalViews and videoId/title/description/published/lengthSeconds/viewCount).
 */
export async function fetchChannelSnapshot(channelUrl: string, maxVideos: number): Promise<YoutubeChannelSnapshot | null> {
  const channel = await resolveChannel(channelUrl);
  if (!channel) return null;

  const snippet = channel.snippet ?? {};
  const stats = channel.statistics ?? {};
  const details: Json = {
    authorId: channel.id,
    author: snippet.title,
    description: snippet.description,
    canonicalBaseUrl: snippet.customUrl ? `/${snippet.customUrl}` : `/channel/${channel.id}`,
    username: snippet.customUrl,
    keywords: parseKeywords(channel.brandingSettings?.channel?.keywords),
    subCount: stats.hiddenSubscriberCount ? null : stats.subscriberCount,
    totalViews: stats.viewCount,
  };

  const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) return { details, videos: [] };

  const playlist = await yt("playlistItems", { part: "contentDetails", playlistId: uploadsPlaylist, maxResults: Math.min(50, maxVideos) });
  const ids: string[] = (playlist.items ?? []).map((item: Json) => item.contentDetails?.videoId).filter(Boolean);
  if (ids.length === 0) return { details, videos: [] };

  const videoResult = await yt("videos", { part: "snippet,contentDetails,statistics,liveStreamingDetails", id: ids.join(",") });
  const videos = (videoResult.items ?? []).map((video: Json) => {
    const publishedMs = Date.parse(video.snippet?.publishedAt ?? "");
    return {
      videoId: video.id,
      title: video.snippet?.title,
      description: video.snippet?.description,
      published: Number.isFinite(publishedMs) ? Math.floor(publishedMs / 1_000) : null,
      lengthSeconds: parseIsoDuration(video.contentDetails?.duration),
      viewCount: video.statistics?.viewCount,
      isLiveNow: video.snippet?.liveBroadcastContent === "live",
      badges: video.liveStreamingDetails ? ["live"] : [],
    };
  });

  return { details, videos };
}
