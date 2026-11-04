import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/auth-helpers";
import { SessionError } from "@/lib/sessions";
import { logger } from "@/lib/logger";

/** Wraps a route handler with uniform error → JSON mapping and a request id. */
export function route<Ctx>(fn: (req: Request, ctx: Ctx, requestId: string) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID().slice(0, 8);
    try {
      const res = await fn(req, ctx, requestId);
      res.headers.set("x-request-id", requestId);
      return res;
    } catch (err) {
      if (err instanceof UnauthorizedError)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (err instanceof SessionError)
        return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "invalid request", issues: err.issues }, { status: 400 });
      }
      logger.error({ err, requestId }, "unhandled API error");
      return NextResponse.json({ error: "internal error", requestId }, { status: 500 });
    }
  };
}

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
