import 'package:flutter/material.dart';
import '../../core/utils/currency_formatter.dart';

class ItemPedido {
  final String id;
  final String tipoItem;
  final String itemId;
  final String descripcion;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final Map<String, dynamic>? producto;

  ItemPedido({
    required this.id,
    required this.tipoItem,
    required this.itemId,
    required this.descripcion,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    this.producto,
  });

  factory ItemPedido.fromJson(Map<String, dynamic> json) {
    // Función auxiliar para convertir valores de forma segura
    double toDouble(dynamic value) {
      if (value == null) return 0;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    int toInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      return 0;
    }

    return ItemPedido(
      id: json['id']?.toString() ?? '',
      tipoItem: json['tipo_item']?.toString() ?? '',
      itemId: json['item_id']?.toString() ?? '',
      descripcion: json['descripcion']?.toString() ?? '',
      cantidad: toInt(json['cantidad']),
      precioUnitario: toDouble(json['precio_unitario']),
      subtotal: toDouble(json['subtotal']),
      producto: json['producto'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tipo_item': tipoItem,
      'item_id': itemId,
      'descripcion': descripcion,
      'cantidad': cantidad,
      'precio_unitario': precioUnitario,
    };
  }

  // Getters útiles
  String get precioUnitarioFormateado =>
      CurrencyFormatter.format(precioUnitario);
  String get subtotalFormateado => CurrencyFormatter.format(subtotal);
}

class Pedido {
  final String id;
  final String numeroPedido;
  final String estado;
  final double subtotal;
  final double impuesto;
  final double descuento;
  final double costoEnvio;
  final double totalFinal;

  // Nuevos campos
  final String? monedaCodigo;
  final String? monedaSimbolo;
  final String? direccionEnvio;
  final String clienteNombre;
  final String clienteEmail;
  final String? clienteTelefono;

  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<ItemPedido> items;

  Pedido({
    required this.id,
    required this.numeroPedido,
    required this.estado,
    required this.subtotal,
    required this.impuesto,
    required this.descuento,
    required this.costoEnvio,
    required this.totalFinal,
    this.monedaCodigo,
    this.monedaSimbolo,
    this.direccionEnvio,
    required this.clienteNombre,
    required this.clienteEmail,
    this.clienteTelefono,
    required this.createdAt,
    this.updatedAt,
    required this.items,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    // Función auxiliar para convertir valores de forma segura
    double toDouble(dynamic value) {
      if (value == null) return 0;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    return Pedido(
      id: json['id']?.toString() ?? '',
      numeroPedido: json['numero_pedido']?.toString() ?? '',
      estado: json['estado']?.toString() ?? 'PENDIENTE',
      subtotal: toDouble(json['subtotal']),
      impuesto: toDouble(json['impuesto']),
      descuento: toDouble(json['descuento']),
      costoEnvio: toDouble(json['costo_envio']),
      totalFinal: toDouble(json['total_final']),
      monedaCodigo: json['moneda_codigo']?.toString(),
      monedaSimbolo: json['moneda_simbolo']?.toString(),
      direccionEnvio: json['cliente_direccion']?.toString(),
      clienteNombre: json['cliente_nombre']?.toString() ?? '',
      clienteEmail: json['cliente_email']?.toString() ?? '',
      clienteTelefono: json['cliente_telefono']?.toString(),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      items:
          (json['items'] as List?)
              ?.map((i) => ItemPedido.fromJson(i))
              .toList() ??
          [],
    );
  }

  // =====================================================
  // GETTERS ÚTILES
  // =====================================================

  // Total formateado con la moneda correcta
  String get totalFormateado {
    return CurrencyFormatter.format(
      totalFinal,
      currencyCode: monedaCodigo ?? 'COP',
      symbol: monedaSimbolo,
    );
  }

  String get subtotalFormateado => CurrencyFormatter.format(subtotal);
  String get impuestoFormateado => CurrencyFormatter.format(impuesto);
  String get descuentoFormateado => CurrencyFormatter.format(descuento);
  String get costoEnvioFormateado => CurrencyFormatter.format(costoEnvio);

  // Icono según estado
  String get estadoIcon {
    switch (estado) {
      case 'PENDIENTE':
        return '⏳';
      case 'PAGADO':
        return '💰';
      case 'ENVIADO':
        return '📦';
      case 'ENTREGADO':
        return '✅';
      case 'CANCELADO':
        return '❌';
      default:
        return '📋';
    }
  }

  // Color según estado
  Color get estadoColor {
    switch (estado) {
      case 'PENDIENTE':
        return Colors.orange;
      case 'PAGADO':
        return Colors.blue;
      case 'ENVIADO':
        return Colors.purple;
      case 'ENTREGADO':
        return Colors.green;
      case 'CANCELADO':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  // Color de fondo según estado
  Color get estadoBackgroundColor {
    switch (estado) {
      case 'PENDIENTE':
        return Colors.orange.shade50;
      case 'PAGADO':
        return Colors.blue.shade50;
      case 'ENVIADO':
        return Colors.purple.shade50;
      case 'ENTREGADO':
        return Colors.green.shade50;
      case 'CANCELADO':
        return Colors.red.shade50;
      default:
        return Colors.grey.shade50;
    }
  }

  // Texto legible del estado
  String get estadoTexto {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'PAGADO':
        return 'Pagado';
      case 'ENVIADO':
        return 'Enviado';
      case 'ENTREGADO':
        return 'Entregado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  // Resumen de items (para mostrar en la tarjeta)
  String get itemsResumen {
    if (items.isEmpty) return 'Sin items';
    return items
        .map((item) => '${item.cantidad}x ${item.descripcion}')
        .join(', ');
  }

  // Cantidad de items
  int get itemsCount => items.length;

  // Verificar si el pedido puede ser cancelado
  bool get puedeCancelar {
    return estado == 'PENDIENTE' || estado == 'PAGADO';
  }

  // Verificar si el pedido está en proceso
  bool get estaEnProceso {
    return estado == 'PAGADO' || estado == 'ENVIADO';
  }

  // Verificar si el pedido está completado
  bool get estaCompletado {
    return estado == 'ENTREGADO';
  }

  // Verificar si el pedido está cancelado
  bool get estaCancelado {
    return estado == 'CANCELADO';
  }
}
