"use client";

import { useState, useMemo } from "react";
import { Producto, ProductoTableProps } from "@/app/productos/types";
import { ToastContainer, useToast } from "../usuarios/Toast";

export default function ProductoTable({ 
  productos, 
  loading, 
  onRefresh, 
  onEdit,
  onDelete,
  categorias = [],
  monedas = [] 
}: ProductoTableProps) {
  const [accionLoading, setAccionLoading] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODOS");
  const [filterMoneda, setFilterMoneda] = useState<string>("TODOS");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [monedaBase, setMonedaBase] = useState<string>("EUR");

  // Obtener moneda base
  useMemo(() => {
    const base = monedas.find(m => m.es_base);
    if (base) setMonedaBase(base.codigo);
  }, [monedas]);

  // Filtrar productos
  const filteredProductos = useMemo(() => {
    return productos.filter(p => {
      const matchesSearch = searchTerm === "" || 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStock = filterStock === "TODOS" || 
        (filterStock === "BAJO" && p.stock < 10) ||
        (filterStock === "MEDIO" && p.stock >= 10 && p.stock < 50) ||
        (filterStock === "ALTO" && p.stock >= 50);

      const matchesEstado = filterEstado === "TODOS" || 
        (filterEstado === "ACTIVO" && p.activo) ||
        (filterEstado === "INACTIVO" && !p.activo);

      const matchesCategoria = filterCategoria === "TODOS" || 
        p.categoria_id === filterCategoria;

      const matchesMoneda = filterMoneda === "TODOS" || 
        p.moneda_codigo === filterMoneda;

      return matchesSearch && matchesStock && matchesEstado && matchesCategoria && matchesMoneda;
    });
  }, [productos, searchTerm, filterStock, filterEstado, filterCategoria, filterMoneda]);

  const formatCurrency = (value: number, moneda: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(value);
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (stock < 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (stock < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  // ✅ CORREGIDO: Tipado correcto en lugar de any
  const getMonedaInfo = (producto: Producto) => {
    const moneda = monedas.find(m => m.id === producto.moneda_id);
    return moneda || { simbolo: '€', codigo: 'EUR' };
  };

  async function toggleProductoStatus(productoId: string, activo: boolean) {
    setAccionLoading(productoId);
    try {
      console.log("🔵 Estado actual:", activo ? "Activo" : "Inactivo");
      console.log("🔵 Enviando PATCH con activo:", !activo);
      
      const res = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo })
      });

      const data = await res.json();
      console.log("📥 Respuesta:", data);

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const mensaje = activo ? 'Producto desactivado correctamente' : 'Producto activado correctamente';
      console.log("✅ Mostrando toast:", mensaje);
      
      showToast(mensaje, 'success');
      onRefresh();
      
    } catch (error) {
      console.error("❌ Error:", error);
      showToast(
        error instanceof Error ? error.message : 'Error al actualizar producto',
        'error'
      );
    } finally {
      setAccionLoading(null);
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Barra de búsqueda y filtros */}
        <div className="p-4 border-b bg-gray-50/50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, SKU, marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
              />
            </div>

            {/* Filtro por Categoría */}
            <div className="md:w-44">
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📂 Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Stock */}
            <div className="md:w-36">
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📦 Todo stock</option>
                <option value="BAJO">🔴 Bajo</option>
                <option value="MEDIO">🟡 Medio</option>
                <option value="ALTO">🟢 Alto</option>
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="md:w-32">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
              >
                <option value="TODOS">📊 Todos</option>
                <option value="ACTIVO">✅ Activos</option>
                <option value="INACTIVO">❌ Inactivos</option>
              </select>
            </div>

            {/* Contador */}
            <div className="flex items-center text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">{filteredProductos.length}</span>
              <span className="text-gray-500 ml-1">productos</span>
            </div>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-black"></div>
            <p className="mt-3 text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Imagen</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Producto</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Categoría</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Precio</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Moneda</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No hay productos registrados
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((p, index) => {
                    const moneda = getMonedaInfo(p);
                    return (
                      <tr 
                        key={p.id} 
                        className="border-t hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
                      >
                        <td className="p-4 text-gray-500 font-mono text-sm">
                          {index + 1}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          {p.imagen_url ? (
                            <img 
                              src={p.imagen_url} 
                              alt={p.nombre}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="p-4 max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{p.nombre}</div>
                          <div className="flex gap-2 mt-1">
                            {p.sku && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded whitespace-nowrap">
                                SKU: {p.sku}
                              </span>
                            )}
                            {p.marca && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded whitespace-nowrap">
                                {p.marca}
                              </span>
                            )}
                          </div>
                          {p.descripcion && expandedRow === p.id && (
                            <div className="text-xs text-gray-500 mt-2 border-t pt-2 max-w-md break-words whitespace-normal">
                              {p.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {p.categoria_nombre || 'Sin categoría'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-gray-900">
                          {formatCurrency(p.precio, moneda.codigo)}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {moneda.simbolo} {moneda.codigo}
                          </span>
                          {moneda.codigo !== monedaBase && p.precio_usd && (
                            <div className="text-xs text-gray-500 mt-1">
                              ≈ {formatCurrency(p.precio_usd, 'USD')}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStockColor(p.stock)}`}>
                            {p.stock} unidades
                          </span>
                        </td>
                        <td className="p-4">
                          {p.activo ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            {/* Botón Activar/Desactivar */}
                            <button
                              onClick={() => toggleProductoStatus(p.id, p.activo)}
                              disabled={accionLoading === p.id}
                              className={`p-2.5 rounded-lg transition-all disabled:opacity-50 group relative border ${
                                p.activo 
                                  ? 'text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300' 
                                  : 'text-green-600 hover:bg-green-50 border-green-200 hover:border-green-300'
                              }`}
                              title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                            >
                              {accionLoading === p.id ? (
                                <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4 block"></span>
                              ) : p.activo ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {/* Botón Editar */}
                            <button
                              onClick={() => onEdit?.(p)}
                              disabled={accionLoading === p.id}
                              className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50 group relative border border-amber-200 hover:border-amber-300"
                              title="Editar producto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}