import { Producto } from "../../productos/types";
import { Usuario } from "../usuarios/types";

export interface Pedido {
  id: string;
  numero_pedido: string;
  usuario_id: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_direccion?: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  subtotal: number;
  impuesto: number;
  descuento: number;
  costo_envio: number;
  total_final: number;
  created_at: string;
  updated_at: string;
  items?: ItemPedido[];
  usuario?: Usuario;
  
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  tipo_item: 'PRODUCTO' | 'SERVICIO';
  item_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  producto?: Producto;
}

export interface PedidoFormData {
  usuario_id: string;
  items: ItemPedidoFormData[];
  impuesto?: number;
  descuento?: number;
  costo_envio?: number;
  direccion_envio?: string;
}

export interface ItemPedidoFormData {
  tipo_item: 'PRODUCTO' | 'SERVICIO';
  item_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

export interface PedidoEditData {
  id: string;
  estado?: 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  impuesto?: number;
  descuento?: number;
  costo_envio?: number;
  direccion_envio?: string;
}

export interface PedidoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PedidoFormData) => Promise<void>;
  loading?: boolean;
  usuarios?: Usuario[];
  productos?: Producto[];
}

export interface PedidoEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<PedidoEditData>) => Promise<void>;
  pedido: Pedido | null;
  loading?: boolean;
}

export interface PedidoTableProps {
  pedidos: Pedido[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (pedido: Pedido) => void;
  onView?: (pedido: Pedido) => void;
  onDelete?: (pedido: Pedido) => void;
  onPagar?: (pedido: Pedido) => void; 
}

export interface PedidoDetalleProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
}