import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://127.0.0.1:5500",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || ""
};

export function assertRequiredEnv() {
  const missing = [];

  if (!env.databaseUrl) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function isRazorpayConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}
