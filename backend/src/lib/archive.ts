import { prisma } from "./prisma.js";
import { cacheDelPrefix } from "./cache.js";

/** Mark past APPROVED events as ARCHIVED so lists stay clean. */
export async function archivePastEvents(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const result = await prisma.event.updateMany({
    where: {
      status: "APPROVED",
      date: { lt: startOfToday },
    },
    data: { status: "ARCHIVED" },
  });

  if (result.count > 0) {
    cacheDelPrefix("events:");
    console.log(`Auto-archived ${result.count} past event(s)`);
  }

  return result.count;
}
