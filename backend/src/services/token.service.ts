import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { hashToken, compareToken } from "../utils/bcrypt";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../utils/jwt";

export async function createTokenPair(userId: string, role: Role) {
  const payload = { userId, role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const tokenHash = await hashToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokens = await prisma.refreshToken.findMany({
    where: { userId: payload.userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  let valid = false;
  for (const stored of tokens) {
    if (await compareToken(refreshToken, stored.tokenHash)) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    throw new Error("INVALID_REFRESH");
  }

  const accessToken = signAccessToken({
    userId: payload.userId,
    role: payload.role,
  });

  return { accessToken, userId: payload.userId, role: payload.role };
}

export async function revokeRefreshToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokens = await prisma.refreshToken.findMany({
      where: { userId: payload.userId },
    });

    for (const stored of tokens) {
      if (await compareToken(refreshToken, stored.tokenHash)) {
        await prisma.refreshToken.delete({ where: { id: stored.id } });
        return;
      }
    }
  } catch {
    // ignore invalid token on logout
  }
}

export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}
