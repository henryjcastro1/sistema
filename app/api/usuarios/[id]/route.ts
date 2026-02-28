import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";

interface UsuarioUpdateInput {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  rol_nombre?: string;
  foto_url?: string;
}

// PATCH existente (para acciones: bloquear, activar, verificar)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { accion } = await request.json();

    let query = "";
    let mensaje = "";

    switch (accion) {
      case 'bloquear':
        query = `
          UPDATE usuarios 
          SET bloqueado = true, 
              updated_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email, nombre, apellido
        `;
        mensaje = "Usuario bloqueado";
        break;

      case 'activar':
        query = `
          UPDATE usuarios 
          SET bloqueado = false, 
              updated_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email, nombre, apellido
        `;
        mensaje = "Usuario activado";
        break;

      case 'verificar':
        query = `
          UPDATE usuarios 
          SET email_verificado = true, 
              updated_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id, email, nombre, apellido
        `;
        mensaje = "Email verificado manualmente";
        break;

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id)
       VALUES ($1, $2, 'usuarios', $3)`,
      [result.rows[0].id, accion.toUpperCase(), id]
    );

    return NextResponse.json({
      success: true,
      message: mensaje,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Error PATCH usuario:", error);
    return NextResponse.json(
      { error: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

// 🆕 NUEVO: PUT para editar usuario completo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UsuarioUpdateInput = await request.json();

    const { 
      nombre, 
      apellido, 
      email, 
      telefono,
      rol_nombre,
      foto_url 
    } = body;

    // Verificar que el usuario existe
    const existe = await pool.query(
      `SELECT id FROM usuarios WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el email no esté duplicado (si se está cambiando)
    if (email) {
      const emailDuplicado = await pool.query(
        `SELECT id FROM usuarios WHERE email = $1 AND id != $2 AND deleted_at IS NULL`,
        [email, id]
      );

      if (emailDuplicado.rows.length > 0) {
        return NextResponse.json(
          { error: "El email ya está registrado por otro usuario" },
          { status: 409 }
        );
      }
    }

    // Verificar que el rol existe (si se está cambiando)
    let rol_id = null;
    if (rol_nombre) {
      const rolResult = await pool.query(
        `SELECT id FROM roles WHERE nombre = $1`,
        [rol_nombre]
      );

      if (rolResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Rol ${rol_nombre} no válido` },
          { status: 400 }
        );
      }
      rol_id = rolResult.rows[0].id;
    }

    // Construir la consulta dinámica
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (nombre) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    if (apellido) {
      updates.push(`apellido = $${paramIndex++}`);
      values.push(apellido);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramIndex++}`);
      values.push(telefono);
    }
    if (rol_id) {
      updates.push(`rol_id = $${paramIndex++}`);
      values.push(rol_id);
    }
    if (foto_url !== undefined) {
      updates.push(`foto_url = $${paramIndex++}`);
      values.push(foto_url);
    }

    // Siempre actualizar updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    // Agregar el ID al final de los valores
    values.push(id);

    const query = `
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id, nombre, apellido, email, telefono, foto_url, rol_id
    `;

    const result = await pool.query(query, values);

    // Obtener el nombre del rol para la respuesta
    const usuarioActualizado = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.foto_url,
        u.email_verificado,
        u.bloqueado,
        u.created_at,
        r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1`,
      [id]
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id)
       VALUES ($1, 'ACTUALIZAR', 'usuarios', $2)`,
      [id, id]
    );

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado correctamente",
      user: usuarioActualizado.rows[0]
    });

  } catch (error) {
    console.error("Error PUT usuario:", error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}

// 🆕 OPCIONAL: GET para obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.foto_url,
        u.email_verificado,
        u.bloqueado,
        u.created_at,
        u.updated_at,
        r.nombre as rol_nombre,
        r.nivel as rol_nivel
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET usuario por ID:", error);
    return NextResponse.json(
      { error: "Error obteniendo usuario" },
      { status: 500 }
    );
  }
}