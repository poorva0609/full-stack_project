import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role:  z.string().trim()
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128)
});

export const AccessTokenSchema = z.object({
  id: z.number(),
  role:z.enum(["USER" , "ADMIN"])
})

export const RefreshTokenSchema = z.object({
  id: z.number(),
  role:z.enum(["USER" , "ADMIN"]),
  jti: z.string()
})