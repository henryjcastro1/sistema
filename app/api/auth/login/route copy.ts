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

    // Buscar usuario
    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        u.apellido,        -- ✅ CORREGIDO: Ahora sí con u.
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

    // ✅ MEJORADO: Registrar LOGIN con TODOS los campos de auditoría
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    const userAgent = req.headers.get('user-agent') || '';

    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, ip, user_agent, datos_despues)
       VALUES ($1, 'LOGIN', 'usuarios', $2, $3::inet, $4, $5::jsonb)`,
      [
        user.id,                          // Quién hizo el login
        'LOGIN',                           // Acción
        user.id,                           // El mismo usuario (registro_id)
        ip,                                // IP del usuario
        userAgent,                         // Navegador/dispositivo
        JSON.stringify({                   // Datos adicionales
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol_nombre,
          timestamp: new Date().toISOString()
        })
      ]
    );

    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_nombre,
        foto_url: user.foto_url
      }
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}