import { notFound } from "next/navigation";
import { DesignShowcase } from "./showcase";

export const metadata = { title: "Design system" };
export const dynamic = "force-dynamic";

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.FLUENT_ENABLE_DESIGN_PAGE !== "1")
    notFound();
  return <DesignShowcase />;
}
