import { param } from "../lib/params.js";
import { Router } from "express";
import { Prisma, EventStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { cacheGet, cacheSet, cacheDelPrefix } from "../lib/cache.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";

export const eventsRouter = Router();

function serializeEvent(event: any) {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    category: event.category,
    date: event.date.toISOString(),
    dateLabel: event.date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).toUpperCase(),
    time: event.time,
    track: event.track,
    city: event.city,
    voivodeship: event.voivodeship,
    imageUrl: event.imageUrl,
    lat: event.lat,
    lng: event.lng,
    status: event.status,
    organizerId: event.organizerId,
    organizer: event.organizer
      ? { id: event.organizer.id, username: event.organizer.username }
      : null,
    registrationsCount: event._count?.registrations ?? undefined,
  };
}

eventsRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const city = String(req.query.city || "").trim();
    const archive = String(req.query.archive || "") === "1";
    const statusParam = String(req.query.status || "").trim();

    const cacheKey = `events:${page}:${limit}:${q}:${category}:${city}:${archive}:${statusParam}:${req.user?.role || "guest"}`;
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) return res.json(cached);

    const where: Prisma.EventWhereInput = {};
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (req.user?.role === "ADMIN" && statusParam) {
      where.status = statusParam as EventStatus;
    } else if (req.user?.role === "ORGANIZER" && statusParam === "mine") {
      where.organizerId = req.user.id;
    } else if (archive) {
      // ARCHIVED + past APPROVED (not yet auto-archived)
      where.OR = [
        { status: "ARCHIVED" },
        { status: "APPROVED", date: { lt: startOfToday } },
      ];
    } else {
      where.status = "APPROVED";
      where.date = { gte: startOfToday };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { track: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category && category !== "all") where.category = category;
    if (city) where.city = { contains: city, mode: "insensitive" };

    const [total, items] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: {
          organizer: { select: { id: true, username: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { date: archive ? "desc" : "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const payload = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: items.map(serializeEvent),
    };
    cacheSet(cacheKey, payload, 20_000);
    res.json(payload);
  } catch (e) {
    next(e);
  }
});

eventsRouter.get("/meta/categories", async (_req, res, next) => {
  try {
    const rows = await prisma.event.findMany({
      where: { status: { in: ["APPROVED", "ARCHIVED"] } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    res.json(rows.map((r) => r.category));
  } catch (e) {
    next(e);
  }
});

eventsRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: param(req, "id") },
      include: {
        organizer: { select: { id: true, username: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) return res.status(404).json({ error: "Nie znaleziono wydarzenia" });

    const isPrivileged =
      req.user &&
      (req.user.role === "ADMIN" ||
        (req.user.role === "ORGANIZER" && event.organizerId === req.user.id));

    if (event.status !== "APPROVED" && event.status !== "ARCHIVED" && !isPrivileged) {
      return res.status(404).json({ error: "Nie znaleziono wydarzenia" });
    }

    res.json(serializeEvent(event));
  } catch (e) {
    next(e);
  }
});

const eventSchema = z.object({
  name: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(40),
  date: z.string(),
  time: z.string().min(1).max(10),
  track: z.string().min(2).max(120),
  city: z.string().min(2).max(80),
  voivodeship: z.string().min(2).max(80),
  imageUrl: z.string().url().optional().or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

eventsRouter.post("/", requireAuth, requireRole("ORGANIZER", "ADMIN"), formLimiter, async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: {
        ...data,
        imageUrl: data.imageUrl || null,
        date: new Date(data.date),
        status: req.user!.role === "ADMIN" ? "APPROVED" : "PENDING",
        organizerId: req.user!.id,
      },
      include: {
        organizer: { select: { id: true, username: true } },
        _count: { select: { registrations: true } },
      },
    });
    cacheDelPrefix("events:");
    res.status(201).json(serializeEvent(event));
  } catch (e) {
    next(e);
  }
});

eventsRouter.patch("/:id", requireAuth, requireRole("ORGANIZER", "ADMIN"), formLimiter, async (req, res, next) => {
  try {
    const existing = await prisma.event.findUnique({ where: { id: param(req, "id") } });
    if (!existing) return res.status(404).json({ error: "Nie znaleziono" });
    if (req.user!.role !== "ADMIN" && existing.organizerId !== req.user!.id) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    const data = eventSchema.partial().parse(req.body);
    const event = await prisma.event.update({
      where: { id: existing.id },
      data: {
        ...data,
        imageUrl: data.imageUrl === "" ? null : data.imageUrl,
        date: data.date ? new Date(data.date) : undefined,
        status: req.user!.role === "ORGANIZER" ? "PENDING" : existing.status,
      },
      include: {
        organizer: { select: { id: true, username: true } },
        _count: { select: { registrations: true } },
      },
    });
    cacheDelPrefix("events:");
    res.json(serializeEvent(event));
  } catch (e) {
    next(e);
  }
});
