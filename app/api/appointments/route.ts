import { connection } from "next/server";
import { sql } from "@/lib/db";

const OPEN = 9 * 60;
const CLOSE = 18 * 60;
const STEP = 30;
const TZ = "-06:00";

export async function POST(request: Request) {
  await connection();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud no válida" }, { status: 400 });
  }

  const serviceId = Number(body.serviceId);
  const date = String(body.date ?? "");
  const time = String(body.time ?? "");
  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").trim();

  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return Response.json({ error: "Faltan datos de la cita" }, { status: 400 });
  }
  if (name.length < 2 || name.length > 80) {
    return Response.json({ error: "Escribe tu nombre" }, { status: 400 });
  }
  if (!/^[0-9+\-\s]{7,20}$/.test(phone)) {
    return Response.json({ error: "Teléfono no válido" }, { status: 400 });
  }

  const [h, mi] = time.split(":").map(Number);
  const minutes = h * 60 + mi;
  if (minutes < OPEN || minutes >= CLOSE || (minutes - OPEN) % STEP !== 0) {
    return Response.json({ error: "Hora fuera del horario" }, { status: 400 });
  }

  const weekday = new Date(`${date}T12:00:00${TZ}`).getUTCDay();
  if (weekday === 0) {
    return Response.json({ error: "Cerrado los domingos" }, { status: 400 });
  }

  const found = await sql`
    select duration_min, name from services
    where id = ${serviceId} and active = true
  `;
  if (found.length === 0) {
    return Response.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  const duration = Number(found[0].duration_min);
  if (minutes + duration > CLOSE) {
    return Response.json({ error: "El servicio no cabe en ese horario" }, { status: 400 });
  }

  const start = new Date(`${date}T${time}:00${TZ}`);
  if (isNaN(start.getTime()) || start.getTime() <= Date.now()) {
    return Response.json({ error: "Esa hora ya pasó" }, { status: 400 });
  }
  const end = new Date(start.getTime() + duration * 60000);

  try {
    const rows = await sql`
      insert into appointments (service_id, client_name, client_phone, starts_at, ends_at)
      values (${serviceId}, ${name}, ${phone}, ${start.toISOString()}, ${end.toISOString()})
      returning id
    `;
    return Response.json(
      { ok: true, id: rows[0].id, service: found[0].name, date, time },
      { status: 201 }
    );
  } catch (err: any) {
    // 23P01 = la regla no_overlap de la base de datos rechazó el cruce
    if (err?.code === "23P01") {
      return Response.json(
        { error: "Ese horario ya fue tomado, elige otro" },
        { status: 409 }
      );
    }
    console.error(err);
    return Response.json({ error: "No se pudo guardar la cita" }, { status: 500 });
  }
}