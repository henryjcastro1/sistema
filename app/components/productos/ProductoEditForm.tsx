"use client";

import { useState, useEffect, useRef } from "react";
import { ProductoEditData, ProductoEditFormProps, Subcategoria } from "@/app/productos/types";

// 🔥 Tipo para imagen adicional existente
interface ImagenExistente {
  id: number;
  imagen_url: string;
  orden: number;
  es_principal: boolean;
}

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
    imagenes_adicionales: [],
    imagenes_eliminar: [],
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
  
  // 🔥 ESTADOS PARA MÚLTIPLES IMÁGENES
  const [previewImagePrincipal, setPreviewImagePrincipal] = useState<string | null>(null);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenExistente[]>([]);
  const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([]);
  const [previewNuevasImagenes, setPreviewNuevasImagenes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAdicionalesRef = useRef<HTMLInputElement>(null);
  
  // Ref para evitar ejecución múltiple del efecto
  const isFirstRender = useRef(true);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (form.categoria_id) {
      // ✅ Mover setCargandoSubcats a una función separada o usar startTransition
      const loadSubcategorias = async () => {
        setCargandoSubcats(true);
        try {
          const res = await fetch(`/api/productos/subcategorias?categoria_id=${form.categoria_id}`);
          const data = await res.json();
          setSubcategorias(data);
        } catch (err) {
          console.error("Error cargando subcategorías:", err);
        } finally {
          setCargandoSubcats(false);
        }
      };
      loadSubcategorias();
    } else {
      setSubcategorias([]);
      setForm(prev => ({ ...prev, subcategoria_id: undefined }));
    }
  }, [form.categoria_id]);

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (producto && isOpen && isFirstRender.current) {
      isFirstRender.current = false;
      
      const existentes: ImagenExistente[] = producto.imagenes_adicionales?.map(img => ({
        id: img.id,
        imagen_url: img.imagen_url,
        orden: img.orden,
        es_principal: img.es_principal
      })) || [];
      
      setImagenesExistentes(existentes);
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio: producto.precio,
        stock: producto.stock,
        imagen_url: producto.imagen_url || "",
        imagenes_adicionales: [],
        imagenes_eliminar: [],
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
      setPreviewImagePrincipal(producto.imagen_url || null);
      setNuevasImagenes([]);
      setPreviewNuevasImagenes([]);
    }
    
    // Resetear el ref cuando se cierra el modal
    if (!isOpen) {
      isFirstRender.current = true;
    }
  }, [producto, isOpen]);

  // 🔥 MANEJADOR PARA IMAGEN PRINCIPAL
  const handleImagenPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewImagePrincipal(previewUrl);
    setForm(prev => ({ ...prev, imagen_url: previewUrl }));
    setError("");
  };

  // 🔥 MANEJADOR PARA IMÁGENES ADICIONALES NUEVAS
  const handleImagenesAdicionalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImagenes = imagenesExistentes.length + nuevasImagenes.length + files.length;
    if (totalImagenes > 5) {
      setError(`Solo puedes tener máximo 5 imágenes. Actualmente tienes ${imagenesExistentes.length + nuevasImagenes.length}.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona solo imágenes válidas');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes no deben superar los 5MB');
        return;
      }
    }

    const nuevasPreviews = files.map(file => URL.createObjectURL(file));
    
    setNuevasImagenes(prev => [...prev, ...files]);
    setPreviewNuevasImagenes(prev => [...prev, ...nuevasPreviews]);
    setError("");
    
    if (fileInputAdicionalesRef.current) {
      fileInputAdicionalesRef.current.value = '';
    }
  };

  // 🔥 ELIMINAR IMAGEN EXISTENTE
  const handleEliminarImagenExistente = (id: number) => {
    setImagenesExistentes(prev => prev.filter(img => img.id !== id));
    setForm(prev => ({
      ...prev,
      imagenes_eliminar: [...(prev.imagenes_eliminar || []), id]
    }));
  };

  // 🔥 ELIMINAR IMAGEN NUEVA (no guardada)
  const handleEliminarNuevaImagen = (index: number) => {
    URL.revokeObjectURL(previewNuevasImagenes[index]);
    setNuevasImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviewNuevasImagenes(prev => prev.filter((_, i) => i !== index));
  };

  // 🔥 ELIMINAR IMAGEN PRINCIPAL
  const handleRemoveImagenPrincipal = () => {
    if (previewImagePrincipal && previewImagePrincipal.startsWith('blob:')) {
      URL.revokeObjectURL(previewImagePrincipal);
    }
    setPreviewImagePrincipal(null);
    setForm(prev => ({ ...prev, imagen_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const formData = new FormData();
    formData.append("nombre", form.nombre || "");
    formData.append("descripcion", form.descripcion || "");
    formData.append("precio", (form.precio || 0).toString());
    formData.append("stock", (form.stock || 0).toString());
    
    if (form.categoria_id) formData.append("categoria_id", form.categoria_id);
    if (form.subcategoria_id) formData.append("subcategoria_id", form.subcategoria_id);
    if (form.sku) formData.append("sku", form.sku);
    if (form.codigo_barras) formData.append("codigo_barras", form.codigo_barras);
    if (form.marca) formData.append("marca", form.marca);
    if (form.modelo) formData.append("modelo", form.modelo);
    if (form.garantia_meses) formData.append("garantia_meses", form.garantia_meses.toString());
    if (form.peso_kg) formData.append("peso_kg", form.peso_kg.toString());
    if (form.destacado) formData.append("destacado", "true");
    
    // ✅ AGREGAR DIMENSIONES como campos separados
    if (form.dimensiones) {
      formData.append("dimensiones_largo", form.dimensiones.largo.toString());
      formData.append("dimensiones_ancho", form.dimensiones.ancho.toString());
      formData.append("dimensiones_alto", form.dimensiones.alto.toString());
    }
    
    // Enviar nueva imagen principal (solo si es un archivo)
    if (fileInputRef.current?.files?.[0]) {
      formData.append("imagen_url", fileInputRef.current.files[0]);
    }
    
    // Enviar nuevas imágenes adicionales
    nuevasImagenes.forEach((imagen) => {
      formData.append("imagenes_adicionales", imagen);
    });
    
    // Enviar IDs de imágenes a eliminar
    (form.imagenes_eliminar || []).forEach((id) => {
      formData.append("eliminar_imagenes", id.toString());
    });

    console.log("📤 Enviando actualización:", {
      id: producto.id,
      nombre: form.nombre,
      precio: form.precio,
      stock: form.stock,
      dimensiones: form.dimensiones,
      nuevasImagenes: nuevasImagenes.length,
      imagenesEliminar: form.imagenes_eliminar
    });

await onSubmit(producto.id, formData);
    onClose();
    
  } catch (err) {
    console.error("❌ Error en submit:", err);
    setError(err instanceof Error ? err.message : "Error al actualizar producto");
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

  const preventSpin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  if (!isOpen || !producto) return null;

  const totalImagenes = imagenesExistentes.length + nuevasImagenes.length;
  const imagenesRestantes = 5 - totalImagenes;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Editar Producto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

          {/* 📸 IMAGEN PRINCIPAL */}
          <div className="border-b pb-6 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Principal</label>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {previewImagePrincipal ? (
                  <div className="relative group">
                    <img 
                      src={previewImagePrincipal} 
                      alt="Preview principal" 
                      className="w-32 h-32 rounded-lg object-cover border-4 border-gray-200" 
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImagenPrincipal}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      disabled={uploading}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()} 
                    className="w-32 h-32 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="text-center">
                      <span className="text-3xl text-gray-400 block">+</span>
                      <span className="text-xs text-gray-500">Imagen principal</span>
                    </div>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImagenPrincipalChange} 
                accept="image/*" 
                className="hidden" 
              />
              <p className="text-xs text-gray-500">
                Click para cambiar imagen principal (máx. 5MB)
              </p>
            </div>
          </div>

          {/* 🖼️ IMÁGENES ADICIONALES EXISTENTES */}
          {imagenesExistentes.length > 0 && (
            <div className="border-b pb-6 mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes Actuales
              </label>
              <div className="grid grid-cols-4 gap-3">
                {imagenesExistentes.map((img) => (
                  <div key={img.id} className="relative group">
                    <img 
                      src={img.imagen_url} 
                      alt="Imagen existente"
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleEliminarImagenExistente(img.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click en ✕ para eliminar imágenes existentes
              </p>
            </div>
          )}

          {/* 🖼️ NUEVAS IMÁGENES ADICIONALES */}
          {previewNuevasImagenes.length > 0 && (
            <div className="border-b pb-6 mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevas Imágenes
                <span className="text-xs text-gray-500 ml-2">({totalImagenes}/5 total)</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {previewNuevasImagenes.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Nueva ${index + 1}`}
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleEliminarNuevaImagen(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      Nueva
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📸 AGREGAR MÁS IMÁGENES */}
          <div className="border-b pb-6 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agregar Más Imágenes
              {imagenesRestantes > 0 && (
                <span className="text-xs text-gray-500 ml-2">({imagenesRestantes} restantes)</span>
              )}
            </label>
            <div className="flex flex-col items-center gap-3">
              <div 
                onClick={() => imagenesRestantes > 0 && fileInputAdicionalesRef.current?.click()} 
                className={`w-32 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition ${imagenesRestantes <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-center">
                  <span className="text-2xl text-gray-400 block">+</span>
                  <span className="text-xs text-gray-500">Agregar</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputAdicionalesRef} 
                onChange={handleImagenesAdicionalesChange} 
                accept="image/*" 
                multiple
                className="hidden" 
                disabled={imagenesRestantes <= 0}
              />
              <p className="text-xs text-gray-500">
                {imagenesRestantes <= 0 
                  ? 'Límite de 5 imágenes alcanzado' 
                  : 'Puedes seleccionar múltiples imágenes (máx. 5, 5MB cada una)'}
              </p>
            </div>
          </div>

          {/* Resto del formulario (igual que antes) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
              <input
                type="text"
                placeholder="Ej: Laptop Gaming Pro"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                onKeyDown={preventSpin}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                placeholder="Ej: LP-GAMING-001"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.sku || ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
              <input
                type="text"
                placeholder="123456789012"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.codigo_barras || ""}
                onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ej: XPS-15-2024"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
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
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.peso_kg || 0}
                onChange={(e) => setForm({ ...form, peso_kg: parseFloat(e.target.value) || 0 })}
                onKeyDown={preventSpin}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensiones (cm)</label>
            <div className="grid grid-cols-3 gap-4">
              <input
                placeholder="Largo"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.dimensiones?.largo ?? 0}
                onChange={(e) => handleDimensionChange('largo', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
              <input
                placeholder="Ancho"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.dimensiones?.ancho ?? 0}
                onChange={(e) => handleDimensionChange('ancho', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
              <input
                placeholder="Alto"
                type="number"
                step="0.1"
                min="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.dimensiones?.alto ?? 0}
                onChange={(e) => handleDimensionChange('alto', parseFloat(e.target.value) || 0)}
                onKeyDown={preventSpin}
              />
            </div>
          </div>

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
              {loading ? 'Guardando...' : uploading ? 'Subiendo imágenes...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}