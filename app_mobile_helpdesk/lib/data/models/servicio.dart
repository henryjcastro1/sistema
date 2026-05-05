// lib/data/models/servicio.dart
import 'package:flutter/material.dart';

class Servicio {
  final String id;
  final String usuarioId;
  final String? tecnicoId;
  final String titulo;
  final String? descripcion;
  final int prioridad;
  final String? direccion;
  final String estado;
  final String? slaConfigId;
  final String? slaNombre;
  final String? clienteNombre;
  final String? clienteEmail;
  final String? clienteTelefono;
  final String? tecnicoNombre;
  final DateTime fechaSolicitado;
  final DateTime? fechaAsignado;
  final DateTime? fechaInicio;
  final DateTime? fechaFin;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Servicio({
    required this.id,
    required this.usuarioId,
    this.tecnicoId,
    required this.titulo,
    this.descripcion,
    required this.prioridad,
    this.direccion,
    required this.estado,
    this.slaConfigId,
    this.slaNombre,
    this.clienteNombre,
    this.clienteEmail,
    this.clienteTelefono,
    this.tecnicoNombre,
    required this.fechaSolicitado,
    this.fechaAsignado,
    this.fechaInicio,
    this.fechaFin,
    this.createdAt,
    this.updatedAt,
  });

  factory Servicio.fromJson(Map<String, dynamic> json) {
    return Servicio(
      id: json['id']?.toString() ?? '',
      usuarioId: json['usuario_id']?.toString() ?? '',
      tecnicoId: json['tecnico_id']?.toString(),
      titulo: json['titulo']?.toString() ?? '',
      descripcion: json['descripcion']?.toString(),
      prioridad: json['prioridad'] ?? 3,
      direccion: json['direccion']?.toString(),
      estado: json['estado']?.toString() ?? 'SOLICITADO',
      slaConfigId: json['sla_config_id']?.toString(),
      slaNombre: json['sla_nombre']?.toString(),
      clienteNombre: json['cliente_nombre']?.toString(),
      clienteEmail: json['cliente_email']?.toString(),
      clienteTelefono: json['cliente_telefono']?.toString(),
      tecnicoNombre: json['tecnico_nombre']?.toString(),
      fechaSolicitado: DateTime.parse(json['fecha_solicitado']),
      fechaAsignado: json['fecha_asignado'] != null
          ? DateTime.parse(json['fecha_asignado'])
          : null,
      fechaInicio: json['fecha_inicio'] != null
          ? DateTime.parse(json['fecha_inicio'])
          : null,
      fechaFin: json['fecha_fin'] != null
          ? DateTime.parse(json['fecha_fin'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'titulo': titulo,
      'descripcion': descripcion,
      'prioridad': prioridad,
      'direccion': direccion,
    };
  }

  String get prioridadTexto {
    switch (prioridad) {
      case 1:
        return 'Crítica';
      case 2:
        return 'Alta';
      case 3:
        return 'Media';
      case 4:
        return 'Baja';
      case 5:
        return 'Muy Baja';
      default:
        return 'Media';
    }
  }

  Color get prioridadColor {
    switch (prioridad) {
      case 1:
        return Colors.red;
      case 2:
        return Colors.orange;
      case 3:
        return Colors.blue;
      case 4:
        return Colors.green;
      case 5:
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  String get estadoTexto {
    switch (estado) {
      case 'SOLICITADO':
        return 'Solicitado';
      case 'ASIGNADO':
        return 'Asignado';
      case 'EN_PROCESO':
        return 'En Proceso';
      case 'COMPLETADO':
        return 'Completado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estado;
    }
  }

  Color get estadoColor {
    switch (estado) {
      case 'SOLICITADO':
        return Colors.orange;
      case 'ASIGNADO':
        return Colors.blue;
      case 'EN_PROCESO':
        return Colors.purple;
      case 'COMPLETADO':
        return Colors.green;
      case 'CANCELADO':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String get estadoIcon {
    switch (estado) {
      case 'SOLICITADO':
        return '⏳';
      case 'ASIGNADO':
        return '👨‍🔧';
      case 'EN_PROCESO':
        return '🔄';
      case 'COMPLETADO':
        return '✅';
      case 'CANCELADO':
        return '❌';
      default:
        return '📋';
    }
  }
}
