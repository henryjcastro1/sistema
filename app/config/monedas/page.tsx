"use client";

import MonedaTable from "@/app/components/monedas/MonedaTable";
import { Moneda } from "@/app/productos/types";
import { useEffect, useState } from "react";

export default function MonedasPage() {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMonedas() {
    try {
      setLoading(true);
      const res = await fetch("/api/monedas", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar monedas");
      }

      const data = await res.json();
      setMonedas(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar monedas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonedas();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monedas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las monedas y tasas de cambio del sistema
          </p>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla de monedas */}
      <MonedaTable 
        monedas={monedas}
        loading={loading}
        onRefresh={loadMonedas}
      />

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">📌 Información importante:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Solo puede haber una moneda base a la vez (marcada con 👑)</li>
          <li>La moneda base no puede desactivarse</li>
        </ul>
      </div>
    </div>
  );
}