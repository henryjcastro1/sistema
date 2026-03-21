import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../../../core/utils/currency_formatter.dart'; // 👈 AGREGAR
import '../../providers/carrito_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/di/injection.dart';
import '../../../domain/services/storage_service.dart';

class CarritoScreen extends StatelessWidget {
  const CarritoScreen({super.key});

  // Función para mostrar imágenes Base64
  Widget _buildImageFromBase64(String? base64String) {
    if (base64String == null) {
      return Icon(
        Icons.image_not_supported,
        size: 30,
        color: Colors.grey.shade400,
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
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.memory(
          imageBytes,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('❌ Error cargando imagen Base64: $error');
            return Icon(
              Icons.broken_image,
              size: 30,
              color: Colors.grey.shade400,
            );
          },
        ),
      );
    } catch (e) {
      print('❌ Error decodificando Base64: $e');
      return Icon(Icons.error_outline, size: 30, color: Colors.grey.shade400);
    }
  }

  // Función para mostrar diálogo de login
  void _mostrarDialogoLogin(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Iniciar sesión requerido'),
        content: const Text(
          'Debes iniciar sesión para crear un pedido. ¿Quieres ir a la pantalla de login?',
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
            child: const Text('Iniciar sesión'),
          ),
        ],
      ),
    );
  }

  // 👇 FUNCIÓN PARA CREAR EL PEDIDO CON VALIDACIÓN DE AUTENTICACIÓN
  Future<void> _crearPedido(BuildContext context) async {
    final carritoProvider = Provider.of<CarritoProvider>(
      context,
      listen: false,
    );
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final storageService = getIt<StorageService>();

    // 👇 VALIDACIÓN DE AUTENTICACIÓN (Capa 1)
    if (!authProvider.isAuthenticated) {
      _mostrarDialogoLogin(context);
      return;
    }

    // Validar que el carrito no esté vacío
    if (carritoProvider.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('El carrito está vacío'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    // Mostrar diálogo de confirmación
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar pedido'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('¿Estás seguro de crear este pedido?'),
            const SizedBox(height: 16),
            Text('Total: ${CurrencyFormatter.format(carritoProvider.total)}'),
            Text('Items: ${carritoProvider.itemCount}'),
          ],
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    try {
      final token = await storageService.getToken();

      // Mostrar indicador de carga
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      final response = await Dio().post(
        '${ApiEndpoints.baseUrl}/pedidos',
        data: carritoProvider.toJson(),
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      // Cerrar indicador de carga
      if (context.mounted) Navigator.pop(context);

      if (response.statusCode == 200) {
        // Limpiar carrito después de pedido exitoso
        carritoProvider.limpiarCarrito();

        if (context.mounted) {
          // Mostrar mensaje de éxito
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Pedido creado exitosamente'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );

          // Regresar a la pantalla anterior
          Navigator.pop(context);
        }
      }
    } on DioException catch (e) {
      // Cerrar indicador de carga si estaba abierto
      if (context.mounted) Navigator.pop(context);

      String errorMessage = 'Error al crear pedido';

      // Manejar errores específicos
      if (e.response?.statusCode == 400) {
        errorMessage = e.response?.data['error'] ?? 'Error en la solicitud';
      } else if (e.response?.statusCode == 401) {
        errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente';
        _mostrarDialogoLogin(context);
      } else if (e.response?.statusCode == 409) {
        errorMessage = 'Stock insuficiente para algunos productos';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Carrito',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Consumer2<CarritoProvider, AuthProvider>(
        builder: (context, carrito, auth, child) {
          // Mostrar banner si no está autenticado
          if (!auth.isAuthenticated && !carrito.isEmpty) {
            return Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  color: Colors.amber.shade100,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber.shade900),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Inicia sesión para poder confirmar el pedido',
                          style: TextStyle(color: Colors.amber.shade900),
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pushNamed(context, '/login');
                        },
                        style: TextButton.styleFrom(
                          backgroundColor: Colors.amber.shade200,
                        ),
                        child: Text(
                          'Login',
                          style: TextStyle(color: Colors.amber.shade900),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(child: _buildCarritoContent(carrito, auth, context)),
              ],
            );
          }

          if (carrito.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 80,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Tu carrito está vacío',
                    style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                  ),
                  if (!auth.isAuthenticated) ...[
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/productos');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Ver productos'),
                    ),
                  ],
                ],
              ),
            );
          }

          return _buildCarritoContent(carrito, auth, context);
        },
      ),
    );
  }

  Widget _buildCarritoContent(
    CarritoProvider carrito,
    AuthProvider auth,
    BuildContext context,
  ) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: carrito.items.length,
            itemBuilder: (context, index) {
              final item = carrito.items[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      // Imagen
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: _buildImageFromBase64(item.producto.imagenUrl),
                      ),
                      const SizedBox(width: 12),
                      // Información
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.producto.nombre,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              CurrencyFormatter.format(
                                item.producto.precio,
                                currencyCode:
                                    item.producto.monedaCodigo ?? 'COP',
                                symbol: item.producto.monedaSimbolo,
                              ),
                              style: const TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline),
                                  onPressed: () {
                                    final nuevaCantidad = item.cantidad - 1;
                                    final actualizado = carrito
                                        .actualizarCantidad(
                                          item.producto.id,
                                          nuevaCantidad,
                                        );

                                    if (!actualizado && context.mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Error al actualizar cantidad',
                                          ),
                                          backgroundColor: Colors.red,
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    }
                                  },
                                  iconSize: 20,
                                ),
                                Text(
                                  '${item.cantidad}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline),
                                  onPressed: () {
                                    final nuevaCantidad = item.cantidad + 1;
                                    final actualizado = carrito
                                        .actualizarCantidad(
                                          item.producto.id,
                                          nuevaCantidad,
                                        );

                                    if (!actualizado && context.mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Stock máximo: ${item.producto.stock}',
                                          ),
                                          backgroundColor: Colors.red,
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    }
                                  },
                                  iconSize: 20,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Subtotal y eliminar
                      Column(
                        children: [
                          Text(
                            CurrencyFormatter.format(
                              item.subtotal,
                              currencyCode: item.producto.monedaCodigo ?? 'COP',
                              symbol: item.producto.monedaSimbolo,
                            ),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.delete_outline,
                              color: Colors.red,
                            ),
                            onPressed: () {
                              carrito.eliminarProducto(item.producto.id);
                            },
                            iconSize: 20,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Resumen y botón de compra
        Container(
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
          child: Column(
            children: [
              _buildResumenRow(
                'Subtotal',
                carrito.subtotal,
                monedaCodigo: 'COP',
              ),
              _buildResumenRow(
                'IVA (19%)',
                carrito.impuesto,
                monedaCodigo: 'COP',
              ),
              _buildResumenRow(
                'Envío',
                carrito.costoEnvio,
                monedaCodigo: 'COP',
              ),
              const Divider(),
              _buildResumenRow(
                'Total',
                carrito.total,
                isTotal: true,
                monedaCodigo: 'COP',
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: auth.isAuthenticated
                    ? () => _crearPedido(context)
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  disabledBackgroundColor: Colors.grey.shade400,
                ),
                child: Text(
                  auth.isAuthenticated
                      ? 'Confirmar pedido'
                      : 'Inicia sesión para comprar',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResumenRow(
    String label,
    double value, {
    bool isTotal = false,
    String monedaCodigo = 'COP',
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            CurrencyFormatter.format(value, currencyCode: monedaCodigo),
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.black : Colors.grey.shade700,
            ),
          ),
        ],
      ),
    );
  }
}
