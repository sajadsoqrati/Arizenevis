import { Router } from "express";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { paramId } from "../utils/params";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: { author: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const slug = paramId(req.params.slug);
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { fullName: true } } },
    });

    if (!post || !post.published) {
      throw new AppError(404, "مقاله یافت نشد");
    }

    res.json(post);
  })
);

export default router;
