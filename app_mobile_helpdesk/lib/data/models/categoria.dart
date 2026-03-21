class Categoria {
  final String id;
  final String nombre;
  final String? descripcion;
  final String? imagenUrl;
  final int productosCount;
  final List<Subcategoria> subcategorias;

  Categoria({
    required this.id,
    required this.nombre,
    this.descripcion,
    this.imagenUrl,
    required this.productosCount,
    required this.subcategorias,
  });

  factory Categoria.fromJson(Map<String, dynamic> json) {
    // 👇 CONVERTIR A INT DE FORMA SEGURA
    int productosCount = 0;
    if (json['productos_count'] != null) {
      if (json['productos_count'] is int) {
        productosCount = json['productos_count'];
      } else if (json['productos_count'] is String) {
        productosCount = int.tryParse(json['productos_count']) ?? 0;
      }
    }

    return Categoria(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      imagenUrl: json['imagen_url'],
      productosCount: productosCount, // 👈 USAR VALOR CONVERTIDO
      subcategorias:
          (json['subcategorias'] as List?)
              ?.map((s) => Subcategoria.fromJson(s))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'imagen_url': imagenUrl,
      'productos_count': productosCount,
      'subcategorias': subcategorias.map((s) => s.toJson()).toList(),
    };
  }
}

class Subcategoria {
  final String id;
  final String nombre;
  final String? descripcion;
  final int productosCount;

  Subcategoria({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.productosCount,
  });

  factory Subcategoria.fromJson(Map<String, dynamic> json) {
    // 👇 CONVERTIR A INT DE FORMA SEGURA TAMBIÉN AQUÍ
    int productosCount = 0;
    if (json['productos_count'] != null) {
      if (json['productos_count'] is int) {
        productosCount = json['productos_count'];
      } else if (json['productos_count'] is String) {
        productosCount = int.tryParse(json['productos_count']) ?? 0;
      }
    }

    return Subcategoria(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      descripcion: json['descripcion'],
      productosCount: productosCount,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
      'productos_count': productosCount,
    };
  }
}
