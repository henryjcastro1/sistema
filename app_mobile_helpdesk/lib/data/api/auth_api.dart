import 'package:dio/dio.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../../domain/services/storage_service.dart';

class AuthApi {
  final ApiClient _apiClient;
  final StorageService _storageService;

  // 👇 Constructor con 1 parámetro requerido
  AuthApi(this._storageService) : _apiClient = ApiClient();

  Future<Response> login(String email, String password) async {
    return await _apiClient.dio.post(
      ApiEndpoints.login,
      data: {'email': email, 'password': password},
    );
  }

  Future<Response> getCurrentUser() async {
    final token = await _storageService.getToken();
    return await _apiClient.dio.get(
      ApiEndpoints.me,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }

  Future<Response> logout() async {
    final token = await _storageService.getToken();
    return await _apiClient.dio.post(
      ApiEndpoints.logout,
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
  }
}
