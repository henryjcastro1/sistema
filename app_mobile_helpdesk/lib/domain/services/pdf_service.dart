// lib/services/pdf_service.dart
import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import '../../data/models/transaccion.dart';
import 'dart:typed_data';

class PdfService {
  static Future<File> generateTransaccionPdf(
    Transaccion transaccion, {
    Uint8List? imagenComprobante,
  }) async {
    final pdf = pw.Document();

    // Cargar imagen si existe
    pw.MemoryImage? imagen;
    if (imagenComprobante != null) {
      imagen = pw.MemoryImage(imagenComprobante);
    }

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        build: (context) => [
          pw.Header(
            level: 0,
            child: pw.Text(
              'Comprobante de Transacción',
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.SizedBox(height: 20),
          pw.Container(
            padding: pw.EdgeInsets.all(15),
            decoration: pw.BoxDecoration(
              border: pw.Border.all(),
              borderRadius: pw.BorderRadius.circular(10),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _buildInfoRow('Número de Pedido:', transaccion.numeroPedido),
                _buildInfoRow('Fecha:', _formatDate(transaccion.createdAt)),
                _buildInfoRow('Estado:', transaccion.estadoTexto),
                _buildInfoRow('Tipo de Pago:', transaccion.tipoPago),
                _buildInfoRow('Monto:', transaccion.montoFormateado),
                _buildInfoRow(
                  'Total del Pedido:',
                  transaccion.pedidoTotalFormateado,
                ),
                if (transaccion.titular != null)
                  _buildInfoRow('Titular:', transaccion.titular!),
                if (transaccion.ultimosDigitos != null)
                  _buildInfoRow(
                    'Últimos dígitos:',
                    transaccion.ultimosDigitos!,
                  ),
                if (transaccion.usuarioNombre.isNotEmpty)
                  _buildInfoRow('Usuario:', transaccion.usuarioNombre),
                if (transaccion.fechaVerificacion != null)
                  _buildInfoRow(
                    'Fecha Verificación:',
                    transaccion.fechaVerificacion!,
                  ),
                if (transaccion.verificadorNombre != null)
                  _buildInfoRow(
                    'Verificado por:',
                    transaccion.verificadorNombre!,
                  ),
                if (transaccion.notasCliente != null)
                  _buildInfoRow(
                    'Notas del Cliente:',
                    transaccion.notasCliente!,
                  ),
                if (transaccion.notasAdmin != null)
                  _buildInfoRow(
                    'Notas del Administrador:',
                    transaccion.notasAdmin!,
                  ),
              ],
            ),
          ),
          if (imagen != null) ...[
            pw.SizedBox(height: 20),
            pw.Text(
              'Comprobante Adjunto:',
              style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
            ),
            pw.SizedBox(height: 10),
            pw.Container(height: 300, child: pw.Image(imagen)),
          ],
          pw.SizedBox(height: 30),
          pw.Text(
            'Este documento es un comprobante oficial de la transacción.',
            style: pw.TextStyle(fontSize: 10, fontStyle: pw.FontStyle.italic),
          ),
        ],
      ),
    );

    final output = await getTemporaryDirectory();
    final file = File('${output.path}/comprobante_${transaccion.id}.pdf');
    await file.writeAsBytes(await pdf.save());
    return file;
  }

  static pw.Widget _buildInfoRow(String label, String value) {
    return pw.Padding(
      padding: pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 150,
            child: pw.Text(
              label,
              style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
            ),
          ),
          pw.Expanded(child: pw.Text(value)),
        ],
      ),
    );
  }

  static String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}
