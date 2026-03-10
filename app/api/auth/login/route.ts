import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { pool } from "@/lib/bd";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y password son requeridos" },
        { status: 400 }
      );
    }

    // ✅ CORREGIDO: Quitar el "u." de todos los campos que no son del alias
    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        apellido,        -- ✅ SIN el u.
        u.email,
        u.password_hash,
        u.password_salt,
        u.rol_id,
        u.foto_url,
        u.bloqueado,
        r.nombre as rol_nombre
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1
         AND u.deleted_at IS NULL`,
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verificar si está bloqueado
    if (user.bloqueado) {
      return NextResponse.json(
        { error: "Usuario bloqueado" },
        { status: 403 }
      );
    }

    // Verificar password con pgcrypto
    const passwordResult = await pool.query(
      `SELECT verify_password($1, $2, $3) as valid`,
      [password, user.password_hash, user.password_salt]
    );

    if (!passwordResult.rows[0].valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Después de verificar la contraseña, antes de crear el token
if (user.rol_nombre === 'CLIENTE') {
  return NextResponse.json(
    { error: "Acceso no autorizado. Esta área es solo para administradores." },
    { status: 403 }
  );
}

    // Actualizar último login
    await pool.query(
      `UPDATE usuarios 
       SET ultimo_login = NOW(),
           intentos_fallidos = 0
       WHERE id = $1`,
      [user.id]
    );

    // Crear token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol_nombre,
        nombre: `${user.nombre} ${user.apellido}`,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    // Registrar en auditoría
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, ip)
       VALUES ($1, 'LOGIN', 'usuarios', $2::inet)`,
      [user.id, req.headers.get('x-forwarded-for') || '0.0.0.0']
    );

    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_nombre
      }
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}