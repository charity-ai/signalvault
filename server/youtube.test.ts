import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({ ENV: { youtubeApiKey: "test-key", databaseUrl: "", isProduction: false } }));

import { fetchChannelSnapshot } from "./youtube";

const responses: Record<string, unknown> = {
  channels: {
    items: [{
      id: "UC123",
      snippet: { title: "Quantum Charity", description: "AI offers for local businesses", customUrl: "@quantumcharity" },
      statistics: { subscriberCount: "1200", viewCount: "45000" },
      contentDetails: { relatedPlaylists: { uploads: "UU123" } },
      brandingSettings: { channel: { keywords: "\"AI automation\" retainers" } },
    }],
  },
  playlistItems: { items: [{ contentDetails: { videoId: "vid1" } }, { contentDetails: { videoId: "vid2" } }] },
  videos: {
    items: [
      { id: "vid1", snippet: { title: "The $3K AI Offer", description: "Offer design", publishedAt: "2026-05-24T00:00:00Z", liveBroadcastContent: "none" }, contentDetails: { duration: "PT18M42S" }, statistics: { viewCount: "900" } },
      { id: "vid2", snippet: { title: "Quick tip", description: "", publishedAt: "2026-05-20T00:00:00Z", liveBroadcastContent: "none" }, contentDetails: { duration: "PT45S" }, statistics: { viewCount: "300" } },
    ],
  },
};

afterEach(() => vi.unstubAllGlobals());

describe("fetchChannelSnapshot", () => {
  it("maps YouTube Data API responses into the Reference pipeline shape", async () => {
    const calls: URL[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: URL) => {
      calls.push(input);
      const resource = input.pathname.split("/").pop()!;
      return new Response(JSON.stringify(responses[resource]), { status: 200 });
    }));

    const snapshot = await fetchChannelSnapshot("https://www.youtube.com/@quantumcharity", 24);

    expect(calls[0]!.searchParams.get("forHandle")).toBe("@quantumcharity");
    expect(calls.every(url => url.searchParams.get("key") === "test-key")).toBe(true);
    expect(snapshot?.details).toMatchObject({ authorId: "UC123", author: "Quantum Charity", keywords: ["AI automation", "retainers"], subCount: "1200" });
    expect(snapshot?.videos).toHaveLength(2);
    expect(snapshot?.videos[0]).toMatchObject({ videoId: "vid1", lengthSeconds: 1122, published: 1779580800 });
    expect(snapshot?.videos[1]).toMatchObject({ videoId: "vid2", lengthSeconds: 45 });
  });

  it("returns null when the channel cannot be found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })));
    expect(await fetchChannelSnapshot("https://www.youtube.com/@missing", 24)).toBeNull();
  });
});
