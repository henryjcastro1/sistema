import 'package:dio/dio.dart';
import '../../core/constants/api_endpoints.dart';
import '../../data/models/pedido.dart';
import 'storage_service.dart';

class PedidoService {
  final StorageService _storageService;

  PedidoService(this._storageService);

  Future<List<Pedido>> getPedidos({String? estado}) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) throw Exception('No hay sesión activa');

      final queryParams = <String, dynamic>{};
      if (estado != null && estado != 'TODOS') {
        queryParams['estado'] = estado;
      }

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/pedidos',
        queryParameters: queryParams,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map && data['pedidos'] is List) {
          return (data['pedidos'] as List)
              .map((p) => Pedido.fromJson(p))
              .toList();
        }
        return [];
      }
      throw Exception('Error al cargar pedidos');
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Error de conexión');
    }
  }

  Future<Pedido> getPedidoById(String id) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) throw Exception('No hay sesión activa');

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/pedidos/$id',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return Pedido.fromJson(response.data);
      }
      throw Exception('Error al cargar pedido');
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Error de conexión');
    }
  }
}
