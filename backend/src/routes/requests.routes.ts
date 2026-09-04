import { Router } from "express";
import { z } from "zod";
import { HelpRequestStatus, Role } from "@prisma/client";
import { prisma } from "../config/database";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { paramId } from "../utils/params";
import { adminNotificationService } from "../services/admin-notification.service";

const router = Router();

const createRequestSchema = z.object({
  categorySlug: z.string().min(1),
  question: z.string().min(10, "متن درخواست باید حداقل ۱۰ کاراکتر باشد"),
});

router.post(
  "/",
  authenticate,
  authorize(Role.CUSTOMER, Role.COWORKER),
  asyncHandler(async (req: AuthRequest, res) => {
    const data = createRequestSchema.parse(req.body);

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: data.categorySlug },
    });

    if (!category) {
      throw new AppError(404, "دسته‌بندی یافت نشد");
    }

    const helpRequest = await prisma.helpRequest.create({
      data: {
        userId: req.user!.userId,
        categoryId: category.id,
        question: data.question,
        status: HelpRequestStatus.PENDING_PRICE,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            city: true,
            province: true,
          },
        },
      },
    });

    if (adminNotificationService.isAnyAdminOnline()) {
      adminNotificationService.notifyNewHelpRequest(helpRequest);
    }

    res.status(201).json({
      message: "درخواست شما ثبت شد. پس از تعیین قیمت توسط مدیر مطلع خواهید شد.",
      helpRequest,
    });
  })
);

router.get(
  "/mine",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const requests = await prisma.helpRequest.findMany({
      where: { userId: req.user!.userId },
      include: {
        category: true,
        payment: {
          select: {
            id: true,
            status: true,
            finalAmount: true,
            originalPrice: true,
            discountAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(requests);
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const id = paramId(req.params.id);
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
      include: {
        category: true,
        payment: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            nationalId: true,
          },
        },
      },
    });

    if (!helpRequest) {
      throw new AppError(404, "درخواست یافت نشد");
    }

    if (
      req.user!.role !== Role.ADMIN &&
      helpRequest.userId !== req.user!.userId
    ) {
      throw new AppError(403, "دسترسی غیرمجاز");
    }

    res.json(helpRequest);
  })
);

export default router;
