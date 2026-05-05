import 'dart:convert';

import 'package:app_mobile_helpdesk/data/models/categoria.dart';
import 'package:app_mobile_helpdesk/data/models/producto.dart';
import 'package:app_mobile_helpdesk/presentation/screens/productos/detalle_producto_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:app_mobile_helpdesk/core/utils/currency_formatter.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_endpoints.dart';
import '../../../core/di/injection.dart';
import '../../../domain/services/storage_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/carrito_provider.dart';

class ProductosScreen extends StatefulWidget {
  const ProductosScreen({super.key});

  @override
  State<ProductosScreen> createState() => _ProductosScreenState();
}

class _ProductosScreenState extends State<ProductosScreen> {
  List<Producto> _productos = [];
  List<Categoria> _categorias = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  int _offset = 0;
  final int _limit = 10;
  bool _hasMore = true;
  String? _categoriaSeleccionada;
  String? _busqueda;
  final _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Control de vista (lista o cuadrícula)
  bool _isGridView = false;

  final storageService = getIt<StorageService>();

  @override
  void initState() {
    super.initState();
    print('🚀 Inicializando ProductosScreen');
    _cargarCategorias();
    _cargarProductos();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    print('🧹 Limpiando ProductosScreen');
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMore) {
        print('📜 Scroll cerca del final, cargando más productos...');
        _cargarMasProductos();
      }
    }
  }

  String _getFullImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }
    return ApiEndpoints.getImageUrl(imagePath);
  }

  Widget _buildProductImage(String? imageUrl) {
    if (imageUrl == null || imageUrl.isEmpty) {
      return Icon(
        Icons.image_not_supported,
        size: 40,
        color: Colors.grey.shade400,
      );
    }

    // Base64
    if (imageUrl.startsWith('data:image')) {
      try {
        String base64Data = imageUrl;
        if (imageUrl.contains(',')) {
          base64Data = imageUrl.split(',').last;
        }
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.memory(
            base64Decode(base64Data),
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) =>
                Icon(Icons.broken_image, size: 40, color: Colors.grey.shade400),
          ),
        );
      } catch (e) {
        return Icon(Icons.error_outline, size: 40, color: Colors.grey.shade400);
      }
    }

    // URL de red
    final fullUrl = ApiEndpoints.getImageUrl(imageUrl);
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Image.network(
        fullUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) =>
            Icon(Icons.broken_image, size: 40, color: Colors.grey.shade400),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: SizedBox(
              width: 30,
              height: 30,
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                    : null,
                strokeWidth: 2,
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _cargarCategorias() async {
    print('📡 Iniciando carga de categorías...');
    print('🔗 URL: ${ApiEndpoints.baseUrl}/categorias');

    try {
      final response = await Dio().get('${ApiEndpoints.baseUrl}/categorias');
      print('📥 Status code categorías: ${response.statusCode}');

      if (response.statusCode == 200) {
        if (response.data is Map && response.data['categorias'] is List) {
          final categoriasList = response.data['categorias'] as List;
          print('📊 Número de categorías: ${categoriasList.length}');

          setState(() {
            _categorias = categoriasList
                .map((c) {
                  try {
                    return Categoria.fromJson(c);
                  } catch (e) {
                    print('❌ Error parseando categoría: $c');
                    return null;
                  }
                })
                .whereType<Categoria>()
                .toList();
          });
          print('✅ Categorías cargadas: ${_categorias.length}');
        }
      }
    } catch (e) {
      print('❌ Error cargando categorías: $e');
    }
  }

  Future<void> _cargarProductos({bool reset = false}) async {
    if (reset) {
      print('🔄 Reiniciando lista de productos');
      setState(() {
        _productos = [];
        _offset = 0;
        _hasMore = true;
      });
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    print('📡 Cargando productos (offset: $_offset, limit: $_limit)');

    try {
      final token = await storageService.getToken();

      final queryParams = {
        'limit': _limit.toString(),
        'offset': _offset.toString(),
        'categoria': ?_categoriaSeleccionada,
        if (_busqueda != null && _busqueda!.isNotEmpty) 'busqueda': _busqueda!,
      };

      print('📦 Query params: $queryParams');

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/productos',
        queryParameters: queryParams,
        options: Options(
          headers: token != null ? {'Authorization': 'Bearer $token'} : null,
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;

        if (data['productos'] is List) {
          final productosList = data['productos'] as List;
          print('📊 Productos recibidos: ${productosList.length}');

          final nuevosProductos = <Producto>[];

          for (var i = 0; i < productosList.length; i++) {
            try {
              final productoJson = productosList[i];
              final producto = Producto.fromJson(productoJson);
              nuevosProductos.add(producto);
              print('✅ Producto parseado: ${producto.nombre}');
            } catch (e) {
              print('❌ Error parseando producto $i: $e');
            }
          }

          setState(() {
            if (reset) {
              _productos = nuevosProductos;
            } else {
              _productos.addAll(nuevosProductos);
            }
            _offset += nuevosProductos.length;
            _hasMore = data['pagination']?['hasMore'] ?? false;
          });

          print('✅ Total productos cargados: ${_productos.length}');
        } else {
          setState(() {
            _errorMessage = 'Formato de respuesta incorrecto';
          });
        }
      } else {
        setState(() {
          _errorMessage = 'Error ${response.statusCode}';
        });
      }
    } on DioException catch (e) {
      print('❌ DioError: ${e.message}');
      String errorMessage = 'Error al cargar productos';
      if (e.response?.statusCode == 404) {
        errorMessage = 'Endpoint no encontrado (404)';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Error de conexión';
      } else if (e.response?.data != null &&
          e.response?.data['error'] != null) {
        errorMessage = e.response?.data['error'];
      }
      setState(() {
        _errorMessage = errorMessage;
      });
    } catch (e) {
      print('❌ Error inesperado: $e');
      setState(() {
        _errorMessage = 'Error inesperado';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _cargarMasProductos() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() {
      _isLoadingMore = true;
    });
    await _cargarProductos();
    setState(() {
      _isLoadingMore = false;
    });
  }

  void _buscarProductos() {
    print('🔍 Buscando: ${_searchController.text}');
    setState(() {
      _busqueda = _searchController.text;
    });
    _cargarProductos(reset: true);
  }

  void _seleccionarCategoria(String? categoriaId) {
    print('📁 Categoría seleccionada: $categoriaId');
    setState(() {
      _categoriaSeleccionada = categoriaId;
    });
    _cargarProductos(reset: true);
  }

  // VISTA DE LISTA
  Widget _buildListView() {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _productos.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _productos.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        return _buildProductoCard(_productos[index]);
      },
    );
  }

  // VISTA DE CUADRÍCULA
  Widget _buildGridView() {
    return GridView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _productos.length + (_hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _productos.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          );
        }
        return _buildProductoGridCard(_productos[index]);
      },
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 300),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inventory_2, size: 80, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                'No hay productos disponibles',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              Text(
                'Desliza hacia abajo para actualizar',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
        const SizedBox(height: 300),
      ],
    );
  }

  Widget _buildErrorState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 300),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 80, color: Colors.grey),
              const SizedBox(height: 16),
              Text(_errorMessage!, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => _cargarProductos(reset: true),
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 300),
      ],
    );
  }

  Widget _buildLoadingState() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 300),
        Center(child: CircularProgressIndicator()),
        SizedBox(height: 300),
      ],
    );
  }

  Widget _buildCarritoFAB(BuildContext context) {
    return Consumer<CarritoProvider>(
      builder: (context, carrito, child) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            FloatingActionButton(
              onPressed: () {
                Navigator.pushNamed(context, '/carrito');
              },
              backgroundColor: Colors.black,
              child: const Icon(Icons.shopping_cart, color: Colors.white),
            ),
            if (carrito.itemCount > 0)
              Positioned(
                right: -4,
                top: -4,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 20,
                    minHeight: 20,
                  ),
                  child: Text(
                    '${carrito.itemCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  // TARJETA PARA VISTA DE LISTA
  Widget _buildProductoCard(Producto producto) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          print('👆 Producto seleccionado: ${producto.nombre}');
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DetalleProductoScreen(producto: producto),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _buildProductImage(producto.imagenUrl),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      producto.nombre,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (producto.marca != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        producto.marca!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                    if (producto.descripcion != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        producto.descripcion!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          CurrencyFormatter.format(
                            producto.precio,
                            currencyCode: producto.monedaCodigo ?? 'COP',
                            symbol: producto.monedaSimbolo,
                          ),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (producto.stock > 0)
                          Text(
                            'Stock: ${producto.stock}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.red.shade100,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Sin stock',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.red.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (producto.destacado)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.star,
                    size: 16,
                    color: Colors.amber.shade800,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // TARJETA PARA VISTA DE CUADRÍCULA
  Widget _buildProductoGridCard(Producto producto) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          print('👆 Producto seleccionado: ${producto.nombre}');
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DetalleProductoScreen(producto: producto),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
              ),
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                child: _buildProductImage(producto.imagenUrl),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    producto.nombre,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (producto.marca != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      producto.marca!,
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          CurrencyFormatter.format(
                            producto.precio,
                            currencyCode: producto.monedaCodigo ?? 'COP',
                            symbol: producto.monedaSimbolo,
                          ),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (producto.destacado)
                        Container(
                          margin: const EdgeInsets.only(left: 4),
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.amber.shade100,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.star,
                            size: 12,
                            color: Colors.amber.shade800,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  if (producto.stock > 0)
                    Text(
                      'Stock: ${producto.stock}',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey.shade600,
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Sin stock',
                        style: TextStyle(
                          fontSize: 8,
                          color: Colors.red.shade700,
                          fontWeight: FontWeight.bold,
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

  void _mostrarFiltros(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Filtrar por categoría',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  FilterChip(
                    label: const Text('Todas'),
                    selected: _categoriaSeleccionada == null,
                    onSelected: (_) {
                      Navigator.pop(context);
                      _seleccionarCategoria(null);
                    },
                  ),
                  ..._categorias.map((categoria) {
                    return FilterChip(
                      label: Text(categoria.nombre),
                      selected: _categoriaSeleccionada == categoria.id,
                      onSelected: (_) {
                        Navigator.pop(context);
                        _seleccionarCategoria(categoria.id);
                      },
                    );
                  }),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: _buildCarritoFAB(context),
      floatingActionButtonLocation: FloatingActionButtonLocation.miniStartFloat,
      body: Column(
        children: [
          // Barra de búsqueda
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Buscar productos...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                    ),
                    onSubmitted: (_) => _buscarProductos(),
                  ),
                ),
                const SizedBox(width: 8),
                // Botón de cambio de vista
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: Icon(
                          Icons.view_list,
                          color: !_isGridView ? Colors.black : Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _isGridView = false;
                          });
                        },
                        tooltip: 'Ver como lista',
                        iconSize: 22,
                      ),
                      Container(
                        width: 1,
                        height: 24,
                        color: Colors.grey.shade400,
                      ),
                      IconButton(
                        icon: Icon(
                          Icons.grid_view,
                          color: _isGridView ? Colors.black : Colors.grey,
                        ),
                        onPressed: () {
                          setState(() {
                            _isGridView = true;
                          });
                        },
                        tooltip: 'Ver como cuadrícula',
                        iconSize: 22,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Botón de filtro
                IconButton(
                  icon: const Icon(Icons.filter_list),
                  onPressed: () => _mostrarFiltros(context),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.grey.shade200,
                  ),
                ),
              ],
            ),
          ),

          // Lista de productos con RefreshIndicator
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                print('🔄 Pull to refresh - Actualizando productos...');
                await _cargarProductos(reset: true);
              },
              color: Colors.black,
              backgroundColor: Colors.white,
              displacement: 40.0,
              strokeWidth: 2.0,
              child: _isLoading && _productos.isEmpty
                  ? _buildLoadingState()
                  : _errorMessage != null
                  ? _buildErrorState()
                  : _productos.isEmpty
                  ? _buildEmptyState()
                  : _isGridView
                  ? _buildGridView()
                  : _buildListView(),
            ),
          ),
        ],
      ),
    );
  }
}
