import { auth } from "@/lib/auth/server";

export async function getAdmin() {
  const { data: session } = await auth.getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email) ? { email } : null;
}