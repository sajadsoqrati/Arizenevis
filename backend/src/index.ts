import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import categoriesRoutes from "./routes/categories.routes";
import requestsRoutes from "./routes/requests.routes";
import paymentsRoutes from "./routes/payments.routes";
import adminRoutes from "./routes/admin.routes";
import adminNotificationsRoutes from "./routes/admin-notifications.routes";
import marketerRoutes from "./routes/marketer.routes";
import blogRoutes from "./routes/blog.routes";

const app = express();

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "تعداد درخواست‌های ورود بیش از حد مجاز است" },
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "سرور فعال است" });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/marketer", marketerRoutes);
app.use("/api/blog", blogRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
