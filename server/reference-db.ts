import { eq } from "drizzle-orm";
import { referenceChannels, referenceChunks, referenceVideos } from "../drizzle/schema";
import { getDb } from "./db";
import type { ReferenceIngestion } from "./reference-pipeline";

export async function persistReferenceIngestion(ingestion: ReferenceIngestion): Promise<{ channelId: number; isSaved: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Reference storage is unavailable. Please try again in a moment.");

  const existing = await db.select().from(referenceChannels)
    .where(eq(referenceChannels.normalizedUrl, ingestion.normalizedUrl))
    .limit(1);
  const current = existing[0];
  const channelValues = {
    youtubeChannelId: ingestion.youtubeChannelId,
    title: ingestion.channelTitle,
    channelUrl: ingestion.channelUrl,
    handle: ingestion.handle,
    description: ingestion.description,
    tagsJson: JSON.stringify(ingestion.tags),
    subscriberCount: ingestion.subscriberCount,
    totalViews: ingestion.totalViews,
    lastSyncedAt: ingestion.syncedAt,
    expiresAt: ingestion.expiresAt,
  };

  let channelId: number;
  let isSaved = false;
  if (current) {
    await db.update(referenceChannels).set(channelValues).where(eq(referenceChannels.id, current.id));
    channelId = current.id;
    isSaved = current.isSaved;
    await db.delete(referenceChunks).where(eq(referenceChunks.referenceChannelId, channelId));
    await db.delete(referenceVideos).where(eq(referenceVideos.referenceChannelId, channelId));
  } else {
    const inserted = await db.insert(referenceChannels).values({
      normalizedUrl: ingestion.normalizedUrl,
      ...channelValues,
    });
    channelId = Number(inserted[0].insertId);
  }

  if (ingestion.videos.length > 0) {
    await db.insert(referenceVideos).values(ingestion.videos.map(video => ({
      referenceChannelId: channelId,
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      description: video.description,
      sourceUrl: video.sourceUrl,
      publishedAt: video.publishedAt,
      publishedLabel: video.publishedLabel,
      durationSeconds: video.durationSeconds,
      viewCount: video.viewCount,
      format: video.format,
      metadataCapturedAt: ingestion.syncedAt,
      expiresAt: ingestion.expiresAt,
    })));
  }

  const storedVideos = await db.select().from(referenceVideos)
    .where(eq(referenceVideos.referenceChannelId, channelId));
  const videoIdByYoutubeId = new Map(storedVideos.map(video => [video.youtubeVideoId, video.id]));

  if (ingestion.chunks.length > 0) {
    await db.insert(referenceChunks).values(ingestion.chunks.map(chunk => ({
      referenceChannelId: channelId,
      referenceVideoId: chunk.youtubeVideoId ? videoIdByYoutubeId.get(chunk.youtubeVideoId) ?? null : null,
      sourceType: chunk.sourceType,
      chunkIndex: chunk.chunkIndex,
      chunkText: chunk.chunkText,
      normalizedText: chunk.normalizedText,
      tokenEstimate: chunk.tokenEstimate,
      contentHash: chunk.contentHash,
      expiresAt: ingestion.expiresAt,
    })));
  }

  return { channelId, isSaved };
}

export async function listReferenceChunks(channelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Reference storage is unavailable. Please try again in a moment.");

  return db.select({
    id: referenceChunks.id,
    chunkText: referenceChunks.chunkText,
    normalizedText: referenceChunks.normalizedText,
    sourceType: referenceChunks.sourceType,
    title: referenceVideos.title,
    sourceUrl: referenceVideos.sourceUrl,
  })
    .from(referenceChunks)
    .leftJoin(referenceVideos, eq(referenceChunks.referenceVideoId, referenceVideos.id))
    .where(eq(referenceChunks.referenceChannelId, channelId));
}

export async function setReferenceSaved(channelId: number, saved: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Reference storage is unavailable. Please try again in a moment.");
  await db.update(referenceChannels).set({ isSaved: saved }).where(eq(referenceChannels.id, channelId));
  return { channelId, saved };
}
