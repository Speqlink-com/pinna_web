import { notFound, redirect } from "next/navigation";
import { AuthScreen, type AuthMode } from "@/components/auth-screen";
import { getSession, nextPath } from "@/lib/server/security";
export const dynamic = "force-dynamic";
const modes: AuthMode[] = [
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "verify-email",
  "change-password",
  "verify-security",
];
export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { screen } = await params;
  if (!modes.includes(screen as AuthMode)) notFound();
  const query = await searchParams;
  const user = await getSession();
  if (screen === "change-password" || screen === "verify-security") {
    if (!user) redirect("/sign-in");
    if (screen === "verify-security" && user.mustChangePassword)
      redirect("/change-password");
    if (screen === "verify-security" && nextPath(user) !== "/verify-security")
      redirect(nextPath(user));
  } else if (user && (screen === "sign-in" || screen === "sign-up"))
    redirect(nextPath(user));
  return (
    <AuthScreen
      mode={screen as AuthMode}
      token={typeof query.token === "string" ? query.token : ""}
      error={typeof query.error === "string" ? query.error : ""}
      expired={query.expired === "true"}
      user={user}
    />
  );
}
