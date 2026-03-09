import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

// Definir interfaz para el payload del token
interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

// PATCH /api/pagos/[id] - Verificar un pago (aprobar/rechazar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { estado, motivo_rechazo } = await request.json();

    // Validar que el estado sea válido
    const estadosValidos = ['COMPLETADO', 'RECHAZADO'];
    if (!estadosValidos.includes(estado)) {
      return NextResponse.json(
        { error: "Estado no válido. Use COMPLETADO o RECHAZADO" },
        { status: 400 }
      );
    }

    // Verificar autenticación del admin
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let adminId: string;
    try {
      // 👇 CORREGIDO: Usar TokenPayload en lugar de any
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      adminId = decoded.id;
      
      // Verificar que el usuario es admin
      const userResult = await pool.query(
        `SELECT r.nombre as rol_nombre 
         FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = $1`,
        [adminId]
      );

      const rol = userResult.rows[0]?.rol_nombre;
      if (!rol || !['ADMIN', 'SUPERADMIN'].includes(rol)) {
        return NextResponse.json(
          { error: "No tienes permisos de administrador" },
          { status: 403 }
        );
      }
      
    } catch (e) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Verificar que la transacción existe y está pendiente
    const transaccionResult = await pool.query(
      `SELECT t.*, p.id as pedido_id, p.estado as pedido_estado
       FROM transacciones t
       JOIN pedidos p ON t.pedido_id = p.id
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id]
    );

    if (transaccionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const transaccion = transaccionResult.rows[0];

    // Validar que la transacción esté pendiente
    if (transaccion.estado !== 'PENDIENTE') {
      return NextResponse.json(
        { error: `Esta transacción ya fue procesada (estado: ${transaccion.estado})` },
        { status: 400 }
      );
    }

    // Para rechazo, se requiere motivo
    if (estado === 'RECHAZADO' && !motivo_rechazo) {
      return NextResponse.json(
        { error: "Debe proporcionar un motivo para el rechazo" },
        { status: 400 }
      );
    }

    // Iniciar transacción SQL
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Actualizar la transacción
      const updateResult = await client.query(
        `UPDATE transacciones 
         SET estado = $1,
             notas_admin = $2,
             fecha_verificacion = NOW(),
             verificado_por = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [
          estado,
          motivo_rechazo || null,
          adminId,
          id
        ]
      );

      // Si el pago fue completado, actualizar el estado del pedido
      if (estado === 'COMPLETADO') {
        await client.query(
          `UPDATE pedidos 
           SET estado = 'PAGADO',
               fecha_pago = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [transaccion.pedido_id]
        );
      }

      // Registrar en auditoría
      await client.query(
        `INSERT INTO audit_logs 
          (usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip)
         VALUES ($1, $2, 'transacciones', $3, $4::jsonb, $5::jsonb, $6::inet)`,
        [
          adminId,
          estado === 'COMPLETADO' ? 'APROBAR_PAGO' : 'RECHAZAR_PAGO',
          id,
          JSON.stringify({ estado: transaccion.estado }),
          JSON.stringify({ estado, motivo_rechazo, verificado_por: adminId }),
          request.headers.get('x-forwarded-for') || '0.0.0.0'
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: estado === 'COMPLETADO' 
          ? "Pago aprobado correctamente" 
          : "Pago rechazado",
        transaccion: updateResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error PATCH pago:", error);
    return NextResponse.json(
      { error: "Error verificando el pago" },
      { status: 500 }
    );
  }
}

// GET /api/pagos/[id] - Obtener una transacción específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
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
      WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET transacción:", error);
    return NextResponse.json(
      { error: "Error obteniendo transacción" },
      { status: 500 }
    );
  }
}