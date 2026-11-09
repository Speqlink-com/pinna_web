import nodemailer from "nodemailer";
import { Problem } from "./security";
export function requireMail() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_FROM ||
    !process.env.AUTH_ENCRYPTION_KEY
  )
    throw new Problem(
      503,
      "Email delivery is not configured yet. Please contact the Pinna team.",
    );
}
export function mailTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}
