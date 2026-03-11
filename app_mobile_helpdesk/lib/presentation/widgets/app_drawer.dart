import 'package:app_mobile_helpdesk/data/models/user.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/main/main_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    final isAuthenticated = authProvider.isAuthenticated;

    return Drawer(
      child: Container(
        color: Colors.black,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Header del drawer - CAMBIA SEGÚN AUTENTICACIÓN
            if (isAuthenticated && user != null)
              _buildUserHeader(user)
            else
              _buildGuestHeader(),

            // Opciones GENERALES (siempre visibles)
            _buildMenuItem(
              context,
              icon: Icons.home,
              title: 'Inicio',
              index: 0,
            ),

            _buildMenuItem(
              context,
              icon: Icons.inventory_2,
              title: 'Productos',
              index: 1,
            ),

            _buildMenuItem(
              context,
              icon: Icons.support_agent,
              title: 'Servicios',
              index: 2,
            ),

            const Divider(color: Colors.white24),

            // Opciones para USUARIOS AUTENTICADOS
            if (isAuthenticated) ...[
              _buildAuthMenuItem(
                context,
                icon: Icons.person,
                title: 'Mi Perfil',
                onTap: () {
                  Navigator.pop(context); // Cerrar el drawer
                  Navigator.pushNamed(
                    context,
                    '/perfil',
                  ); // 👈 Navegar a la pantalla de perfil
                },
              ),

              _buildAuthMenuItem(
                context,
                icon: Icons.payment,
                title: 'Mis Pagos',
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Pagos - Próximamente')),
                  );
                },
              ),
            ],

            // Opciones GENERALES (visibles para todos)
            _buildAuthMenuItem(
              context,
              icon: Icons.settings,
              title: 'Configuración',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Configuración - Próximamente')),
                );
              },
            ),

            _buildAuthMenuItem(
              context,
              icon: Icons.help,
              title: 'Ayuda',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Ayuda - Próximamente')),
                );
              },
            ),

            const Divider(color: Colors.white24),

            // Opción de AUTENTICACIÓN (Login o Logout)
            if (!isAuthenticated)
              _buildAuthMenuItem(
                context,
                icon: Icons.login,
                title: 'Iniciar sesión',
                iconColor: Colors.greenAccent,
                textColor: Colors.greenAccent,
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushReplacementNamed(context, '/login');
                },
              )
            else
              _buildAuthMenuItem(
                context,
                icon: Icons.logout,
                title: 'Cerrar sesión',
                iconColor: Colors.redAccent,
                textColor: Colors.redAccent,
                onTap: () => _showLogoutDialog(context),
              ),
          ],
        ),
      ),
    );
  }

  // Header para usuario autenticado
  Widget _buildUserHeader(User user) {
    return UserAccountsDrawerHeader(
      accountName: Text(
        user.nombreCompleto,
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
      ),
      accountEmail: Text(user.email, style: const TextStyle(fontSize: 14)),
      currentAccountPicture: CircleAvatar(
        backgroundColor: Colors.white,
        child: Text(
          user.nombre.isNotEmpty ? user.nombre[0].toUpperCase() : 'U',
          style: const TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
      ),
      decoration: const BoxDecoration(
        color: Colors.black,
        image: DecorationImage(
          image: AssetImage('assets/images/fondo1.png'),
          fit: BoxFit.cover,
          opacity: 0.3,
        ),
      ),
    );
  }

  // Header para visitantes (no autenticados)
  Widget _buildGuestHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.black,
        image: DecorationImage(
          image: AssetImage('assets/images/fondo1.png'),
          fit: BoxFit.cover,
          opacity: 0.3,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CircleAvatar(
            backgroundColor: Colors.white,
            radius: 30,
            child: Icon(Icons.person, size: 40, color: Colors.black),
          ),
          const SizedBox(height: 16),
          const Text(
            'Visitante',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Inicia sesión para acceder',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  // Menú item para navegación principal (con índice)
  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required int index,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(title, style: const TextStyle(color: Colors.white)),
      onTap: () {
        Navigator.pop(context);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => MainScreen(initialIndex: index),
          ),
        );
      },
    );
  }

  // Menú item para acciones personalizadas
  Widget _buildAuthMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color iconColor = Colors.white,
    Color textColor = Colors.white,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor),
      title: Text(title, style: TextStyle(color: textColor)),
      onTap: onTap,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Cerrar sesión'),
          content: const Text('¿Estás seguro de que quieres cerrar sesión?'),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(context); // Cerrar diálogo
                final authProvider = Provider.of<AuthProvider>(
                  context,
                  listen: false,
                );
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, '/login');
                }
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Cerrar sesión'),
            ),
          ],
        );
      },
    );
  }
}
