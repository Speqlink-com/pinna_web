import { redirect } from "next/navigation";
import { getSession, nextPath } from "@/lib/server/security";
import { AccountStatus } from "@/components/account-status";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await getSession();
  if (!user) redirect("/sign-in");
  if (nextPath(user) !== "/account-status") redirect(nextPath(user));
  return <AccountStatus user={user} />;
}
