// lib/core/constants/api_endpoints.dart
class ApiEndpoints {
  // ✅ Usar la IP de tu Wi-Fi
  static const String baseUrl = 'http://192.168.1.7:3000/api/mobile';

  // Para emulador Android: 'http://10.0.2.2:3000/api/mobile'
  // Para iOS simulator: 'http://localhost:3000/api/mobile'
  // Para dispositivo físico: 'http://192.168.1.7:3000/api/mobile'

  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';
  static const String perfilFoto = '/perfil/foto';

  static const String servicios = '/servicios';
  static const String pedidos = '/pedidos';
  static const String perfil = '/perfil';

  static const String productos = '/productos';
  static const String categorias = '/categorias';
  static const String pagos = '/pagos';

  // Obtener la URL base del servidor (sin /api/mobile)
  static String get serverBaseUrl {
    if (baseUrl.endsWith('/api/mobile')) {
      return baseUrl.substring(0, baseUrl.length - '/api/mobile'.length);
    }
    return baseUrl;
  }

  // Método para obtener URL completa de imágenes
  static String getImageUrl(String? path) {
    if (path == null || path.isEmpty || path.contains('undefined')) {
      print('🚨 URL inválida detectada: $path');
      return '';
    }

    String cleanPath = path;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    final fullUrl = '$serverBaseUrl/$cleanPath';
    print('🖼️ URL imagen: $fullUrl');
    return fullUrl;
  }
}
