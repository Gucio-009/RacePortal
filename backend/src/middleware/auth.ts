import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const secret = () => process.env.JWT_SECRET || "raceportal-dev-secret";

export function signToken(user: AuthUser) {
  return jwt.sign(user, secret(), { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Brak autoryzacji" });
  }
  try {
    req.user = jwt.verify(header.slice(7), secret()) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ error: "Nieprawidłowy token" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), secret()) as AuthUser;
    } catch {
      /* ignore */
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Brak autoryzacji" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Brak uprawnień" });
    }
    next();
  };
}
