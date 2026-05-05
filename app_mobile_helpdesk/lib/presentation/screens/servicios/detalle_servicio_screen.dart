// lib/presentation/screens/detalle_servicio_screen.dart
import 'package:flutter/material.dart';
import 'package:app_mobile_helpdesk/data/models/servicio.dart';

class DetalleServicioScreen extends StatelessWidget {
  final Servicio servicio;

  const DetalleServicioScreen({super.key, required this.servicio});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Detalle del Servicio',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Estado
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: servicio.estadoColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Text(
                    servicio.estadoIcon,
                    style: const TextStyle(fontSize: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estado del servicio',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Text(
                          servicio.estadoTexto,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: servicio.estadoColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Información del servicio
            _buildSection(
              title: 'Información del Servicio',
              children: [
                _buildInfoRow('Título', servicio.titulo),
                if (servicio.descripcion != null)
                  _buildInfoRow('Descripción', servicio.descripcion!),
                _buildInfoRow(
                  'Prioridad',
                  servicio.prioridadTexto,
                  color: servicio.prioridadColor,
                ),
                if (servicio.direccion != null)
                  _buildInfoRow('Dirección', servicio.direccion!),
                _buildInfoRow(
                  'Fecha solicitado',
                  _formatFullDate(servicio.fechaSolicitado),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Información del cliente
            if (servicio.clienteNombre != null)
              _buildSection(
                title: 'Cliente',
                children: [
                  _buildInfoRow('Nombre', servicio.clienteNombre!),
                  if (servicio.clienteEmail != null)
                    _buildInfoRow('Email', servicio.clienteEmail!),
                  if (servicio.clienteTelefono != null)
                    _buildInfoRow('Teléfono', servicio.clienteTelefono!),
                ],
              ),

            const SizedBox(height: 20),

            // Información del técnico
            if (servicio.tecnicoNombre != null)
              _buildSection(
                title: 'Técnico Asignado',
                children: [
                  _buildInfoRow('Técnico', servicio.tecnicoNombre!),
                  if (servicio.fechaAsignado != null)
                    _buildInfoRow(
                      'Fecha asignación',
                      _formatFullDate(servicio.fechaAsignado!),
                    ),
                ],
              ),

            const SizedBox(height: 20),

            // SLA
            if (servicio.slaNombre != null)
              _buildSection(
                title: 'SLA',
                children: [
                  _buildInfoRow('Nivel de Servicio', servicio.slaNombre!),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: color ?? Colors.black87,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  String _formatFullDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
