"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, useToast } from "@/app/usuarios/components/Toast";

// 👇 Definir el tipo para Método de Pago
interface MetodoPago {
  id: string;
  tipo: string;
  ultimos_digitos: string;
  titular: string;
  es_principal: boolean;
}

interface PagoClienteFormProps {
  pedidoId: string;
  monto: number;
  numeroPedido: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PagoClienteForm({ 
  pedidoId, 
  monto, 
  numeroPedido,
  onSuccess,
  onCancel 
}: PagoClienteFormProps) {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();
  
  const [tipoPago, setTipoPago] = useState<string>('');
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]); // 👈 Tipo específico
  const [metodoPagoId, setMetodoPagoId] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cargandoMetodos, setCargandoMetodos] = useState(false);
  
  // Estados para subida de comprobante
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewComprobante, setPreviewComprobante] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tipoPago === 'TARJETA') {
      cargarMetodosPago();
    }
  }, [tipoPago]);

  const cargarMetodosPago = async () => {
    setCargandoMetodos(true);
    try {
      const res = await fetch('/api/usuarios/metodos-pago', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMetodosPago(data);
      }
    } catch (error) {
      console.error("Error cargando métodos de pago:", error);
    } finally {
      setCargandoMetodos(false);
    }
  };

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('El comprobante debe ser una imagen o PDF', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('El comprobante no debe superar los 5MB', 'error');
      return;
    }

    setComprobante(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewComprobante(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewComprobante(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoPago) {
      showToast('Debes seleccionar un método de pago', 'error');
      return;
    }

    if (tipoPago === 'TARJETA' && !metodoPagoId) {
      showToast('Debes seleccionar una tarjeta', 'error');
      return;
    }

    if (tipoPago === 'TRANSFERENCIA' && !comprobante) {
      showToast('Debes subir el comprobante de transferencia', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pedido_id', pedidoId);
      formData.append('tipo_pago', tipoPago);
      
      if (metodoPagoId) {
        formData.append('metodo_pago_id', metodoPagoId);
      }
      
      if (notas) {
        formData.append('notas', notas);
      }
      
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const res = await fetch('/api/pagos', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      showToast(
        tipoPago === 'TARJETA' 
          ? 'Pago procesándose...' 
          : 'Comprobante recibido. Pendiente de verificación.',
        'success'
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/pedidos';
        }
      }, 2000);

    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Error al procesar el pago',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagar Pedido</h2>
        <p className="text-gray-600 mb-6">
          Pedido: <span className="font-mono font-medium">{numeroPedido}</span>
        </p>

<div className="mb-6 p-4 bg-blue-50 rounded-lg">
  <p className="text-sm text-blue-800">
    <span className="font-medium">Total a pagar:</span>{' '}
    <span className="text-xl font-bold">
      ${(typeof monto === 'number' ? monto : Number(monto) || 0).toFixed(2)}
    </span>
  </p>
</div>


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Métodos de pago - descomentados y corregidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de pago
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTipoPago('TARJETA')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  tipoPago === 'TARJETA'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-2">💳</span>
                <span className="font-medium">Tarjeta</span>
                <span className="text-xs text-gray-500 block mt-1">Crédito/Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoPago('TRANSFERENCIA')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  tipoPago === 'TRANSFERENCIA'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-2">🏦</span>
                <span className="font-medium">Transferencia</span>
                <span className="text-xs text-gray-500 block mt-1">Subir comprobante</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoPago('EFECTIVO')}
                className={`p-4 border-2 rounded-lg text-center transition ${
                  tipoPago === 'EFECTIVO'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl block mb-2">💵</span>
                <span className="font-medium">Efectivo</span>
                <span className="text-xs text-gray-500 block mt-1">Pago en local</span>
              </button>
            </div>
          </div>

          {/* Si es tarjeta, mostrar métodos guardados */}
          {tipoPago === 'TARJETA' && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona una tarjeta
              </label>
              {cargandoMetodos ? (
                <div className="text-center py-4">
                  <span className="animate-spin border-2 border-gray-300 border-t-black rounded-full w-6 h-6 block mx-auto"></span>
                </div>
              ) : metodosPago.length > 0 ? (
                <div className="space-y-2">
                  {metodosPago.map((metodo) => (
                    <label
                      key={metodo.id}
                      className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer ${
                        metodoPagoId === metodo.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodo_pago"
                        value={metodo.id}
                        checked={metodoPagoId === metodo.id}
                        onChange={(e) => setMetodoPagoId(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="font-medium">
                          {metodo.tipo} **** {metodo.ultimos_digitos}
                        </p>
                        <p className="text-sm text-gray-500">{metodo.titular}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No tienes tarjetas guardadas.{' '}
                  <button className="text-blue-600 hover:underline">
                    Agregar tarjeta
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Si es transferencia, mostrar subida de comprobante */}
          {tipoPago === 'TRANSFERENCIA' && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante de transferencia
              </label>
              
              <div className="flex flex-col items-center gap-4">
                {previewComprobante ? (
                  <div className="relative">
                    <img
                      src={previewComprobante}
                      alt="Preview comprobante"
                      className="max-h-48 rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setComprobante(null);
                        setPreviewComprobante(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-gray-400 transition"
                  >
                    <span className="text-4xl text-gray-400 block mb-2">📎</span>
                    <p className="text-gray-600">Haz clic para subir el comprobante</p>
                    <p className="text-xs text-gray-500 mt-1">PDF o imagen (máx. 5MB)</p>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleComprobanteChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium mb-2">Datos para la transferencia:</p>
                <p>Banco: Banco Ejemplo</p>
                <p>CBU: 1234567890123456789012</p>
                <p>Alias: HELP.MIEMPRESA</p>
                <p>Titular: Mi Empresa SRL</p>
              </div>
            </div>
          )}

          {/* Notas adicionales */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agrega alguna nota sobre el pago..."
              rows={3}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white p-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  Procesando...
                </span>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </form>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}