import { describe, expect, it } from "vitest";
import {
  buildReferenceReport,
  chunkPublicMetadata,
  normalizePublicChannelInput,
  rankReferenceChunks,
} from "./reference-pipeline";

describe("public Reference ingestion primitives", () => {
  it("normalizes a handle and rejects a non-YouTube source", () => {
    expect(normalizePublicChannelInput("@quantumcharity")).toBe("https://www.youtube.com/@quantumcharity");
    expect(normalizePublicChannelInput("youtube.com/@quantumcharity")).toBe("https://www.youtube.com/@quantumcharity");
    expect(() => normalizePublicChannelInput("https://example.com/channel")).toThrow("YouTube channel URL or @handle");
  });

  it("chunks public metadata without treating it as a transcript", () => {
    const chunks = chunkPublicMetadata("A ".repeat(900), 120, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.length <= 120)).toBe(true);
  });

  it("builds a metadata-bound reference report", () => {
    const report = buildReferenceReport({
      normalizedUrl: "https://www.youtube.com/@signalvault",
      youtubeChannelId: "UC123",
      channelTitle: "SignalVault Ideas",
      channelUrl: "https://www.youtube.com/@signalvault",
      handle: "@signalvault",
      description: "AI operations and authority systems for service businesses.",
      subscriberCount: 1000,
      totalViews: 25000,
      tags: ["AI", "operations"],
      videos: [{
        youtubeVideoId: "abc",
        title: "Build an AI operations system",
        description: "How to turn recurring operational leakage into a premium offer.",
        sourceUrl: "https://www.youtube.com/watch?v=abc",
        publishedAt: new Date("2026-08-01T00:00:00Z"),
        publishedLabel: "Aug 1, 2026",
        durationSeconds: 640,
        viewCount: 200,
        format: "video",
      }],
      chunks: [],
      syncedAt: new Date("2026-09-01T00:00:00Z"),
      expiresAt: new Date("2026-10-01T00:00:00Z"),
    }, 9);

    expect(report.channel.id).toBe(9);
    expect(report.metrics.videoCount).toBe(1);
    expect(report.sourcePolicy).toContain("Metadata-only");
    expect(report.positioningPattern).toContain("Public metadata");
  });

  it("returns only matching metadata chunks for a reference query", () => {
    const matches = rankReferenceChunks("premium offer operations", [
      { id: 1, chunkText: "Video title: Build an AI operations offer", normalizedText: "video title build an ai operations offer", sourceType: "video_metadata", title: "Build an AI operations offer", sourceUrl: "https://youtube.com/watch?v=1" },
      { id: 2, chunkText: "Video title: Founder morning routine", normalizedText: "video title founder morning routine", sourceType: "video_metadata", title: "Founder routine", sourceUrl: "https://youtube.com/watch?v=2" },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.chunkId).toBe(1);
    expect(matches[0]?.sourceType).toBe("video_metadata");
    expect(matches[0]?.score).toBeGreaterThan(0);
    expect(matches[0]?.score).toBeLessThanOrEqual(100);
  });
});
