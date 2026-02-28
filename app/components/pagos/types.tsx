export interface MetodoPago {
  id: string;
  usuario_id: string;
  tipo: string;
  token_pago?: string;
  ultimos_digitos?: string;
  titular?: string;
  fecha_expiracion?: string;
  es_principal: boolean;
  created_at: string;
}

export interface Transaccion {
  id: string;
  pedido_id: string;
  usuario_id: string;
  metodo_pago_id?: string;
  monto: number;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO' | 'CANCELADO' | 'RECHAZADO';
  referencia_externa?: string;
  respuesta_completa?: any;
  created_at: string;
  
  // ✅ NUEVOS CAMPOS - estos son los que faltan
  tipo_pago?: 'TARJETA' | 'TRANSFERENCIA' | 'EFECTIVO';
  comprobante_url?: string;
  notas_cliente?: string;
  notas_admin?: string;
  fecha_verificacion?: string;
  verificado_por?: string;
  
  // Propiedades del JOIN
  metodo_pago_tipo?: string;
  ultimos_digitos?: string;
  titular?: string;
  numero_pedido?: string;
  pedido_total?: number;
  usuario_nombre?: string;
  verificador_nombre?: string;
}

export interface PagoFormData {
  pedido_id: string;
  metodo_pago_id?: string;
  monto: number;
  tipo_pago: 'TARJETA' | 'TRANSFERENCIA' | 'EFECTIVO';
  notas?: string;
}

export interface PagoTableProps {
  transacciones: Transaccion[];
  loading: boolean;
  onRefresh: () => void;
  onView?: (transaccion: Transaccion) => void;
}

export interface PagoDetalleProps {
  transaccion: Transaccion | null;
  isOpen: boolean;
  onClose: () => void;
}