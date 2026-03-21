import 'package:app_mobile_helpdesk/presentation/providers/carrito_provider.dart'; // 👈 AGREGAR
import 'package:app_mobile_helpdesk/presentation/screens/carrito/carrito_screen.dart';
import 'package:app_mobile_helpdesk/presentation/screens/perfil/perfil_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/di/injection.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/welcome/welcome_screen.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/main/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDependencies();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => getIt<AuthProvider>()),
        ChangeNotifierProvider(create: (_) => CarritoProvider()), // 👈 AGREGAR
      ],
      child: MaterialApp(
        title: 'HelpDesk Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
        initialRoute: '/',
        routes: {
          '/': (context) => const WelcomeScreen(),
          '/login': (context) => const LoginScreen(),
          '/main': (context) => const MainScreen(),
          '/register': (context) => const RegisterScreen(),
          '/perfil': (context) => const PerfilScreen(),
          '/carrito': (context) => const CarritoScreen(),
        },
      ),
    );
  }
}
