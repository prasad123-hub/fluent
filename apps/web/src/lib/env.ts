import { z } from "zod";

/**
 * Environment validation. Fails fast at boot with a readable message.
 * Optional services (recordings, email) degrade gracefully when unset.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a postgres:// URL" }),
  OWNER_EMAIL: z.string().email({ message: "OWNER_EMAIL must be an email address" }),
  OWNER_PASSWORD_HASH: z
    .string()
    .min(
      20,
      "OWNER_PASSWORD_HASH must be a bcrypt hash (run `pnpm --filter @fluent/web hash-password`)",
    ),
  OWNER_NAME: z.string().min(1).default("You"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  LIVEKIT_URL: z.string().min(1, "LIVEKIT_URL is required (wss://… or ws://localhost:7880)"),
  LIVEKIT_API_KEY: z.string().min(1, "LIVEKIT_API_KEY is required"),
  LIVEKIT_API_SECRET: z.string().min(1, "LIVEKIT_API_SECRET is required"),
  LIVEKIT_AGENT_NAME: z.string().default("fluent-agent"),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  FLUENT_LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),
  FLUENT_LLM_MODEL: z.string().default("gpt-4.1"),

  FLUENT_MAX_SESSION_MINUTES: z.coerce.number().int().positive().default(30),
  FLUENT_MAX_DAILY_MINUTES: z.coerce.number().int().positive().default(120),

  RECORDINGS_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  RESEND_API_KEY: z.string().optional(),
  REMINDER_FROM_EMAIL: z.string().optional(),
  LOG_LEVEL: z.string().default("info"),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  if (process.env.FLUENT_SKIP_ENV_VALIDATION === "1") {
    return schema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://x:y@localhost:5432/test",
      OWNER_EMAIL: process.env.OWNER_EMAIL ?? "owner@example.com",
      OWNER_PASSWORD_HASH: process.env.OWNER_PASSWORD_HASH ?? "$2a$12$abcdefghijklmnopqrstuv",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret-test-secret",
      LIVEKIT_URL: process.env.LIVEKIT_URL ?? "ws://localhost:7880",
      LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ?? "devkey",
      LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ?? "secret",
    });
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`);
    throw new Error(
      `\n✖ Invalid environment configuration. Copy .env.example to .env and fix:\n${lines.join("\n")}\n`,
    );
  }
  return parsed.data;
}

export const env: Env = load();

export const recordingsConfigured =
  env.RECORDINGS_ENABLED &&
  !!env.S3_ENDPOINT &&
  !!env.S3_BUCKET &&
  !!env.S3_ACCESS_KEY &&
  !!env.S3_SECRET_KEY;
export const emailConfigured = !!env.RESEND_API_KEY && !!env.REMINDER_FROM_EMAIL;
