// app/api/mobile/servicios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  nombre: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "No autorizado - Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      console.log("✅ Token válido - Usuario:", decoded.id, "Rol:", decoded.rol);
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const usuarioId = decoded.id;
    const usuarioRol = decoded.rol;

    // 🔥 ACTUALIZADO: Incluir categoría en la consulta
    let query = `
      SELECT 
        s.*,
        CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
        c.email as cliente_email,
        c.telefono as cliente_telefono,
        CONCAT(t.nombre, ' ', t.apellido) as tecnico_nombre,
        sla.nombre as sla_nombre,
        cs.nombre as categoria_nombre,
        cs.icono as categoria_icono
      FROM servicios s
      LEFT JOIN usuarios c ON s.usuario_id = c.id
      LEFT JOIN usuarios t ON s.tecnico_id = t.id
      LEFT JOIN sla_config sla ON s.sla_config_id = sla.id
      LEFT JOIN categorias_servicio cs ON s.categoria_id = cs.id AND cs.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
    `;

    // 🔥 FILTROS SEGÚN ROL PARA APP MÓVIL
    if (usuarioRol === 'CLIENTE') {
      query += ` AND s.usuario_id = '${usuarioId}'`;
      console.log("👤 Cliente - Mostrando servicios del usuario:", usuarioId);
    } 
    else if (usuarioRol === 'TECNICO') {
      query += ` AND s.tecnico_id = '${usuarioId}'`;
      console.log("🔧 Técnico - Mostrando servicios asignados:", usuarioId);
    }
    else if (usuarioRol === 'ADMIN' || usuarioRol === 'SUPERADMIN') {
      query += ` AND s.usuario_id = '${usuarioId}'`;
      console.log("👑 Admin - Mostrando SOLO sus servicios:", usuarioId);
    }
    else {
      query += ` AND s.usuario_id = '${usuarioId}'`;
      console.log("❓ Otro rol - Mostrando servicios del usuario:", usuarioId);
    }

    query += ` ORDER BY s.created_at DESC`;

    console.log("📝 Query:", query);
    
    const result = await pool.query(query);
    console.log(`📊 Total servicios encontrados: ${result.rows.length}`);
    
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET servicios:", error);
    return NextResponse.json(
      { error: "Error al cargar servicios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "No autorizado - Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      console.log("✅ Token válido - Creando servicio para usuario:", decoded.id);
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    const usuarioId = decoded.id;
    const usuarioRol = decoded.rol;

    const data = await request.json();
    // 🔥 AGREGADO: categoria_id al destructuring
    const { titulo, descripcion, prioridad = 3, direccion, categoria_id } = data;

    if (!titulo) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }

    // 🔥 NUEVO: Validar que la categoría existe si se proporciona
    if (categoria_id) {
      const categoriaResult = await pool.query(
        `SELECT id FROM categorias_servicio WHERE id = $1 AND activo = true AND deleted_at IS NULL`,
        [categoria_id]
      );
      
      if (categoriaResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Categoría no válida" },
          { status: 400 }
        );
      }
    }

    // Validar prioridad
    const prioridadesValidas = [1, 2, 3, 4, 5];
    if (!prioridadesValidas.includes(prioridad)) {
      return NextResponse.json(
        { error: "Prioridad no válida" },
        { status: 400 }
      );
    }

    // Obtener SLA config por defecto según prioridad
    const slaResult = await pool.query(
      `SELECT id FROM sla_config WHERE prioridad = $1 AND activo = true LIMIT 1`,
      [prioridad]
    );

    const slaConfigId = slaResult.rows[0]?.id;

    // 🔥 ACTUALIZADO: Incluir categoria_id en el INSERT
    const result = await pool.query(
      `INSERT INTO servicios (
        usuario_id,
        titulo,
        descripcion,
        prioridad,
        direccion,
        categoria_id,
        sla_config_id,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SOLICITADO')
      RETURNING *`,
      [usuarioId, titulo, descripcion, prioridad, direccion, categoria_id || null, slaConfigId]
    );

    console.log("✅ Servicio creado ID:", result.rows[0].id, "para usuario:", usuarioId);
    if (categoria_id) {
      console.log("   📂 Categoría:", categoria_id);
    }
    
    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error POST servicio:", error);
    return NextResponse.json(
      { error: "Error al crear servicio" },
      { status: 500 }
    );
  }
}