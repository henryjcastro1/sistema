import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt, { JwtPayload } from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { cookies } from 'next/headers';

// Configuración para subida de archivos
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/comprobantes");

// POST - Crear una nueva transacción de pago
export async function POST(req: Request) {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    let usuarioId;
    
    if (token) {
      try {
        interface JwtPayload {
          id: string;
          email: string;
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as JwtPayload;

        usuarioId = decoded.id;
      } catch (error) {
        console.error("Error verificando token:", error);
        return NextResponse.json(
          { error: "Token inválido" },
          { status: 401 }
        );
      }
    } else {
      // Fallback: intentar desde headers
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7);
        try {
          const decoded = jwt.verify(
            bearerToken,
            process.env.JWT_SECRET as string
          ) as JwtPayload;
          usuarioId = decoded.id;
        } catch (error) {
          return NextResponse.json(
            { error: "Token inválido" },
            { status: 401 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "No autorizado - Token no encontrado" },
          { status: 401 }
        );
      }
    }

    if (!usuarioId) {
      return NextResponse.json(
        { error: "No autorizado - Usuario no identificado" },
        { status: 401 }
      );
    }

    // =====================================================
    // VERIFICAR SI EL USUARIO ES ADMIN
    // =====================================================
    const userResult = await pool.query(
      `SELECT r.nombre as rol_nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [usuarioId]
    );

    const esAdmin = userResult.rows[0]?.rol_nombre === 'ADMIN' || 
                    userResult.rows[0]?.rol_nombre === 'SUPERADMIN';

    console.log("👤 Usuario autenticado:", { usuarioId, esAdmin });

    // =====================================================
    // 2. PROCESAR FORM DATA
    // =====================================================
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
      usuarioId,
      esAdmin,
      tiene_comprobante: !!comprobante
    });

    // Validaciones básicas
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

    // Validar tipos de pago válidos
    const tiposValidos = ['TARJETA', 'TRANSFERENCIA', 'EFECTIVO'];
    if (!tiposValidos.includes(tipo_pago)) {
      return NextResponse.json(
        { error: "Tipo de pago no válido" },
        { status: 400 }
      );
    }

    // Para tarjeta, se requiere metodo_pago_id
    if (tipo_pago === 'TARJETA' && !metodo_pago_id) {
      return NextResponse.json(
        { error: "Para pagos con tarjeta debe seleccionar un método de pago" },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. VERIFICAR PEDIDO (con soporte para admin)
    // =====================================================
    let pedidoQuery;
    let pedidoValues;

    if (esAdmin) {
      // Admin puede ver cualquier pedido
      pedidoQuery = `SELECT p.id, p.total_final, p.estado, p.usuario_id 
                     FROM pedidos p 
                     WHERE p.id = $1 AND p.deleted_at IS NULL`;
      pedidoValues = [pedido_id];
    } else {
      // Usuario normal solo puede ver sus pedidos
      pedidoQuery = `SELECT p.id, p.total_final, p.estado, p.usuario_id 
                     FROM pedidos p 
                     WHERE p.id = $1 AND p.usuario_id = $2 AND p.deleted_at IS NULL`;
      pedidoValues = [pedido_id, usuarioId];
    }

    console.log("🔍 Verificando pedido:", { pedido_id, usuarioId, esAdmin });

    const pedidoResult = await pool.query(pedidoQuery, pedidoValues);

    if (pedidoResult.rows.length === 0) {
      console.log("❌ Pedido no encontrado en BD");
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedido = pedidoResult.rows[0];
    console.log("📊 Pedido encontrado:", pedido);

    // =====================================================
    // 4. VERIFICAR QUE NO HAYA PAGOS DUPLICADOS
    // =====================================================
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
        mensaje = "❌ Este pedido ya está pagado";
      } else if (estadoPago === 'PENDIENTE') {
        mensaje = "⏳ Ya hay un pago pendiente de verificación para este pedido";
      } else if (estadoPago === 'PROCESANDO') {
        mensaje = "🔄 Ya hay un pago en proceso para este pedido";
      }
      
      console.log("🚫 Pago duplicado detectado:", { 
        pedido_id, 
        pago_existente_id: pagoExistente.rows[0].id,
        estado: estadoPago 
      });
      
      return NextResponse.json(
        { error: mensaje },
        { status: 400 }
      );
    }

    // Si no es admin, verificar que el pedido pertenece al usuario
    if (!esAdmin && pedido.usuario_id !== usuarioId) {
      console.log("❌ El pedido no pertenece al usuario");
      return NextResponse.json(
        { error: "Pedido no encontrado o no te pertenece" },
        { status: 404 }
      );
    }

    // Verificar que el pedido no esté ya pagado por estado
    if (pedido.estado === 'PAGADO') {
      return NextResponse.json(
        { error: "Este pedido ya está pagado" },
        { status: 400 }
      );
    }

    // =====================================================
    // 5. PROCESAR COMPROBANTE (si es transferencia)
    // =====================================================
    let comprobante_url = null;
    if (tipo_pago === 'TRANSFERENCIA') {
      if (!comprobante) {
        return NextResponse.json(
          { error: "Para pagos por transferencia debe subir un comprobante" },
          { status: 400 }
        );
      }

      // Validar tipo de archivo
      if (!comprobante.type.startsWith('image/') && comprobante.type !== 'application/pdf') {
        return NextResponse.json(
          { error: "El comprobante debe ser una imagen o PDF" },
          { status: 400 }
        );
      }

      // Validar tamaño (máx 5MB)
      if (comprobante.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "El comprobante no debe superar los 5MB" },
          { status: 400 }
        );
      }

      try {
        // Crear directorio si no existe
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Generar nombre único
        const extension = comprobante.name.split('.').pop();
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        
        // Convertir File a Buffer y guardar
        const bytes = await comprobante.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // URL pública del archivo
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

    // =====================================================
    // 6. CREAR TRANSACCIÓN
    // =====================================================
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
        usuarioId,
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

    // =====================================================
    // 7. AUDITORÍA
    // =====================================================
    const rawIp = req.headers.get('x-forwarded-for');
    const ip = rawIp ? rawIp.split(',')[0].trim() : '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    try {
      await pool.query(
        `INSERT INTO audit_logs 
          (usuario_id, accion, tabla, registro_id, datos_despues, ip, user_agent)
         VALUES ($1, 'CREAR_PAGO', 'transacciones', $2, $3::jsonb, $4::inet, $5)`,
        [
          usuarioId,
          nuevaTransaccion.id,
          JSON.stringify(nuevaTransaccion),
          ip,
          userAgent
        ]
      );
    } catch (auditError) {
      console.error("Error en auditoría (no crítico):", auditError);
      // No fallamos la operación principal por error de auditoría
    }

    // =====================================================
    // 8. RESPUESTA EXITOSA
    // =====================================================
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
    console.error("❌ Error en POST /api/pagos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET - Listar transacciones
export async function GET(req: Request) {
  try {
    // Verificar autenticación para GET también
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar token (opcional, dependiendo si quieres proteger el GET)
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
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
      WHERE t.deleted_at IS NULL
      ORDER BY t.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error GET pagos:", error);
    return NextResponse.json(
      { error: "Error obteniendo pagos" },
      { status: 500 }
    );
  }
}