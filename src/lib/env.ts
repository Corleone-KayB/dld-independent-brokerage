import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(6, "WhatsApp number is required"),
    DLD_OFFICIAL_VERIFICATION_URL: z.string().optional().default(""),
    DLD_OFFICIAL_BROKER_DIRECTORY_URL: z.string().optional().default(""),
    DLD_OFFICIAL_COMPANY_DIRECTORY_URL: z.string().optional().default(""),
    STORAGE_PROVIDER: z.enum(["local", "vercel-blob"]).default("local"),
    UPLOAD_DIR: z.string().default("./.data/uploads"),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    SEED_USER_PASSWORD: z.string().min(8).default("DldPartners#2026"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  })
  .refine(
    (value) => value.STORAGE_PROVIDER !== "vercel-blob" || Boolean(value.BLOB_READ_WRITE_TOKEN),
    {
      message: "BLOB_READ_WRITE_TOKEN is required when STORAGE_PROVIDER=vercel-blob",
      path: ["BLOB_READ_WRITE_TOKEN"],
    },
  );

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "Invalid environment configuration:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment configuration. Check .env against .env.example.");
  }
  return parsed.data;
}

export const env = loadEnv();
