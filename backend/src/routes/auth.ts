import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendMail } from "../lib/mail.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Konto z tym emailem już istnieje" });

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 10),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email)}`,
        role: "USER",
      },
    });

    await sendMail(
      user.email,
      "Witaj w RACEPORTAL",
      `<p>Cześć ${user.username},</p><p>Twoje konto kierowcy zostało utworzone.</p>`,
    );

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        memberSince: user.createdAt.getFullYear().toString(),
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        memberSince: user.createdAt.getFullYear().toString(),
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: "Nie znaleziono użytkownika" });
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      memberSince: user.createdAt.getFullYear().toString(),
    });
  } catch (e) {
    next(e);
  }
});

authRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().min(2).max(40).optional(),
      email: z.string().email().optional(),
      avatar: z.union([z.string().url(), z.literal("")]).optional(),
    });
    const data = schema.parse(req.body);
    const current = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!current) return res.status(404).json({ error: "Nie znaleziono użytkownika" });

    if (data.email) {
      const email = data.email.toLowerCase();
      if (email !== current.email) {
        const taken = await prisma.user.findUnique({ where: { email } });
        if (taken) return res.status(409).json({ error: "Ten email jest już zajęty" });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar || null } : {}),
      },
    });

    if (data.email && data.email.toLowerCase() !== current.email) {
      await sendMail(
        user.email,
        "Zmiana adresu e-mail — RACEPORTAL",
        `<p>Cześć ${user.username},</p><p>Twój adres e-mail w RACEPORTAL został zmieniony na <strong>${user.email}</strong>.</p>`,
      );
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      memberSince: user.createdAt.getFullYear().toString(),
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/me/password", requireAuth, authLimiter, async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6).max(100),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: "Nie znaleziono użytkownika" });

    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Obecne hasło jest nieprawidłowe" });

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({ error: "Nowe hasło musi być inne niż obecne" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 10) },
    });

    await sendMail(
      user.email,
      "Hasło zmienione — RACEPORTAL",
      `<p>Cześć ${user.username},</p><p>Hasło do Twojego konta RACEPORTAL zostało zmienione. Jeśli to nie Ty — skontaktuj się z administratorem.</p>`,
    );

    res.json({ message: "Hasło zostało zmienione" });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      await sendMail(
        user.email,
        "Reset hasła RACEPORTAL",
        `<p>Otrzymaliśmy prośbę o reset hasła dla konta ${user.username}.</p><p>W wersji MVP skontaktuj się z administratorem lub zaloguj hasłem testowym.</p>`,
      );
    }
    res.json({
      message: "Jeśli konto istnieje, wysłaliśmy instrukcję resetu hasła na podany adres.",
    });
  } catch (e) {
    next(e);
  }
});
