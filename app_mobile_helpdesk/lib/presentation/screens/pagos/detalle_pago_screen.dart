import 'package:app_mobile_helpdesk/presentation/widgets/comprobante_dialog.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../data/models/transaccion.dart';

class DetallePagoScreen extends StatelessWidget {
  final Transaccion transaccion;

  const DetallePagoScreen({super.key, required this.transaccion});

  void _mostrarComprobante(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => ComprobanteDialog(transaccion: transaccion),
    );
  }

  Future<void> _abrirUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      throw 'No se pudo abrir la URL: $url';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Detalle de Pago',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          // Botón para compartir como PDF
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _mostrarComprobante(context),
            tooltip: 'Compartir comprobante',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Estado
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: transaccion.estadoBackgroundColor,
              child: Row(
                children: [
                  Text(
                    transaccion.estadoIcon,
                    style: const TextStyle(fontSize: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Estado del pago',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                        Text(
                          transaccion.estadoTexto,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: transaccion.estadoColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Información del pedido
                  _buildSection(
                    title: 'Información del pedido',
                    children: [
                      _buildInfoRow(
                        'Número de pedido',
                        transaccion.numeroPedido,
                      ),
                      _buildInfoRow('Cliente', transaccion.usuarioNombre),
                      _buildInfoRow(
                        'Fecha',
                        _formatFullDate(transaccion.createdAt),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Detalles del pago
                  _buildSection(
                    title: 'Detalles del pago',
                    children: [
                      _buildInfoRow(
                        'Monto',
                        transaccion.montoFormateado,
                        isHighlight: true,
                      ),
                      _buildInfoRow('Método de pago', transaccion.tipoPago),
                      if (transaccion.metodoPagoTipo != null)
                        _buildInfoRow(
                          'Tarjeta',
                          '${transaccion.metodoPagoTipo} **** ${transaccion.ultimosDigitos ?? ''}',
                        ),
                      if (transaccion.titular != null)
                        _buildInfoRow('Titular', transaccion.titular!),
                      if (transaccion.notasCliente != null &&
                          transaccion.notasCliente!.isNotEmpty)
                        _buildInfoRow(
                          'Notas del cliente',
                          transaccion.notasCliente!,
                        ),
                    ],
                  ),

                  // Información de verificación (si aplica)
                  if (transaccion.esCompletado || transaccion.esRechazado) ...[
                    const SizedBox(height: 24),
                    _buildSection(
                      title: 'Verificación',
                      children: [
                        if (transaccion.fechaVerificacion != null)
                          _buildInfoRow(
                            'Fecha de verificación',
                            _formatFullDateFromString(
                              transaccion.fechaVerificacion!,
                            ),
                          ),
                        if (transaccion.verificadorNombre != null)
                          _buildInfoRow(
                            'Verificado por',
                            transaccion.verificadorNombre!,
                          ),
                        if (transaccion.notasAdmin != null &&
                            transaccion.notasAdmin!.isNotEmpty)
                          _buildInfoRow(
                            'Notas del administrador',
                            transaccion.notasAdmin!,
                          ),
                      ],
                    ),
                  ],

                  // Comprobante - Versión mejorada con más opciones
                  if (transaccion.comprobanteUrl != null) ...[
                    const SizedBox(height: 24),
                    _buildSection(
                      title: 'Comprobante',
                      children: [
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _mostrarComprobante(context),
                                icon: const Icon(Icons.visibility),
                                label: const Text('Ver comprobante'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _mostrarComprobante(context),
                                icon: const Icon(Icons.picture_as_pdf),
                                label: const Text('Compartir PDF'),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Vista previa de la imagen (opcional)
                        GestureDetector(
                          onTap: () => _mostrarComprobante(context),
                          child: Container(
                            height: 120,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade300),
                              borderRadius: BorderRadius.circular(8),
                              color: Colors.grey.shade50,
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                transaccion.imagenUrlCompleta ?? '',
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Center(
                                    child: Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.image_not_supported,
                                          size: 40,
                                        ),
                                        SizedBox(height: 8),
                                        Text(
                                          'No se pudo cargar la vista previa',
                                        ),
                                        Text(
                                          'Toca para ver el comprobante',
                                          style: TextStyle(fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                                loadingBuilder:
                                    (context, child, loadingProgress) {
                                      if (loadingProgress == null) return child;
                                      return const Center(
                                        child: CircularProgressIndicator(),
                                      );
                                    },
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Center(
                          child: TextButton.icon(
                            onPressed: () async {
                              try {
                                await _abrirUrl(transaccion.comprobanteUrl!);
                              } catch (e) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'No se pudo abrir el comprobante',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                            icon: const Icon(Icons.open_in_browser),
                            label: const Text('Abrir en navegador'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
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

  Widget _buildInfoRow(String label, String value, {bool isHighlight = false}) {
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
                fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
                color: isHighlight ? Colors.green : Colors.black87,
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

  String _formatFullDateFromString(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return _formatFullDate(date);
    } catch (e) {
      return dateStr;
    }
  }
}
