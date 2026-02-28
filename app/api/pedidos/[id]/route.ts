import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface PedidoUpdateInput {
  estado?: 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  impuesto?: number;
  descuento?: number;
  costo_envio?: number;
  direccion_envio?: string;
}

// GET /api/pedidos/[id] - Obtener un pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pedidoResult = await pool.query(`
      SELECT 
        p.id,
        p.numero_pedido,
        p.usuario_id,
        p.cliente_nombre,
        p.cliente_email,
        p.cliente_direccion,
        p.estado,
        p.subtotal,
        p.impuesto,
        p.descuento,
        p.costo_envio,
        p.total_final,
        p.created_at,
        p.updated_at
      FROM pedidos p
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `, [id]);

    if (pedidoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const itemsResult = await pool.query(`
      SELECT 
        ip.id,
        ip.tipo_item,
        ip.item_id,
        ip.descripcion,
        ip.cantidad,
        ip.precio_unitario,
        ip.subtotal
      FROM items_pedido ip
      WHERE ip.pedido_id = $1
      ORDER BY ip.created_at
    `, [id]);

    const pedido = {
      ...pedidoResult.rows[0],
      items: itemsResult.rows
    };

    return NextResponse.json(pedido);

  } catch (error) {
    console.error("Error GET pedido:", error);
    return NextResponse.json(
      { error: "Error obteniendo pedido" },
      { status: 500 }
    );
  }
}

// PUT /api/pedidos/[id] - Actualizar estado de pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: PedidoUpdateInput = await request.json();
    const { estado, impuesto, descuento, costo_envio, direccion_envio } = body;

    // Verificar que el pedido existe
    const existe = await pool.query(
      `SELECT * FROM pedidos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedidoAntes = existe.rows[0];

    // Construir consulta dinámica
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (estado) {
      updates.push(`estado = $${paramIndex++}`);
      values.push(estado);
    }
    if (impuesto !== undefined) {
      updates.push(`impuesto = $${paramIndex++}`);
      values.push(impuesto);
    }
    if (descuento !== undefined) {
      updates.push(`descuento = $${paramIndex++}`);
      values.push(descuento);
    }
    if (costo_envio !== undefined) {
      updates.push(`costo_envio = $${paramIndex++}`);
      values.push(costo_envio);
    }
    if (direccion_envio !== undefined) {
      updates.push(`cliente_direccion = $${paramIndex++}`);
      values.push(direccion_envio);
    }

    // Si se actualizaron campos financieros, recalcular total
    if (impuesto !== undefined || descuento !== undefined || costo_envio !== undefined) {
      const nuevoSubtotal = pedidoAntes.subtotal;
      const nuevoImpuesto = impuesto !== undefined ? impuesto : pedidoAntes.impuesto;
      const nuevoDescuento = descuento !== undefined ? descuento : pedidoAntes.descuento;
      const nuevoCostoEnvio = costo_envio !== undefined ? costo_envio : pedidoAntes.costo_envio;
      
      const nuevoTotal = nuevoSubtotal + nuevoImpuesto - nuevoDescuento + nuevoCostoEnvio;
      updates.push(`total_final = $${paramIndex++}`);
      values.push(nuevoTotal);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    values.push(id);

    const query = `
      UPDATE pedidos 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const pedidoDespues = result.rows[0];

    // Obtener quién hizo el cambio (opcional)
    const cookieHeader = request.headers.get('cookie');
    let usuarioCambioId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioCambioId = decoded.id;
        } catch (e) {}
      }
    }

    // Obtener IP y User-Agent (opcional)
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // Determinar acción para auditoría
    let accionAuditoria = 'ACTUALIZAR_PEDIDO';

    // Registrar en auditoría (opcional)
    try {
      await pool.query(
        `INSERT INTO audit_logs 
          (usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip, user_agent)
         VALUES ($1, $2, 'pedidos', $3, $4::jsonb, $5::jsonb, $6::inet, $7)`,
        [
          usuarioCambioId,
          accionAuditoria,
          id,
          JSON.stringify(pedidoAntes),
          JSON.stringify(pedidoDespues),
          ip,
          userAgent
        ]
      );
    } catch (auditError) {
      console.error("Error registrando auditoría:", auditError);
      // No fallar la operación principal si la auditoría falla
    }

    return NextResponse.json({
      success: true,
      message: "Pedido actualizado correctamente",
      pedido: pedidoDespues
    });

  } catch (error) {
    console.error("Error PUT pedido:", error);
    return NextResponse.json(
      { error: "Error actualizando pedido" },
      { status: 500 }
    );
  }
}

// DELETE /api/pedidos/[id] - Eliminar pedido (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que el pedido existe
    const existe = await pool.query(
      `SELECT * FROM pedidos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await pool.query(
      `UPDATE pedidos SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Pedido eliminado correctamente"
    });

  } catch (error) {
    console.error("Error DELETE pedido:", error);
    return NextResponse.json(
      { error: "Error eliminando pedido" },
      { status: 500 }
    );
  }
}