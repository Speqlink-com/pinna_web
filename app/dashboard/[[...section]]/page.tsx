import { notFound, redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getSession, nextPath } from "@/lib/server/security";
export const dynamic = "force-dynamic";
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const user = process.env.DATABASE_URL ? await getSession() : null;
  if (!user) redirect("/sign-in");
  if (nextPath(user) !== "/dashboard") redirect(nextPath(user));
  const parts = (await params).section ?? [];
  if (parts.length > 1) notFound();
  const section = parts[0] ?? "overview";
  const allowed =
    user.role === "USER"
      ? ["overview", "saved", "messages", "settings"]
      : user.role === "BUSINESS"
        ? ["overview", "portfolios", "messages", "settings"]
        : user.role === "SUPER_ADMIN"
          ? ["overview", "applications", "team", "settings"]
          : ["overview", "applications", "settings"];
  if (!allowed.includes(section)) notFound();
  return (
    <Dashboard key={`${user.id}:${section}`} user={user} section={section} />
  );
}
