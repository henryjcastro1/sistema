import 'package:flutter/material.dart';
import '../../domain/services/auth_service.dart';
import '../../domain/services/storage_service.dart';
import '../../data/models/user.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;
  final StorageService _storageService;

  User? _user;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._authService, this._storageService);

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final result = await _authService.login(email, password);

    _isLoading = false;

    if (result['success']) {
      _user = result['user'];
      notifyListeners();
      return true;
    } else {
      _error = result['error'];
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    _user = null;

    _isLoading = false;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    final hasToken = await _storageService.getToken() != null;

    if (hasToken) {
      final user = await _authService.getCurrentUser();
      if (user != null) {
        _user = user;
      } else {
        await _storageService.clearAll();
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  // 👇 NUEVO MÉTODO AGREGADO
  Future<void> refreshUser() async {
    if (!isAuthenticated) return;

    _isLoading = true;
    notifyListeners();

    final updatedUser = await _authService.getCurrentUser();
    if (updatedUser != null) {
      _user = updatedUser;
      await _storageService.saveUser(updatedUser.toJson());
    }

    _isLoading = false;
    notifyListeners();
  }
}
