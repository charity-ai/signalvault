import { describe, expect, it } from "vitest";
import {
  filterPrototypeVideos,
  isUsablePublicChannelReference,
  isUsableQuestion,
  normalizeReferenceChannel,
} from "../client/src/lib/prototype-utils";

const videos = [
  { title: "The $3K AI Offer That Closes Faster", topic: "AI Offers", format: "Long-form" },
  { title: "The Cost of a Missed Lead", topic: "Lead Response", format: "Short" },
  { title: "Build the System Before You Buy the Software", topic: "Operations", format: "Live" },
];

describe("SignalVault prototype behavior", () => {
  it("returns only source items matching both a search and a format filter", () => {
    expect(filterPrototypeVideos(videos, "offer", "Long-form")).toEqual([videos[0]]);
    expect(filterPrototypeVideos(videos, "lead", "Short")).toEqual([videos[1]]);
  });

  it("treats the All filter and an empty search as the full private library", () => {
    expect(filterPrototypeVideos(videos, "", "All")).toHaveLength(3);
  });

  it("prevents blank channel questions from being submitted", () => {
    expect(isUsableQuestion("  ")).toBe(false);
    expect(isUsableQuestion("What has the channel said about retainers?")).toBe(true);
  });

  it("accepts a public YouTube URL or handle while rejecting arbitrary text", () => {
    expect(normalizeReferenceChannel("@samplecreator")).toBe("https://youtube.com/@samplecreator");
    expect(normalizeReferenceChannel("youtube.com/@samplecreator")).toBe("https://youtube.com/@samplecreator");
    expect(normalizeReferenceChannel("https://youtube.com/@samplecreator")).toBe("https://youtube.com/@samplecreator");
    expect(isUsablePublicChannelReference("not a channel")).toBe(false);
  });
});
