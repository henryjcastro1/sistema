import 'dart:typed_data';
import 'package:app_mobile_helpdesk/data/models/transaccion.dart';
import 'package:app_mobile_helpdesk/domain/services/pdf_service.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:http/http.dart' as http;

class ComprobanteDialog extends StatefulWidget {
  final Transaccion transaccion;

  const ComprobanteDialog({super.key, required this.transaccion});

  @override
  State<ComprobanteDialog> createState() => _ComprobanteDialogState();
}

class _ComprobanteDialogState extends State<ComprobanteDialog> {
  bool _isLoading = false;
  Uint8List? _imagenBytes;

  @override
  void initState() {
    super.initState();
    _cargarImagen();
  }

  Future<void> _cargarImagen() async {
    if (widget.transaccion.comprobanteUrl != null) {
      setState(() => _isLoading = true);
      try {
        final urlCompleta = widget.transaccion.imagenUrlCompleta;
        if (urlCompleta == null) {
          setState(() => _isLoading = false);
          return;
        }

        final response = await http.get(Uri.parse(urlCompleta));
        if (response.statusCode == 200) {
          setState(() {
            _imagenBytes = response.bodyBytes;
            _isLoading = false;
          });
        }
      } catch (e) {
        setState(() => _isLoading = false);
        debugPrint('Error cargando imagen: $e');
      }
    }
  }

  Future<void> _compartirComoPdf() async {
    setState(() => _isLoading = true);
    try {
      final pdfFile = await PdfService.generateTransaccionPdf(
        widget.transaccion,
        imagenComprobante: _imagenBytes,
      );

      await Share.shareXFiles(
        [XFile(pdfFile.path)],
        text: 'Comprobante de transacción #${widget.transaccion.numeroPedido}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error al generar PDF: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final urlImagen = widget.transaccion.imagenUrlCompleta;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 10,
      child: Container(
        width: MediaQuery.of(context).size.width * 0.92,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          children: [
            // 🔷 HEADER NEGRO
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              decoration: const BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.receipt_long, color: Colors.white),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Comprobante de Pago',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // 🔽 CONTENIDO
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 🧾 CARD INFO
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _buildModernItem(
                            "Número de Pedido",
                            widget.transaccion.numeroPedido,
                          ),
                          _buildModernItem(
                            "Fecha",
                            _formatDate(widget.transaccion.createdAt),
                          ),
                          _buildModernItem(
                            "Monto",
                            widget.transaccion.montoFormateado,
                            isHighlight: true,
                          ),
                          _buildEstadoChip(widget.transaccion.estadoTexto),
                          _buildModernItem(
                            "Método de Pago",
                            widget.transaccion.tipoPago,
                          ),
                          if (widget.transaccion.titular != null)
                            _buildModernItem(
                              "Titular",
                              widget.transaccion.titular!,
                            ),
                          if (widget.transaccion.ultimosDigitos != null)
                            _buildModernItem(
                              "Tarjeta",
                              "**** ${widget.transaccion.ultimosDigitos!}",
                            ),
                          if (widget.transaccion.notasCliente != null &&
                              widget.transaccion.notasCliente!.isNotEmpty)
                            _buildModernItem(
                              "Notas del Cliente",
                              widget.transaccion.notasCliente!,
                            ),
                          if (widget.transaccion.notasAdmin != null &&
                              widget.transaccion.notasAdmin!.isNotEmpty)
                            _buildModernItem(
                              "Notas del Administrador",
                              widget.transaccion.notasAdmin!,
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 🖼 IMAGEN DEL COMPROBANTE
                    if (urlImagen != null && urlImagen.isNotEmpty) ...[
                      const Text(
                        'Comprobante Adjunto',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 10),

                      if (_isLoading)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32.0),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else if (_imagenBytes != null)
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                blurRadius: 12,
                                color: Colors.black.withOpacity(0.1),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.memory(
                              _imagenBytes!,
                              fit: BoxFit.contain,
                              width: double.infinity,
                            ),
                          ),
                        )
                      else
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: CachedNetworkImage(
                            imageUrl: urlImagen,
                            placeholder: (_, _) => const Center(
                              child: Padding(
                                padding: EdgeInsets.all(32.0),
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            errorWidget: (_, _, _) => Container(
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Column(
                                children: [
                                  Icon(
                                    Icons.image_not_supported,
                                    size: 48,
                                    color: Colors.grey,
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    "No se pudo cargar la imagen",
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            ),

            // 🔘 BOTONES NEGROS
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _compartirComoPdf,
                      icon: const Icon(Icons.picture_as_pdf, size: 20),
                      label: const Text(
                        "Generar PDF",
                        style: TextStyle(fontSize: 14),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _compartirComoPdf,
                      icon: const Icon(Icons.share, size: 20),
                      label: const Text(
                        "Compartir",
                        style: TextStyle(fontSize: 14),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 🔹 ITEM MODERNO
  Widget _buildModernItem(
    String label,
    String value, {
    bool isHighlight = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: isHighlight ? FontWeight.bold : FontWeight.w500,
                fontSize: isHighlight ? 16 : 14,
                color: isHighlight ? Colors.green.shade700 : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 🔹 CHIP ESTADO
  Widget _buildEstadoChip(String estado) {
    Color color;
    switch (estado.toUpperCase()) {
      case 'COMPLETADO':
        color = Colors.green;
        break;
      case 'PENDIENTE':
        color = Colors.orange;
        break;
      case 'PROCESANDO':
        color = Colors.blue;
        break;
      case 'RECHAZADO':
        color = Colors.red;
        break;
      case 'FALLIDO':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 4),
      child: Align(
        alignment: Alignment.centerRight,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            estado,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} '
        '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
