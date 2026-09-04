import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: "10h",
    refreshExpiresIn: "30d",
  },
  zarinpal: {
    merchantId: process.env.ZARINPAL_MERCHANT_ID || "",
    sandbox: process.env.ZARINPAL_SANDBOX === "true",
    callbackUrl:
      process.env.ZARINPAL_CALLBACK_URL ||
      "http://localhost:4000/api/payments/verify",
  },
  admin: {
    nationalId: process.env.ADMIN_NATIONAL_ID || "0000000000",
    password: process.env.ADMIN_PASSWORD || "Admin@123",
  },
};
