import { emailConfigured, env } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface GoalReminderInput {
  to: string;
  name: string;
  weekMinutes: number;
  weekSessions: number;
  targetMinutes: number | null;
  targetSessions: number | null;
  cefr: string;
  targetCefr: string | null;
  dueDate: Date | null;
  streakDays: number;
}

export type GoalReminderResult =
  { sent: true; id: string | null } | { sent: false; reason: string };

function line(label: string, value: string) {
  return `<tr><td style="padding:6px 12px 6px 0;color:#666">${label}</td><td style="padding:6px 0;font-family:ui-monospace,Menlo,monospace">${value}</td></tr>`;
}

function esc(s: string) {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c,
  );
}

/** Renders a short, encouraging weekly-goal email. */
export function renderGoalReminder(input: GoalReminderInput): {
  subject: string;
  html: string;
  text: string;
} {
  const minutesLeft =
    input.targetMinutes !== null ? Math.max(0, input.targetMinutes - input.weekMinutes) : null;
  const sessionsLeft =
    input.targetSessions !== null ? Math.max(0, input.targetSessions - input.weekSessions) : null;
  const onTrack =
    (minutesLeft === null || minutesLeft === 0) && (sessionsLeft === null || sessionsLeft === 0);
  const subject = onTrack
    ? "You've hit this week's practice goal"
    : `${minutesLeft ?? 0} more minutes to hit this week's goal`;

  const rows = [
    line(
      "Minutes this week",
      input.targetMinutes !== null
        ? `${Math.round(input.weekMinutes)} / ${input.targetMinutes}`
        : `${Math.round(input.weekMinutes)}`,
    ),
    line(
      "Sessions this week",
      input.targetSessions !== null
        ? `${input.weekSessions} / ${input.targetSessions}`
        : `${input.weekSessions}`,
    ),
    line(
      "Level",
      input.targetCefr
        ? `${esc(input.cefr)} → ${esc(input.targetCefr)}${input.dueDate ? ` by ${input.dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}`
        : esc(input.cefr),
    ),
    line("Streak", `${input.streakDays} day${input.streakDays === 1 ? "" : "s"}`),
  ].join("");

  const cta = `${env.NEXT_PUBLIC_APP_URL}/practice`;
  const html = `<!doctype html><html><body style="margin:0;background:#fafafa;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#171717">
  <div style="max-width:480px;margin:32px auto;background:#fff;border:1px solid #eaeaea;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:12px;color:#666;letter-spacing:.04em;text-transform:uppercase">Fluent · weekly goal</p>
    <h1 style="margin:0 0 12px;font-size:20px;letter-spacing:-0.02em">${esc(subject)}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#666">Hi ${esc(input.name)}, ${onTrack ? "great work — keep the rhythm going." : "a short session today keeps the streak alive."}</p>
    <table style="border-collapse:collapse;font-size:14px">${rows}</table>
    <a href="${cta}" style="display:inline-block;margin-top:20px;background:#000;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 16px;border-radius:6px">Practice now</a>
  </div></body></html>`;
  const text = `${subject}\n\nMinutes this week: ${Math.round(input.weekMinutes)}${input.targetMinutes !== null ? ` / ${input.targetMinutes}` : ""}\nSessions this week: ${input.weekSessions}${input.targetSessions !== null ? ` / ${input.targetSessions}` : ""}\nStreak: ${input.streakDays} days\n\nPractice now: ${cta}`;
  return { subject, html, text };
}

/**
 * Sends a weekly-goal reminder via Resend. Returns `{ sent: false }` (never throws) when
 * email isn't configured so callers can degrade gracefully. The SDK is imported lazily.
 */
export async function sendGoalReminder(input: GoalReminderInput): Promise<GoalReminderResult> {
  if (!emailConfigured || !env.RESEND_API_KEY || !env.REMINDER_FROM_EMAIL) {
    return {
      sent: false,
      reason: "Email reminders aren't configured. Set RESEND_API_KEY and REMINDER_FROM_EMAIL.",
    };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(env.RESEND_API_KEY);
  const { subject, html, text } = renderGoalReminder(input);
  const { data, error } = await resend.emails.send({
    from: env.REMINDER_FROM_EMAIL,
    to: input.to,
    subject,
    html,
    text,
  });
  if (error) {
    logger.warn({ error }, "goal reminder failed to send");
    return { sent: false, reason: error.message };
  }
  return { sent: true, id: data?.id ?? null };
}
