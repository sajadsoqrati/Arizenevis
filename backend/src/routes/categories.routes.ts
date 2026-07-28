import { Router } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.json(categories);
  })
);

export default router;
