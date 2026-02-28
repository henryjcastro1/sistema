import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface UsuarioInput {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol_nombre?: string;
  foto_url?: string;
}

interface JwtPayload {
  id: string;
  email?: string;
  rol?: string;
  iat?: number;
  exp?: number;
}

/* ================================
   GET - Listar usuarios
================================ */
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.foto_url,
        u.email_verificado,
        u.bloqueado,
        u.created_at,
        r.nombre as rol_nombre,
        r.nivel as rol_nivel
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET usuarios:", error);
    return NextResponse.json(
      { error: "Error obteniendo usuarios" },
      { status: 500 }
    );
  }
}

/* ================================
   POST - Crear usuario
================================ */
export async function POST(req: Request) {
  try {
    const body: UsuarioInput = await req.json();

    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      rol_nombre = "CLIENTE",
      foto_url
    } = body;

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y password son obligatorios" },
        { status: 400 }
      );
    }

    const exists = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (exists.rows.length > 0) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

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

    const result = await pool.query(
      `SELECT create_user($1, $2, $3, $4, $5, $6, $7) as user_id`,
      [
        nombre,
        apellido,
        email,
        password,
        telefono || null,
        rol_nombre,
        foto_url || null
      ]
    );

    const userId = result.rows[0].user_id;

    const newUser = await pool.query(
      `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.foto_url,
        u.email_verificado,
        u.created_at,
        r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1`,
      [userId]
    );

    /* ===== OBTENER USUARIO CREADOR ===== */
    const cookieHeader = req.headers.get("cookie");
    let usuarioCreadorId: string | null = null;

    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
          ) as JwtPayload;

          usuarioCreadorId = decoded.id;
        } catch {
          console.log("Token inválido al crear usuario");
        }
      }
    }

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const userAgent = req.headers.get("user-agent") || "";

    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_despues, ip, user_agent)
       VALUES ($1, 'CREAR', 'usuarios', $2, $3::jsonb, $4::inet, $5)`,
      [
        usuarioCreadorId,
        userId,
        JSON.stringify(newUser.rows[0]),
        ip,
        userAgent
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Usuario creado exitosamente",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error("Error POST usuarios:", error);
    return NextResponse.json(
      { error: "Error creando usuario" },
      { status: 500 }
    );
  }
}

/* ================================
   PATCH - Cambiar contraseña
================================ */
export async function PATCH(req: Request) {
  try {
    const { email, newPassword }: { email: string; newPassword: string } =
      await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    const antesResult = await pool.query(
      `SELECT id, email, nombre, apellido 
       FROM usuarios 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (antesResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const usuario = antesResult.rows[0];

    const result = await pool.query(
      `UPDATE usuarios 
       SET 
         password_hash = crypt($2, gen_salt('bf'))::BYTEA,
         password_salt = gen_salt('bf')::BYTEA,
         updated_at = NOW()
       WHERE email = $1 AND deleted_at IS NULL
       RETURNING id, email, nombre, apellido`,
      [email, newPassword]
    );

    const cookieHeader = req.headers.get("cookie");
    let usuarioCambioId: string | null = null;

    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
          ) as JwtPayload;

          usuarioCambioId = decoded.id;
        } catch {
          console.log("Token inválido al cambiar contraseña");
        }
      }
    }

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const userAgent = req.headers.get("user-agent") || "";

    await pool.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_antes, datos_despues, ip, user_agent)
       VALUES ($1, 'CAMBIO_PASSWORD', 'usuarios', $2, $3::jsonb, $4::jsonb, $5::inet, $6)`,
      [
        usuarioCambioId,
        usuario.id,
        JSON.stringify({
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        }),
        JSON.stringify(result.rows[0]),
        ip,
        userAgent
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Error PATCH usuarios:", error);
    return NextResponse.json(
      { error: "Error actualizando contraseña" },
      { status: 500 }
    );
  }
}