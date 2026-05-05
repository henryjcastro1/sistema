"use client";

import { useState, useMemo, useRef } from "react";
import { 
  Producto, 
  ProductoTableProps, 
  Moneda, 
  Categoria 
} from "@/app/productos/types";
import { ToastContainer, useToast } from "../usuarios/Toast";

// Definir tipos para CSV
interface CSVProducto {
  sku: string;
  nuevo_precio: number;
  moneda: string;
}

interface CSVRow {
  [key: string]: string;
}

interface CSVError {
  sku: string;
  error: string;
}

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
  
  // Estados para importación CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVProducto[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState<string>("TODOS");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODOS");
  const [filterMoneda, setFilterMoneda] = useState<string>("TODOS");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [monedaBase, setMonedaBase] = useState<string>("EUR");

  // Obtener moneda base - usando el tipo Moneda
  useMemo(() => {
    const base = monedas.find((m: Moneda) => m.es_base === true);
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

  // Obtener información de moneda - usando el tipo Moneda
  const getMonedaInfo = (producto: Producto): Moneda => {
    const moneda = monedas.find((m: Moneda) => m.id === producto.moneda_id);
    if (moneda) return moneda;
    // Moneda por defecto
    return {
      id: '',
      codigo: 'EUR',
      nombre: 'Euro',
      simbolo: '€',
      tasa_cambio: 1,
      es_base: false,
      activo: true
    };
  };

  async function toggleProductoStatus(productoId: string, activo: boolean) {
    setAccionLoading(productoId);
    try {
      const res = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const mensaje = activo ? 'Producto desactivado correctamente' : 'Producto activado correctamente';
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

  // Funciones para importar CSV
  const processCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsText(file, "UTF-8");
    });
  };

  const parseCSV = (csvText: string): CSVProducto[] => {
    const lines = csvText.split("\n").filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("El archivo debe contener al menos una línea de encabezado y datos");
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const requiredHeaders = ["sku", "nuevo_precio"];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(", ")}`);
    }

    const results: CSVProducto[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: CSVRow = {};
      
      headers.forEach((header, idx) => {
        if (idx < values.length) {
          row[header] = values[idx];
        }
      });
      
      if (!row.sku) {
        throw new Error(`Fila ${i + 1}: SKU es requerido`);
      }
      
      const precio = parseFloat(row.nuevo_precio);
      if (isNaN(precio)) {
        throw new Error(`Fila ${i + 1}: Precio inválido "${row.nuevo_precio}"`);
      }
      
      results.push({
        sku: row.sku,
        nuevo_precio: precio,
        moneda: row.moneda || "COP"
      });
    }
    
    return results;
  };

  // Versión simplificada - SIN VERIFICACIÓN DE SKUs
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImportLoading(true);
    setCsvError(null);
    
    try {
      const csvText = await processCSV(file);
      const parsedData = parseCSV(csvText);
      setCsvData(parsedData);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Error al procesar el archivo");
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;
    
    setImportLoading(true);
    
    try {
      const response = await fetch("/api/productos/importar-precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: csvData })
      });
      
      const textResponse = await response.text();
      
      if (!textResponse || textResponse.trim() === "") {
        throw new Error("El servidor devolvió una respuesta vacía");
      }
      
      let result;
      try {
        result = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error(`Error al parsear JSON: ${textResponse.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        throw new Error(result.error || result.message || `Error ${response.status}`);
      }
      
      if (result.success) {
        let mensaje = `✅ ${result.actualizados} productos actualizados correctamente`;
        
        if (result.errores && result.errores.length > 0) {
  const erroresList = result.errores.map((e: CSVError) => `${e.sku}: ${e.error}`).join(", ");
  mensaje += ` (${result.errores.length} errores: ${erroresList.substring(0, 100)}${erroresList.length > 100 ? "..." : ""})`;
  showToast(mensaje, "warning");
} else {
  showToast(mensaje, "success");
}
        
        onRefresh();
        setIsImportModalOpen(false);
        setCsvData([]);
      } else {
        throw new Error(result.error || result.message || "Error al importar precios");
      }
      
    } catch (err) {
      console.error("Error en importación:", err);
      showToast(err instanceof Error ? err.message : "Error al importar", "error");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["sku", "nuevo_precio", "moneda"];
    const exampleRows = [
      ["PC-GAMER-001", "3500000", "COP"],
      ["LAPTOP-ASUS-001", "2650000", "COP"],
      ["MONITOR-SAMSUNG-001", "920000", "COP"]
    ];
    
    const csvContent = [headers.join(","), ...exampleRows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "plantilla_precios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                {categorias.map((cat: Categoria) => (
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

            {/* Botón Importar CSV */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Importar Precios CSV
            </button>

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
      src={p.imagen_url.startsWith('http') ? p.imagen_url : `tyu192.168.1.7:3000${p.imagen_url}`} 
      alt={p.nombre}
      className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:scale-110 transition-transform"
      onError={(e) => {
        console.error('Error cargando imagen:', p.imagen_url);
        e.currentTarget.style.display = 'none';
        // Mostrar placeholder en caso de error
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const placeholder = document.createElement('div');
          placeholder.className = 'w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400';
          placeholder.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
          parent.appendChild(placeholder);
          e.currentTarget.remove();
        }
      }}
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

      {/* Modal de Importación CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Importar Precios desde CSV</h2>
                <p className="text-sm text-gray-500 mt-1">Sube un archivo CSV con los precios actualizados</p>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Columnas requeridas: <code className="bg-blue-100 px-1 rounded">sku</code>, <code className="bg-blue-100 px-1 rounded">nuevo_precio</code></li>
                  <li>Columna opcional: <code className="bg-blue-100 px-1 rounded">moneda</code> (por defecto COP)</li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar plantilla
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Selecciona un archivo CSV</p>
                </label>
              </div>

              {csvError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ❌ {csvError}
                </div>
              )}

              {csvData.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Previsualización ({csvData.length} productos)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">SKU</th>
                          <th className="p-2 text-left">Nuevo Precio</th>
                          <th className="p-2 text-left">Moneda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(0, 5).map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 font-mono text-xs">{item.sku}</td>
                            <td className="p-2 font-medium">{item.nuevo_precio}</td>
                            <td className="p-2">{item.moneda}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={csvData.length === 0 || importLoading}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  csvData.length === 0 || importLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {importLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Importando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Importar {csvData.length} productos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}