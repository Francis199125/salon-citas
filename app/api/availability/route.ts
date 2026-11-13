import { connection } from "next/server";
import { sql } from "@/lib/db";

const OPEN = 9 * 60;   // 9:00
const CLOSE = 18 * 60; // 18:00
const STEP = 30;       // cada 30 minutos
const TZ = "-06:00";   // Guatemala

function hhmm(m: number) {
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const n = String(m % 60).padStart(2, "0");
  return `${h}:${n}`;
}

export async function GET(request: Request) {
  await connection();

  const { searchParams } = new URL(request.url);
  const serviceId = Number(searchParams.get("serviceId"));
  const date = searchParams.get("date") ?? "";

  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Faltan serviceId o date (formato AAAA-MM-DD)" },
      { status: 400 }
    );
  }

  const dayStart = new Date(`${date}T00:00:00${TZ}`);
  if (isNaN(dayStart.getTime())) {
    return Response.json({ error: "Fecha no válida" }, { status: 400 });
  }
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  // Domingo cerrado
  const weekday = new Date(`${date}T12:00:00${TZ}`).getUTCDay();
  if (weekday === 0) {
    return Response.json({ date, serviceId, slots: [] });
  }

  const found = await sql`
    select duration_min from services
    where id = ${serviceId} and active = true
  `;
  if (found.length === 0) {
    return Response.json({ error: "Servicio no encontrado" }, { status: 404 });
  }
  const duration = Number(found[0].duration_min);

  const booked = await sql`
    select starts_at, ends_at from appointments
    where status <> 'cancelada'
      and starts_at < ${dayEnd.toISOString()}
      and ends_at > ${dayStart.toISOString()}
  `;
  const busy = booked.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const now = Date.now();
  const slots: string[] = [];
  for (let m = OPEN; m + duration <= CLOSE; m += STEP) {
    const start = dayStart.getTime() + m * 60000;
    const end = start + duration * 60000;
    if (start <= now) continue;
    if (busy.some((b) => start < b.end && end > b.start)) continue;
    slots.push(hhmm(m));
  }

  return Response.json({ date, serviceId, durationMin: duration, slots });
}