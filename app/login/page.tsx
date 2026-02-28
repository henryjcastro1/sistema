"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en login");
      }

      router.replace("/dashboard");

    } catch (err) {
      // ✅ Tipado seguro sin usar any
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">

        <h1 className="text-2xl font-bold mb-6 text-center">
          Iniciar Sesión
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          {/* Email */}
          <input
            type="email"
            placeholder="Correo"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full p-3 border rounded-lg pr-12 focus:ring-2 focus:ring-black outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-lg disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading && (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
            )}

            {loading ? "Ingresando..." : "Entrar"}
          </button>

        </form>
      </div>
    </main>
  );
}