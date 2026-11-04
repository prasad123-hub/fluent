import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level,
  base: { app: "fluent-web" },
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {}),
});

export function requestLogger(requestId: string, extra: Record<string, unknown> = {}) {
  return logger.child({ requestId, ...extra });
}
