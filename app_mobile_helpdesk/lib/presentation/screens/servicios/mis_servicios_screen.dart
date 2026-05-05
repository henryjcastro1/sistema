// lib/presentation/screens/mis_servicios_screen.dart
import 'package:app_mobile_helpdesk/data/api/auth_api.dart';
import 'package:app_mobile_helpdesk/domain/services/auth_service.dart';
import 'package:app_mobile_helpdesk/domain/services/servicio_service.dart';
import 'package:app_mobile_helpdesk/domain/services/storage_service.dart';
import 'package:flutter/material.dart';
import 'package:app_mobile_helpdesk/data/models/servicio.dart';
import 'crear_servicio_screen.dart';
import 'detalle_servicio_screen.dart';

class MisServiciosScreen extends StatefulWidget {
  const MisServiciosScreen({super.key});

  @override
  State<MisServiciosScreen> createState() => _MisServiciosScreenState();
}

class _MisServiciosScreenState extends State<MisServiciosScreen> {
  late ServicioService _servicioService;
  List<Servicio> _servicios = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _inicializarServicios();
  }

  void _inicializarServicios() {
    final storageService = StorageService();
    final authApi = AuthApi(storageService);
    final authService = AuthService(authApi, storageService);
    _servicioService = ServicioService(authService);
    _cargarServicios();
  } // 👈 CIERRE CORREGIDO: faltaba esta llave

  Future<void> _cargarServicios() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final servicios = await _servicioService.getMisServicios();
      setState(() {
        _servicios = servicios;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _crearServicio() async {
    final result = await Navigator.push<Servicio>(
      context,
      MaterialPageRoute(builder: (_) => const CrearServicioScreen()),
    );

    if (result != null) {
      _cargarServicios();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Mis Servicios',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarServicios,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _crearServicio,
        backgroundColor: Colors.black,
        tooltip: 'Nuevo servicio',
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error: $_error',
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _cargarServicios,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_servicios.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.assignment, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No tienes servicios registrados',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _crearServicio,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
              ),
              child: const Text('Crear mi primer servicio'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _servicios.length,
      itemBuilder: (context, index) {
        final servicio = _servicios[index];
        return _buildServicioCard(servicio);
      },
    );
  }

  Widget _buildServicioCard(Servicio servicio) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DetalleServicioScreen(servicio: servicio),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    servicio.estadoIcon,
                    style: const TextStyle(fontSize: 20),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      servicio.titulo,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: servicio.estadoColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      servicio.estadoTexto,
                      style: TextStyle(
                        fontSize: 12,
                        color: servicio.estadoColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                servicio.descripcion ?? 'Sin descripción',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildInfoChip(
                    icon: Icons.priority_high,
                    label: servicio.prioridadTexto,
                    color: servicio.prioridadColor,
                  ),
                  const SizedBox(width: 8),
                  _buildInfoChip(
                    icon: Icons.calendar_today,
                    label: _formatDate(servicio.fechaSolicitado),
                    color: Colors.blue,
                  ),
                  if (servicio.tecnicoNombre != null) ...[
                    const SizedBox(width: 8),
                    _buildInfoChip(
                      icon: Icons.person,
                      label: servicio.tecnicoNombre!,
                      color: Colors.green,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
