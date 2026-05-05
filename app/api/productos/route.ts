// app/api/productos/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/bd";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

interface TokenPayload {
  id: string;
  email: string;
  rol: string;
}

interface ProductoInput {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  imagenes_adicionales?: string[];
  categoria_id?: string;
  subcategoria_id?: string;
  sku?: string;
  codigo_barras?: string;
  marca?: string;
  modelo?: string;
  garantia_meses?: number;
  peso_kg?: number;
  dimensiones?: {
    largo: number;
    ancho: number;
    alto: number;
  };
  destacado?: boolean;
}

// 🔥 FUNCIÓN MEJORADA PARA GUARDAR IMÁGENES
async function guardarImagen(data: string | File, nombre: string, index: number): Promise<string | null> {
  try {
let buffer: Buffer | null = null;
let extension: string = '';

if (data instanceof File) {
  extension = data.name.split('.').pop() || 'jpg';
  const bytes = await data.arrayBuffer();
  buffer = Buffer.from(bytes);
}
else if (typeof data === 'string' && data.startsWith('data:image')) {
  const matches = data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return null;

  extension = matches[1];
  buffer = Buffer.from(matches[2], 'base64');
}
else if (
  typeof data === 'string' &&
  (data.startsWith('http') || data.startsWith('/uploads'))
) {
  if (data.includes('undefined')) {
    console.error('❌ URL inválida detectada:', data);
    return null;
  }

  return data;
}
else {
  // 🔥 ESTA LÍNEA ARREGLA TODO
  console.error('❌ Formato de imagen no soportado');
  return null;
}

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const filename = `${nombre}_${timestamp}_${random}.${extension}`;
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log(`📁 Directorio creado: ${uploadDir}`);
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    const imageUrl = `/uploads/products/${filename}`;
    console.log(`✅ Imagen guardada: ${imageUrl}`);
    
    return imageUrl;
  } catch (error) {
    console.error("❌ Error guardando imagen:", error);
    return null;
  }
}

async function obtenerTasaCambio(monedaDestino: string, monedaOrigen: string): Promise<number> {
  if (monedaDestino === monedaOrigen) return 1;
  
  const tasas: Record<string, Record<string, number>> = {
    'COP': { 'USD': 4000, 'EUR': 4400 },
    'USD': { 'COP': 0.00025, 'EUR': 0.92 },
    'EUR': { 'COP': 0.00023, 'USD': 1.09 }
  };
  
  const tasa = tasas[monedaOrigen]?.[monedaDestino];
  if (!tasa) {
    console.warn(`⚠️ Tasa de cambio no encontrada para ${monedaOrigen} -> ${monedaDestino}. Usando 1.`);
    return 1;
  }
  
  return tasa;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        p.descripcion,
        p.precio,
        p.precio_usd,
        p.precio_eur,
        p.stock,
        p.imagen_url,
        p.activo,
        p.destacado,
        p.marca,
        p.modelo,
        p.sku,
        p.codigo_barras,
        p.garantia_meses,
        p.peso_kg,
        p.dimensiones,
        p.categoria_id,
        p.subcategoria_id,
        p.moneda_id,
        m.codigo as moneda_codigo,
        m.simbolo as moneda_simbolo,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre,
        p.created_at,
        p.updated_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'imagen_url', pi.imagen_url,
              'orden', pi.orden,
              'es_principal', pi.es_principal
            ) ORDER BY pi.orden
          )
          FROM productos_imagenes pi 
          WHERE pi.producto_id = p.id AND pi.activo = true AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN monedas m ON p.moneda_id = m.id
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id AND sc.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("Error GET productos:", error);
    return NextResponse.json(
      { error: "Error obteniendo productos" },
      { status: 500 }
    );
  }
}

// app/api/productos/route.ts - Modifica la sección del POST

export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const contentType = req.headers.get('content-type') || '';
    let body: ProductoInput;
    const imagenesAdicionalesFiles: File[] = [];
    let imagenPrincipalBase64: string | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      // Obtener imagen principal (puede ser File o Base64 string)
      const imagenPrincipal = formData.get('imagen_url');
      if (imagenPrincipal && imagenPrincipal instanceof File && imagenPrincipal.size > 0) {
        imagenesAdicionalesFiles.push(imagenPrincipal);
      } else if (imagenPrincipal && typeof imagenPrincipal === 'string' && imagenPrincipal.startsWith('data:image')) {
        imagenPrincipalBase64 = imagenPrincipal;
      }
      
      body = {
        nombre: formData.get('nombre') as string,
        descripcion: formData.get('descripcion') as string,
        precio: parseFloat(formData.get('precio') as string),
        stock: parseInt(formData.get('stock') as string),
        imagen_url: imagenPrincipalBase64 || undefined, // ✅ CORREGIDO: convertir null a undefined
        categoria_id: formData.get('categoria_id') as string,
        subcategoria_id: formData.get('subcategoria_id') as string,
        sku: formData.get('sku') as string,
        codigo_barras: formData.get('codigo_barras') as string,
        marca: formData.get('marca') as string,
        modelo: formData.get('modelo') as string,
        garantia_meses: parseInt(formData.get('garantia_meses') as string),
        peso_kg: parseFloat(formData.get('peso_kg') as string),
        destacado: formData.get('destacado') === 'true',
      };
      
      // Obtener imágenes adicionales
      const imagenes = formData.getAll('imagenes_adicionales');
      for (const img of imagenes) {
        if (img instanceof File && img.size > 0) {
          imagenesAdicionalesFiles.push(img);
        }
      }
    } else {
      body = await req.json();
    }
    
    const { 
      nombre, 
      descripcion, 
      precio, 
      stock, 
      categoria_id,
      subcategoria_id,
      sku,
      codigo_barras,
      marca,
      modelo,
      garantia_meses,
      peso_kg,
      dimensiones,
      destacado
    } = body;

    // Validaciones básicas
    if (!nombre || precio === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Nombre, precio y stock son obligatorios" },
        { status: 400 }
      );
    }

    if (precio < 0) {
      return NextResponse.json(
        { error: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: "El stock no puede ser negativo" },
        { status: 400 }
      );
    }

    if (sku) {
      const skuExists = await client.query(
        `SELECT id FROM productos WHERE sku = $1 AND deleted_at IS NULL`,
        [sku]
      );
      if (skuExists.rows.length > 0) {
        return NextResponse.json(
          { error: "El SKU ya está registrado" },
          { status: 409 }
        );
      }
    }

    const monedaResult = await client.query(
      `SELECT id, codigo, tasa_cambio 
       FROM monedas 
       WHERE es_base = true AND activo = true AND deleted_at IS NULL 
       LIMIT 1`
    );

    if (monedaResult.rows.length === 0) {
      throw new Error("No hay una moneda base configurada");
    }

    const monedaBase = monedaResult.rows[0];
    console.log(`💰 Moneda base: ${monedaBase.codigo}`);

    let precioEnUSD: number;
    let precioEnEUR: number;
    
    try {
      precioEnUSD = monedaBase.codigo === 'USD' 
        ? precio 
        : precio / await obtenerTasaCambio('USD', monedaBase.codigo);
      
      precioEnEUR = monedaBase.codigo === 'EUR' 
        ? precio 
        : precio / await obtenerTasaCambio('EUR', monedaBase.codigo);
    } catch (convError) {
      console.error("❌ Error en conversión de moneda:", convError);
      precioEnUSD = monedaBase.codigo === 'USD' ? precio : 0;
      precioEnEUR = monedaBase.codigo === 'EUR' ? precio : 0;
    }

    // Guardar imagen principal
    let imagenPrincipalPath: string | null = null;
    
    // Primero intentar con el archivo
    if (imagenesAdicionalesFiles.length > 0) {
      const primeraImagen = imagenesAdicionalesFiles[0];
      imagenPrincipalPath = await guardarImagen(primeraImagen, `producto_principal`, 0);
      // Remover la primera imagen de adicionales si se usó como principal
      imagenesAdicionalesFiles.shift();
    }
    // Si no hay archivo, intentar con Base64
    else if (imagenPrincipalBase64) {
      imagenPrincipalPath = await guardarImagen(imagenPrincipalBase64, `producto_principal`, 0);
    }

    const result = await client.query(
      `INSERT INTO productos (
        nombre, descripcion, precio, stock, imagen_url,
        categoria_id, subcategoria_id, sku, codigo_barras,
        marca, modelo, garantia_meses, peso_kg, dimensiones, destacado,
        moneda_id, precio_usd, precio_eur
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        nombre,
        descripcion || null,
        precio,
        stock,
imagenPrincipalPath && !imagenPrincipalPath.includes('undefined')
  ? imagenPrincipalPath
  : null,        categoria_id || null,
        subcategoria_id || null,
        sku || null,
        codigo_barras || null,
        marca || null,
        modelo || null,
        garantia_meses || null,
        peso_kg || null,
        dimensiones || null,
        destacado || false,
        monedaBase.id,
        precioEnUSD,
        precioEnEUR
      ]
    );

    const newProducto = result.rows[0];

    // Guardar imágenes adicionales
    if (imagenesAdicionalesFiles.length > 0) {
      for (let i = 0; i < imagenesAdicionalesFiles.length; i++) {
        const imagen = imagenesAdicionalesFiles[i];
        const imagenPath = await guardarImagen(imagen, `producto_${newProducto.id}`, i);
        
        if (imagenPath) {
          await client.query(
            `INSERT INTO productos_imagenes (producto_id, imagen_url, orden, es_principal, activo)
             VALUES ($1, $2, $3, $4, true)`,
            [newProducto.id, imagenPath, i, false]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Obtener producto completo
    const productoCompleto = await client.query(`
      SELECT 
        p.*,
        m.codigo as moneda_codigo,
        m.simbolo as moneda_simbolo,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'imagen_url', pi.imagen_url,
              'orden', pi.orden,
              'es_principal', pi.es_principal
            ) ORDER BY pi.orden
          )
          FROM productos_imagenes pi 
          WHERE pi.producto_id = p.id AND pi.activo = true AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN monedas m ON p.moneda_id = m.id
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id
      WHERE p.id = $1
    `, [newProducto.id]);

    return NextResponse.json({
      success: true,
      message: "Producto creado exitosamente",
      producto: productoCompleto.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error POST productos:", error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "El SKU ya está registrado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error creando producto" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(req: Request) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const contentType = req.headers.get('content-type') || '';
    let body: ProductoInput;
    // ✅ CORREGIDO: cambiar let por const
    const imagenesAdicionalesFiles: File[] = [];
    const imagenesAEliminar: string[] = [];
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        id: formData.get('id') as string,
        nombre: formData.get('nombre') as string,
        descripcion: formData.get('descripcion') as string,
        precio: parseFloat(formData.get('precio') as string),
        stock: parseInt(formData.get('stock') as string),
        imagen_url: formData.get('imagen_url') as string,
        categoria_id: formData.get('categoria_id') as string,
        subcategoria_id: formData.get('subcategoria_id') as string,
        sku: formData.get('sku') as string,
        codigo_barras: formData.get('codigo_barras') as string,
        marca: formData.get('marca') as string,
        modelo: formData.get('modelo') as string,
        garantia_meses: parseInt(formData.get('garantia_meses') as string),
        peso_kg: parseFloat(formData.get('peso_kg') as string),
        destacado: formData.get('destacado') === 'true',
      };
      
      const imagenes = formData.getAll('imagenes_adicionales');
      for (const img of imagenes) {
        if (img instanceof File && img.size > 0) {
          imagenesAdicionalesFiles.push(img);
        }
      }
      
      const eliminar = formData.getAll('eliminar_imagenes');
      for (const id of eliminar) {
        if (typeof id === 'string' && id) {
          imagenesAEliminar.push(id);
        }
      }
    } else {
      body = await req.json();
    }
    
    const { 
      id,
      nombre, 
      descripcion, 
      precio, 
      stock, 
      imagen_url,
      categoria_id,
      subcategoria_id,
      sku,
      codigo_barras,
      marca,
      modelo,
      garantia_meses,
      peso_kg,
      dimensiones,
      destacado
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto es requerido" },
        { status: 400 }
      );
    }

    const productoExistente = await client.query(
      `SELECT * FROM productos WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (productoExistente.rows.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    if (!nombre || precio === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "Nombre, precio y stock son obligatorios" },
        { status: 400 }
      );
    }

    if (precio < 0) {
      return NextResponse.json(
        { error: "El precio no puede ser negativo" },
        { status: 400 }
      );
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: "El stock no puede ser negativo" },
        { status: 400 }
      );
    }

    const skuToUpdate = sku && sku.trim() !== '' ? sku.trim() : null;

    if (skuToUpdate) {
      const skuExists = await client.query(
        `SELECT id FROM productos WHERE sku = $1 AND id != $2 AND deleted_at IS NULL`,
        [skuToUpdate, id]
      );
      if (skuExists.rows.length > 0) {
        return NextResponse.json(
          { error: "El SKU ya está registrado" },
          { status: 409 }
        );
      }
    }

    const monedaResult = await client.query(
      `SELECT id, codigo, tasa_cambio 
       FROM monedas 
       WHERE es_base = true AND activo = true AND deleted_at IS NULL 
       LIMIT 1`
    );

    if (monedaResult.rows.length === 0) {
      throw new Error("No hay una moneda base configurada");
    }

    const monedaBase = monedaResult.rows[0];

    let precioEnUSD: number;
    let precioEnEUR: number;
    
    try {
      precioEnUSD = monedaBase.codigo === 'USD' 
        ? precio 
        : precio / await obtenerTasaCambio('USD', monedaBase.codigo);
      
      precioEnEUR = monedaBase.codigo === 'EUR' 
        ? precio 
        : precio / await obtenerTasaCambio('EUR', monedaBase.codigo);
    } catch (convError) {
      console.error("❌ Error en conversión de moneda:", convError);
      precioEnUSD = monedaBase.codigo === 'USD' ? precio : 0;
      precioEnEUR = monedaBase.codigo === 'EUR' ? precio : 0;
    }

    let imagenPrincipalPath: string | null = null;
    if (imagen_url && imagen_url.startsWith('data:image')) {
      imagenPrincipalPath = await guardarImagen(imagen_url, `producto_principal_${Date.now()}`, 0);
    } else if (imagen_url && !imagen_url.startsWith('data:image')) {
      imagenPrincipalPath = imagen_url;
    } else if (imagen_url === '') {
      imagenPrincipalPath = null;
    } else {
      imagenPrincipalPath = productoExistente.rows[0].imagen_url;
    }

    const result = await client.query(
      `UPDATE productos 
       SET 
        nombre = $1,
        descripcion = $2,
        precio = $3,
        stock = $4,
        imagen_url = $5,
        categoria_id = $6,
        subcategoria_id = $7,
        sku = $8,
        codigo_barras = $9,
        marca = $10,
        modelo = $11,
        garantia_meses = $12,
        peso_kg = $13,
        dimensiones = $14,
        destacado = $15,
        precio_usd = $16,
        precio_eur = $17,
        moneda_id = $18,
        updated_at = NOW()
       WHERE id = $19 AND deleted_at IS NULL
       RETURNING *`,
      [
        nombre,
        descripcion || null,
        precio,
        stock,
imagenPrincipalPath && !imagenPrincipalPath.includes('undefined')
  ? imagenPrincipalPath
  : null,        categoria_id || null,
        subcategoria_id || null,
        skuToUpdate,
        codigo_barras || null,
        marca || null,
        modelo || null,
        garantia_meses || null,
        peso_kg || null,
        dimensiones || null,
        destacado || false,
        precioEnUSD,
        precioEnEUR,
        monedaBase.id,
        id
      ]
    );

    const productoActualizado = result.rows[0];

    if (imagenesAEliminar.length > 0) {
      await client.query(
        `UPDATE productos_imagenes 
         SET deleted_at = NOW(), activo = false 
         WHERE id = ANY($1::int[]) AND producto_id = $2`,
        [imagenesAEliminar.map(Number), id]
      );
    }

    if (imagenesAdicionalesFiles.length > 0) {
      const ordenActual = await client.query(
        `SELECT COALESCE(MAX(orden), -1) as max_orden FROM productos_imagenes WHERE producto_id = $1 AND deleted_at IS NULL`,
        [id]
      );
      // ✅ CORREGIDO: usar const en lugar de let
      const startOrden = (ordenActual.rows[0].max_orden || -1) + 1;
      
      for (let i = 0; i < imagenesAdicionalesFiles.length; i++) {
        const imagen = imagenesAdicionalesFiles[i];
        const imagenPath = await guardarImagen(imagen, `producto_${id}`, startOrden + i);
        
        if (imagenPath) {
          await client.query(
            `INSERT INTO productos_imagenes (producto_id, imagen_url, orden, es_principal, activo)
             VALUES ($1, $2, $3, $4, true)`,
            [id, imagenPath, startOrden + i, false]
          );
        }
      }
    }

    const cookieHeader = req.headers.get('cookie');
    let usuarioActualizadorId = null;
    
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
          usuarioActualizadorId = decoded.id;
        } catch (e) {
          console.log("Token inválido al actualizar producto");
        }
      }
    }

    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    await client.query(
      `INSERT INTO audit_logs 
        (usuario_id, accion, tabla, registro_id, datos_despues, ip, user_agent)
       VALUES ($1, 'ACTUALIZAR', 'productos', $2, $3::jsonb, $4::inet, $5)`,
      [
        usuarioActualizadorId,
        productoActualizado.id,
        JSON.stringify(productoActualizado),
        ip,
        userAgent
      ]
    );

    await client.query('COMMIT');

    const productoCompleto = await client.query(`
      SELECT 
        p.*,
        m.codigo as moneda_codigo,
        m.simbolo as moneda_simbolo,
        c.nombre as categoria_nombre,
        sc.nombre as subcategoria_nombre,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'imagen_url', pi.imagen_url,
              'orden', pi.orden,
              'es_principal', pi.es_principal
            ) ORDER BY pi.orden
          )
          FROM productos_imagenes pi 
          WHERE pi.producto_id = p.id AND pi.activo = true AND pi.deleted_at IS NULL
        ), '[]'::json) as imagenes_adicionales
      FROM productos p
      LEFT JOIN monedas m ON p.moneda_id = m.id
      LEFT JOIN categorias_producto c ON p.categoria_id = c.id
      LEFT JOIN subcategorias_producto sc ON p.subcategoria_id = sc.id
      WHERE p.id = $1
    `, [productoActualizado.id]);

    return NextResponse.json({
      success: true,
      message: "Producto actualizado exitosamente",
      producto: productoCompleto.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error PUT producto:", error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "El SKU ya está registrado" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error actualizando producto" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const imagenId = searchParams.get('imagenId');
    const productoId = searchParams.get('productoId');

    if (!imagenId || !productoId) {
      return NextResponse.json(
        { error: "Se requiere imagenId y productoId" },
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE productos_imagenes 
       SET deleted_at = NOW(), activo = false 
       WHERE id = $1 AND producto_id = $2`,
      [imagenId, productoId]
    );

    return NextResponse.json({
      success: true,
      message: "Imagen eliminada correctamente"
    });

  } catch (error) {
    console.error("Error DELETE imagen:", error);
    return NextResponse.json(
      { error: "Error eliminando imagen" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}