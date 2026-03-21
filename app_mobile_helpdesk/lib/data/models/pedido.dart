class ItemPedido {
  final String id;
  final String tipoItem;
  final String itemId;
  final String descripcion;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final Map<String, dynamic>? producto;

  ItemPedido({
    required this.id,
    required this.tipoItem,
    required this.itemId,
    required this.descripcion,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    this.producto,
  });

  factory ItemPedido.fromJson(Map<String, dynamic> json) {
    return ItemPedido(
      id: json['id'] ?? '',
      tipoItem: json['tipo_item'] ?? '',
      itemId: json['item_id'] ?? '',
      descripcion: json['descripcion'] ?? '',
      cantidad: json['cantidad'] ?? 0,
      precioUnitario: (json['precio_unitario'] ?? 0).toDouble(),
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      producto: json['producto'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tipo_item': tipoItem,
      'item_id': itemId,
      'descripcion': descripcion,
      'cantidad': cantidad,
      'precio_unitario': precioUnitario,
    };
  }
}

class Pedido {
  final String id;
  final String numeroPedido;
  final String estado;
  final double subtotal;
  final double impuesto;
  final double descuento;
  final double costoEnvio;
  final double totalFinal;
  final DateTime createdAt;
  final List<ItemPedido> items;

  Pedido({
    required this.id,
    required this.numeroPedido,
    required this.estado,
    required this.subtotal,
    required this.impuesto,
    required this.descuento,
    required this.costoEnvio,
    required this.totalFinal,
    required this.createdAt,
    required this.items,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) {
    return Pedido(
      id: json['id'] ?? '',
      numeroPedido: json['numero_pedido'] ?? '',
      estado: json['estado'] ?? 'PENDIENTE',
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      impuesto: (json['impuesto'] ?? 0).toDouble(),
      descuento: (json['descuento'] ?? 0).toDouble(),
      costoEnvio: (json['costo_envio'] ?? 0).toDouble(),
      totalFinal: (json['total_final'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      items: (json['items'] as List)
          .map((i) => ItemPedido.fromJson(i))
          .toList(),
    );
  }

  String get totalFormateado => '\$${totalFinal.toStringAsFixed(2)}';
}
