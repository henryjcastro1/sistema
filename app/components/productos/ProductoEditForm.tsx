"use client";

import { useState, useEffect, useRef } from "react";
import { ProductoEditData, ProductoEditFormProps, Subcategoria } from "@/app/productos/types";

export default function ProductoEditForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  producto,
  loading,
  categorias = []
}: ProductoEditFormProps) {
  const [form, setForm] = useState<Partial<ProductoEditData>>({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    imagen_url: "",
    sku: "",
    codigo_barras: "",
    marca: "",
    modelo: "",
    garantia_meses: 0,
    peso_kg: 0,
    dimensiones: { largo: 0, ancho: 0, alto: 0 },
    destacado: false,
  });
  
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [cargandoSubcats, setCargandoSubcats] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para la imagen
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (form.categoria_id) {
      setCargandoSubcats(true);
      fetch(`/api/productos/subcategorias?categoria_id=${form.categoria_id}`)
        .then(res => res.json())
        .then(data => {
          setSubcategorias(data);
          setCargandoSubcats(false);
        })
        .catch(err => {
          console.error("Error cargando subcategorías:", err);
          setCargandoSubcats(false);
        });
    } else {
      setSubcategorias([]);
      setForm({ ...form, subcategoria_id: undefined });
    }
  }, [form.categoria_id]);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (producto && isOpen) {
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio: producto.precio,
        stock: producto.stock,
        imagen_url: producto.imagen_url || "",
        categoria_id: producto.categoria_id || undefined,
        subcategoria_id: producto.subcategoria_id || undefined,
        sku: producto.sku || "",
        codigo_barras: producto.codigo_barras || "",
        marca: producto.marca || "",
        modelo: producto.modelo || "",
        garantia_meses: producto.garantia_meses || 0,
        peso_kg: producto.peso_kg || 0,
        dimensiones: producto.dimensiones || { largo: 0, ancho: 0, alto: 0 },
        destacado: producto.destacado || false,
      });
      setPreviewImage(producto.imagen_url || null);
    }
  }, [producto, isOpen]);

  // Manejador para subir imagen
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2MB');
      return;
    }

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Convertir a Base64
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setForm({ ...form, imagen_url: base64 });
      setError("");
    } catch (err) {
      console.error("❌ Error procesando imagen:", err);
      setError("Error procesando la imagen");
      setPreviewImage(producto?.imagen_url || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.precio || form.precio <= 0) {
      setError("Nombre y precio válido son obligatorios");
      return;
    }

    if (!producto?.id) {
      setError("Error: ID de producto no válido");
      return;
    }

    try {
      await onSubmit(producto.id, form);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al actualizar producto");
      }
    }
  };

  const handleDimensionChange = (dimension: 'largo' | 'ancho' | 'alto', value: number) => {
    setForm({
      ...form,
      dimensiones: {
        largo: form.dimensiones?.largo ?? 0,
        ancho: form.dimensiones?.ancho ?? 0,
        alto: form.dimensiones?.alto ?? 0,
        [dimension]: value
      }
    });
  };

  // Función para evitar los spinners en inputs numéricos
  const preventSpin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  if (!isOpen || !producto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {/* 📸 SELECTOR DE IMAGEN */}
          <div className="flex flex-col items-center gap-3 border-b pb-6 mb-2">
            <div className="relative">
              {previewImage ? (
                <div className="relative group">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-lg object-cover border-4 border-gray-200" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setForm({ ...form, imagen_url: "" });
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-6 h-6"></span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => !uploading && fileInputRef.current?.click()} 
                  className={`w-32 h-32 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-center">
                    <span className="text-3xl text-gray-400 block">+</span>
                    <span className="text-xs text-gray-500">Agregar imagen</span>
                  </div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
              disabled={uploading}
            />
            <p className="text-xs text-gray-500">
              {uploading ? 'Procesando imagen...' : 'Click para cambiar imagen (máx. 2MB)'}
            </p>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
              <input
                type="text"
                placeholder="Ej: Laptop Gaming Pro"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                placeholder="Ej: Dell, Samsung, Sony"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.marca || ""}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              placeholder="Describe las características del producto..."
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          {/* Categorías */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                value={form.categoria_id || ""}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value || undefined })}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoría</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                value={form.subcategoria_id || ""}
                onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value || undefined })}
                disabled={!form.categoria_id || cargandoSubcats}
              >
                <option value="">
                  {cargandoSubcats ? "Cargando..." : "Seleccionar subcategoría"}
                </option>
                {subcategorias.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                onKeyDown={preventSpin}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                onKeyDown={preventSpin}
                required
              />
            </div>
          </div>

          {/* SKU y Código de barras */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (código interno)</label>
              <input
                type="text"
                placeholder="Ej: LP-GAMING-001"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.sku || ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
              <input
                type="text"
                placeholder="123456789012"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.codigo_barras || ""}
                onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
              />
            </div>
          </div>

          {/* Modelo y Peso */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ej: XPS-15-2024"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.modelo || ""}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="1.5"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.peso_kg || 0}
                onChange={(e) => setForm({ ...form, peso_kg: parseFloat(e.target.value) || 0 })}
                onKeyDown={preventSpin}
              />
            </div>
          </div>

          {/* Dimensiones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensiones (cm)</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Largo"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.dimensiones?.largo ?? 0}
                onChange={(e) => handleDimensionChange('largo', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
              <input
                placeholder="Ancho"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.dimensiones?.ancho ?? 0}
                onChange={(e) => handleDimensionChange('ancho', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
              <input
                placeholder="Alto"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={form.dimensiones?.alto ?? 0}
                onChange={(e) => handleDimensionChange('alto', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
            </div>
          </div>

          {/* Producto destacado */}
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
            <input
              type="checkbox"
              id="destacado"
              checked={form.destacado || false}
              onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
              className="w-4 h-4 text-black focus:ring-black rounded"
            />
            <label htmlFor="destacado" className="text-sm text-gray-700 cursor-pointer">
              Marcar como producto destacado
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition font-medium"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Guardando...' : uploading ? 'Subiendo imagen...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}