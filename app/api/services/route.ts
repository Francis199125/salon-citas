import { connection } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  await connection();
  const rows = await sql`
    select id, name, duration_min, price
    from services
    where active = true
    order by name
  `;
  return Response.json(rows);
}