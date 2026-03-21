import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/utils/currency_formatter.dart'; // 👈 Agregar para formato de moneda

class Producto {
  final String id;
  final String nombre;
  final String? descripcion;
  final double precio;
  final double? precioUsd;
  final double? precioEur;
  final int stock;
  final String? imagenUrl;
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
  final String? monedaId; // 👈 NUEVO
  final String? monedaCodigo; // 👈 NUEVO
  final String? monedaSimbolo; // 👈 NUEVO
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
    this.monedaId, // 👈 NUEVO
    this.monedaCodigo, // 👈 NUEVO
    this.monedaSimbolo, // 👈 NUEVO
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

    return Producto(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],

      // Precio principal (en moneda base)
      precio:
          safeParse<double>(
            json['precio'],
            (v) =>
                v is String ? double.tryParse(v) ?? 0 : (v as num).toDouble(),
          ) ??
          0,

      // Precio en USD
      precioUsd: safeParse<double>(
        json['precio_usd'],
        (v) => v is String ? double.tryParse(v) : (v as num?)?.toDouble(),
      ),

      // Precio en EUR
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

      // 👇 NUEVOS CAMPOS DE MONEDA
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

  // Getters útiles
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
