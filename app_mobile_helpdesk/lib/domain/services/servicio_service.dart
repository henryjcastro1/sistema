// lib/domain/services/servicio_service.dart
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:app_mobile_helpdesk/core/constants/api_endpoints.dart';
import 'package:app_mobile_helpdesk/core/network/api_client.dart';
import 'package:app_mobile_helpdesk/data/models/servicio.dart';
import 'package:app_mobile_helpdesk/domain/services/auth_service.dart';

class ServicioService {
  final AuthService _authService;
  final ApiClient _apiClient;

  ServicioService(this._authService) : _apiClient = ApiClient();

  /// Decodificar token para ver el rol
  void _decodificarToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length == 3) {
        // Decodificar el payload (segunda parte)
        String payload = parts[1];

        // Normalizar base64
        payload = payload.replaceAll('-', '+').replaceAll('_', '/');
        while (payload.length % 4 != 0) {
          payload += '=';
        }

        final bytes = base64.decode(payload);
        final decoded = utf8.decode(bytes);
        final Map<String, dynamic> data = json.decode(decoded);

        print('📦 ========== TOKEN DECODIFICADO ==========');
        print('👤 ID: ${data['id']}');
        print('📧 Email: ${data['email']}');
        print('🎭 Rol: ${data['rol']}');
        print('📛 Nombre: ${data['nombre']}');
        print(
          '📅 Expira: ${DateTime.fromMillisecondsSinceEpoch(data['exp'] * 1000)}',
        );
        print('==========================================');
      }
    } catch (e) {
      print('❌ Error decodificando token: $e');
    }
  }

  /// Obtener todos los servicios del usuario autenticado
  Future<List<Servicio>> getMisServicios() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('❌ Token no encontrado');
        throw Exception('No autenticado. Por favor inicie sesión.');
      }

      print(
        '🔑 Token encontrado (primeros 50 chars): ${token.substring(0, token.length > 50 ? 50 : token.length)}...',
      );

      // Decodificar token para ver el rol
      _decodificarToken(token);

      print(
        '🌐 Haciendo petición a: ${ApiEndpoints.baseUrl}${ApiEndpoints.servicios}',
      );

      final response = await _apiClient.dio.get(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.servicios}',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      print('✅ Response status: ${response.statusCode}');
      print('📊 Cantidad de servicios recibidos: ${response.data.length}');

      if (response.data.isNotEmpty) {
        print('📋 Primer servicio:');
        print('   - ID: ${response.data[0]['id']}');
        print('   - Título: ${response.data[0]['titulo']}');
        print('   - Usuario ID: ${response.data[0]['usuario_id']}');
        print('   - Estado: ${response.data[0]['estado']}');
      }

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Servicio.fromJson(json)).toList();
      } else {
        throw Exception('Error al cargar servicios');
      }
    } on DioException catch (e) {
      print('❌ DioException:');
      print('   - Status: ${e.response?.statusCode}');
      print('   - Mensaje: ${e.message}');
      if (e.response?.data != null) {
        print('   - Data: ${e.response?.data}');
      }
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
      throw Exception('Error de conexión: ${e.message}');
    } catch (e) {
      print('❌ Error inesperado: $e');
      rethrow;
    }
  }

  /// Crear un nuevo servicio
  Future<Servicio> crearServicio({
    required String titulo,
    String? descripcion,
    int prioridad = 3,
    String? direccion,
  }) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No autenticado. Por favor inicie sesión.');
      }

      print('📝 Creando nuevo servicio:');
      print('   - Título: $titulo');
      print('   - Prioridad: $prioridad');
      print('   - Descripción: ${descripcion ?? "Sin descripción"}');

      final body = {
        'titulo': titulo,
        if (descripcion != null && descripcion.isNotEmpty)
          'descripcion': descripcion,
        'prioridad': prioridad,
        if (direccion != null && direccion.isNotEmpty) 'direccion': direccion,
      };

      final response = await _apiClient.dio.post(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.servicios}',
        data: body,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        print('✅ Servicio creado exitosamente: ${response.data['id']}');
        return Servicio.fromJson(response.data);
      } else {
        final error = response.data;
        throw Exception(error['error'] ?? 'Error al crear servicio');
      }
    } on DioException catch (e) {
      print('❌ Error creando servicio: ${e.message}');
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
      throw Exception('Error de conexión: ${e.message}');
    } catch (e) {
      rethrow;
    }
  }

  /// Obtener un servicio por ID
  Future<Servicio> getServicioById(String id) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No autenticado. Por favor inicie sesión.');
      }

      final response = await _apiClient.dio.get(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.servicios}/$id',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return Servicio.fromJson(response.data);
      } else if (response.statusCode == 404) {
        throw Exception('Servicio no encontrado');
      } else {
        throw Exception('Error al cargar el servicio');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
      throw Exception('Error de conexión: ${e.message}');
    } catch (e) {
      rethrow;
    }
  }

  /// Cancelar un servicio (solo si está en estado SOLICITADO)
  Future<bool> cancelarServicio(String id) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No autenticado. Por favor inicie sesión.');
      }

      final response = await _apiClient.dio.put(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.servicios}/$id/cancelar',
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        final error = response.data;
        throw Exception(error['error'] ?? 'Error al cancelar servicio');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Sesión expirada. Por favor inicie sesión nuevamente.');
      }
      throw Exception('Error de conexión: ${e.message}');
    } catch (e) {
      rethrow;
    }
  }
}
