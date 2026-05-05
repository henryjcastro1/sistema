import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface ItemPedidoInput {
  tipo_item: 'PRODUCTO' | 'SERVICIO';
  item_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    // Verificar token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    await client.query('BEGIN');
    
    const body = await req.json();
    const { items, impuesto = 0, descuento = 0, costo_envio = 0, direccion_envio } = body;

    // Validaciones
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Al menos un item es requerido" },
        { status: 400 }
      );
    }

    // Obtener datos del usuario
    const usuario = await client.query(
      `SELECT id, nombre, apellido, email FROM usuarios WHERE id = $1 AND deleted_at IS NULL`,
      [decoded.id]
    );

    if (usuario.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Calcular subtotal y validar items
    let subtotal = 0;
    
    for (const item of items) {
      if (item.cantidad <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      if (item.tipo_item === 'PRODUCTO') {
        // Verificar que el producto existe y tiene stock
        const producto = await client.query(
          `SELECT id, nombre, precio, stock FROM productos WHERE id = $1 AND deleted_at IS NULL AND activo = true`,
          [item.item_id]
        );

        if (producto.rows.length === 0) {
          throw new Error(`Producto con ID ${item.item_id} no encontrado o inactivo`);
        }

        if (producto.rows[0].stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.rows[0].nombre}. Disponible: ${producto.rows[0].stock}`);
        }

        // Actualizar stock
        await client.query(
          `UPDATE productos SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
          [item.cantidad, item.item_id]
        );
      }

      subtotal += item.cantidad * item.precio_unitario;
    }

    const total_final = subtotal + impuesto - descuento + costo_envio;

    // Crear el pedido
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (
        usuario_id,
        cliente_nombre,
        cliente_email,
        cliente_direccion,
        estado,
        subtotal,
        impuesto,
        descuento,
        costo_envio,
        total_final
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        decoded.id,
        `${usuario.rows[0].nombre} ${usuario.rows[0].apellido}`,
        usuario.rows[0].email,
        direccion_envio || null,
        'PENDIENTE',
        subtotal,
        impuesto,
        descuento,
        costo_envio,
        total_final
      ]
    );

    const nuevoPedido = pedidoResult.rows[0];

    // Insertar items del pedido
    for (const item of items) {
      await client.query(
        `INSERT INTO items_pedido (
          pedido_id,
          tipo_item,
          item_id,
          descripcion,
          cantidad,
          precio_unitario
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          nuevoPedido.id,
          item.tipo_item,
          item.item_id,
          item.descripcion,
          item.cantidad,
          item.precio_unitario
        ]
      );
    }

    // Registrar en auditoría
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';

    await client.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_despues, ip)
       VALUES ($1, 'CREAR_PEDIDO_MOBILE', 'pedidos', $2, $3::jsonb, $4::inet)`,
      [
        decoded.id,
        nuevoPedido.id,
        JSON.stringify(nuevoPedido),
        ip
      ]
    );

    await client.query('COMMIT');

    // Obtener el pedido completo con sus items
    const pedidoCompleto = await client.query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ip.id,
              'tipo_item', ip.tipo_item,
              'item_id', ip.item_id,
              'descripcion', ip.descripcion,
              'cantidad', ip.cantidad,
              'precio_unitario', ip.precio_unitario,
              'subtotal', ip.subtotal
            ) ORDER BY ip.created_at
          ) FILTER (WHERE ip.id IS NOT NULL),
          '[]'
        ) as items
      FROM pedidos p
      LEFT JOIN items_pedido ip ON p.id = ip.pedido_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [nuevoPedido.id]);

    return NextResponse.json({
      success: true,
      message: "Pedido creado exitosamente",
      pedido: pedidoCompleto.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error POST pedido móvil:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Error creando pedido";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  } finally {
    client.release();
  }
}

export async function GET(req: Request) {
  try {
    // Verificar token
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const estado = searchParams.get('estado');

    let query = `
      SELECT 
        p.id,
        p.numero_pedido,
        p.estado,
        p.subtotal,
        p.impuesto,
        p.descuento,
        p.costo_envio,
        p.total_final,
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ip.id,
              'tipo_item', ip.tipo_item,
              'item_id', ip.item_id,
              'descripcion', ip.descripcion,
              'cantidad', ip.cantidad,
              'precio_unitario', ip.precio_unitario,
              'subtotal', ip.subtotal
            ) ORDER BY ip.created_at
          ) FILTER (WHERE ip.id IS NOT NULL),
          '[]'
        ) as items
      FROM pedidos p
      LEFT JOIN items_pedido ip ON p.id = ip.pedido_id
      WHERE p.usuario_id = $1 AND p.deleted_at IS NULL
    `;

    const values: (string | number)[] = [decoded.id];
    let paramIndex = 2;

    if (estado) {
      query += ` AND p.estado = $${paramIndex}`;
      values.push(estado);
      paramIndex++;
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Obtener total para paginación
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM pedidos WHERE usuario_id = $1 AND deleted_at IS NULL`,
      [decoded.id]
    );

    return NextResponse.json({
      success: true,
      pedidos: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
      }
    });

  } catch (error) {
    console.error("Error GET pedidos móvil:", error);
    return NextResponse.json(
      { error: "Error obteniendo pedidos" },
      { status: 500 }
    );
  }
}