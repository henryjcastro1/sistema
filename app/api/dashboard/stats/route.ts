// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
  nombre?: string;
}

// Tipos para los resultados de las consultas
interface CountResult {
  count: string;
}

interface VentaResult {
  total_ventas: string;
}

interface ServicioEstadoRow {
  estado: string;
  cantidad: string;
}

interface PedidoEstadoRow {
  estado: string;
  cantidad: string;
}

interface VentaMensualRow {
  mes: string;
  total: string;
}

interface TopProductoRow {
  nombre: string;
  cantidad_vendida: string;
  total: string;
}

interface TopServicioRow {
  titulo: string;
  cantidad_solicitada: string;
  total: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      );
    }

    // Solo admin puede ver estadísticas completas
    if (decoded.rol !== 'ADMIN' && decoded.rol !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Acceso denegado" },
        { status: 403 }
      );
    }

    // Consultas para obtener estadísticas
    const [
      usuariosResult,
      productosResult,
      serviciosResult,
      pedidosResult,
      ventasResult,
      serviciosPorEstado,
      pedidosPorEstado,
      ventasMensuales,
      topProductos,
      topServicios
    ] = await Promise.all([
      // Total usuarios
      pool.query<CountResult>(`
        SELECT COUNT(*) as count 
        FROM usuarios 
        WHERE deleted_at IS NULL
      `),
      
      // Total productos
      pool.query<CountResult>(`
        SELECT COUNT(*) as count 
        FROM productos 
        WHERE deleted_at IS NULL
      `),
      
      // Total servicios
      pool.query<CountResult>(`
        SELECT COUNT(*) as count 
        FROM servicios 
        WHERE deleted_at IS NULL
      `),
      
      // Total pedidos
      pool.query<CountResult>(`
        SELECT COUNT(*) as count 
        FROM pedidos 
        WHERE deleted_at IS NULL
      `),
      
      // 🔥 CORREGIDO: Ventas totales desde transacciones COMPLETADAS
      pool.query<VentaResult>(`
        SELECT COALESCE(SUM(monto), 0) as total_ventas 
        FROM transacciones 
        WHERE estado = 'COMPLETADO' 
          AND deleted_at IS NULL
      `),
      
      // Servicios por estado
      pool.query<ServicioEstadoRow>(`
        SELECT 
          estado, 
          COUNT(*) as cantidad 
        FROM servicios 
        WHERE deleted_at IS NULL 
        GROUP BY estado
        ORDER BY 
          CASE estado
            WHEN 'SOLICITADO' THEN 1
            WHEN 'EN_PROCESO' THEN 2
            WHEN 'COMPLETADO' THEN 3
            WHEN 'CANCELADO' THEN 4
            ELSE 5
          END
      `),
      
      // Pedidos por estado
      pool.query<PedidoEstadoRow>(`
        SELECT 
          estado, 
          COUNT(*) as cantidad 
        FROM pedidos 
        WHERE deleted_at IS NULL 
        GROUP BY estado
        ORDER BY 
          CASE estado
            WHEN 'PENDIENTE' THEN 1
            WHEN 'PAGADO' THEN 2
            WHEN 'CANCELADO' THEN 3
            ELSE 4
          END
      `),
      
      // Ventas mensuales (últimos 12 meses) - desde transacciones
      pool.query<VentaMensualRow>(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as mes,
          COALESCE(SUM(monto), 0) as total
        FROM transacciones 
        WHERE estado = 'COMPLETADO' 
          AND created_at >= NOW() - INTERVAL '12 months'
          AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY mes DESC
        LIMIT 12
      `),
      
      // Top 5 productos más vendidos (desde items_pedido)
      pool.query<TopProductoRow>(`
        SELECT 
          p.nombre,
          COUNT(ip.item_id) as cantidad_vendida,
          COALESCE(SUM(ip.cantidad * ip.precio_unitario), 0) as total
        FROM items_pedido ip
        INNER JOIN productos p ON ip.item_id = p.id
        INNER JOIN pedidos ped ON ip.pedido_id = ped.id
        WHERE ped.estado = 'PAGADO' 
          AND ped.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND ip.tipo_item = 'PRODUCTO'
        GROUP BY p.id, p.nombre
        ORDER BY cantidad_vendida DESC
        LIMIT 5
      `),
      
      // Top 5 servicios más solicitados (desde items_pedido)
      pool.query<TopServicioRow>(`
        SELECT 
          s.titulo,
          COUNT(ip.item_id) as cantidad_solicitada,
          COALESCE(SUM(ip.cantidad * ip.precio_unitario), 0) as total
        FROM items_pedido ip
        INNER JOIN servicios s ON ip.item_id = s.id
        INNER JOIN pedidos ped ON ip.pedido_id = ped.id
        WHERE ped.estado = 'PAGADO' 
          AND ped.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND ip.tipo_item = 'SERVICIO'
        GROUP BY s.id, s.titulo
        ORDER BY cantidad_solicitada DESC
        LIMIT 5
      `)
    ]);

    // Formatear ventas mensuales
    const ventasMensualesFormateadas = ventasMensuales.rows.map((row) => ({
      mes: row.mes,
      total: parseFloat(row.total)
    }));

    const stats = {
      usuarios: parseInt(usuariosResult.rows[0]?.count || '0'),
      productos: parseInt(productosResult.rows[0]?.count || '0'),
      servicios: parseInt(serviciosResult.rows[0]?.count || '0'),
      pedidos: parseInt(pedidosResult.rows[0]?.count || '0'),
      ventasTotales: parseFloat(ventasResult.rows[0]?.total_ventas || '0'),
      serviciosPorEstado: serviciosPorEstado.rows.map((row) => ({
        estado: row.estado,
        cantidad: parseInt(row.cantidad)
      })),
      pedidosPorEstado: pedidosPorEstado.rows.map((row) => ({
        estado: row.estado,
        cantidad: parseInt(row.cantidad)
      })),
      ventasMensuales: ventasMensualesFormateadas,
      topProductos: topProductos.rows.map((row) => ({
        nombre: row.nombre,
        cantidad_vendida: parseInt(row.cantidad_vendida),
        total: parseFloat(row.total)
      })),
      topServicios: topServicios.rows.map((row) => ({
        titulo: row.titulo,
        cantidad_solicitada: parseInt(row.cantidad_solicitada),
        total: parseFloat(row.total)
      }))
    };

    console.log("📊 Estadísticas cargadas correctamente");
    console.log(`   - Usuarios: ${stats.usuarios}`);
    console.log(`   - Productos: ${stats.productos}`);
    console.log(`   - Servicios: ${stats.servicios}`);
    console.log(`   - Pedidos: ${stats.pedidos}`);
    console.log(`   - Ventas totales: ${stats.ventasTotales}`);

    return NextResponse.json(stats);

  } catch (error) {
    console.error("❌ Error GET dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al cargar estadísticas" },
      { status: 500 }
    );
  }
}