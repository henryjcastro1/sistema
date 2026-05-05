// lib/core/di/injection.dart
import 'package:app_mobile_helpdesk/data/api/auth_api.dart';
import 'package:app_mobile_helpdesk/domain/services/pago_service.dart';
import 'package:app_mobile_helpdesk/domain/services/servicio_service.dart';
import 'package:get_it/get_it.dart';
import '../../domain/services/auth_service.dart';
import '../../domain/services/pedido_service.dart';
import '../../domain/services/storage_service.dart';
import '../../presentation/providers/auth_provider.dart';

final GetIt getIt = GetIt.instance;

Future<void> initializeDependencies() async {
  // ========== DOMAIN SERVICES (primero, sin dependencias) ==========
  getIt.registerLazySingleton<StorageService>(() => StorageService());

  // ========== CONFIGURAR DIO (opcional, si lo necesitas) ==========
  // Nota: Tu AuthApi no usa Dio directamente, usa ApiClient internamente
  // Por lo tanto, no necesitas registrar Dio aquí a menos que otros servicios lo usen

  // ========== DATA APIS ==========
  // 🔥 CORREGIDO: AuthApi recibe StorageService, NO Dio
  getIt.registerLazySingleton<AuthApi>(() => AuthApi(getIt<StorageService>()));

  // ========== DOMAIN SERVICES ==========
  getIt.registerLazySingleton<AuthService>(
    () => AuthService(getIt<AuthApi>(), getIt<StorageService>()),
  );

  // 🔥 CORREGIDO: ServicioService solo recibe AuthService, sin parámetro dio
  getIt.registerLazySingleton<ServicioService>(
    () => ServicioService(getIt<AuthService>()),
  );

  // Registrar PedidoService
  getIt.registerLazySingleton<PedidoService>(
    () => PedidoService(getIt<StorageService>()),
  );

  // ========== PRESENTATION PROVIDERS ==========
  getIt.registerFactory<AuthProvider>(
    () => AuthProvider(getIt<AuthService>(), getIt<StorageService>()),
  );

  getIt.registerLazySingleton<PagoService>(
    () => PagoService(getIt<StorageService>()),
  );
}
