import { connection } from "next/server";
import { sql } from "@/lib/db";
import { getAdmin } from "@/lib/auth/admin";

export async function GET() {
  await connection();
  if (!(await getAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }
  const rows = await sql`
    select id, name, duration_min, price, active
    from services
    order by active desc, name
  `;
  return Response.json(rows);
}

export async function POST(request: Request) {
  await connection();
  if (!(await getAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const duration = Number(body.durationMin);
  const price = Number(body.price);

  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "Escribe un nombre válido" }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
    return Response.json(
      { error: "La duración debe ser entre 5 y 480 minutos" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return Response.json({ error: "Precio no válido" }, { status: 400 });
  }

  const rows = await sql`
    insert into services (name, duration_min, price)
    values (${name}, ${duration}, ${price})
    returning id
  `;
  return Response.json({ ok: true, id: rows[0].id }, { status: 201 });
}