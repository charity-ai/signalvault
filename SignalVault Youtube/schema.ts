import { bigint, boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus authentication flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Public channel metadata retained for the Reference workspace only. No copied
 * video, audio, caption track, or private transcript is stored in this model.
 */
export const referenceChannels = mysqlTable("referenceChannels", {
  id: int("id").autoincrement().primaryKey(),
  normalizedUrl: varchar("normalizedUrl", { length: 1024 }).notNull(),
  youtubeChannelId: varchar("youtubeChannelId", { length: 128 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  channelUrl: varchar("channelUrl", { length: 1024 }).notNull(),
  handle: varchar("handle", { length: 256 }),
  description: text("description").notNull(),
  tagsJson: text("tagsJson").notNull(),
  subscriberCount: bigint("subscriberCount", { mode: "number" }),
  totalViews: bigint("totalViews", { mode: "number" }),
  isSaved: boolean("isSaved").default(false).notNull(),
  sourceClass: mysqlEnum("sourceClass", ["public_metadata"]).default("public_metadata").notNull(),
  lastSyncedAt: timestamp("lastSyncedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("reference_channels_normalized_url_unique").on(table.normalizedUrl),
  index("reference_channels_youtube_id_idx").on(table.youtubeChannelId),
  index("reference_channels_expires_at_idx").on(table.expiresAt),
]);

/** Recent public metadata only, refreshed rather than treated as a permanent channel archive. */
export const referenceVideos = mysqlTable("referenceVideos", {
  id: int("id").autoincrement().primaryKey(),
  referenceChannelId: int("referenceChannelId").notNull().references(() => referenceChannels.id, { onDelete: "cascade" }),
  youtubeVideoId: varchar("youtubeVideoId", { length: 128 }).notNull(),
  title: varchar("title", { length: 768 }).notNull(),
  description: text("description").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }).notNull(),
  publishedAt: timestamp("publishedAt"),
  publishedLabel: varchar("publishedLabel", { length: 128 }).notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  viewCount: bigint("viewCount", { mode: "number" }),
  format: mysqlEnum("format", ["video", "short", "live"]).default("video").notNull(),
  metadataCapturedAt: timestamp("metadataCapturedAt").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("reference_videos_channel_video_unique").on(table.referenceChannelId, table.youtubeVideoId),
  index("reference_videos_channel_published_idx").on(table.referenceChannelId, table.publishedAt),
]);

/** Retrieval-ready public metadata chunks. Embeddings are intentionally external to the system of record. */
export const referenceChunks = mysqlTable("referenceChunks", {
  id: int("id").autoincrement().primaryKey(),
  referenceChannelId: int("referenceChannelId").notNull().references(() => referenceChannels.id, { onDelete: "cascade" }),
  referenceVideoId: int("referenceVideoId").references(() => referenceVideos.id, { onDelete: "cascade" }),
  sourceType: mysqlEnum("sourceType", ["channel_metadata", "video_metadata"]).notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  chunkText: text("chunkText").notNull(),
  normalizedText: text("normalizedText").notNull(),
  tokenEstimate: int("tokenEstimate").default(0).notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  embeddingState: mysqlEnum("embeddingState", ["not_configured", "pending", "ready", "failed"]).default("not_configured").notNull(),
  vectorRecordId: varchar("vectorRecordId", { length: 128 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("reference_chunks_channel_expiry_idx").on(table.referenceChannelId, table.expiresAt),
  index("reference_chunks_video_idx").on(table.referenceVideoId),
  index("reference_chunks_hash_idx").on(table.contentHash),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ReferenceChannel = typeof referenceChannels.$inferSelect;
export type ReferenceVideo = typeof referenceVideos.$inferSelect;
export type ReferenceChunk = typeof referenceChunks.$inferSelect;
