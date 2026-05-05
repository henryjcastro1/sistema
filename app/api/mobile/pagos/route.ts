import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/comprobantes");

export async function POST(req: Request) {
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
      console.log("✅ Token válido para usuario:", decoded.id);
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Obtener el rol del usuario
    const userResult = await pool.query(
      `SELECT r.nombre as rol_nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    const esAdmin = userResult.rows[0]?.rol_nombre === 'ADMIN' || 
                    userResult.rows[0]?.rol_nombre === 'SUPERADMIN';

    // Procesar form data
    const formData = await req.formData();
    
    const pedido_id = formData.get('pedido_id') as string;
    const tipo_pago = formData.get('tipo_pago') as string;
    const metodo_pago_id = formData.get('metodo_pago_id') as string | null;
    const notas = formData.get('notas') as string | null;
    const comprobante = formData.get('comprobante') as File | null;

    console.log("📦 Datos recibidos:", {
      pedido_id,
      tipo_pago,
      metodo_pago_id,
      tiene_comprobante: !!comprobante
    });

    // Validaciones
    if (!pedido_id) {
      return NextResponse.json(
        { error: "ID de pedido es requerido" },
        { status: 400 }
      );
    }

    if (!tipo_pago) {
      return NextResponse.json(
        { error: "Tipo de pago es requerido" },
        { status: 400 }
      );
    }

    const tiposValidos = ['TARJETA', 'TRANSFERENCIA', 'EFECTIVO'];
    if (!tiposValidos.includes(tipo_pago)) {
      return NextResponse.json(
        { error: "Tipo de pago no válido" },
        { status: 400 }
      );
    }

    if (tipo_pago === 'TARJETA' && !metodo_pago_id) {
      return NextResponse.json(
        { error: "Para pagos con tarjeta debe seleccionar un método de pago" },
        { status: 400 }
      );
    }

    // Verificar pedido
    let pedidoQuery;
    let pedidoValues;

    if (esAdmin) {
      pedidoQuery = `SELECT p.id, p.total_final, p.estado, p.usuario_id 
                     FROM pedidos p 
                     WHERE p.id = $1 AND p.deleted_at IS NULL`;
      pedidoValues = [pedido_id];
    } else {
      pedidoQuery = `SELECT p.id, p.total_final, p.estado, p.usuario_id 
                     FROM pedidos p 
                     WHERE p.id = $1 AND p.usuario_id = $2 AND p.deleted_at IS NULL`;
      pedidoValues = [pedido_id, decoded.id];
    }

    const pedidoResult = await pool.query(pedidoQuery, pedidoValues);

    if (pedidoResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedido = pedidoResult.rows[0];

    // Verificar que el pedido no esté ya pagado
    if (pedido.estado === 'PAGADO') {
      return NextResponse.json(
        { error: "Este pedido ya está pagado" },
        { status: 400 }
      );
    }

    // Verificar pagos duplicados
    const pagoExistente = await pool.query(
      `SELECT id, estado 
       FROM transacciones 
       WHERE pedido_id = $1 
       AND estado IN ('COMPLETADO', 'PENDIENTE', 'PROCESANDO')
       LIMIT 1`,
      [pedido_id]
    );

    if (pagoExistente.rows.length > 0) {
      const estadoPago = pagoExistente.rows[0].estado;
      let mensaje = "Este pedido ya tiene un pago registrado";
      
      if (estadoPago === 'COMPLETADO') {
        mensaje = "Este pedido ya está pagado";
      } else if (estadoPago === 'PENDIENTE') {
        mensaje = "Ya hay un pago pendiente de verificación para este pedido";
      } else if (estadoPago === 'PROCESANDO') {
        mensaje = "Ya hay un pago en proceso para este pedido";
      }
      
      return NextResponse.json(
        { error: mensaje },
        { status: 400 }
      );
    }

    // Procesar comprobante
    let comprobante_url = null;
    if (tipo_pago === 'TRANSFERENCIA') {
      if (!comprobante) {
        return NextResponse.json(
          { error: "Para pagos por transferencia debe subir un comprobante" },
          { status: 400 }
        );
      }

      if (!comprobante.type.startsWith('image/') && comprobante.type !== 'application/pdf') {
        return NextResponse.json(
          { error: "El comprobante debe ser una imagen o PDF" },
          { status: 400 }
        );
      }

      if (comprobante.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El comprobante no debe superar los 5MB" },
          { status: 400 }
        );
      }

      try {
        await mkdir(UPLOAD_DIR, { recursive: true });

        const extension = comprobante.name.split('.').pop();
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        const bytes = await comprobante.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        comprobante_url = `/uploads/comprobantes/${fileName}`;
        console.log("✅ Comprobante guardado:", comprobante_url);
      } catch (uploadError) {
        console.error("Error subiendo comprobante:", uploadError);
        return NextResponse.json(
          { error: "Error al subir el comprobante" },
          { status: 500 }
        );
      }
    }

    // Crear transacción
    const estadoInicial = tipo_pago === 'TARJETA' ? 'PROCESANDO' : 'PENDIENTE';
    
    const result = await pool.query(
      `INSERT INTO transacciones (
        pedido_id,
        usuario_id,
        metodo_pago_id,
        tipo_pago,
        monto,
        estado,
        comprobante_url,
        notas_cliente
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        pedido_id,
        decoded.id,
        metodo_pago_id || null,
        tipo_pago,
        pedido.total_final,
        estadoInicial,
        comprobante_url,
        notas || null
      ]
    );

    const nuevaTransaccion = result.rows[0];
    console.log("✅ Transacción creada:", nuevaTransaccion.id);

    // Registrar auditoría
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    
    try {
      await pool.query(
        `INSERT INTO audit_logs 
          (usuario_id, accion, tabla, registro_id, datos_despues, ip)
         VALUES ($1, 'CREAR_PAGO', 'transacciones', $2, $3::jsonb, $4::inet)`,
        [
          decoded.id,
          nuevaTransaccion.id,
          JSON.stringify(nuevaTransaccion),
          ip
        ]
      );
    } catch (auditError) {
      console.error("Error en auditoría:", auditError);
    }

    const mensaje = tipo_pago === 'TARJETA' 
      ? "Pago procesándose correctamente" 
      : tipo_pago === 'TRANSFERENCIA'
      ? "Comprobante recibido, pendiente de verificación"
      : "Pago registrado correctamente";

    return NextResponse.json({
      success: true,
      message: mensaje,
      transaccion: {
        id: nuevaTransaccion.id,
        estado: nuevaTransaccion.estado,
        monto: nuevaTransaccion.monto,
        tipo_pago: nuevaTransaccion.tipo_pago
      }
    });

  } catch (error) {
    console.error("❌ Error en POST /api/mobile/pagos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
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

    const result = await pool.query(`
      SELECT 
        t.*,
        mp.tipo as metodo_pago_tipo,
        mp.ultimos_digitos,
        mp.titular,
        p.numero_pedido,
        p.total_final as pedido_total,
        u.nombre || ' ' || u.apellido as usuario_nombre,
        v.nombre || ' ' || v.apellido as verificador_nombre
      FROM transacciones t
      LEFT JOIN metodos_pago_usuario mp ON t.metodo_pago_id = mp.id
      LEFT JOIN pedidos p ON t.pedido_id = p.id
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      LEFT JOIN usuarios v ON t.verificado_por = v.id
      WHERE t.usuario_id = $1 AND t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `, [decoded.id]);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET pagos móvil:", error);
    return NextResponse.json(
      { error: "Error obteniendo pagos" },
      { status: 500 }
    );
  }
}