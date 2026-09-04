import { Router } from "express";
import { Role } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { adminNotificationService } from "../services/admin-notification.service";

const router = Router();

function extractToken(req: {
  query: { token?: unknown };
  headers: { authorization?: string };
}): string | null {
  if (typeof req.query.token === "string" && req.query.token.length > 0) {
    return req.query.token;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

router.get("/stream", (req, res) => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ message: "لطفاً وارد حساب کاربری شوید" });
    return;
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    res.status(401).json({ message: "نشست شما منقضی شده است" });
    return;
  }

  if (payload.role !== Role.ADMIN) {
    res.status(403).json({ message: "شما دسترسی به این بخش را ندارید" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  adminNotificationService.addClient(payload.userId, res);
});

export default router;
