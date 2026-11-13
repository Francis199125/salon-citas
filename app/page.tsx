"use client";

import { useEffect, useState } from "react";

type Service = {
  id: number;
  name: string;
  duration_min: number;
  price: string | number;
};

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-CA")); // AAAA-MM-DD
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices)
      .catch(() =>
        setMsg({ ok: false, text: "No se pudieron cargar los servicios" })
      );
  }, []);

  function loadSlots(sid: number | null, d: string) {
    setTime("");
    if (!sid || !d) {
      setSlots(null);
      return;
    }
    fetch(`/api/availability?serviceId=${sid}&date=${d}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]));
  }

  function pickService(id: number) {
    setServiceId(id);
    setMsg(null);
    loadSlots(id, date);
  }

  function pickDate(d: string) {
    setDate(d);
    setMsg(null);
    loadSlots(serviceId, d);
  }

  async function reserve() {
    setMsg(null);
    if (!serviceId || !date || !time || !name.trim() || !phone.trim()) {
      setMsg({ ok: false, text: "Completa servicio, día, hora, nombre y teléfono." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, date, time, name, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          ok: true,
          text: `¡Listo, ${name.trim()}! Tu cita de ${data.service} es el ${date} a las ${time}.`,
        });
        setName("");
        setPhone("");
      } else {
        setMsg({ ok: false, text: data.error ?? "No se pudo reservar" });
      }
    } catch {
      setMsg({ ok: false, text: "Error de conexión, intenta de nuevo" });
    }
    setBusy(false);
    loadSlots(serviceId, date);
  }

  const chip =
    "rounded-full border px-4 py-2 text-sm transition cursor-pointer ";
  const on = "bg-rose-600 text-white border-rose-600";
  const off = "bg-white text-neutral-800 border-rose-200 hover:border-rose-400";
  const card = "mb-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm";
  const input =
    "w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-neutral-900";

  return (
    <div className="min-h-screen bg-rose-50 text-neutral-900">
      <main className="mx-auto max-w-xl p-4">
        <h1 className="mt-4 text-3xl font-semibold">✿ Salón de belleza</h1>
        <p className="mb-5 text-sm text-neutral-600">
          Reserva tu cita en línea · Lunes a sábado, 9:00 a 18:00
        </p>

        <section className={card}>
          <h2 className="mb-3 font-semibold">1. Elige un servicio</h2>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => pickService(s.id)}
                className={chip + (serviceId === s.id ? on : off)}
              >
                {s.name} · {s.duration_min} min · Q{Number(s.price)}
              </button>
            ))}
            {services.length === 0 && (
              <span className="text-sm text-neutral-500">Cargando servicios…</span>
            )}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">2. Elige el día</h2>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => pickDate(e.target.value)}
            className={input}
          />
          <h2 className="mb-3 mt-5 font-semibold">3. Horarios disponibles</h2>
          {slots === null && (
            <p className="text-sm text-neutral-500">
              Elige un servicio y un día para ver los horarios.
            </p>
          )}
          {slots !== null && slots.length === 0 && (
            <p className="text-sm text-neutral-500">
              No hay horarios disponibles ese día. Prueba con otro.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {slots?.map((s) => (
              <button
                key={s}
                onClick={() => setTime(s)}
                className={chip + (time === s ? on : off)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-semibold">4. Tus datos</h2>
          <input
            className={input + " mb-3"}
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={input + " mb-4"}
            placeholder="Teléfono / WhatsApp"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            onClick={reserve}
            disabled={busy}
            className="rounded-lg bg-rose-600 px-5 py-2 font-medium text-white disabled:opacity-50"
          >
            {busy ? "Reservando…" : "Confirmar cita"}
          </button>
          {msg && (
            <p
              className={
                "mt-4 rounded-lg p-3 text-sm " +
                (msg.ok ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900")
              }
            >
              {msg.text}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}