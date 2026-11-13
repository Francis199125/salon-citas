"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

type Service = {
  id: number;
  name: string;
  duration_min: number;
  price: string | number;
  active: boolean;
};

const input =
  "w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-neutral-900";

export default function Admin() {
  const [state, setState] = useState<"cargando" | "ok" | "denegado">("cargando");
  const [email, setEmail] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/services");
    if (r.ok) setServices(await r.json());
  }, []);

  useEffect(() => {
    fetch("/api/admin/me").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setEmail(d.email);
        setState("ok");
        load();
      } else {
        setState("denegado");
      }
    });
  }, [load]);

  async function add() {
    setMsg("");
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        durationMin: Number(minutes),
        price: Number(price || 0),
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setName("");
      setMinutes("");
      setPrice("");
      load();
    } else {
      setMsg(d.error ?? "No se pudo guardar");
    }
  }

  async function toggle(s: Service) {
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    load();
  }

  async function salir() {
    await authClient.signOut();
    window.location.href = "/auth/sign-in";
  }

  return (
    <div className="min-h-screen bg-rose-50 p-4 text-neutral-900">
      <main className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Panel del salón</h1>
          {state === "ok" && (
            <button
              onClick={salir}
              className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-sm"
            >
              Cerrar sesión
            </button>
          )}
        </div>

        {state === "cargando" && <p>Cargando…</p>}
        {state === "denegado" && (
          <p className="rounded-lg bg-red-100 p-3 text-red-900">
            Tu cuenta no tiene acceso a este panel.
          </p>
        )}

        {state === "ok" && (
          <>
            <p className="mb-4 text-sm text-neutral-600">Sesión: {email}</p>

            <section className="mb-4 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Nuevo servicio</h2>
              <input
                className={input + " mb-3"}
                placeholder="Nombre (ej. Corte de cabello)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="mb-3 flex gap-3">
                <input
                  className={input}
                  type="number"
                  min="5"
                  placeholder="Minutos"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
                <input
                  className={input}
                  type="number"
                  min="0"
                  placeholder="Precio Q"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <button
                onClick={add}
                className="rounded-lg bg-rose-600 px-5 py-2 font-medium text-white"
              >
                Agregar servicio
              </button>
              {msg && (
                <p className="mt-3 rounded-lg bg-red-100 p-2 text-sm text-red-900">
                  {msg}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold">Servicios</h2>
              {services.length === 0 && (
                <p className="text-sm text-neutral-500">Aún no hay servicios.</p>
              )}
              {services.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-rose-100 py-3 last:border-0"
                >
                  <div className={s.active ? "" : "opacity-50"}>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-neutral-600">
                      {s.duration_min} min · Q{Number(s.price)}
                      {!s.active && " · oculto para clientas"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(s)}
                    className="rounded-lg border border-rose-300 px-3 py-1 text-sm"
                  >
                    {s.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}