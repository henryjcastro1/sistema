import 'package:flutter/material.dart';
import '../../core/utils/currency_formatter.dart';

// 🔥 NUEVA CLASE: Para imágenes adicionales
class ProductoImagen {
  final int id;
  final String imagenUrl;
  final int orden;
  final bool esPrincipal;

  ProductoImagen({
    required this.id,
    required this.imagenUrl,
    required this.orden,
    required this.esPrincipal,
  });

  factory ProductoImagen.fromJson(Map<String, dynamic> json) {
    return ProductoImagen(
      id: json['id'] ?? 0,
      imagenUrl: json['imagen_url'] ?? '',
      orden: json['orden'] ?? 0,
      esPrincipal: json['es_principal'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imagen_url': imagenUrl,
      'orden': orden,
      'es_principal': esPrincipal,
    };
  }
}

class Producto {
  final String id;
  final String nombre;
  final String? descripcion;
  final double precio;
  final double? precioUsd;
  final double? precioEur;
  final int stock;
  final String? imagenUrl;
  final List<ProductoImagen>? imagenesAdicionales; // 🔥 NUEVO CAMPO
  final bool activo;
  final bool destacado;
  final String? marca;
  final String? modelo;
  final String? sku;
  final String? codigoBarras;
  final int? garantiaMeses;
  final double? pesoKg;
  final Map<String, dynamic>? dimensiones;
  final String? categoriaId;
  final String? subcategoriaId;
  final String? categoriaNombre;
  final String? subcategoriaNombre;
  final String? monedaId;
  final String? monedaCodigo;
  final String? monedaSimbolo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Producto({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.precio,
    this.precioUsd,
    this.precioEur,
    required this.stock,
    this.imagenUrl,
    this.imagenesAdicionales, // 🔥 NUEVO PARÁMETRO
    required this.activo,
    required this.destacado,
    this.marca,
    this.modelo,
    this.sku,
    this.codigoBarras,
    this.garantiaMeses,
    this.pesoKg,
    this.dimensiones,
    this.categoriaId,
    this.subcategoriaId,
    this.categoriaNombre,
    this.subcategoriaNombre,
    this.monedaId,
    this.monedaCodigo,
    this.monedaSimbolo,
    this.createdAt,
    this.updatedAt,
  });

  // Constructor desde JSON (para recibir datos de la API)
  factory Producto.fromJson(Map<String, dynamic> json) {
    // Función auxiliar para convertir valores de forma segura
    T? safeParse<T>(dynamic value, T? Function(dynamic) parser) {
      if (value == null) return null;
      try {
        return parser(value);
      } catch (e) {
        print('⚠️ Error parseando valor: $value - $e');
        return null;
      }
    }

    // 🔥 PROCESAR IMÁGENES ADICIONALES
    List<ProductoImagen>? imagenesAdicionales;
    if (json['imagenes_adicionales'] != null &&
        json['imagenes_adicionales'] is List) {
      imagenesAdicionales = (json['imagenes_adicionales'] as List)
          .map((img) => ProductoImagen.fromJson(img))
          .toList();
    }

    return Producto(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      precio:
          safeParse<double>(
            json['precio'],
            (v) =>
                v is String ? double.tryParse(v) ?? 0 : (v as num).toDouble(),
          ) ??
          0,
      precioUsd: safeParse<double>(
        json['precio_usd'],
        (v) => v is String ? double.tryParse(v) : (v as num?)?.toDouble(),
      ),
      precioEur: safeParse<double>(
        json['precio_eur'],
        (v) => v is String ? double.tryParse(v) : (v as num?)?.toDouble(),
      ),
      stock:
          safeParse<int>(
            json['stock'],
            (v) => v is String ? int.tryParse(v) : v as int?,
          ) ??
          0,
      imagenUrl: json['imagen_url'],
      imagenesAdicionales: imagenesAdicionales, // 🔥 NUEVO
      activo: json['activo'] ?? true,
      destacado: json['destacado'] ?? false,
      marca: json['marca'],
      modelo: json['modelo'],
      sku: json['sku'],
      codigoBarras: json['codigo_barras'],
      garantiaMeses: safeParse<int>(
        json['garantia_meses'],
        (v) => v is String ? int.tryParse(v) : v as int?,
      ),
      pesoKg: safeParse<double>(
        json['peso_kg'],
        (v) => v is String ? double.tryParse(v) : (v as num?)?.toDouble(),
      ),
      dimensiones: json['dimensiones'],
      categoriaId: json['categoria_id'],
      subcategoriaId: json['subcategoria_id'],
      categoriaNombre: json['categoria_nombre'],
      subcategoriaNombre: json['subcategoria_nombre'],
      monedaId: json['moneda_id'],
      monedaCodigo: json['moneda_codigo'],
      monedaSimbolo: json['moneda_simbolo'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  // Convertir a JSON (para enviar datos a la API)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'precio': precio,
      'precio_usd': precioUsd,
      'precio_eur': precioEur,
      'stock': stock,
      'imagen_url': imagenUrl,
      'imagenes_adicionales': imagenesAdicionales
          ?.map((img) => img.toJson())
          .toList(),
      'activo': activo,
      'destacado': destacado,
      'marca': marca,
      'modelo': modelo,
      'sku': sku,
      'codigo_barras': codigoBarras,
      'garantia_meses': garantiaMeses,
      'peso_kg': pesoKg,
      'dimensiones': dimensiones,
      'categoria_id': categoriaId,
      'subcategoria_id': subcategoriaId,
      'moneda_id': monedaId,
      'moneda_codigo': monedaCodigo,
      'moneda_simbolo': monedaSimbolo,
    };
  }

  // 🔥 GETTERS PARA IMÁGENES
  List<String> get todasLasImagenes {
    final List<String> imagenes = [];

    if (imagenUrl != null && imagenUrl!.isNotEmpty) {
      imagenes.add(imagenUrl!);
    }

    if (imagenesAdicionales != null) {
      for (final img in imagenesAdicionales!) {
        if (img.imagenUrl.isNotEmpty) {
          imagenes.add(img.imagenUrl);
        }
      }
    }

    return imagenes;
  }

  String get primeraImagen {
    if (imagenUrl != null && imagenUrl!.isNotEmpty) return imagenUrl!;
    if (imagenesAdicionales != null && imagenesAdicionales!.isNotEmpty) {
      return imagenesAdicionales!.first.imagenUrl;
    }
    return '';
  }

  int get cantidadImagenes => todasLasImagenes.length;

  // Getters existentes
  String get precioFormateado {
    return CurrencyFormatter.format(
      precio,
      currencyCode: monedaCodigo ?? 'COP',
      symbol: monedaSimbolo,
    );
  }

  String get precioUsdFormateado {
    if (precioUsd != null) {
      return CurrencyFormatter.format(
        precioUsd!,
        currencyCode: 'USD',
        symbol: '\$',
      );
    }
    return 'N/A';
  }

  String get precioEurFormateado {
    if (precioEur != null) {
      return CurrencyFormatter.format(
        precioEur!,
        currencyCode: 'EUR',
        symbol: '€',
      );
    }
    return 'N/A';
  }

  String get nombreCompleto {
    if (marca != null && modelo != null) {
      return '$marca $modelo - $nombre';
    } else if (marca != null) {
      return '$marca - $nombre';
    } else if (modelo != null) {
      return '$modelo - $nombre';
    }
    return nombre;
  }

  bool get tieneStock => stock > 0;

  String get estadoStock {
    if (stock > 10) return 'Disponible';
    if (stock > 0) return 'Últimas unidades';
    return 'Agotado';
  }

  Color get stockColor {
    if (stock > 10) return Colors.green;
    if (stock > 0) return Colors.orange;
    return Colors.red;
  }
}
