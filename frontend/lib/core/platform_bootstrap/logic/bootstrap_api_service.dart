import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class BootstrapApiService {
  static const String _baseUrl = 'http://10.0.2.2:3000';

  Future<Map<String, dynamic>> fetchBootstrapContext() async {
    // 🔹 Temporary hardcoded token (later: local storage / secure storage)
    const String token = 'demo-token';

    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/api/bootstrap/context'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }

      // 🔒 Backend responded but not OK
      throw HttpException(
        'Bootstrap failed with status ${response.statusCode}',
      );
    } on SocketException {
      // 🌐 No internet / server unreachable
      throw Exception('NO_NETWORK');
    } on HttpException {
      rethrow;
    } catch (e) {
      // ❌ Unknown / parsing error
      throw Exception('BOOTSTRAP_UNKNOWN_ERROR');
    }
  }
}
