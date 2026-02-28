"use client";

import { useState, useEffect } from "react";
import { PedidoFormProps, ItemPedidoFormData } from "./types";
import { Producto } from "../../productos/types";
import { Usuario } from "../usuarios/types";

export default function PedidoForm({ isOpen, onClose, onSubmit, loading }: PedidoFormProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [items, setItems] = useState<ItemPedidoFormData[]>([]);
  const [impuesto, setImpuesto] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [direccionEnvio, setDireccionEnvio] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [buscadorProducto, setBuscadorProducto] = useState<string>("");
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);

  // Cargar usuarios y productos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadUsuarios();
      loadProductos();
    }
  }, [isOpen]);

  // Filtrar productos cuando cambia el buscador
  useEffect(() => {
    if (buscadorProducto) {
      const filtrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(buscadorProducto.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(buscadorProducto.toLowerCase()))
      );
      setProductosFiltrados(filtrados);
    } else {
      setProductosFiltrados(productos);
    }
  }, [buscadorProducto, productos]);

  async function loadUsuarios() {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data.filter((u: Usuario) => u.rol_nombre === 'CLIENTE'));
      }
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  }

  async function loadProductos() {
    try {
      const res = await fetch("/api/productos");
      if (res.ok) {
        const data = await res.json();
        setProductos(data.filter((p: Producto) => p.activo && p.stock > 0));
      }
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  }

  const agregarItem = (producto: Producto) => {
    // Verificar si el producto ya está en la lista
    const existe = items.find(item => item.item_id === producto.id);
    
    if (existe) {
      // Actualizar cantidad
      setItems(items.map(item => 
        item.item_id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      // Agregar nuevo item
      const nuevoItem: ItemPedidoFormData = {
        tipo_item: 'PRODUCTO',
        item_id: producto.id,
        descripcion: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio
      };
      setItems([...items, nuevoItem]);
    }
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(index);
      return;
    }

    const producto = productos.find(p => p.id === items[index].item_id);
    if (producto && nuevaCantidad > producto.stock) {
      setError(`Stock máximo disponible: ${producto.stock}`);
      return;
    }

    setItems(items.map((item, i) => 
      i === index ? { ...item, cantidad: nuevaCantidad } : item
    ));
    setError("");
  };

  const calcularSubtotal = () => {
    return items.reduce((total, item) => total + (item.cantidad * item.precio_unitario), 0);
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal + impuesto - descuento + costoEnvio;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usuarioId) {
      setError("Debes seleccionar un cliente");
      return;
    }

    if (items.length === 0) {
      setError("Debes agregar al menos un producto");
      return;
    }

    // Validar stock de cada producto
    for (const item of items) {
      const producto = productos.find(p => p.id === item.item_id);
      if (producto && item.cantidad > producto.stock) {
        setError(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
        return;
      }
    }

    try {
      await onSubmit({
        usuario_id: usuarioId,
        items,
        impuesto,
        descuento,
        costo_envio: costoEnvio,
        direccion_envio: direccionEnvio || undefined
      });

      // Resetear formulario
      setUsuarioId("");
      setItems([]);
      setImpuesto(0);
      setDescuento(0);
      setCostoEnvio(0);
      setDireccionEnvio("");
      setError("");
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Crear Nuevo Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Selección de Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              required
            >
              <option value="">Seleccionar cliente</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellido} - {usuario.email}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador de Productos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agregar Productos
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={buscadorProducto}
              onChange={(e) => setBuscadorProducto(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
            
            {/* Lista de productos filtrados */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {productosFiltrados.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => agregarItem(producto)}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 transition text-left"
                  disabled={producto.stock === 0}
                >
                  {producto.imagen_url ? (
                    <img src={producto.imagen_url} alt={producto.nombre} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-400">📦</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{producto.nombre}</div>
                    <div className="text-xs text-gray-500">
                      ${producto.precio} | Stock: {producto.stock}
                    </div>
                  </div>
                </button>
              ))}
              {productosFiltrados.length === 0 && (
                <p className="text-gray-500 text-sm col-span-3 text-center py-4">
                  No hay productos disponibles
                </p>
              )}
            </div>
          </div>

          {/* Items del Pedido */}
          {items.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Productos en el pedido</h3>
              <div className="space-y-2">
                {items.map((item, index) => {
                  const producto = productos.find(p => p.id === item.item_id);
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                      {producto?.imagen_url ? (
                        <img src={producto.imagen_url} alt={item.descripcion} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          📦
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.descripcion}</div>
                        <div className="text-sm text-gray-500">
                          ${item.precio_unitario} c/u
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max={producto?.stock}
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidad(index, parseInt(e.target.value) || 1)}
                          className="w-20 p-2 border rounded-lg text-center"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Datos de Envío y Financieros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Datos de Envío</h3>
              <textarea
                placeholder="Dirección de envío"
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Totales</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Subtotal</label>
                  <div className="text-xl font-bold">${calcularSubtotal().toFixed(2)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600">Impuesto</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={impuesto}
                      onChange={(e) => setImpuesto(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600">Descuento</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={descuento}
                      onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600">Costo de envío</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costoEnvio}
                    onChange={(e) => setCostoEnvio(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div className="pt-3 border-t">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${calcularTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
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
              disabled={loading || items.length === 0}
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Creando pedido...' : 'Crear Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}