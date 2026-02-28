"use client";

import { useEffect, useState } from "react";
import { Pedido, PedidoEditData, PedidoFormData } from "../components/pedidos/types";
import PedidoTable from "../components/pedidos/PedidoTable";
import PedidoForm from "../components/pedidos/PedidoForm";
import PedidoEditForm from "../components/pedidos/PedidoEditForm";
import PedidoDetalle from "../components/pedidos/PedidoDetalle";
import PagoClienteForm from "../components/pagos/PagoClienteForm";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false); // 👈 NUEVO
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);
  const [pedidoToView, setPedidoToView] = useState<Pedido | null>(null);
  const [pedidoToPay, setPedidoToPay] = useState<Pedido | null>(null); // 👈 NUEVO
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadPedidos() {
    try {
      setLoading(true);
      const res = await fetch("/api/pedidos", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cargar pedidos");
      }

      const data = await res.json();
      setPedidos(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPedidos();
  }, []);

  async function handleCreatePedido(formData: PedidoFormData) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear pedido");
      }

      await loadPedidos();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditPedido(id: string, data: Partial<PedidoEditData>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar pedido");
      }

      await loadPedidos();
      setEditModalOpen(false);
      setPedidoToEdit(null);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  }

  const handleEditClick = (pedido: Pedido) => {
    setPedidoToEdit(pedido);
    setEditModalOpen(true);
  };

  const handleViewClick = (pedido: Pedido) => {
    setPedidoToView(pedido);
    setDetalleModalOpen(true);
  };

  // 👇 NUEVO: Función para abrir modal de pago
  const handlePagarClick = (pedido: Pedido) => {
    setPedidoToPay(pedido);
    setPagoModalOpen(true);
  };

  // 👇 NUEVO: Función cuando el pago es exitoso
  const handlePagoSuccess = () => {
    setPagoModalOpen(false);
    setPedidoToPay(null);
    loadPedidos(); // Recargar para ver el nuevo estado
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600 mt-1">Gestiona los pedidos del sistema</p>
        </div>
        
        <button
          onClick={() => setModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Pedido
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <PedidoTable 
        pedidos={pedidos}
        loading={loading}
        onRefresh={loadPedidos}
        onEdit={handleEditClick}
        onView={handleViewClick}
        onPagar={handlePagarClick} // 👈 PASAR LA FUNCIÓN
      />

      {/* Modal de creación */}
      <PedidoForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreatePedido}
        loading={formLoading}
      />

      {/* Modal de edición */}
      <PedidoEditForm
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setPedidoToEdit(null);
        }}
        onSubmit={handleEditPedido}
        pedido={pedidoToEdit}
        loading={formLoading}
      />

      {/* Modal de detalle */}
      <PedidoDetalle
        isOpen={detalleModalOpen}
        onClose={() => {
          setDetalleModalOpen(false);
          setPedidoToView(null);
        }}
        pedido={pedidoToView}
      />

      {/* 👇 NUEVO: Modal de pago */}
      {pagoModalOpen && pedidoToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="w-full max-w-2xl">
            <PagoClienteForm
  pedidoId={pedidoToPay.id}
  monto={Number(pedidoToPay.total_final)}  // 👈 Convertir a número
  numeroPedido={pedidoToPay.numero_pedido}
  onSuccess={handlePagoSuccess}
  onCancel={() => {
    setPagoModalOpen(false);
    setPedidoToPay(null);
  }}
/>
          </div>
        </div>
      )}
    </div>
  );
}