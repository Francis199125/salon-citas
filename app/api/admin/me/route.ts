import { connection } from "next/server";
import { getAdmin } from "@/lib/auth/admin";

export async function GET() {
  await connection();
  const admin = await getAdmin();
  if (!admin) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }
  return Response.json({ email: admin.email });
}