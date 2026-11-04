import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export interface Owner {
  id: string;
  email: string;
  name: string;
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("unauthorized");
  }
}

/** Returns the single owner user or throws (route handlers). */
export async function requireOwner(): Promise<Owner> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new UnauthorizedError();
  return { id: user.id, email: user.email, name: user.name };
}

/** Page variant: redirects to /login instead of throwing. */
export async function requireOwnerPage(): Promise<Owner> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  return { id: user.id, email: user.email, name: user.name };
}
