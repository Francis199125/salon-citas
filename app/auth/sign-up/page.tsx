"use client";

import { useActionState } from "react";
import { signUpWithEmail } from "./actions";

export default function SignUp() {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-rose-50 p-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
      >
        <h1 className="mb-4 text-xl font-semibold text-neutral-900">
          Crear cuenta
        </h1>
        <input
          name="name"
          required
          placeholder="Nombre"
          className="mb-3 w-full rounded-lg border border-rose-200 px-3 py-2 text-neutral-900"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Correo"
          className="mb-3 w-full rounded-lg border border-rose-200 px-3 py-2 text-neutral-900"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="mb-4 w-full rounded-lg border border-rose-200 px-3 py-2 text-neutral-900"
        />
        {state?.error && (
          <p className="mb-3 rounded-lg bg-red-100 p-2 text-sm text-red-900">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-rose-600 py-2 font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}