import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface RegisterInput {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}

export async function POST(req: Request) {
  try {
    const body: RegisterInput = await req.json();
    const { nombre, apellido, email, password, telefono } = body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y password son obligatorios" },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Validar longitud de password
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const exists = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (exists.rows.length > 0) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // Obtener el ID del rol CLIENTE
    const rolResult = await pool.query(
      `SELECT id FROM roles WHERE nombre = 'CLIENTE'`
    );

    if (rolResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Error de configuración: rol CLIENTE no encontrado" },
        { status: 500 }
      );
    }

    // Crear usuario usando la función existente
    const result = await pool.query(
      `SELECT create_user($1, $2, $3, $4, $5, 'CLIENTE') as user_id`,
      [
        nombre,
        apellido,
        email.toLowerCase(),
        password,
        telefono || null
      ]
    );

    const userId = result.rows[0].user_id;

    // Obtener el usuario recién creado
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
        r.nombre as rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1`,
      [userId]
    );

    // Generar token JWT para móvil (30 días)
    const token = jwt.sign(
      {
        id: userId,
        email: email.toLowerCase(),
        rol: 'CLIENTE',
        nombre: `${nombre} ${apellido}`,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "30d" }
    );

    // Registrar en auditoría
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    
    await pool.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, ip)
       VALUES ($1, 'REGISTRO_MOBILE', 'usuarios', $2::inet)`,
      [userId, ip]
    );

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente",
      token, // 👈 Devolvemos token para login automático
      user: {
        id: newUser.rows[0].id,
        nombre: newUser.rows[0].nombre,
        apellido: newUser.rows[0].apellido,
        email: newUser.rows[0].email,
        rol: newUser.rows[0].rol,
        telefono: newUser.rows[0].telefono,
        foto_url: newUser.rows[0].foto_url,
      }
    });

  } catch (error) {
    console.error("Error en registro móvil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}