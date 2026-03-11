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

    const result = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        apellido,
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

    // 👇 PARA MÓVIL: PERMITIR CLIENTES (la app es para clientes)
    // Comentamos o eliminamos la validación de cliente
    // if (user.rol_nombre === 'CLIENTE') {
    //   return NextResponse.json(
    //     { error: "Acceso no autorizado. Esta área es solo para administradores." },
    //     { status: 403 }
    //   );
    // }

    // Actualizar último login
    await pool.query(
      `UPDATE usuarios 
       SET ultimo_login = NOW(),
           intentos_fallidos = 0
       WHERE id = $1`,
      [user.id]
    );

    // 👇 PARA MÓVIL: Token con mayor duración (30 días)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: user.rol_nombre,
        nombre: `${user.nombre} ${user.apellido}`,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" } // 30 días para móvil
    );

    // Registrar en auditoría (opcional para móvil)
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, ip)
       VALUES ($1, 'LOGIN_MOBILE', 'usuarios', $2::inet)`,
      [user.id, req.headers.get('x-forwarded-for') || '0.0.0.0']
    );

    // 👇 PARA MÓVIL: Devolver token en el body (sin cookies)
    return NextResponse.json({ 
      success: true,
      token, // Token en el body para que la app lo guarde
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_nombre,
        foto_url: user.foto_url
      }
    });

  } catch (error) {
    console.error("Login móvil error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}