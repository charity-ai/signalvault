export type SearchableVideo = {
  title: string;
  topic: string;
  format: string;
};

export function filterPrototypeVideos<T extends SearchableVideo>(
  videos: T[],
  search: string,
  selectedFormat: "All" | string,
): T[] {
  const normalizedSearch = search.trim().toLowerCase();

  return videos.filter((video) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${video.title} ${video.topic}`.toLowerCase().includes(normalizedSearch);
    const matchesFormat = selectedFormat === "All" || video.format === selectedFormat;

    return matchesSearch && matchesFormat;
  });
}

export function isUsableQuestion(question: string): boolean {
  return question.trim().length > 0;
}

export function normalizeReferenceChannel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("@")) return `https://youtube.com/${trimmed}`;
  if (/^(www\.)?youtube\.com\//i.test(trimmed)) return `https://${trimmed.replace(/^www\./i, "")}`;
  if (/^https?:\/\/(www\.)?youtube\.com\//i.test(trimmed)) return trimmed;

  return "";
}

export function isUsablePublicChannelReference(value: string): boolean {
  return normalizeReferenceChannel(value).length > 0;
}
