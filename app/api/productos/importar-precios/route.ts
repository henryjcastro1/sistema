// app/api/productos/importar-precios/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

interface ProductoPrecio {
  sku: string;
  nuevo_precio: number;
  moneda: string;
  nombre?: string;
}

interface ProductoExistente {
  id: string;
  nombre: string;
  precio: number;
  moneda_id: string;
}

interface MonedaRow {
  id: string;
  codigo: string;
  tasa_cambio: number;
}

export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    const { productos } = await req.json();
    
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json(
        { error: "Lista de productos requerida" },
        { status: 400 }
      );
    }
    
    await client.query('BEGIN');
    
    // Obtener la moneda base
    const monedaResult = await client.query<MonedaRow>(
      `SELECT id, codigo, tasa_cambio FROM monedas WHERE es_base = true AND activo = true LIMIT 1`
    );
    
    if (monedaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "No hay moneda base configurada" },
        { status: 400 }
      );
    }
    
    const monedaBase = monedaResult.rows[0];
    const actualizados: string[] = [];
    const creados: string[] = [];
    const errores: { sku: string; error: string }[] = [];
    
    // Procesar cada producto
    for (const item of productos as ProductoPrecio[]) {
      try {
        // Validar que el producto tenga SKU
        if (!item.sku) {
          errores.push({ sku: "desconocido", error: "SKU no proporcionado" });
          continue;
        }
        
        // Verificar si el producto existe
        const productoResult = await client.query<ProductoExistente>(
          `SELECT id, nombre, precio, moneda_id FROM productos WHERE sku = $1 AND deleted_at IS NULL`,
          [item.sku]
        );
        
        // Convertir el precio a la moneda base si es necesario
        let nuevoPrecio = item.nuevo_precio;
        
        if (item.moneda && item.moneda !== monedaBase.codigo) {
          const tasaResult = await client.query<MonedaRow>(
            `SELECT tasa_cambio FROM monedas WHERE codigo = $1 AND activo = true`,
            [item.moneda]
          );
          
          if (tasaResult.rows.length > 0) {
            const tasa = tasaResult.rows[0].tasa_cambio;
            nuevoPrecio = item.nuevo_precio * tasa;
          } else {
            errores.push({ sku: item.sku, error: `Moneda no soportada: ${item.moneda}` });
            continue;
          }
        }
        
        if (productoResult.rows.length === 0) {
          // 🔥 CREAR PRODUCTO NUEVO
          const nombreProducto = item.nombre || item.sku;
          
          const insertResult = await client.query(
            `INSERT INTO productos (
              nombre, 
              sku, 
              precio, 
              stock, 
              activo, 
              moneda_id,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            RETURNING id, nombre`,
            [
              nombreProducto,
              item.sku,
              nuevoPrecio,
              0, // Stock inicial en 0
              true, // Activo por defecto
              monedaBase.id
            ]
          );
          
          creados.push(item.sku);
          console.log(`✅ Producto creado: ${item.sku} - ${nombreProducto} - ${nuevoPrecio} ${monedaBase.codigo}`);
          
        } else {
          // 🔥 ACTUALIZAR PRODUCTO EXISTENTE
          const producto = productoResult.rows[0];
          
          await client.query(
            `UPDATE productos 
             SET precio = $1, updated_at = NOW() 
             WHERE id = $2`,
            [nuevoPrecio, producto.id]
          );
          
          actualizados.push(item.sku);
          console.log(`✅ Producto actualizado: ${item.sku} - Nuevo precio: ${nuevoPrecio}`);
        }
        
      } catch (err) {
        console.error(`Error procesando SKU ${item.sku}:`, err);
        errores.push({ 
          sku: item.sku, 
          error: err instanceof Error ? err.message : "Error desconocido" 
        });
      }
    }
    
    // Registrar auditoría
    let usuarioId = null;
    try {
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;
        
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
          usuarioId = decoded.id;
        }
      }
    } catch (e) {
      console.log("Error obteniendo usuario para auditoría:", e);
    }
    
    await client.query(
      `INSERT INTO audit_logs (usuario_id, accion, tabla, datos_despues, ip)
       VALUES ($1, 'IMPORTAR_PRECIOS', 'productos', $2::jsonb, $3::inet)`,
      [
        usuarioId,
        JSON.stringify({ 
          total: productos.length, 
          actualizados: actualizados.length, 
          creados: creados.length,
          errores 
        }),
        req.headers.get('x-forwarded-for') || '0.0.0.0'
      ]
    );
    
    await client.query('COMMIT');
    
    // Construir mensaje
    let mensaje = "";
    if (actualizados.length > 0) mensaje += `${actualizados.length} actualizados, `;
    if (creados.length > 0) mensaje += `${creados.length} creados, `;
    if (errores.length > 0) mensaje += `${errores.length} errores`;
    mensaje = mensaje.replace(/,\s*$/, "");
    
    return NextResponse.json({
      success: true,
      actualizados: actualizados.length,
      creados: creados.length,
      total: productos.length,
      errores,
      message: `${mensaje}`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error importando precios:", error);
    return NextResponse.json(
      { error: "Error al importar precios" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}