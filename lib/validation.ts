import { z } from "zod";
import { portfolioTypes } from "./types";
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128)
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.");
export const emailSchema = z
  .email("Enter a valid email address.")
  .max(254)
  .transform((v) => v.trim().toLowerCase());
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    password: passwordSchema,
    accountType: z.enum(["USER", "BUSINESS"]),
    consent: z.literal(true),
  })
  .strict();
export const portfolioSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    category: z.enum(portfolioTypes),
    county: z.string().trim().min(2).max(80),
    address: z.string().trim().min(5).max(250),
    phone: z
      .string()
      .regex(/^\+?[\d\s()-]{9,20}$/, "Enter a valid contact number."),
    registrationNumber: z.string().trim().min(2).max(100),
    insurance: z.array(z.string().trim().min(2).max(80)).max(30),
    services: z
      .array(
        z.object({
          name: z.string().trim().min(2).max(120),
          price: z.number().min(0).max(10000000).nullable(),
        }),
      )
      .max(100),
  })
  .strict();
