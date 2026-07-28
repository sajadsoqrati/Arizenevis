import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";

const router = Router();

router.use(authenticate, authorize(Role.MARKETER));

router.get(
  "/profile",
  asyncHandler(async (req: AuthRequest, res) => {
    const profile = await prisma.marketerProfile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
            city: true,
            province: true,
          },
        },
        coworkers: {
          include: {
            coworker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                city: true,
                province: true,
                createdAt: true,
              },
            },
          },
        },
        budgetRequests: { orderBy: { createdAt: "desc" } },
        commissions: {
          include: {
            payment: {
              include: {
                helpRequest: {
                  include: { category: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, "پروفایل بازاریاب یافت نشد");
    }

    const totalCommission = profile.commissions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    res.json({ ...profile, totalCommission });
  })
);

const budgetSchema = z.object({
  amount: z.number().int().positive("مبلغ باید عدد مثبت باشد"),
  description: z.string().min(5, "توضیحات الزامی است"),
});

router.post(
  "/budget-requests",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = budgetSchema.parse(req.body);

    const profile = await prisma.marketerProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!profile) {
      throw new AppError(404, "پروفایل بازاریاب یافت نشد");
    }

    const budgetRequest = await prisma.budgetRequest.create({
      data: {
        marketerProfileId: profile.id,
        amount: data.amount,
        description: data.description,
      },
    });

    res.status(201).json({
      message: "درخواست بودجه ثبت شد",
      budgetRequest,
    });
  })
);

export default router;
