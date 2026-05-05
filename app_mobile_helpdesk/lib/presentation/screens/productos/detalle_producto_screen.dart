import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/producto.dart';
import '../../providers/carrito_provider.dart';

class DetalleProductoScreen extends StatefulWidget {
  final Producto producto;

  const DetalleProductoScreen({super.key, required this.producto});

  @override
  State<DetalleProductoScreen> createState() => _DetalleProductoScreenState();
}

class _DetalleProductoScreenState extends State<DetalleProductoScreen> {
  int _currentImageIndex = 0;
  late List<String> _allImages;

  @override
  void initState() {
    super.initState();
    _buildImageList();
  }

  void _buildImageList() {
    _allImages = [];

    // Agregar imagen principal
    if (widget.producto.imagenUrl != null &&
        widget.producto.imagenUrl!.isNotEmpty) {
      _allImages.add(widget.producto.imagenUrl!);
    }

    // Agregar imágenes adicionales
    if (widget.producto.imagenesAdicionales != null) {
      for (final img in widget.producto.imagenesAdicionales!) {
        if (img.imagenUrl.isNotEmpty) {
          _allImages.add(img.imagenUrl);
        }
      }
    }

    // Si no hay imágenes, agregar un placeholder
    if (_allImages.isEmpty) {
      _allImages.add('');
    }

    print('📸 Total imágenes: ${_allImages.length}');
  }

  // 🔥 FUNCIÓN PARA CONSTRUIR URL COMPLETA
  String _getFullImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }

    return 'http://192.168.1.7:3000$imagePath';
  }

  // 🔥 FUNCIÓN PARA MOSTRAR IMAGEN
  Widget _buildImage(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) {
      return Center(
        child: Icon(
          Icons.image_not_supported,
          size: 80,
          color: Colors.grey.shade400,
        ),
      );
    }

    // Si es Base64
    if (imageUrl.startsWith('data:image')) {
      try {
        String base64Data = imageUrl;
        if (imageUrl.contains(',')) {
          base64Data = imageUrl.split(',').last;
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
                size: 80,
                color: Colors.grey.shade400,
              ),
            );
          },
        );
      } catch (e) {
        print('❌ Error decodificando Base64: $e');
        return Center(
          child: Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.grey.shade400,
          ),
        );
      }
    }

    // Si es URL de red
    final fullUrl = _getFullImageUrl(imageUrl);
    print('📸 Cargando imagen desde: $fullUrl');

    return GestureDetector(
      onTap: () {
        if (_allImages.length > 1) {
          _showFullImageGallery(context);
        }
      },
      child: Image.network(
        fullUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          print('❌ Error cargando imagen: $error');
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.broken_image, size: 80, color: Colors.grey.shade400),
                const SizedBox(height: 8),
                Text(
                  'Error al cargar imagen',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                ),
              ],
            ),
          );
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                        : null,
                    strokeWidth: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Cargando imagen...',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // 🔥 GALERÍA COMPLETA EN DIÁLOGO
  void _showFullImageGallery(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            PageView.builder(
              controller: PageController(initialPage: _currentImageIndex),
              onPageChanged: (index) {
                setState(() {
                  _currentImageIndex = index;
                });
              },
              itemCount: _allImages.length,
              itemBuilder: (context, index) {
                return InteractiveViewer(
                  panEnabled: true,
                  minScale: 0.5,
                  maxScale: 4,
                  child: _allImages[index].isNotEmpty
                      ? _buildImage(_allImages[index])
                      : Center(
                          child: Icon(
                            Icons.broken_image,
                            size: 80,
                            color: Colors.grey.shade600,
                          ),
                        ),
                );
              },
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(context),
              ),
            ),
            Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${_currentImageIndex + 1} / ${_allImages.length}',
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 🔥 BOTONES DE NAVEGACIÓN ENTRE IMÁGENES
  Widget _buildNavigationButtons() {
    if (_allImages.length <= 1) return const SizedBox.shrink();

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: _currentImageIndex > 0
              ? () {
                  setState(() {
                    _currentImageIndex--;
                  });
                }
              : null,
          icon: Icon(Icons.chevron_left, size: 32),
          color: Colors.grey.shade700,
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            '${_currentImageIndex + 1} / ${_allImages.length}',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade700,
            ),
          ),
        ),
        IconButton(
          onPressed: _currentImageIndex < _allImages.length - 1
              ? () {
                  setState(() {
                    _currentImageIndex++;
                  });
                }
              : null,
          icon: Icon(Icons.chevron_right, size: 32),
          color: Colors.grey.shade700,
        ),
      ],
    );
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

  void _agregarAlCarrito(BuildContext context) {
    final carritoProvider = Provider.of<CarritoProvider>(
      context,
      listen: false,
    );

    final puedeAgregar = carritoProvider.puedeAgregar(
      widget.producto,
      cantidad: 1,
    );

    if (!puedeAgregar) {
      final cantidadEnCarrito = carritoProvider.obtenerCantidadEnCarrito(
        widget.producto.id,
      );
      final disponible = widget.producto.stock - cantidadEnCarrito;

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

    final agregado = carritoProvider.agregarProducto(
      widget.producto,
      cantidad: 1,
    );

    if (agregado) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${widget.producto.nombre} agregado al carrito'),
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
          widget.producto.nombre,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagen principal
            Container(
              width: double.infinity,
              height: 350,
              color: Colors.grey.shade100,
              child: _buildImage(_allImages[_currentImageIndex]),
            ),

            // Navegación entre imágenes (solo si hay más de 1)
            if (_allImages.length > 1) ...[
              const SizedBox(height: 12),
              _buildNavigationButtons(),
            ],

            const SizedBox(height: 8),

            // Información del producto
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Marca y modelo
                  if (widget.producto.marca != null ||
                      widget.producto.modelo != null) ...[
                    Text(
                      '${widget.producto.marca ?? ''} ${widget.producto.modelo ?? ''}'
                          .trim(),
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Nombre
                  Text(
                    widget.producto.nombre,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Precio
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
                            widget.producto.precioFormateado,
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),
                      if (widget.producto.stock > 0)
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
                                '${widget.producto.stock} disponibles',
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

                  const Divider(height: 32),

                  // Descripción
                  if (widget.producto.descripcion != null) ...[
                    const Text(
                      'Descripción',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.producto.descripcion!,
                      style: const TextStyle(fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Información adicional
                  if (widget.producto.sku != null ||
                      widget.producto.categoriaNombre != null) ...[
                    const Text(
                      'Información adicional',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (widget.producto.sku != null)
                      _buildInfoRow('SKU', widget.producto.sku!),
                    if (widget.producto.categoriaNombre != null)
                      _buildInfoRow(
                        'Categoría',
                        widget.producto.categoriaNombre!,
                      ),
                    if (widget.producto.subcategoriaNombre != null)
                      _buildInfoRow(
                        'Subcategoría',
                        widget.producto.subcategoriaNombre!,
                      ),
                    if (widget.producto.monedaCodigo != null)
                      _buildInfoRow('Moneda', widget.producto.monedaCodigo!),
                    if (widget.producto.garantiaMeses != null &&
                        widget.producto.garantiaMeses! > 0)
                      _buildInfoRow(
                        'Garantía',
                        '${widget.producto.garantiaMeses} meses',
                      ),
                    if (widget.producto.pesoKg != null &&
                        widget.producto.pesoKg! > 0)
                      _buildInfoRow('Peso', '${widget.producto.pesoKg} kg'),
                    if (widget.producto.dimensiones != null)
                      _buildInfoRow(
                        'Dimensiones',
                        '${widget.producto.dimensiones!['largo']} x ${widget.producto.dimensiones!['ancho']} x ${widget.producto.dimensiones!['alto']} cm',
                      ),
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
          onPressed: widget.producto.stock > 0
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
}
