"use client";

import { useState, useEffect, useRef } from "react";
import { ProductoFormData, ProductoFormProps, Subcategoria } from "../../../app/productos/types";

export default function ProductoForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading, 
  categorias = [],
  monedas = [] 
}: ProductoFormProps) {
  const [form, setForm] = useState<ProductoFormData>({
    nombre: "",
    descripcion: "",
    precio: 0,
    moneda_id: "",
    stock: 0,
    imagen_url: null,
    imagenes_adicionales: [], // ✅ Siempre un array vacío
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
  
  const [previewImagePrincipal, setPreviewImagePrincipal] = useState<string | null>(null);
  const [previewImagesAdicionales, setPreviewImagesAdicionales] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAdicionalesRef = useRef<HTMLInputElement>(null);

  const monedaSeleccionada = monedas.find(m => m.id === form.moneda_id);

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
      setForm(prev => ({ ...prev, subcategoria_id: undefined }));
    }
  }, [form.categoria_id]);

  useEffect(() => {
    if (monedas.length > 0 && !form.moneda_id) {
      const monedaPorDefecto = monedas.find(m => m.codigo === 'EUR') || monedas[0];
      setForm(prev => ({ ...prev, moneda_id: monedaPorDefecto.id }));
    }
  }, [monedas]);

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
    setForm(prev => ({ ...prev, imagen_url: file }));
    setError("");
  };

  // 🔥 MANEJADOR PARA IMÁGENES ADICIONALES
  const handleImagenesAdicionalesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

const totalImagenes = form.imagenes_adicionales.length + files.length;
    if (totalImagenes > 5) {
setError(`Solo puedes subir máximo 5 imágenes. Ya tienes ${form.imagenes_adicionales.length} imágenes.`);      return;
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
  
  // ✅ Actualizar ambos estados
  setForm(prev => ({ 
    ...prev, 
    imagenes_adicionales: [...prev.imagenes_adicionales, ...files] 
  }));
  
  // ✅ IMPORTANTE: Actualizar los previews para mostrarlos
  setPreviewImagesAdicionales(prev => [...prev, ...nuevasPreviews]);
  
  setError("");
  
  if (fileInputAdicionalesRef.current) {
    fileInputAdicionalesRef.current.value = '';
  }
};

  const handleRemoveImagenAdicional = (index: number) => {
const nuevasImagenes = [...form.imagenes_adicionales];
    const nuevasPreviews = [...previewImagesAdicionales];
    
    URL.revokeObjectURL(nuevasPreviews[index]);
    nuevasImagenes.splice(index, 1);
    nuevasPreviews.splice(index, 1);
    
    setForm(prev => ({ ...prev, imagenes_adicionales: nuevasImagenes }));
    setPreviewImagesAdicionales(nuevasPreviews);
  };

  const handleRemoveImagenPrincipal = () => {
    if (previewImagePrincipal) {
      URL.revokeObjectURL(previewImagePrincipal);
    }
    setPreviewImagePrincipal(null);
    setForm(prev => ({ ...prev, imagen_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.nombre) {
      setError("El nombre del producto es obligatorio");
      return;
    }

   const precioNum = parseFloat(form.precio?.toString() || "0");
if (isNaN(precioNum) || precioNum < 0) {
  setError("Precio inválido");
  return;
}

    if (form.stock < 0) {
      setError("El stock no puede ser negativo");
      return;
    }

    if (!form.moneda_id) {
      setError("Debes seleccionar una moneda");
      return;
    }

    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append("nombre", form.nombre);
      formData.append("descripcion", form.descripcion || "");
      formData.append("precio", form.precio.toString());
      formData.append("stock", form.stock.toString());
      formData.append("moneda_id", form.moneda_id);
      
      if (form.categoria_id) formData.append("categoria_id", form.categoria_id);
      if (form.subcategoria_id) formData.append("subcategoria_id", form.subcategoria_id);
      if (form.sku) formData.append("sku", form.sku);
      if (form.codigo_barras) formData.append("codigo_barras", form.codigo_barras);
      if (form.marca) formData.append("marca", form.marca);
      if (form.modelo) formData.append("modelo", form.modelo);
      if (form.garantia_meses) formData.append("garantia_meses", form.garantia_meses.toString());
      if (form.peso_kg) formData.append("peso_kg", form.peso_kg.toString());
      if (form.destacado) formData.append("destacado", "true");
      
      // ✅ Enviar imagen principal como File
      if (form.imagen_url instanceof File) {
        formData.append("imagen_url", form.imagen_url);
      }
      
      form.imagenes_adicionales.forEach((imagen) => {
        formData.append("imagenes_adicionales", imagen);
      });

      const response = await fetch("/api/productos", {
        method: "POST",
        body: formData, // No pongas Content-Type
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al crear producto");
      }

      // Resetear formulario
      setForm({
        nombre: "",
        descripcion: "",
        precio: 0,
        moneda_id: monedas.find(m => m.codigo === 'EUR')?.id || '',
        stock: 0,
        imagen_url: null,
        imagenes_adicionales: [],
        sku: "",
        codigo_barras: "",
        marca: "",
        modelo: "",
        garantia_meses: 0,
        peso_kg: 0,
        dimensiones: { largo: 0, ancho: 0, alto: 0 },
        destacado: false,
      });
      
      // Limpiar previews
      if (previewImagePrincipal) URL.revokeObjectURL(previewImagePrincipal);
      previewImagesAdicionales.forEach(url => URL.revokeObjectURL(url));
      setPreviewImagePrincipal(null);
      setPreviewImagesAdicionales([]);
      
      setError("");
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear producto");
    }
  };

  const handleDimensionChange = (dimension: 'largo' | 'ancho' | 'alto', value: number) => {
    setForm(prev => ({
      ...prev,
      dimensiones: {
        largo: prev.dimensiones?.largo ?? 0,
        ancho: prev.dimensiones?.ancho ?? 0,
        alto: prev.dimensiones?.alto ?? 0,
        [dimension]: value
      }
    }));
  };

  const preventSpin = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Crear Nuevo Producto</h2>
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
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
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
                Click para subir imagen principal (máx. 5MB)
              </p>
            </div>
          </div>

          {/* 🖼️ IMÁGENES ADICIONALES */}
          <div className="border-b pb-6 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes Adicionales 
              <span className="text-xs text-gray-500 ml-2">
                ({previewImagesAdicionales.length}/5 imágenes)
              </span>
            </label>
            
            {previewImagesAdicionales.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {previewImagesAdicionales.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImagenAdicional(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex flex-col items-center gap-3">
              <div 
                onClick={() => previewImagesAdicionales.length < 5 && fileInputAdicionalesRef.current?.click()} 
                className={`w-32 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition ${previewImagesAdicionales.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                disabled={previewImagesAdicionales.length >= 5}
              />
              <p className="text-xs text-gray-500">
                {previewImagesAdicionales.length >= 5 
                  ? 'Límite de 5 imágenes alcanzado' 
                  : 'Puedes seleccionar múltiples imágenes (máx. 5, 5MB cada una)'}
              </p>
            </div>
          </div>

          {/* Resto del formulario igual... */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto *</label>
              <input
                type="text"
                placeholder="Ej: Laptop Gaming Pro"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.nombre}
                onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, marca: e.target.value }))}
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
              onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                value={form.categoria_id || ""}
                onChange={(e) => setForm(prev => ({ ...prev, categoria_id: e.target.value || undefined }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, subcategoria_id: e.target.value || undefined }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda *</label>
              <select
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white"
                value={form.moneda_id || ""}
                onChange={(e) => setForm(prev => ({ ...prev, moneda_id: e.target.value }))}
                required
              >
                <option value="">Seleccionar moneda</option>
                {monedas.filter(m => m.activo).map((moneda) => (
                  <option key={moneda.id} value={moneda.id}>
                    {moneda.simbolo} {moneda.codigo} - {moneda.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio {monedaSeleccionada && `(${monedaSeleccionada.simbolo})`} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.precio}
                onChange={(e) => setForm(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
                onKeyDown={preventSpin}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.stock}
                onChange={(e) => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                onKeyDown={preventSpin}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía (meses)</label>
              <input
                type="number"
                min="0"
                placeholder="12"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.garantia_meses || 0}
                onChange={(e) => setForm(prev => ({ ...prev, garantia_meses: parseInt(e.target.value) || 0 }))}
                onKeyDown={preventSpin}
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
                onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
              <input
                type="text"
                placeholder="123456789012"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                value={form.codigo_barras || ""}
                onChange={(e) => setForm(prev => ({ ...prev, codigo_barras: e.target.value }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, modelo: e.target.value }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, peso_kg: parseFloat(e.target.value) || 0 }))}
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
              onChange={(e) => setForm(prev => ({ ...prev, destacado: e.target.checked }))}
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
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}