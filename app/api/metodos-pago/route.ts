import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

// GET /api/metodos-pago - Listar métodos de pago del usuario
export async function GET(req: Request) {
  try {
    // Verificar autenticación
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let usuarioId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      usuarioId = decoded.id;
    } catch (e) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT 
        id,
        tipo,
        ultimos_digitos,
        titular,
        es_principal,
        created_at
      FROM metodos_pago_usuario 
      WHERE usuario_id = $1 AND deleted_at IS NULL
      ORDER BY es_principal DESC, created_at DESC`,
      [usuarioId]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET métodos de pago:", error);
    return NextResponse.json(
      { error: "Error obteniendo métodos de pago" },
      { status: 500 }
    );
  }
}

// POST /api/metodos-pago - Crear un nuevo método de pago
export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let usuarioId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      usuarioId = decoded.id;
    } catch (e) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    const { tipo, token_pago, ultimos_digitos, titular, fecha_expiracion, es_principal } = await req.json();

    // Validaciones básicas
    if (!tipo || !token_pago || !ultimos_digitos || !titular) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar tipo de tarjeta
    const tiposValidos = ['VISA', 'MASTERCARD', 'AMEX', 'OTHER'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de tarjeta no válido" },
        { status: 400 }
      );
    }

    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Si es principal, quitar principal a los demás
      if (es_principal) {
        await client.query(
          `UPDATE metodos_pago_usuario 
           SET es_principal = false 
           WHERE usuario_id = $1`,
          [usuarioId]
        );
      }

      // Insertar nuevo método de pago
      const result = await client.query(
        `INSERT INTO metodos_pago_usuario (
          usuario_id,
          tipo,
          token_pago,
          ultimos_digitos,
          titular,
          fecha_expiracion,
          es_principal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, tipo, ultimos_digitos, titular, es_principal, created_at`,
        [
          usuarioId,
          tipo,
          token_pago,
          ultimos_digitos,
          titular,
          fecha_expiracion || null,
          es_principal || false
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Método de pago agregado correctamente",
        metodo_pago: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error POST método de pago:", error);
    return NextResponse.json(
      { error: "Error al agregar método de pago" },
      { status: 500 }
    );
  }
}