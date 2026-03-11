import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}

export async function PATCH(req: Request) {
  console.log("👤 Endpoint de editar perfil llamado");
  
  try {
    // Verificar token
    const authHeader = req.headers.get('authorization');
    console.log("🔑 Auth header:", authHeader ? "Presente" : "No presente");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      console.log("✅ Token válido para usuario:", decoded.id);
    } catch (error) {
      console.log("❌ Token inválido:", error);
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const body = await req.json();
    console.log("📦 Body recibido:", body);
    
    const { nombre, apellido, telefono } = body;

    // Validaciones
    if (!nombre || !apellido) {
      return NextResponse.json(
        { error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // Actualizar usuario en la base de datos
    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, 
           apellido = $2, 
           telefono = $3, 
           updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, nombre, apellido, email, telefono, foto_url, created_at`,
      [nombre, apellido, telefono || null, decoded.id]
    );

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado:", decoded.id);
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const usuarioActualizado = result.rows[0];
    console.log("✅ Usuario actualizado:", usuarioActualizado);

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente",
      user: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        apellido: usuarioActualizado.apellido,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        foto_url: usuarioActualizado.foto_url,
        created_at: usuarioActualizado.created_at
      }
    });

  } catch (error) {
    console.error("❌ Error en endpoint de perfil:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}