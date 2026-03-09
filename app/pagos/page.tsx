"use client";

import { useEffect, useState } from "react";
import { Transaccion } from "../components/pagos/types";
import PagoTable from "../components/pagos/PagoTable";
import PagoDetalle from "../components/pagos/PagoDetalle";

export default function PagosPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [transaccionToView, setTransaccionToView] = useState<Transaccion | null>(null);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    completados: 0,
    pendientes: 0,
    montoTotal: 0
  });

// Función para formatear el monto total (con validación completa)
const formatMontoTotal = (monto: number | string | null | undefined): string => {
  if (monto === null || monto === undefined) return '$0.00';
  
  const numero = typeof monto === 'number' ? monto : parseFloat(monto) || 0;
  return `$${numero.toFixed(2)}`;
};

  async function loadTransacciones() {
    try {
      setLoading(true);
      const res = await fetch("/api/pagos", { credentials: "include" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTransacciones(data);
      
      const completados = data.filter((t: Transaccion) => t.estado === 'COMPLETADO').length;
      const pendientes = data.filter((t: Transaccion) => t.estado === 'PENDIENTE').length;
      
      // CORREGIDO: Convertir monto a número si viene como string
      const montoTotal = data
        .filter((t: Transaccion) => t.estado === 'COMPLETADO')
        .reduce((sum: number, t: Transaccion) => {
          // Asegurar que monto sea número
          const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : (t.monto || 0);
          return sum + monto;
        }, 0);
      
      setStats({ total: data.length, completados, pendientes, montoTotal });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTransacciones(); }, []);

  const handleView = (transaccion: Transaccion) => {
    setTransaccionToView(transaccion);
    setDetalleOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos y Transacciones</h1>
          <p className="text-gray-600 mt-1">Gestiona todos los pagos del sistema</p>
        </div>
        <button onClick={loadTransacciones} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-green-600">{stats.completados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto Total</p>
              {/* CORREGIDO: Usar la función formatMontoTotal */}
              <p className="text-2xl font-bold text-purple-600">{formatMontoTotal(stats.montoTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

      <PagoTable 
        transacciones={transacciones}
        loading={loading}
        onRefresh={loadTransacciones}
        onView={handleView}
      />

      <PagoDetalle
        isOpen={detalleOpen}
        onClose={() => { setDetalleOpen(false); setTransaccionToView(null); }}
        transaccion={transaccionToView}
      />
    </div>
  );
}