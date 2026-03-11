import 'package:app_mobile_helpdesk/data/api/auth_api.dart';
import 'package:get_it/get_it.dart';
import '../../domain/services/auth_service.dart';
import '../../domain/services/storage_service.dart';
import '../../presentation/providers/auth_provider.dart';

final GetIt getIt = GetIt.instance;

Future<void> initializeDependencies() async {
  // ========== DOMAIN SERVICES ==========
  getIt.registerLazySingleton<StorageService>(() => StorageService());

  // ========== DATA APIS ==========
  // 👇 CORREGIDO: Ahora pasamos StorageService al constructor
  getIt.registerLazySingleton<AuthApi>(
    () => AuthApi(
      getIt<StorageService>(), // 👈 AGREGAMOS EL PARÁMETRO REQUERIDO
    ),
  );

  // ========== DOMAIN SERVICES (con dependencias) ==========
  getIt.registerLazySingleton<AuthService>(
    () => AuthService(getIt<AuthApi>(), getIt<StorageService>()),
  );

  // ========== PRESENTATION PROVIDERS ==========
  getIt.registerFactory<AuthProvider>(
    () => AuthProvider(getIt<AuthService>(), getIt<StorageService>()),
  );
}
