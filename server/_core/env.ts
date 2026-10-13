export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
