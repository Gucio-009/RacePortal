import { param } from "../lib/params.js";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { formLimiter } from "../middleware/rateLimit.js";

export const garageRouter = Router();

garageRouter.use(requireAuth);

garageRouter.get("/", async (req, res, next) => {
  try {
    const cars = await prisma.car.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(cars);
  } catch (e) {
    next(e);
  }
});

const carSchema = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1950).max(2100).optional(),
  className: z.string().max(60).optional(),
  plate: z.string().max(20).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

garageRouter.post("/", formLimiter, async (req, res, next) => {
  try {
    const data = carSchema.parse(req.body);
    const car = await prisma.car.create({
      data: {
        ...data,
        imageUrl: data.imageUrl || null,
        userId: req.user!.id,
      },
    });
    res.status(201).json(car);
  } catch (e) {
    next(e);
  }
});

garageRouter.delete("/:id", formLimiter, async (req, res, next) => {
  try {
    const car = await prisma.car.findFirst({ where: { id: param(req, "id"), userId: req.user!.id } });
    if (!car) return res.status(404).json({ error: "Nie znaleziono auta" });
    await prisma.car.delete({ where: { id: car.id } });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
