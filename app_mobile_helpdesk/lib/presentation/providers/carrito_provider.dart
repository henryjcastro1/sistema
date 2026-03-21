import 'package:app_mobile_helpdesk/presentation/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import '../../data/models/producto.dart';
import '../../data/models/carrito_item.dart';

class CarritoProvider extends ChangeNotifier {
  final List<CarritoItem> _items = [];

  List<CarritoItem> get items => List.unmodifiable(_items);
  int get itemCount => _items.length;

  double get subtotal {
    return _items.fold(0, (sum, item) => sum + item.subtotal);
  }

  double get impuesto => subtotal * 0.19;
  double get descuento => 0;
  double get costoEnvio => 5000;
  double get total => subtotal + impuesto - descuento + costoEnvio;

  bool get isEmpty => _items.isEmpty;

  bool puedeHacerCheckout(AuthProvider authProvider) {
    return authProvider.isAuthenticated && !isEmpty;
  }

  // 👇 NUEVO: Verificar stock disponible
  int obtenerCantidadEnCarrito(String productoId) {
    final item = _items.firstWhere(
      (item) => item.producto.id == productoId,
      orElse: () => CarritoItem(
        producto: Producto(
          id: '',
          nombre: '',
          precio: 0,
          stock: 0,
          activo: true,
          destacado: false,
        ),
        cantidad: 0,
      ),
    );
    return item.cantidad;
  }

  bool puedeAgregar(Producto producto, {int cantidad = 1}) {
    final cantidadEnCarrito = obtenerCantidadEnCarrito(producto.id);
    return (cantidadEnCarrito + cantidad) <= producto.stock;
  }

  // 👇 MODIFICADO: Retorna bool indicando si se pudo agregar
  bool agregarProducto(Producto producto, {int cantidad = 1}) {
    if (!puedeAgregar(producto, cantidad: cantidad)) {
      return false;
    }

    final existingIndex = _items.indexWhere(
      (item) => item.producto.id == producto.id,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].cantidad += cantidad;
    } else {
      _items.add(CarritoItem(producto: producto, cantidad: cantidad));
    }

    notifyListeners();
    return true;
  }

  // 👇 MODIFICADO: Retorna bool indicando si se pudo actualizar
  bool actualizarCantidad(String productoId, int nuevaCantidad) {
    final index = _items.indexWhere((item) => item.producto.id == productoId);

    if (index >= 0) {
      if (nuevaCantidad <= 0) {
        _items.removeAt(index);
        notifyListeners();
        return true;
      }

      if (nuevaCantidad <= _items[index].producto.stock) {
        _items[index].cantidad = nuevaCantidad;
        notifyListeners();
        return true;
      }
    }
    return false;
  }

  void eliminarProducto(String productoId) {
    _items.removeWhere((item) => item.producto.id == productoId);
    notifyListeners();
  }

  void limpiarCarrito() {
    _items.clear();
    notifyListeners();
  }

  Map<String, dynamic> toJson() {
    return {
      'items': _items.map((item) => item.toJson()).toList(),
      'impuesto': impuesto,
      'descuento': descuento,
      'costo_envio': costoEnvio,
    };
  }
}
