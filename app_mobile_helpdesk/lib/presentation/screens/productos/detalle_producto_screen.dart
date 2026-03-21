import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/producto.dart';
import '../../../core/utils/currency_formatter.dart'; // 👈 AGREGAR
import '../../providers/carrito_provider.dart';

class DetalleProductoScreen extends StatelessWidget {
  final Producto producto;

  const DetalleProductoScreen({super.key, required this.producto});

  // Función para mostrar imágenes Base64
  Widget _buildImageFromBase64(String? base64String) {
    if (base64String == null) {
      return Center(
        child: Icon(
          Icons.image_not_supported,
          size: 60,
          color: Colors.grey.shade400,
        ),
      );
    }

    try {
      String base64Data = base64String;
      if (base64String.startsWith('data:image')) {
        final parts = base64String.split(',');
        if (parts.length > 1) {
          base64Data = parts[1];
        }
      }

      final imageBytes = base64Decode(base64Data);
      return Image.memory(
        imageBytes,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          print('❌ Error cargando imagen Base64: $error');
          return Center(
            child: Icon(
              Icons.broken_image,
              size: 60,
              color: Colors.grey.shade400,
            ),
          );
        },
      );
    } catch (e) {
      print('❌ Error decodificando Base64: $e');
      return Center(
        child: Icon(Icons.error_outline, size: 60, color: Colors.grey.shade400),
      );
    }
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }

  // 👇 FUNCIÓN MEJORADA CON VALIDACIÓN DE STOCK
  void _agregarAlCarrito(BuildContext context) {
    final carritoProvider = Provider.of<CarritoProvider>(
      context,
      listen: false,
    );

    // Verificar si se puede agregar
    final puedeAgregar = carritoProvider.puedeAgregar(producto, cantidad: 1);

    if (!puedeAgregar) {
      // Calcular cuánto más puede agregar
      final cantidadEnCarrito = carritoProvider.obtenerCantidadEnCarrito(
        producto.id,
      );
      final disponible = producto.stock - cantidadEnCarrito;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            disponible > 0
                ? 'Solo puedes agregar $disponible más.'
                : 'Ya tienes todas las unidades disponibles en el carrito.',
          ),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    // Intentar agregar
    final agregado = carritoProvider.agregarProducto(producto, cantidad: 1);

    if (agregado) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${producto.nombre} agregado al carrito'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
          action: SnackBarAction(
            label: 'VER CARRITO',
            textColor: Colors.white,
            onPressed: () {
              Navigator.pushNamed(context, '/carrito');
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          producto.nombre,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        // 👇 BOTÓN PARA VER EN OTRAS MONEDAS (opcional)
        actions: [
          if (producto.precioUsd != null || producto.precioEur != null)
            PopupMenuButton<String>(
              icon: const Icon(Icons.currency_exchange, color: Colors.white),
              onSelected: (value) {
                // Aquí podrías mostrar un diálogo con el precio en otras monedas
                _mostrarOtrasMonedas(context);
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'info',
                  child: Text('Ver precios en otras monedas'),
                ),
              ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagen principal
            Container(
              width: double.infinity,
              height: 300,
              color: Colors.grey.shade200,
              child: _buildImageFromBase64(producto.imagenUrl),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Marca y modelo
                  if (producto.marca != null || producto.modelo != null) ...[
                    Text(
                      '${producto.marca ?? ''} ${producto.modelo ?? ''}'.trim(),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Nombre
                  Text(
                    producto.nombre,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 👇 PRECIO PRINCIPAL CON FORMATO CORREGIDO
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Precio',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            producto
                                .precioFormateado, // 👈 USA EL GETTER DEL MODELO
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      // Stock
                      if (producto.stock > 0)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.inventory,
                                size: 16,
                                color: Colors.green.shade700,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${producto.stock} disponibles',
                                style: TextStyle(
                                  color: Colors.green.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.warning_amber_rounded,
                                size: 16,
                                color: Colors.red.shade700,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Agotado',
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),

                  // 👇 PRECIOS EN OTRAS MONEDAS (opcional)
                  if (producto.precioUsd != null ||
                      producto.precioEur != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Precios en otras monedas',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              if (producto.precioUsd != null) ...[
                                Expanded(
                                  child: _buildOtraMonedaItem(
                                    'USD',
                                    producto.precioUsd!,
                                    '\$',
                                  ),
                                ),
                              ],
                              if (producto.precioEur != null) ...[
                                Expanded(
                                  child: _buildOtraMonedaItem(
                                    'EUR',
                                    producto.precioEur!,
                                    '€',
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],

                  const Divider(height: 32),

                  // Descripción
                  if (producto.descripcion != null) ...[
                    const Text(
                      'Descripción',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      producto.descripcion!,
                      style: const TextStyle(fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Información adicional
                  if (producto.sku != null ||
                      producto.categoriaNombre != null) ...[
                    const Text(
                      'Información adicional',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (producto.sku != null)
                      _buildInfoRow('SKU', producto.sku!),
                    if (producto.categoriaNombre != null)
                      _buildInfoRow('Categoría', producto.categoriaNombre!),
                    if (producto.subcategoriaNombre != null)
                      _buildInfoRow(
                        'Subcategoría',
                        producto.subcategoriaNombre!,
                      ),
                    if (producto.monedaCodigo != null)
                      _buildInfoRow('Moneda', producto.monedaCodigo!),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.3),
              spreadRadius: 1,
              blurRadius: 5,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: producto.stock > 0
              ? () => _agregarAlCarrito(context)
              : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Text(
            'Agregar al carrito',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  // 👇 FUNCIÓN AUXILIAR PARA MOSTRAR PRECIOS EN OTRAS MONEDAS
  Widget _buildOtraMonedaItem(String codigo, double valor, String simbolo) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        children: [
          Text(
            codigo,
            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 2),
          Text(
            CurrencyFormatter.format(
              valor,
              currencyCode: codigo,
              symbol: simbolo,
            ),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  // 👇 FUNCIÓN PARA MOSTRAR DIÁLOGO CON PRECIOS EN OTRAS MONEDAS
  void _mostrarOtrasMonedas(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Precios en otras monedas'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (producto.precioUsd != null) ...[
              ListTile(
                leading: const Icon(Icons.attach_money),
                title: const Text('Dólar Americano'),
                trailing: Text(
                  CurrencyFormatter.format(
                    producto.precioUsd!,
                    currencyCode: 'USD',
                    symbol: '\$',
                  ),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ),
            ],
            if (producto.precioEur != null) ...[
              ListTile(
                leading: const Icon(Icons.euro),
                title: const Text('Euro'),
                trailing: Text(
                  CurrencyFormatter.format(
                    producto.precioEur!,
                    currencyCode: 'EUR',
                    symbol: '€',
                  ),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }
}
