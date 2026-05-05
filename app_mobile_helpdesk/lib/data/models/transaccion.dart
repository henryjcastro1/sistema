import 'package:app_mobile_helpdesk/core/constants/api_endpoints.dart';

import '../../core/utils/currency_formatter.dart';
import 'package:flutter/material.dart';

class Transaccion {
  final String id;
  final String pedidoId;
  final String numeroPedido;
  final double monto;
  final double pedidoTotal;
  final String estado;
  final String tipoPago;
  final String? metodoPagoTipo;
  final String? ultimosDigitos;
  final String? titular;
  final String? comprobanteUrl;
  final String? notasCliente;
  final String? notasAdmin;
  final String? fechaVerificacion;
  final String? verificadorNombre;
  final String usuarioNombre;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Transaccion({
    required this.id,
    required this.pedidoId,
    required this.numeroPedido,
    required this.monto,
    required this.pedidoTotal,
    required this.estado,
    required this.tipoPago,
    this.metodoPagoTipo,
    this.ultimosDigitos,
    this.titular,
    this.comprobanteUrl,
    this.notasCliente,
    this.notasAdmin,
    this.fechaVerificacion,
    this.verificadorNombre,
    required this.usuarioNombre,
    required this.createdAt,
    this.updatedAt,
  });

  factory Transaccion.fromJson(Map<String, dynamic> json) {
    // Función auxiliar para convertir valores de forma segura
    double toDouble(dynamic value) {
      if (value == null) return 0;
      if (value is double) return value;
      if (value is int) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0;
      return 0;
    }

    return Transaccion(
      id: json['id']?.toString() ?? '',
      pedidoId: json['pedido_id']?.toString() ?? '',
      numeroPedido: json['numero_pedido']?.toString() ?? '',
      monto: toDouble(json['monto']),
      pedidoTotal: toDouble(json['pedido_total']),
      estado: json['estado']?.toString() ?? 'PENDIENTE',
      tipoPago: json['tipo_pago']?.toString() ?? '',
      metodoPagoTipo: json['metodo_pago_tipo']?.toString(),
      ultimosDigitos: json['ultimos_digitos']?.toString(),
      titular: json['titular']?.toString(),
      comprobanteUrl: json['comprobante_url']?.toString(),
      notasCliente: json['notas_cliente']?.toString(),
      notasAdmin: json['notas_admin']?.toString(),
      fechaVerificacion: json['fecha_verificacion']?.toString(),
      verificadorNombre: json['verificador_nombre']?.toString(),
      usuarioNombre: json['usuario_nombre']?.toString() ?? '',
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  // Getters útiles
  String get montoFormateado => CurrencyFormatter.format(monto);
  String get pedidoTotalFormateado => CurrencyFormatter.format(pedidoTotal);

  // 🔥 CORREGIDO: Getter para obtener la URL completa del comprobante usando ApiEndpoints
  String? get imagenUrlCompleta {
    if (comprobanteUrl == null || comprobanteUrl!.isEmpty) return null;

    // Usa el método getImageUrl de ApiEndpoints
    return ApiEndpoints.getImageUrl(comprobanteUrl);
  }

  // Getter para saber si tiene comprobante
  bool get tieneComprobante =>
      comprobanteUrl != null && comprobanteUrl!.isNotEmpty;

  String get estadoIcon {
    switch (estado.toUpperCase()) {
      case 'COMPLETADO':
        return '✅';
      case 'PENDIENTE':
        return '⏳';
      case 'PROCESANDO':
        return '🔄';
      case 'FALLIDO':
        return '❌';
      case 'REEMBOLSADO':
        return '💰';
      case 'RECHAZADO':
        return '❌';
      default:
        return '📋';
    }
  }

  String get estadoTexto {
    switch (estado.toUpperCase()) {
      case 'COMPLETADO':
        return 'Completado';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'PROCESANDO':
        return 'Procesando';
      case 'FALLIDO':
        return 'Fallido';
      case 'REEMBOLSADO':
        return 'Reembolsado';
      case 'RECHAZADO':
        return 'Rechazado';
      default:
        return estado;
    }
  }

  Color get estadoColor {
    switch (estado.toUpperCase()) {
      case 'COMPLETADO':
        return Colors.green;
      case 'PENDIENTE':
        return Colors.orange;
      case 'PROCESANDO':
        return Colors.blue;
      case 'FALLIDO':
        return Colors.red;
      case 'REEMBOLSADO':
        return Colors.purple;
      case 'RECHAZADO':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color get estadoBackgroundColor {
    switch (estado.toUpperCase()) {
      case 'COMPLETADO':
        return Colors.green.shade50;
      case 'PENDIENTE':
        return Colors.orange.shade50;
      case 'PROCESANDO':
        return Colors.blue.shade50;
      case 'FALLIDO':
        return Colors.red.shade50;
      case 'REEMBOLSADO':
        return Colors.purple.shade50;
      case 'RECHAZADO':
        return Colors.red.shade50;
      default:
        return Colors.grey.shade50;
    }
  }

  String get tipoPagoIcon {
    switch (tipoPago.toUpperCase()) {
      case 'TARJETA':
        return '💳';
      case 'TRANSFERENCIA':
        return '🏦';
      case 'EFECTIVO':
        return '💵';
      default:
        return '💰';
    }
  }

  bool get esCompletado => estado.toUpperCase() == 'COMPLETADO';
  bool get esPendiente => estado.toUpperCase() == 'PENDIENTE';
  bool get esProcesando => estado.toUpperCase() == 'PROCESANDO';
  bool get esRechazado => estado.toUpperCase() == 'RECHAZADO';
}
