import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import '../../core/constants/app_constants.dart';

class StorageService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConstants.tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: AppConstants.tokenKey);
  }

  Future<void> removeToken() async {
    await _storage.delete(key: AppConstants.tokenKey);
  }

  Future<void> saveUser(Map<String, dynamic> user) async {
    await _storage.write(key: AppConstants.userKey, value: json.encode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final userData = await _storage.read(key: AppConstants.userKey);
    if (userData != null) {
      return json.decode(userData);
    }
    return null;
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
