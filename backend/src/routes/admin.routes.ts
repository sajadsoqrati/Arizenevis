import { Router } from "express";
import { z } from "zod";
import { HelpRequestStatus, Role } from "@prisma/client";
import { prisma } from "../config/database";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { slugify } from "../utils/helpers";
import { paramId } from "../utils/params";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

const priceSchema = z.object({
  price: z.number().int().positive("قیمت باید عدد مثبت باشد"),
  answerDeadline: z.string().datetime({ message: "تاریخ پاسخ‌دهی معتبر نیست" }),
});

router.get(
  "/requests",
  asyncHandler(async (_req, res) => {
    const requests = await prisma.helpRequest.findMany({
      include: {
        category: true,
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            nationalId: true,
            city: true,
            province: true,
            role: true,
          },
        },
        payment: {
          include: { commission: true, discountCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  })
);

router.patch(
  "/requests/:id/price",
  asyncHandler(async (req, res) => {
    const data = priceSchema.parse(req.body);

    const id = paramId(req.params.id);
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!helpRequest) {
      throw new AppError(404, "درخواست یافت نشد");
    }

    if (helpRequest.status !== HelpRequestStatus.PENDING_PRICE) {
      throw new AppError(400, "فقط درخواست‌های در انتظار قیمت قابل ویرایش هستند");
    }

    const updated = await prisma.helpRequest.update({
      where: { id },
      data: {
        price: data.price,
        answerDeadline: new Date(data.answerDeadline),
        status: HelpRequestStatus.PRICED,
      },
      include: { category: true, user: true },
    });

    res.json({
      message: "قیمت و زمان پاسخ‌دهی ثبت شد",
      helpRequest: updated,
    });
  })
);

router.patch(
  "/requests/:id/answered",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id },
    });

    if (!helpRequest) {
      throw new AppError(404, "درخواست یافت نشد");
    }

    const updated = await prisma.helpRequest.update({
      where: { id },
      data: { status: HelpRequestStatus.ANSWERED },
    });

    res.json({ message: "وضعیت به «پاسخ داده شده» تغییر کرد", helpRequest: updated });
  })
);

router.get(
  "/payments",
  asyncHandler(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      include: {
        helpRequest: {
          include: {
            category: true,
            user: {
              select: {
                fullName: true,
                phone: true,
                nationalId: true,
                city: true,
                province: true,
              },
            },
          },
        },
        commission: {
          include: {
            marketerProfile: {
              include: {
                user: { select: { fullName: true, phone: true } },
              },
            },
          },
        },
        discountCode: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  })
);

router.get(
  "/marketers",
  asyncHandler(async (_req, res) => {
    const marketers = await prisma.marketerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
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
              },
            },
          },
        },
        commissions: true,
        budgetRequests: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(marketers);
  })
);

router.get(
  "/budget-requests",
  asyncHandler(async (_req, res) => {
    const requests = await prisma.budgetRequest.findMany({
      include: {
        marketerProfile: {
          include: {
            user: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  })
);

const budgetStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

router.patch(
  "/budget-requests/:id",
  asyncHandler(async (req, res) => {
    const data = budgetStatusSchema.parse(req.body);
    const id = paramId(req.params.id);

    const updated = await prisma.budgetRequest.update({
      where: { id },
      data: {
        status: data.status,
        adminNote: data.adminNote,
      },
    });

    res.json({ message: "وضعیت درخواست بودجه به‌روز شد", budgetRequest: updated });
  })
);

const discountSchema = z.object({
  code: z.string().min(3),
  percentOff: z.number().int().min(1).max(100),
  maxUses: z.number().int().positive().optional(),
  firstTimeOnly: z.boolean().optional(),
});

router.get(
  "/discount-codes",
  asyncHandler(async (_req, res) => {
    const codes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(codes);
  })
);

router.post(
  "/discount-codes",
  asyncHandler(async (req, res) => {
    const data = discountSchema.parse(req.body);

    const code = await prisma.discountCode.create({
      data: {
        code: data.code.toUpperCase(),
        percentOff: data.percentOff,
        maxUses: data.maxUses,
        firstTimeOnly: data.firstTimeOnly ?? false,
      },
    });

    res.status(201).json({ message: "کد تخفیف ایجاد شد", discountCode: code });
  })
);

router.delete(
  "/discount-codes/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    await prisma.discountCode.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ message: "کد تخفیف غیرفعال شد" });
  })
);

const blogSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  published: z.boolean().optional(),
  slug: z.string().optional(),
});

router.get(
  "/blog",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      include: { author: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  })
);

router.post(
  "/blog",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = blogSchema.parse(req.body);

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug || slugify(data.title) + "-" + Date.now().toString(36),
        content: data.content,
        published: data.published ?? false,
        authorId: req.user!.userId,
      },
    });

    res.status(201).json({ message: "مقاله ایجاد شد", post });
  })
);

router.patch(
  "/blog/:id",
  asyncHandler(async (req, res) => {
    const data = blogSchema.partial().parse(req.body);
    const id = paramId(req.params.id);

    const post = await prisma.blogPost.update({
      where: { id },
      data,
    });

    res.json({ message: "مقاله به‌روز شد", post });
  })
);

router.delete(
  "/blog/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    await prisma.blogPost.delete({ where: { id } });
    res.json({ message: "مقاله حذف شد" });
  })
);

export default router;
