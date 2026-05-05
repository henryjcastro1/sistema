import 'package:dio/dio.dart';
import '../../core/constants/api_endpoints.dart';
import '../../data/models/transaccion.dart';
import 'storage_service.dart';

class PagoService {
  final StorageService _storageService;

  PagoService(this._storageService);

  Future<List<Transaccion>> getTransacciones() async {
    try {
      final token = await _storageService.getToken();
      if (token == null) throw Exception('No hay sesión activa');

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/pagos',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data as List;
        return data.map((t) => Transaccion.fromJson(t)).toList();
      }
      throw Exception('Error al cargar transacciones');
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Error de conexión');
    }
  }

  Future<Transaccion> getTransaccionById(String id) async {
    try {
      final token = await _storageService.getToken();
      if (token == null) throw Exception('No hay sesión activa');

      final response = await Dio().get(
        '${ApiEndpoints.baseUrl}/pagos/$id',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return Transaccion.fromJson(response.data);
      }
      throw Exception('Error al cargar transacción');
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? 'Error de conexión');
    }
  }
}
