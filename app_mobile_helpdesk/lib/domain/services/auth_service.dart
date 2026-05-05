// lib/domain/services/auth_service.dart
import 'package:dio/dio.dart';
import 'package:app_mobile_helpdesk/data/api/auth_api.dart';
import '../../data/models/user.dart';
import 'storage_service.dart';

class AuthService {
  final AuthApi _authApi;
  final StorageService _storageService;

  AuthService(this._authApi, this._storageService);

  // 🔥 AGREGAR: Método para obtener el token
  Future<String?> getToken() async {
    return await _storageService.getToken();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _authApi.login(email, password);

      if (response.statusCode == 200) {
        final data = response.data;

        final userData = {
          'id': data['user']['id'],
          'nombre': data['user']['nombre'],
          'apellido': data['user']['apellido'],
          'email': data['user']['email'],
          'rol': data['user']['rol'],
          'foto_url': data['user']['foto_url'],
          'telefono': data['user']['telefono'],
          'created_at': data['user']['created_at'],
        };

        final user = User.fromJson(userData);

        await _storageService.saveToken(data['token']);
        await _storageService.saveUser(user.toJson());

        return {'success': true, 'user': user};
      } else {
        final errorMsg = response.data?['error'] ?? 'Error en el servidor';
        return {'success': false, 'error': errorMsg};
      }
    } on DioException catch (e) {
      if (e.response != null) {
        final errorMsg = e.response?.data?['error'] ?? 'Error del servidor';
        return {'success': false, 'error': errorMsg};
      } else {
        return {'success': false, 'error': 'Error de conexión: ${e.message}'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Error inesperado: $e'};
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      final token = await _storageService.getToken();
      if (token == null) return null;

      final response = await _authApi.getCurrentUser();

      if (response.statusCode == 200) {
        final data = response.data;

        final userData = {
          'id': data['user']['id'],
          'nombre': data['user']['nombre'],
          'apellido': data['user']['apellido'],
          'email': data['user']['email'],
          'rol': data['user']['rol'],
          'foto_url': data['user']['foto_url'],
          'telefono': data['user']['telefono'],
          'created_at': data['user']['created_at'],
        };

        return User.fromJson(userData);
      }
      return null;
    } catch (e) {
      print('Error getCurrentUser: $e');
      return null;
    }
  }

  Future<void> logout() async {
    try {
      await _authApi.logout();
    } catch (e) {
      // Ignorar error
    } finally {
      await _storageService.clearAll();
    }
  }
}
