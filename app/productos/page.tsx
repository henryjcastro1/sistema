"use client";

import { useEffect, useState } from "react";
import { Producto, ProductoFormData, ProductoEditData, Categoria, Moneda } from "./types";
import ProductoTable from "../components/productos/ProductoTable";
import ProductoForm from "../components/productos/ProductoForm";
import ProductoEditForm from "../components/productos/ProductoEditForm"; // 👈 Importar el componente de edición

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productoToEdit, setProductoToEdit] = useState<Producto | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [monedas, setMonedas] = useState<Moneda[]>([]);

  async function loadMonedas() {
    try {
      const res = await fetch("/api/monedas");
      if (res.ok) {
        const data = await res.json();
        setMonedas(data);
      }
    } catch (err) {
      console.error("Error cargando monedas:", err);
    }
  }

  async function loadProductos() {
    try {
      setLoading(true);
      const res = await fetch("/api/productos", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar productos");
      }

      const data = await res.json();
      setProductos(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategorias() {
    try {
      const res = await fetch("/api/productos/categorias");
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  useEffect(() => {
    loadProductos();
    loadCategorias();
    loadMonedas();
  }, []);

  async function handleCreateProducto(formData: ProductoFormData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear producto");
      }

      await loadProductos();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  }

  // Manejar edición de producto
  async function handleEditProducto(id: string, data: Partial<ProductoEditData>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar producto");
      }

      await loadProductos();
      setEditModalOpen(false);
      setProductoToEdit(null);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  // Abrir modal de edición
  const handleEditClick = (producto: Producto) => {
    console.log("Editando producto:", producto);
    setProductoToEdit(producto);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona el catálogo de productos</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* ✅ Tabla con callback de edición AHORA INCLUYE onEdit */}
      <ProductoTable 
        productos={productos}
        loading={loading}
        onRefresh={loadProductos}
        categorias={categorias}
        monedas={monedas}
        onEdit={handleEditClick} // 👈 ESTA ES LA LÍNEA QUE FALTABA
      />

      {/* Modal de creación */}
      <ProductoForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateProducto}
        loading={formLoading}
        categorias={categorias}
        monedas={monedas}
      />

      {/* Modal de edición (necesitas crear este componente) */}
      <ProductoEditForm
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setProductoToEdit(null);
        }}
        onSubmit={handleEditProducto}
        producto={productoToEdit}
        loading={formLoading}
        categorias={categorias}
        monedas={monedas}
      />
    </div>
  );
}