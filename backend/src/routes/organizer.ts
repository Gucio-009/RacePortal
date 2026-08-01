import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";

export const organizerRouter = Router();

organizerRouter.post("/apply", requireAuth, formLimiter, async (req, res, next) => {
  try {
    const data = z
      .object({
        company: z.string().min(2).max(120),
        message: z.string().min(10).max(2000),
      })
      .parse(req.body);

    if (req.user!.role === "ORGANIZER" || req.user!.role === "ADMIN") {
      return res.status(400).json({ error: "Masz już uprawnienia organizatora" });
    }

    const existing = await prisma.organizerApplication.findFirst({
      where: { userId: req.user!.id, status: "PENDING" },
    });
    if (existing) return res.status(409).json({ error: "Masz już aktywny wniosek" });

    const app = await prisma.organizerApplication.create({
      data: {
        userId: req.user!.id,
        company: data.company,
        message: data.message,
      },
    });
    res.status(201).json(app);
  } catch (e) {
    next(e);
  }
});

organizerRouter.use(requireAuth, requireRole("ORGANIZER", "ADMIN"));

organizerRouter.get("/events", async (req, res, next) => {
  try {
    const where = req.user!.role === "ADMIN" ? {} : { organizerId: req.user!.id };
    const items = await prisma.event.findMany({
      where,
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});
