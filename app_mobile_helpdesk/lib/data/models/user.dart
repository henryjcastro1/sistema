class User {
  final String id;
  final String nombre;
  final String apellido;
  final String email;
  final String rol;
  final String? fotoUrl;
  final String? telefono; // 👈 AGREGADO
  final String? createdAt; // 👈 AGREGADO

  User({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.email,
    required this.rol,
    this.fotoUrl,
    this.telefono, // 👈 AGREGADO
    this.createdAt, // 👈 AGREGADO
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      email: json['email'] ?? '',
      rol: json['rol'] ?? 'CLIENTE',
      fotoUrl: json['foto_url'],
      telefono: json['telefono'], // 👈 AGREGADO
      createdAt: json['created_at'], // 👈 AGREGADO
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nombre': nombre,
      'apellido': apellido,
      'email': email,
      'rol': rol,
      'foto_url': fotoUrl,
      'telefono': telefono, // 👈 AGREGADO
      'created_at': createdAt, // 👈 AGREGADO
    };
  }

  String get nombreCompleto => '$nombre $apellido';
}
