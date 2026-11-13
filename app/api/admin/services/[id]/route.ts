import { connection } from "next/server";
import { sql } from "@/lib/db";
import { getAdmin } from "@/lib/auth/admin";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await connection();
  if (!(await getAdmin())) {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const serviceId = Number(id);
  if (!Number.isInteger(serviceId)) {
    return Response.json({ error: "Servicio no válido" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  const name = body.name === undefined ? null : String(body.name).trim();
  const duration = body.durationMin === undefined ? null : Number(body.durationMin);
  const price = body.price === undefined ? null : Number(body.price);
  const active = body.active === undefined ? null : Boolean(body.active);

  if (name !== null && (name.length < 2 || name.length > 80)) {
    return Response.json({ error: "Nombre no válido" }, { status: 400 });
  }
  if (duration !== null && (!Number.isInteger(duration) || duration < 5 || duration > 480)) {
    return Response.json({ error: "Duración no válida" }, { status: 400 });
  }
  if (price !== null && (!Number.isFinite(price) || price < 0 || price > 100000)) {
    return Response.json({ error: "Precio no válido" }, { status: 400 });
  }

  const rows = await sql`
    update services set
      name = coalesce(${name}::text, name),
      duration_min = coalesce(${duration}::int, duration_min),
      price = coalesce(${price}::numeric, price),
      active = coalesce(${active}::boolean, active)
    where id = ${serviceId}
    returning id
  `;
  if (rows.length === 0) {
    return Response.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  return Response.json({ ok: true });
}