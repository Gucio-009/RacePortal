import { param } from "../lib/params.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendMail } from "../lib/mail.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { cacheDelPrefix } from "../lib/cache.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", async (_req, res, next) => {
  try {
    const [users, events, pendingEvents, registrations, pendingApps] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.event.count({ where: { status: "PENDING" } }),
      prisma.registration.count(),
      prisma.organizerApplication.count({ where: { status: "PENDING" } }),
    ]);
    res.json({ users, events, pendingEvents, registrations, pendingApps });
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/users/:id/role", formLimiter, async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.enum(["USER", "ORGANIZER", "ADMIN"]) }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: param(req, "id") },
      data: { role },
      select: { id: true, email: true, username: true, role: true, avatar: true, createdAt: true },
    });
    await sendMail(
      user.email,
      "Zmiana roli w RACEPORTAL",
      `<p>Twoja rola w systemie to teraz: <strong>${role}</strong>.</p>`,
    );
    res.json(user);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/events/pending", async (_req, res, next) => {
  try {
    const items = await prisma.event.findMany({
      where: { status: "PENDING" },
      include: { organizer: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/events/:id/status", formLimiter, async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(["APPROVED", "REJECTED", "ARCHIVED", "PENDING", "DRAFT"]) })
      .parse(req.body);

    const event = await prisma.event.update({
      where: { id: param(req, "id") },
      data: { status },
      include: { organizer: true },
    });

    if (event.organizer) {
      await sendMail(
        event.organizer.email,
        `Status wydarzenia: ${event.name}`,
        `<p>Wydarzenie <strong>${event.name}</strong> ma teraz status: <strong>${status}</strong>.</p>`,
      );
    }

    cacheDelPrefix("events:");
    res.json(event);
  } catch (e) {
    next(e);
  }
});

adminRouter.get("/organizer-applications", async (_req, res, next) => {
  try {
    const items = await prisma.organizerApplication.findMany({
      include: { user: { select: { id: true, username: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

adminRouter.patch("/organizer-applications/:id", formLimiter, async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED"]) }).parse(req.body);
    const app = await prisma.organizerApplication.update({
      where: { id: param(req, "id") },
      data: { status },
      include: { user: true },
    });

    if (status === "APPROVED") {
      await prisma.user.update({ where: { id: app.userId }, data: { role: "ORGANIZER" } });
    }

    await sendMail(
      app.user.email,
      "Wniosek o rolę organizatora",
      `<p>Twój wniosek o konto organizatora: <strong>${status}</strong>.</p>`,
    );

    res.json(app);
  } catch (e) {
    next(e);
  }
});
