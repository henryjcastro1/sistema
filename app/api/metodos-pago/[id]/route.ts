import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol?: string;
}

// GET /api/metodos-pago/[id] - Obtener un método específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar autenticación
    const cookieHeader = request.headers.get('cookie');
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
      WHERE id = $1 AND usuario_id = $2 AND deleted_at IS NULL`,
      [id, usuarioId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Método de pago no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error GET método de pago:", error);
    return NextResponse.json(
      { error: "Error obteniendo método de pago" },
      { status: 500 }
    );
  }
}

// PUT /api/metodos-pago/[id] - Actualizar método (principalmente para cambiar principal)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticación
    const cookieHeader = request.headers.get('cookie');
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

    const { es_principal } = await request.json();

    // Verificar que el método de pago pertenece al usuario
    const existe = await pool.query(
      `SELECT * FROM metodos_pago_usuario 
       WHERE id = $1 AND usuario_id = $2 AND deleted_at IS NULL`,
      [id, usuarioId]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Método de pago no encontrado" },
        { status: 404 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Si se está estableciendo como principal, quitar principal a los demás
      if (es_principal) {
        await client.query(
          `UPDATE metodos_pago_usuario 
           SET es_principal = false 
           WHERE usuario_id = $1`,
          [usuarioId]
        );
      }

      // Actualizar método de pago
      const result = await client.query(
        `UPDATE metodos_pago_usuario 
         SET es_principal = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, tipo, ultimos_digitos, titular, es_principal`,
        [es_principal || false, id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: "Método de pago actualizado",
        metodo_pago: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error PUT método de pago:", error);
    return NextResponse.json(
      { error: "Error actualizando método de pago" },
      { status: 500 }
    );
  }
}

// DELETE /api/metodos-pago/[id] - Eliminar método de pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticación
    const cookieHeader = request.headers.get('cookie');
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

    // Verificar que el método de pago pertenece al usuario
    const existe = await pool.query(
      `SELECT * FROM metodos_pago_usuario 
       WHERE id = $1 AND usuario_id = $2 AND deleted_at IS NULL`,
      [id, usuarioId]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Método de pago no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete
    await pool.query(
      `UPDATE metodos_pago_usuario 
       SET deleted_at = NOW() 
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Método de pago eliminado"
    });

  } catch (error) {
    console.error("Error DELETE método de pago:", error);
    return NextResponse.json(
      { error: "Error eliminando método de pago" },
      { status: 500 }
    );
  }
}