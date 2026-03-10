import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

interface UpdateData {
  estado?: 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
  tecnico_id?: string;
  fecha_inicio?: string;
  fecha_completado?: string;
  fecha_cancelado?: string;
  costo_final?: number;
  comentario_cliente?: string;
  calificacion?: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    const usuarioId = decoded.id;

    // Obtener rol del usuario
    const userResult = await pool.query(
      `SELECT r.nombre as rol_nombre 
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1`,
      [usuarioId]
    );

    const rol = userResult.rows[0]?.rol_nombre;
    
    // Obtener servicio actual
    const servicioActual = await pool.query(
      `SELECT * FROM servicios WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (servicioActual.rows.length === 0) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const servicio = servicioActual.rows[0];
    const data = await request.json() as UpdateData;

    // =====================================================
    // VALIDACIONES SEGÚN ROL Y ESTADO
    // =====================================================

    // Admin puede hacer todo
    // Técnico solo puede modificar servicios asignados a él
    if (rol === 'TECNICO' && servicio.tecnico_id && servicio.tecnico_id !== usuarioId) {
      return NextResponse.json(
        { error: "No puedes modificar un servicio que no te pertenece" },
        { status: 403 }
      );
    }

    // Cliente no puede modificar servicios (solo ver)
    if (rol === 'CLIENTE') {
      return NextResponse.json(
        { error: "Los clientes no pueden modificar servicios" },
        { status: 403 }
      );
    }

    // =====================================================
    // CONSTRUIR QUERY DINÁMICA (EVITANDO DUPLICADOS)
    // =====================================================

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    // Siempre actualizar updated_at
    updates.push(`updated_at = NOW()`);

    // Caso 1: Asignar técnico (SOLICITADO → EN_PROCESO)
    if (data.tecnico_id) {
      if (servicio.estado !== 'SOLICITADO') {
        return NextResponse.json(
          { error: "Solo se puede asignar técnico a servicios solicitados" },
          { status: 400 }
        );
      }

      updates.push(`tecnico_id = $${paramIndex}`);
      values.push(data.tecnico_id);
      paramIndex++;
      
      updates.push(`estado = 'EN_PROCESO'`);
      updates.push(`fecha_asignado = NOW()`);
    }

    // Caso 2: Cambiar estado a EN_PROCESO (cuando el técnico toma el servicio)
    else if (data.estado === 'EN_PROCESO') {
      if (servicio.estado !== 'SOLICITADO') {
        return NextResponse.json(
          { error: "Solo se puede iniciar servicios solicitados" },
          { status: 400 }
        );
      }

      updates.push(`estado = 'EN_PROCESO'`);
      updates.push(`fecha_inicio = COALESCE(fecha_inicio, NOW())`);
      
      // Si el técnico se está asignando a sí mismo
      if (rol === 'TECNICO' && !servicio.tecnico_id) {
        updates.push(`tecnico_id = $${paramIndex}`);
        values.push(usuarioId);
        paramIndex++;
        updates.push(`fecha_asignado = NOW()`);
      }
    }

    // Caso 3: Completar servicio (EN_PROCESO → COMPLETADO)
    else if (data.estado === 'COMPLETADO') {
      if (servicio.estado !== 'EN_PROCESO') {
        return NextResponse.json(
          { error: "Solo se pueden completar servicios en proceso" },
          { status: 400 }
        );
      }

      updates.push(`estado = 'COMPLETADO'`);
      updates.push(`fecha_completado = NOW()`);

      if (data.costo_final !== undefined) {
        updates.push(`costo_final = $${paramIndex}`);
        values.push(data.costo_final);
        paramIndex++;
      }
    }

    // Caso 4: Cancelar servicio
    else if (data.estado === 'CANCELADO') {
      if (servicio.estado === 'COMPLETADO') {
        return NextResponse.json(
          { error: "No se puede cancelar un servicio completado" },
          { status: 400 }
        );
      }

      updates.push(`estado = 'CANCELADO'`);
      updates.push(`fecha_cancelado = NOW()`);
    }

    // Caso 5: Agregar calificación (solo cuando está completado)
    if (data.calificacion !== undefined || data.comentario_cliente) {
      // Verificar que el servicio esté completado
      if (servicio.estado !== 'COMPLETADO' && data.estado !== 'COMPLETADO') {
        return NextResponse.json(
          { error: "Solo se puede calificar servicios completados" },
          { status: 400 }
        );
      }

      if (data.calificacion !== undefined) {
        if (data.calificacion < 1 || data.calificacion > 5) {
          return NextResponse.json(
            { error: "La calificación debe ser entre 1 y 5" },
            { status: 400 }
          );
        }
        updates.push(`calificacion = $${paramIndex}`);
        values.push(data.calificacion);
        paramIndex++;
      }

      if (data.comentario_cliente) {
        updates.push(`comentario_cliente = $${paramIndex}`);
        values.push(data.comentario_cliente);
        paramIndex++;
      }
    }

    // Si no hay cambios, retornar error
    if (updates.length === 1) { // Solo updated_at
      return NextResponse.json(
        { error: "No se especificaron cambios" },
        { status: 400 }
      );
    }

    // Construir y ejecutar query
    const updateQuery = `
      UPDATE servicios 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    values.push(id);
    
    console.log("📝 Query:", updateQuery);
    console.log("📦 Values:", values);

    const result = await pool.query(updateQuery, values);

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id, ip)
       VALUES ($1, 'ACTUALIZAR_SERVICIO', 'servicios', $2, $3::inet)`,
      [usuarioId, id, request.headers.get('x-forwarded-for') || '0.0.0.0']
    );

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error PATCH servicio:", error);
    return NextResponse.json(
      { error: "Error al actualizar servicio" },
      { status: 500 }
    );
  }
}

// GET /api/servicios/[id] - Obtener un servicio específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        s.*,
        CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
        c.email as cliente_email,
        c.telefono as cliente_telefono,
        CONCAT(t.nombre, ' ', t.apellido) as tecnico_nombre,
        sla.nombre as sla_nombre
      FROM servicios s
      LEFT JOIN usuarios c ON s.usuario_id = c.id
      LEFT JOIN usuarios t ON s.tecnico_id = t.id
      LEFT JOIN sla_config sla ON s.sla_config_id = sla.id
      WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET servicio:", error);
    return NextResponse.json(
      { error: "Error al obtener servicio" },
      { status: 500 }
    );
  }
}