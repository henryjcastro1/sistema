class ApiEndpoints {
  static const String baseUrl = 'http://192.168.40.13:3000/api/mobile';
  // Para emulador Android: 'http://10.0.2.2:3000/api/mobile'
  // Para iOS simulator: 'http://localhost:3000/api/mobile'
  // Para dispositivo físico: 'http://192.168.x.x:3000/api/mobile'

  static const String login = '/auth/login';
  static const String me = '/auth/me';
  static const String logout = '/auth/logout';
  static const String perfilFoto =
      '/perfil/foto'; // 👈 CORREGIDO: agregar tipo String y ruta correcta

  static const String servicios = '/servicios';
  static const String pedidos = '/pedidos';
  static const String perfil = '/perfil';

  static const String productos = '/productos';
  static const String categorias = '/categorias';
}
