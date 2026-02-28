import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Contraseña actual y nueva son requeridas" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Obtener usuario con su contraseña actual
    const userResult = await pool.query(
      `SELECT id, password_hash, password_salt 
       FROM usuarios 
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const passwordValid = await pool.query(
      `SELECT verify_password($1, $2, $3) as valid`,
      [currentPassword, user.password_hash, user.password_salt]
    );

    if (!passwordValid.rows[0].valid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 401 }
      );
    }

    // Actualizar a nueva contraseña
    const result = await pool.query(
      `UPDATE usuarios 
       SET 
         password_hash = crypt($2, gen_salt('bf'))::BYTEA,
         password_salt = gen_salt('bf')::BYTEA,
         updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, email, nombre, apellido`,
      [id, newPassword]
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, registro_id)
       VALUES ($1, 'CAMBIO_PASSWORD', 'usuarios', $2)`,
      [id, id]
    );

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return NextResponse.json(
      { error: "Error cambiando contraseña" },
      { status: 500 }
    );
  }
}