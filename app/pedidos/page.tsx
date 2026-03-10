"use client";

import { useEffect, useState } from "react";
import { Pedido, PedidoEditData, PedidoFormData } from "../components/pedidos/types";
import PedidoTable from "../components/pedidos/PedidoTable";
import PedidoForm from "../components/pedidos/PedidoForm";
import PedidoEditForm from "../components/pedidos/PedidoEditForm";
import PedidoDetalle from "../components/pedidos/PedidoDetalle";
import PagoClienteForm from "../components/pagos/PagoClienteForm";
import CambiarEstadoPedido from "../components/pedidos/CambiarEstadoPedido"; // 👈 IMPORTAR
import { ToastContainer, useToast } from "../components/usuarios/Toast"; // 👈 IMPORTAR PARA TOASTS

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [cambiarEstadoOpen, setCambiarEstadoOpen] = useState(false); // 👈 NUEVO ESTADO
  const [pedidoToEdit, setPedidoToEdit] = useState<Pedido | null>(null);
  const [pedidoToView, setPedidoToView] = useState<Pedido | null>(null);
  const [pedidoToPay, setPedidoToPay] = useState<Pedido | null>(null);
  const [pedidoToChangeStatus, setPedidoToChangeStatus] = useState<Pedido | null>(null); // 👈 NUEVO ESTADO
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const { toasts, showToast, removeToast } = useToast(); // 👈 PARA TOASTS

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

  // Función para abrir modal de pago
  const handlePagarClick = (pedido: Pedido) => {
    setPedidoToPay(pedido);
    setPagoModalOpen(true);
  };

  // Función cuando el pago es exitoso
  const handlePagoSuccess = () => {
    setPagoModalOpen(false);
    setPedidoToPay(null);
    loadPedidos();
  };

  // 👇 NUEVA: Función para abrir modal de cambio de estado
  const handleCambiarEstadoClick = (pedido: Pedido) => {
    setPedidoToChangeStatus(pedido);
    setCambiarEstadoOpen(true);
  };

  // 👇 NUEVA: Función para cambiar el estado del pedido
  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Error al cambiar estado');
      
      showToast(`✅ Pedido ${nuevoEstado.toLowerCase()} correctamente`, 'success');
      setCambiarEstadoOpen(false);
      setPedidoToChangeStatus(null);
      loadPedidos();
    } catch (error) {
      showToast('Error al cambiar estado', 'error');
    }
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
        onPagar={handlePagarClick} 
        onCambiarEstado={handleCambiarEstadoClick}
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

      {/* Modal de pago */}
      {pagoModalOpen && pedidoToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="w-full max-w-2xl">
            <PagoClienteForm
              pedidoId={pedidoToPay.id}
              monto={Number(pedidoToPay.total_final)}
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

      {/* 👇 NUEVO: Modal de cambio de estado */}
      <CambiarEstadoPedido
        isOpen={cambiarEstadoOpen}
        onClose={() => {
          setCambiarEstadoOpen(false);
          setPedidoToChangeStatus(null);
        }}
        pedido={pedidoToChangeStatus}
        onCambiarEstado={handleCambiarEstado}
      />

      {/* ToastContainer para notificaciones */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}