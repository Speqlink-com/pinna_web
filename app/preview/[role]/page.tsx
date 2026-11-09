import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { previewUsers } from "@/lib/preview";
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  if (
    process.env.ENABLE_DESIGN_PREVIEWS !== "true" &&
    process.env.NODE_ENV === "production"
  )
    notFound();
  const { role } = await params;
  const user = previewUsers[role];
  if (!user) notFound();
  const section = (await searchParams).section ?? "overview";
  const allowed =
    role === "customer"
      ? ["overview", "saved", "messages", "settings"]
      : role === "business"
        ? ["overview", "portfolios", "messages", "settings"]
        : ["overview", "applications", "team", "settings"];
  if (!allowed.includes(section)) notFound();
  return (
    <Dashboard
      key={`${role}:${section}`}
      user={user}
      section={section}
      preview
    />
  );
}
