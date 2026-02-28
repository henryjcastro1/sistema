"use client";

import { useState } from "react";

interface FilterParams {
  fechaInicio?: string;
  fechaFin?: string;
  accion?: string;
  usuario?: string;
  registro_id?: string;
}

interface AuditFiltersProps {
  onFilterChange: (filters: FilterParams) => void;
  loading?: boolean;
}

const ACCIONES = [
  { valor: "TODAS", label: "📋 Todas las acciones" },
  { valor: "CREAR", label: "➕ Crear producto" },
  { valor: "ACTUALIZAR", label: "✏️ Editar producto" },
  { valor: "ACTIVAR", label: "✅ Activar producto" },
  { valor: "DESACTIVAR", label: "❌ Desactivar producto" },
  { valor: "ELIMINAR", label: "🗑️ Eliminar producto" },
];

export default function AuditFiltersProductos({ onFilterChange, loading }: AuditFiltersProps) {
  const [filters, setFilters] = useState<FilterParams>({
    fechaInicio: "",
    fechaFin: "",
    accion: "TODAS",
    usuario: "",
    registro_id: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

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
      accion: "TODAS",
      usuario: "",
      registro_id: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Filtros de Auditoría - Productos</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro por acción */}
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
            {ACCIONES.map((accion) => (
              <option key={accion.valor} value={accion.valor}>
                {accion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por usuario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email del usuario
          </label>
          <input
            type="text"
            name="usuario"
            value={filters.usuario}
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
            value={filters.fechaInicio}
            onChange={handleChange}
            disabled={loading}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
          />
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          {/* Filtro por fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="datetime-local"
              name="fechaFin"
              value={filters.fechaFin}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>

          {/* Filtro por ID de producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID del producto
            </label>
            <input
              type="text"
              name="registro_id"
              value={filters.registro_id}
              onChange={handleChange}
              placeholder="UUID del producto"
              disabled={loading}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
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