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

interface PedidoInput {
  usuario_id: string;
  items: ItemPedidoInput[];
  impuesto?: number;
  descuento?: number;
  costo_envio?: number;
  direccion_envio?: string;
}

// GET /api/pedidos - Listar todos los pedidos
export async function GET() {
  try {
    const result = await pool.query(`
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
        p.updated_at,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    // Para cada pedido, obtener sus items
    const pedidos = await Promise.all(result.rows.map(async (pedido) => {
      const itemsResult = await pool.query(`
        SELECT 
          ip.id,
          ip.tipo_item,
          ip.item_id,
          ip.descripcion,
          ip.cantidad,
          ip.precio_unitario,
          ip.subtotal,
          CASE 
            WHEN ip.tipo_item = 'PRODUCTO' THEN jsonb_build_object(
              'id', prod.id,
              'nombre', prod.nombre,
              'imagen_url', prod.imagen_url
            )
            ELSE NULL
          END as producto
        FROM items_pedido ip
        LEFT JOIN productos prod ON ip.tipo_item = 'PRODUCTO' AND ip.item_id = prod.id
        WHERE ip.pedido_id = $1
        ORDER BY ip.created_at
      `, [pedido.id]);

      return {
        ...pedido,
        items: itemsResult.rows
      };
    }));

    return NextResponse.json(pedidos);

  } catch (error) {
    console.error("Error GET pedidos:", error);
    return NextResponse.json(
      { error: "Error obteniendo pedidos" },
      { status: 500 }
    );
  }
}

// POST /api/pedidos - Crear un nuevo pedido
export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const body: PedidoInput = await req.json();
    const { usuario_id, items, impuesto = 0, descuento = 0, costo_envio = 0, direccion_envio } = body;

    // Validaciones
    if (!usuario_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Usuario y al menos un item son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const usuario = await client.query(
      `SELECT id, nombre, apellido, email FROM usuarios WHERE id = $1 AND deleted_at IS NULL`,
      [usuario_id]
    );

    if (usuario.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Calcular subtotal
    let subtotal = 0;
    
    // Validar items y verificar stock si son productos
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
        usuario_id,
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

    // Obtener quién creó el pedido (desde el token)
    const cookieHeader = req.headers.get('cookie');
    let usuarioCreadorId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
          usuarioCreadorId = decoded.id;
        } catch (e) {}
      }
    }

    // Obtener IP y User-Agent
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    // Registrar en auditoría
    await client.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_despues, ip, user_agent)
       VALUES ($1, 'CREAR', 'pedidos', $2, $3::jsonb, $4::inet, $5)`,
      [
        usuarioCreadorId,
        nuevoPedido.id,
        JSON.stringify(nuevoPedido),
        ip,
        userAgent
      ]
    );

    await client.query('COMMIT');

    // Obtener el pedido completo con sus items
    const pedidoCompleto = await client.query(`
      SELECT 
        p.*,
        json_agg(json_build_object(
          'id', ip.id,
          'tipo_item', ip.tipo_item,
          'item_id', ip.item_id,
          'descripcion', ip.descripcion,
          'cantidad', ip.cantidad,
          'precio_unitario', ip.precio_unitario,
          'subtotal', ip.subtotal
        )) as items
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
    console.error("Error POST pedido:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Error creando pedido";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  } finally {
    client.release();
  }
}