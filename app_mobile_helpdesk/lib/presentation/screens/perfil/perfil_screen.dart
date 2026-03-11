import 'package:app_mobile_helpdesk/core/constants/api_endpoints.dart';
import 'package:app_mobile_helpdesk/core/di/injection.dart';
import 'package:app_mobile_helpdesk/domain/services/storage_service.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../../providers/auth_provider.dart';
import 'editar_perfil_screen.dart'; // 👈 IMPORTAR LA PANTALLA DE EDICIÓN

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  File? _imageFile;
  bool _isUploading = false;
  final picker = ImagePicker();
  final storageService = getIt<StorageService>();

  Future<void> _checkPermissions() async {
    if (await Permission.storage.isDenied) {
      await Permission.storage.request();
    }
  }

  Future<void> _pickImage() async {
    await _checkPermissions();

    try {
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final fileSize = await file.length();

        if (fileSize > 2 * 1024 * 1024) {
          _showErrorSnackBar('La imagen no debe superar los 2MB');
          return;
        }

        setState(() {
          _imageFile = file;
        });
        await _uploadImage();
      }
    } catch (e) {
      print('Error picking image: $e');
      _showErrorSnackBar('Error al seleccionar imagen');
    }
  }

  Future<void> _uploadImage() async {
    if (_imageFile == null) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = await storageService.getToken();

      if (token == null) {
        throw Exception('No hay sesión activa');
      }

      final bytes = await _imageFile!.readAsBytes();
      final base64Image = base64Encode(bytes);
      final mimeType = _getMimeType(_imageFile!.path);

      print('📤 Subiendo imagen...');
      print('📏 Tamaño: ${bytes.length} bytes');
      print('🔗 URL: ${ApiEndpoints.baseUrl}/perfil/foto');

      final response = await Dio().patch(
        '${ApiEndpoints.baseUrl}${ApiEndpoints.perfilFoto}',
        data: {'foto_url': 'data:$mimeType;base64,$base64Image'},
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json',
          },
        ),
      );

      print('📥 Respuesta: ${response.statusCode}');
      print('📥 Data: ${response.data}');

      if (response.statusCode == 200) {
        await authProvider.refreshUser();

        if (mounted) {
          _showSuccessSnackBar('Foto actualizada correctamente');
        }
      }
    } on DioException catch (e) {
      print('❌ DioError: ${e.message}');
      print('❌ Response: ${e.response?.data}');

      String errorMessage = 'Error al subir la foto';

      if (e.response != null) {
        if (e.response?.data is Map) {
          errorMessage = e.response?.data['error'] ?? errorMessage;
        }
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Error de conexión';
      } else if (e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Tiempo de espera agotado';
      }

      _showErrorSnackBar(errorMessage);
    } catch (e) {
      print('❌ Error inesperado: $e');
      _showErrorSnackBar('Error inesperado');
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  void _showSuccessSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  String _getMimeType(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  void _navigateToEditProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const EditarPerfilScreen()),
    ).then((_) {
      // Cuando vuelva de la pantalla de edición, refrescar los datos
      Provider.of<AuthProvider>(context, listen: false).refreshUser();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Mi Perfil',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          // 👇 BOTÓN DE EDITAR PERFIL
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _navigateToEditProfile,
            tooltip: 'Editar perfil',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Foto de perfil
            Stack(
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey.shade300, width: 3),
                    image: user?.fotoUrl != null
                        ? DecorationImage(
                            image: NetworkImage(user!.fotoUrl!),
                            fit: BoxFit.cover,
                          )
                        : (_imageFile != null
                              ? DecorationImage(
                                  image: FileImage(_imageFile!),
                                  fit: BoxFit.cover,
                                )
                              : null),
                  ),
                  child: user?.fotoUrl == null && _imageFile == null
                      ? const Icon(Icons.person, size: 60, color: Colors.grey)
                      : null,
                ),
                if (_isUploading)
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black54,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                    ),
                  ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: _isUploading ? null : _pickImage,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.camera_alt,
                        color: _isUploading ? Colors.grey : Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Nombre
            Text(
              user?.nombreCompleto ?? 'Usuario',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),

            // Email
            Text(
              user?.email ?? '',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 8),

            // Rol
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Text(
                user?.rol ?? 'CLIENTE',
                style: TextStyle(
                  color: Colors.blue.shade700,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Información de contacto
            _buildInfoCard(
              icon: Icons.phone_outlined,
              title: 'Teléfono',
              value: user?.telefono ?? 'No especificado',
            ),
            const SizedBox(height: 12),

            _buildInfoCard(
              icon: Icons.email_outlined,
              title: 'Email',
              value: user?.email ?? '',
            ),
            const SizedBox(height: 12),

            _buildInfoCard(
              icon: Icons.calendar_today_outlined,
              title: 'Miembro desde',
              value: _formatDate(user?.createdAt),
            ),

            const SizedBox(height: 24),

            // 👇 BOTÓN DE EDITAR PERFIL (también como botón grande)
            ElevatedButton.icon(
              onPressed: _navigateToEditProfile,
              icon: const Icon(Icons.edit),
              label: const Text('Editar Perfil'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.black, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Desconocido';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (e) {
      return 'Desconocido';
    }
  }
}
