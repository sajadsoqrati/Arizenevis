import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { hashPassword, comparePassword } from "../utils/bcrypt";
import { generateReferralCode } from "../utils/helpers";
import {
  createTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
} from "../services/token.service";
import { authenticate, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(3, "نام و نام خانوادگی الزامی است"),
  nationalId: z.string().min(5, "شماره ملی یا شماره ثبت شرکت الزامی است"),
  jobTitle: z.string().min(2, "شغل الزامی است"),
  role: z.enum(["CUSTOMER", "COWORKER", "MARKETER"]),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  phone: z.string().min(10, "شماره تماس معتبر نیست"),
  city: z.string().min(2, "شهر الزامی است"),
  province: z.string().min(2, "استان الزامی است"),
  referralCode: z.string().optional(),
  acceptedTerms: z.boolean().refine((value) => value, {
    message: "برای ثبت‌نام باید قوانین و مقررات سایت را بپذیرید",
  }),
});

const loginSchema = z.object({
  nationalId: z.string().min(5, "شماره ملی یا شماره ثبت شرکت الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { nationalId: data.nationalId },
    });
    if (existing) {
      throw new AppError(409, "این شماره ملی قبلاً ثبت شده است");
    }

    let marketerProfileId: string | undefined;

    if (data.role === "COWORKER" && data.referralCode?.trim()) {
      const marketer = await prisma.marketerProfile.findUnique({
        where: { referralCode: data.referralCode.trim().toUpperCase() },
      });
      if (!marketer) {
        throw new AppError(400, "کد معرف نامعتبر است");
      }
      marketerProfileId = marketer.id;
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: data.fullName,
          nationalId: data.nationalId,
          jobTitle: data.jobTitle,
          role: data.role as Role,
          passwordHash,
          phone: data.phone,
          city: data.city,
          province: data.province,
        },
      });

      if (data.role === "MARKETER") {
        await tx.marketerProfile.create({
          data: {
            userId: created.id,
            referralCode: generateReferralCode(),
          },
        });
      }

      if (data.role === "COWORKER" && marketerProfileId) {
        await tx.coworkerLink.create({
          data: {
            coworkerId: created.id,
            marketerProfileId,
          },
        });
      }

      return created;
    });

    const tokens = await createTokenPair(user.id, user.role);

    res.status(201).json({
      message: "ثبت‌نام با موفقیت انجام شد",
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        nationalId: user.nationalId,
      },
      ...tokens,
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { nationalId: data.nationalId },
    });

    if (!user) {
      throw new AppError(401, "شماره ملی یا رمز عبور اشتباه است");
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "شماره ملی یا رمز عبور اشتباه است");
    }

    const tokens = await createTokenPair(user.id, user.role);

    res.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        nationalId: user.nationalId,
      },
      ...tokens,
    });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken =
      req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new AppError(401, "توکن بازیابی یافت نشد");
    }

    try {
      const result = await refreshAccessToken(refreshToken);
      res.json({
        accessToken: result.accessToken,
        user: { id: result.userId, role: result.role },
      });
    } catch {
      throw new AppError(401, "نشست شما منقضی شده است، لطفاً دوباره وارد شوید");
    }
  })
);

router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const refreshToken =
      req.body.refreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: "خروج موفق" });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        fullName: true,
        nationalId: true,
        jobTitle: true,
        role: true,
        phone: true,
        city: true,
        province: true,
        marketerProfile: { select: { referralCode: true } },
      },
    });

    if (!user) {
      throw new AppError(404, "کاربر یافت نشد");
    }

    res.json(user);
  })
);

export default router;
