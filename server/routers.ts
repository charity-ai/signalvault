import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { referenceRouter } from "./routers/reference";

export const appRouter = router({
  system: systemRouter,
  reference: referenceRouter,
});

export type AppRouter = typeof appRouter;
