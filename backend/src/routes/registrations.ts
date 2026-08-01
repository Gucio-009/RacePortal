import { param } from "../lib/params.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendMail } from "../lib/mail.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";
import { cacheDelPrefix } from "../lib/cache.js";

export const registrationsRouter = Router();

registrationsRouter.use(requireAuth);

registrationsRouter.get("/mine", async (req, res, next) => {
  try {
    const items = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: {
        event: true,
        car: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

registrationsRouter.post("/", formLimiter, async (req, res, next) => {
  try {
    const data = z
      .object({
        eventId: z.string().min(1),
        carId: z.string().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || event.status !== "APPROVED") {
      return res.status(400).json({ error: "Nie można zgłosić się na to wydarzenie" });
    }

    if (data.carId) {
      const car = await prisma.car.findFirst({ where: { id: data.carId, userId: req.user!.id } });
      if (!car) return res.status(400).json({ error: "Nieprawidłowe auto" });
    }

    const registration = await prisma.registration.upsert({
      where: {
        userId_eventId: { userId: req.user!.id, eventId: data.eventId },
      },
      create: {
        userId: req.user!.id,
        eventId: data.eventId,
        carId: data.carId,
        note: data.note,
        status: "PENDING",
      },
      update: {
        carId: data.carId,
        note: data.note,
        status: "PENDING",
      },
      include: { event: true, car: true },
    });

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user) {
      await sendMail(
        user.email,
        `Zgłoszenie: ${event.name}`,
        `<p>Twoje zgłoszenie na <strong>${event.name}</strong> zostało przyjęte i oczekuje na decyzję organizatora.</p>`,
      );
    }

    res.status(201).json(registration);
  } catch (e) {
    next(e);
  }
});

registrationsRouter.get("/event/:eventId", requireRole("ORGANIZER", "ADMIN"), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: param(req, "eventId") } });
    if (!event) return res.status(404).json({ error: "Nie znaleziono" });
    if (req.user!.role !== "ADMIN" && event.organizerId !== req.user!.id) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    const items = await prisma.registration.findMany({
      where: { eventId: event.id },
      include: {
        user: { select: { id: true, username: true, email: true, avatar: true } },
        car: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

registrationsRouter.patch("/:id/status", requireRole("ORGANIZER", "ADMIN"), formLimiter, async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]) })
      .parse(req.body);

    const registration = await prisma.registration.findUnique({
      where: { id: param(req, "id") },
      include: { event: true, user: true },
    });
    if (!registration) return res.status(404).json({ error: "Nie znaleziono" });
    if (req.user!.role !== "ADMIN" && registration.event.organizerId !== req.user!.id) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }

    const updated = await prisma.registration.update({
      where: { id: registration.id },
      data: { status },
      include: { event: true, car: true, user: { select: { id: true, username: true, email: true } } },
    });

    await sendMail(
      registration.user.email,
      `Status zgłoszenia: ${registration.event.name}`,
      `<p>Status Twojego zgłoszenia na <strong>${registration.event.name}</strong>: <strong>${status}</strong>.</p>`,
    );

    cacheDelPrefix("events:");
    res.json(updated);
  } catch (e) {
    next(e);
  }
});
