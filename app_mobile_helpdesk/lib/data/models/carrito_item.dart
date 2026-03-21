import 'producto.dart';

class CarritoItem {
  final Producto producto;
  int cantidad;

  CarritoItem({required this.producto, required this.cantidad});

  double get subtotal => producto.precio * cantidad;

  Map<String, dynamic> toJson() {
    return {
      'tipo_item': 'PRODUCTO',
      'item_id': producto.id,
      'descripcion': producto.nombre,
      'cantidad': cantidad,
      'precio_unitario': producto.precio,
    };
  }
}
