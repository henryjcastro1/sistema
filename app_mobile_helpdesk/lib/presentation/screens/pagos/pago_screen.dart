import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/di/injection.dart';
import '../../../domain/services/storage_service.dart';
import '../../../core/utils/currency_formatter.dart';

class PagoScreen extends StatefulWidget {
  final String pedidoId;
  final double monto;
  final String numeroPedido;

  const PagoScreen({
    super.key,
    required this.pedidoId,
    required this.monto,
    required this.numeroPedido,
  });

  @override
  State<PagoScreen> createState() => _PagoScreenState();
}

class _PagoScreenState extends State<PagoScreen> {
  String _tipoPago = '';
  String? _metodoPagoId;
  String _notas = '';
  bool _isLoading = false;
  bool _isLoadingMetodos = false;

  // Para transferencia/QR
  File? _comprobanteFile;
  String? _previewComprobante;

  // Para QR
  String? _qrPlataforma;

  final List<MetodoPago> _metodosPago = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void didUpdateWidget(covariant PagoScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_tipoPago == 'TARJETA') {
      _cargarMetodosPago();
    }
  }

  Future<void> _cargarMetodosPago() async {
    setState(() {
      _isLoadingMetodos = true;
    });

    try {
      final token = await getIt<StorageService>().getToken();
      if (token == null) return;

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/usuarios/metodos-pago',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.statusCode == 200) {
        final data = response.data as List;
        setState(() {
          _metodosPago.clear();
          _metodosPago.addAll(data.map((m) => MetodoPago.fromJson(m)));
        });
      }
    } catch (e) {
      print('Error cargando métodos de pago: $e');
    } finally {
      setState(() {
        _isLoadingMetodos = false;
      });
    }
  }

  Future<void> _seleccionarComprobante() async {
    final pickedFile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      final file = File(pickedFile.path);
      final fileSize = await file.length();

      if (fileSize > 5 * 1024 * 1024) {
        _mostrarError('El comprobante no debe superar los 5MB');
        return;
      }

      setState(() {
        _comprobanteFile = file;
        _previewComprobante = pickedFile.path;
      });
    }
  }

  Future<void> _enviarPago() async {
    if (_tipoPago.isEmpty) {
      _mostrarError('Debes seleccionar un método de pago');
      return;
    }

    if (_tipoPago == 'TARJETA' && _metodoPagoId == null) {
      _mostrarError('Debes seleccionar una tarjeta');
      return;
    }

    if (_tipoPago == 'TRANSFERENCIA' && _comprobanteFile == null) {
      _mostrarError('Debes subir el comprobante de transferencia');
      return;
    }

    if (_tipoPago == 'QR' && _qrPlataforma == null) {
      _mostrarError('Debes seleccionar una plataforma de pago');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final token = await getIt<StorageService>().getToken();
      if (token == null) {
        _mostrarError('Debes iniciar sesión');
        return;
      }

      // 👇 CONSTRUCCIÓN CORRECTA DEL FORM DATA
      final formData = FormData();

      // Agregar campos de texto correctamente
      formData.fields.add(MapEntry('pedido_id', widget.pedidoId));
      formData.fields.add(
        MapEntry('tipo_pago', _tipoPago == 'QR' ? 'TRANSFERENCIA' : _tipoPago),
      );

      if (_tipoPago == 'QR') {
        formData.fields.add(MapEntry('notas', 'Pago por QR - $_qrPlataforma'));
      }

      if (_metodoPagoId != null && _metodoPagoId!.isNotEmpty) {
        formData.fields.add(MapEntry('metodo_pago_id', _metodoPagoId!));
      }

      if (_notas.isNotEmpty) {
        formData.fields.add(MapEntry('notas', _notas));
      }

      // 👇 AGREGAR ARCHIVO CORRECTAMENTE (si existe)
      if (_comprobanteFile != null) {
        // Obtener el nombre del archivo
        final fileName = _comprobanteFile!.path.split('/').last;

        // Convertir el archivo a MultipartFile
        final multipartFile = await MultipartFile.fromFile(
          _comprobanteFile!.path,
          filename: fileName,
        );

        formData.files.add(MapEntry('comprobante', multipartFile));
      }

      // Log para depuración
      print('📤 Enviando pago...');
      print('pedido_id: ${widget.pedidoId}');
      print('tipo_pago: ${_tipoPago == 'QR' ? 'TRANSFERENCIA' : _tipoPago}');
      print('metodo_pago_id: $_metodoPagoId');
      print('comprobante: ${_comprobanteFile != null}');

      final response = await Dio().post(
        '${ApiEndpoints.baseUrl}/pagos',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );

      if (response.statusCode == 200) {
        _mostrarExito(
          _tipoPago == 'TARJETA'
              ? 'Pago procesándose...'
              : 'Comprobante recibido. Pendiente de verificación.',
        );

        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pop(context, true);
          }
        });
      }
    } on DioException catch (e) {
      print('❌ DioError: ${e.message}');
      print('❌ Response: ${e.response?.data}');

      String errorMessage = 'Error al procesar el pago';
      if (e.response?.data != null) {
        if (e.response?.data is Map) {
          errorMessage = e.response?.data['error'] ?? errorMessage;
        } else if (e.response?.data is String) {
          errorMessage = e.response?.data;
        }
      }
      _mostrarError(errorMessage);
    } catch (e) {
      print('❌ Error inesperado: $e');
      _mostrarError('Error inesperado: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _mostrarError(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _mostrarExito(String mensaje) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(mensaje),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Pagar Pedido',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Información del pedido
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Pedido: ${widget.numeroPedido}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Total a pagar:',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      Text(
                        CurrencyFormatter.format(widget.monto),
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                  Icon(Icons.receipt, size: 48, color: Colors.blue.shade300),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Métodos de pago
            const Text(
              'Método de pago',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildMetodoPagoButton('Tarjeta', Icons.credit_card, 'TARJETA'),
                const SizedBox(width: 12),
                _buildMetodoPagoButton(
                  'Transferencia',
                  Icons.account_balance,
                  'TRANSFERENCIA',
                ),
                const SizedBox(width: 12),
                _buildMetodoPagoButton('Pago QR', Icons.qr_code_scanner, 'QR'),
                const SizedBox(width: 12),
                _buildMetodoPagoButton('Efectivo', Icons.money, 'EFECTIVO'),
              ],
            ),
            const SizedBox(height: 24),

            // Contenido según método de pago
            if (_tipoPago == 'TARJETA') ...[
              _buildSeccionTarjeta(),
            ] else if (_tipoPago == 'TRANSFERENCIA') ...[
              _buildSeccionTransferencia(),
            ] else if (_tipoPago == 'QR') ...[
              _buildSeccionQR(),
            ],

            // Notas adicionales
            const Divider(height: 32),
            const Text(
              'Notas (opcional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            TextField(
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Agrega alguna nota sobre el pago...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey.shade50,
              ),
              onChanged: (value) {
                _notas = value;
              },
            ),
            const SizedBox(height: 24),

            // Botones de acción
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Cancelar'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _enviarPago,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text('Confirmar Pago'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetodoPagoButton(String label, IconData icon, String valor) {
    final isSelected = _tipoPago == valor;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _tipoPago = valor;
            if (valor == 'TARJETA') {
              _cargarMetodosPago();
            }
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? Colors.blue.shade50 : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? Colors.blue : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? Colors.blue : Colors.grey),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? Colors.blue : Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSeccionTarjeta() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        const Text(
          'Selecciona una tarjeta',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        if (_isLoadingMetodos)
          const Center(child: CircularProgressIndicator())
        else if (_metodosPago.isEmpty)
          Center(
            child: Column(
              children: [
                const Text('No tienes tarjetas guardadas'),
                TextButton(
                  onPressed: () {},
                  child: const Text('Agregar tarjeta'),
                ),
              ],
            ),
          )
        else
          ..._metodosPago.map(
            (metodo) => RadioListTile<String>(
              title: Text('${metodo.tipo} **** ${metodo.ultimosDigitos}'),
              subtitle: Text(metodo.titular),
              value: metodo.id,
              groupValue: _metodoPagoId,
              onChanged: (value) {
                setState(() {
                  _metodoPagoId = value;
                });
              },
              secondary: const Icon(Icons.credit_card, color: Colors.blue),
            ),
          ),
      ],
    );
  }

  Widget _buildSeccionTransferencia() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        const Text(
          'Comprobante de transferencia',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _seleccionarComprobante,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.grey.shade300,
                width: 2,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(12),
              color: Colors.grey.shade50,
            ),
            child: _previewComprobante != null
                ? Column(
                    children: [
                      Image.file(
                        File(_previewComprobante!),
                        height: 150,
                        fit: BoxFit.cover,
                      ),
                      const SizedBox(height: 8),
                      const Text('Toca para cambiar'),
                    ],
                  )
                : Column(
                    children: [
                      const Icon(
                        Icons.cloud_upload,
                        size: 48,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 8),
                      const Text('Haz clic para subir el comprobante'),
                      Text(
                        'PDF o imagen (máx. 5MB)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Datos para la transferencia:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text('Banco: Banco Ejemplo'),
              Text('CBU: 1234567890123456789012'),
              Text('Alias: HELP.MIEMPRESA'),
              Text('Titular: Mi Empresa SRL'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSeccionQR() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        const Text(
          'Selecciona plataforma de pago',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildPlataformaButton(
                'Nequi',
                Icons.phone_android,
                'Nequi',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPlataformaButton(
                'Bancolombia',
                Icons.account_balance,
                'Bancolombia',
              ),
            ),
          ],
        ),
        if (_qrPlataforma != null) ...[
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Text(
                  'Escanea el código QR con tu app de $_qrPlataforma',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Image.asset(
                    _qrPlataforma == 'Nequi'
                        ? 'assets/images/nequi.jpeg'
                        : 'assets/images/bancolombia.jpeg',
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Monto: ${CurrencyFormatter.format(widget.monto)}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Referencia: ${widget.numeroPedido}',
                  style: const TextStyle(fontFamily: 'monospace'),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Instrucciones:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text('1. Abre la app'),
                const Text('2. Selecciona la opción "Pagar con QR"'),
                const Text('3. Escanea el código QR mostrado'),
                const Text('4. Confirma el pago'),
                const SizedBox(height: 16),
                const Divider(),
                _buildSeccionSubirComprobante(),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPlataformaButton(String label, IconData icon, String valor) {
    final isSelected = _qrPlataforma == valor;
    return GestureDetector(
      onTap: () {
        setState(() {
          _qrPlataforma = valor;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? (valor == 'Nequi'
                    ? Colors.purple.shade50
                    : Colors.yellow.shade50)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? (valor == 'Nequi' ? Colors.purple : Colors.orange)
                : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? (valor == 'Nequi' ? Colors.purple : Colors.orange)
                  : Colors.grey,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected
                    ? (valor == 'Nequi' ? Colors.purple : Colors.orange)
                    : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSeccionSubirComprobante() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Comprobante de pago QR (opcional)',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _seleccionarComprobante,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.grey.shade300,
                width: 1,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(8),
              color: Colors.white,
            ),
            child: _previewComprobante != null
                ? Row(
                    children: [
                      Image.file(
                        File(_previewComprobante!),
                        height: 40,
                        width: 40,
                        fit: BoxFit.cover,
                      ),
                      const SizedBox(width: 8),
                      const Expanded(child: Text('Archivo seleccionado')),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () {
                          setState(() {
                            _comprobanteFile = null;
                            _previewComprobante = null;
                          });
                        },
                      ),
                    ],
                  )
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.attach_file, size: 20),
                      SizedBox(width: 8),
                      Text('Subir comprobante'),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.yellow.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.yellow.shade200),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, size: 16),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Si tienes problemas con el QR, puedes subir el comprobante manualmente.',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// Modelo para método de pago
class MetodoPago {
  final String id;
  final String tipo;
  final String ultimosDigitos;
  final String titular;
  final bool esPrincipal;

  MetodoPago({
    required this.id,
    required this.tipo,
    required this.ultimosDigitos,
    required this.titular,
    required this.esPrincipal,
  });

  factory MetodoPago.fromJson(Map<String, dynamic> json) {
    return MetodoPago(
      id: json['id'] ?? '',
      tipo: json['tipo'] ?? '',
      ultimosDigitos: json['ultimos_digitos'] ?? '',
      titular: json['titular'] ?? '',
      esPrincipal: json['es_principal'] ?? false,
    );
  }
}
