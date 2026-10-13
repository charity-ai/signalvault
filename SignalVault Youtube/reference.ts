import { z } from "zod";
import { listReferenceChunks, persistReferenceIngestion, setReferenceSaved } from "../reference-db";
import { buildReferenceReport, ingestPublicReferenceChannel, rankReferenceChunks } from "../reference-pipeline";
import { publicProcedure, router } from "../_core/trpc";

const channelInput = z.object({
  channelUrl: z.string().trim().min(3).max(1024),
});

export const referenceRouter = router({
  scan: publicProcedure.input(channelInput).mutation(async ({ input }) => {
    const ingestion = await ingestPublicReferenceChannel(input.channelUrl);
    const persisted = await persistReferenceIngestion(ingestion);
    return buildReferenceReport(ingestion, persisted.channelId, persisted.isSaved);
  }),

  query: publicProcedure.input(z.object({
    channelId: z.number().int().positive(),
    question: z.string().trim().min(3).max(500),
  })).mutation(async ({ input }) => {
    const chunks = await listReferenceChunks(input.channelId);
    return {
      matches: rankReferenceChunks(input.question, chunks),
      sourceClass: "public_metadata" as const,
      boundary: "Matches come from indexed public titles and descriptions only. They are not transcript-level evidence.",
    };
  }),

  setSaved: publicProcedure.input(z.object({
    channelId: z.number().int().positive(),
    saved: z.boolean(),
  })).mutation(({ input }) => setReferenceSaved(input.channelId, input.saved)),
});
