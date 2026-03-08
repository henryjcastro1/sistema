"use client";

import { AuditFiltersProps, FilterParams } from "@/app/config/auditoria/types";
import { useState } from "react";

const TABLAS = [
  { valor: "TODAS", label: "📋 Todas las tablas" },
  { valor: "usuarios", label: "👥 Usuarios" },
  { valor: "productos", label: "📦 Productos" },
  { valor: "servicios", label: "🔧 Servicios" },
  { valor: "pedidos", label: "🛒 Pedidos" },
];

const ACCIONES_POR_TABLA: Record<string, { valor: string; label: string; color: string }[]> = {
  TODAS: [
    { valor: "TODAS", label: "Todas las acciones", color: "gray" },
    { valor: "LOGIN", label: "🔑 Login", color: "green" },
    { valor: "LOGOUT", label: "🚪 Logout", color: "gray" },
    { valor: "CREAR", label: "➕ Crear", color: "blue" },
    { valor: "ACTUALIZAR", label: "✏️ Actualizar", color: "purple" },
    { valor: "ELIMINAR", label: "🗑️ Eliminar", color: "red" },
    { valor: "ACTIVAR", label: "✅ Activar", color: "emerald" },
    { valor: "DESACTIVAR", label: "❌ Desactivar", color: "orange" },
    { valor: "BLOQUEAR", label: "🔒 Bloquear", color: "red" },
    { valor: "VERIFICAR", label: "📧 Verificar", color: "indigo" },
    { valor: "CAMBIO_PASSWORD", label: "🔐 Cambio password", color: "amber" },
  ],
  usuarios: [
    { valor: "TODAS", label: "Todas las acciones", color: "gray" },
    { valor: "LOGIN", label: "🔑 Login", color: "green" },
    { valor: "LOGOUT", label: "🚪 Logout", color: "gray" },
    { valor: "CREAR", label: "➕ Crear usuario", color: "blue" },
    { valor: "ACTUALIZAR", label: "✏️ Editar usuario", color: "purple" },
    { valor: "BLOQUEAR", label: "🔒 Bloquear", color: "red" },
    { valor: "ACTIVAR", label: "✅ Activar", color: "emerald" },
    { valor: "VERIFICAR", label: "📧 Verificar email", color: "indigo" },
    { valor: "CAMBIO_PASSWORD", label: "🔐 Cambiar password", color: "amber" },
  ],
  productos: [
    { valor: "TODAS", label: "Todas las acciones", color: "gray" },
    { valor: "CREAR", label: "➕ Crear producto", color: "blue" },
    { valor: "ACTUALIZAR", label: "✏️ Editar producto", color: "purple" },
    { valor: "ACTIVAR", label: "✅ Activar producto", color: "emerald" },
    { valor: "DESACTIVAR", label: "❌ Desactivar producto", color: "orange" },
    { valor: "ELIMINAR", label: "🗑️ Eliminar producto", color: "red" },
  ],
};

export default function AuditFilters({ onFilterChange, loading }: AuditFiltersProps) {
  const [filters, setFilters] = useState<FilterParams>({
    fechaInicio: "",
    fechaFin: "",
    tabla: "TODAS",
    accion: "TODAS",
    usuario: "",
    registro_id: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTablaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tabla = e.target.value;
    const newFilters = { ...filters, tabla, accion: "TODAS" };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      fechaInicio: "",
      fechaFin: "",
      tabla: "TODAS",
      accion: "TODAS",
      usuario: "",
      registro_id: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const accionesDisponibles = ACCIONES_POR_TABLA[filters.tabla || "TODAS"] || ACCIONES_POR_TABLA.TODAS;

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Filtros de Auditoría Global</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {showAdvanced ? 'Ocultar avanzados' : 'Mostrar avanzados'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro por Tabla */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tabla
          </label>
          <select
            name="tabla"
            value={filters.tabla}
            onChange={handleTablaChange}
            disabled={loading}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          >
            {TABLAS.map((tabla) => (
              <option key={tabla.valor} value={tabla.valor}>
                {tabla.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Acción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acción
          </label>
          <select
            name="accion"
            value={filters.accion}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          >
            {accionesDisponibles.map((accion) => (
              <option key={accion.valor} value={accion.valor}>
                {accion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por usuario/email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email del usuario
          </label>
          <input
            type="text"
            name="usuario"
            value={filters.usuario || ""}
            onChange={handleChange}
            placeholder="ej: admin@demo.com"
            disabled={loading}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          />
        </div>

        {/* Filtro por fecha inicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="datetime-local"
            name="fechaInicio"
            value={filters.fechaInicio || ""}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          />
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
          {/* Filtro por fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="datetime-local"
              name="fechaFin"
              value={filters.fechaFin || ""}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>

          {/* Filtro por ID de registro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID del registro
            </label>
            <input
              type="text"
              name="registro_id"
              value={filters.registro_id || ""}
              onChange={handleChange}
              placeholder="UUID del registro"
              disabled={loading}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>

          {/* Resumen de filtros activos */}
          <div className="flex items-end">
            <div className="w-full p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium">Filtros activos:</span>{" "}
              {Object.entries(filters).filter(([_, v]) => v && v !== "TODAS").length}
            </div>
          </div>
        </div>
      )}

      {/* Botón de reset */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}