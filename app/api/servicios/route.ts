import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from 'next/headers';

// Definir interfaz para el payload del token
interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

// Interfaz para los datos del formulario
interface ServicioFormData {
  titulo: string;
  descripcion?: string;
  prioridad?: number;
  direccion?: string;
  cliente_id?: string;  // 👈 NUEVO: ID del cliente seleccionado
}

export async function GET(req: Request) {
  try {
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

    let query = `
      SELECT 
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
      WHERE s.deleted_at IS NULL
    `;

    // Filtros según rol
    if (rol === 'CLIENTE') {
      query += ` AND s.usuario_id = '${usuarioId}'`;
    } else if (rol === 'TECNICO') {
      query += ` AND (s.tecnico_id = '${usuarioId}' OR s.tecnico_id IS NULL)`;
    }

    query += ` ORDER BY 
      CASE s.prioridad 
        WHEN 1 THEN 1
        WHEN 2 THEN 2
        WHEN 3 THEN 3
        WHEN 4 THEN 4
        WHEN 5 THEN 5
      END,
      s.fecha_solicitado DESC`;

    const result = await pool.query(query);
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET servicios:", error);
    return NextResponse.json(
      { error: "Error al cargar servicios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    const esAdmin = ['ADMIN', 'SUPERADMIN'].includes(userResult.rows[0]?.rol_nombre);

    const data = await req.json() as ServicioFormData;
    const { titulo, descripcion, prioridad = 3, direccion, cliente_id } = data;

    // Validaciones
    if (!titulo) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }

    // Determinar el usuario_id del servicio
    let servicioUsuarioId = usuarioId;
    
    // 👇 Si es admin y envió un cliente_id, usar ese cliente
    if (esAdmin && cliente_id) {
      // Verificar que el cliente existe
      const clienteResult = await pool.query(
        `SELECT id FROM usuarios WHERE id = $1 AND deleted_at IS NULL`,
        [cliente_id]
      );
      
      if (clienteResult.rows.length === 0) {
        return NextResponse.json(
          { error: "El cliente seleccionado no existe" },
          { status: 400 }
        );
      }
      
      servicioUsuarioId = cliente_id;
      console.log(`👤 Admin ${usuarioId} creando servicio para cliente ${cliente_id}`);
    } else {
      console.log(`👤 Usuario ${usuarioId} creando servicio para sí mismo`);
    }

    // Obtener SLA config por defecto según prioridad
    const slaResult = await pool.query(
      `SELECT id FROM sla_config WHERE prioridad = $1 AND activo = true LIMIT 1`,
      [prioridad]
    );

    const slaConfigId = slaResult.rows[0]?.id;

    // Crear servicio con el usuario_id correcto
    const result = await pool.query(
      `INSERT INTO servicios (
        usuario_id,
        titulo,
        descripcion,
        prioridad,
        direccion,
        sla_config_id,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, 'SOLICITADO')
      RETURNING *`,
      [
        servicioUsuarioId,  // 👈 Usa el ID del cliente (seleccionado o el propio usuario)
        titulo,
        descripcion,
        prioridad,
        direccion,
        slaConfigId
      ]
    );

    // Registrar en auditoría
    try {
      await pool.query(
        `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id, ip)
         VALUES ($1, 'CREAR_SERVICIO', 'servicios', $2, $3::inet)`,
        [usuarioId, result.rows[0].id, req.headers.get('x-forwarded-for') || '0.0.0.0']
      );
    } catch (auditError) {
      console.error("Error en auditoría:", auditError);
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error POST servicio:", error);
    return NextResponse.json(
      { error: "Error al crear servicio" },
      { status: 500 }
    );
  }
}