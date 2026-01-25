import 'package:flutter/material.dart';
import '../logic/bootstrap_api_service.dart';
import 'role_based_dashboard.dart';
import 'account_locked_screen.dart';
import 'offline_mode_screen.dart';
import 'bootstrap_debug_overlay.dart';

class AppBootstrapScreen extends StatefulWidget {
  const AppBootstrapScreen({super.key});

  @override
  State<AppBootstrapScreen> createState() => _AppBootstrapScreenState();
}

class _AppBootstrapScreenState extends State<AppBootstrapScreen> {
  String statusText = 'সিস্টেম প্রস্তুত করা হচ্ছে...';
  final bool showDebugOverlay = true;

  final BootstrapApiService _apiService = BootstrapApiService();

  // 🔹 Cached bootstrap context (frontend)
  Map<String, dynamic>? bootstrapContext;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      // 1️⃣ Load local session (placeholder)
      final String? token = 'local-token-placeholder';
      if (token == null) {
        throw Exception('No local token');
      }

      // 2️⃣ Network + system check (UI level)
      setState(() {
        statusText = 'নেটওয়ার্ক ও সিস্টেম যাচাই করা হচ্ছে...';
      });

      // 3️⃣ Fetch bootstrap context
      final result = await _apiService.fetchBootstrapContext();
      if (!mounted) return;

      // 4️⃣ Frontend cache
      setState(() {
        bootstrapContext = result;
        statusText = 'সিস্টেম প্রস্তুত';
      });

      // ⏱️ Debug overlay দেখানোর সময়
      await Future.delayed(const Duration(seconds: 2));

      // 5️⃣ Subscription validation
      final bool subscriptionValid =
          result['institute']['subscription_valid'] == true;

      final String role = result['user']['role'];

      // 6️⃣ Activate ed agent (non-voice placeholder)
      _activateEdAgent(result);

      // 7️⃣ Navigation decision
      if (subscriptionValid) {
        _navigateByRole(role);
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AccountLockedScreen()),
        );
      }
    } catch (e) {
      if (!mounted) return;

      // 🔹 Offline fallback + Debug visibility
      setState(() {
        statusText = 'ইন্টারনেট নেই, অফলাইন মোড চালু হচ্ছে';
        bootstrapContext = {
          'user': {'id': 'offline', 'role': 'unknown'},
          'institute': {'id': 'offline', 'plan': 'N/A'},
          'allowed_plugins': [],
        };
      });

      // ⏱️ Debug overlay দেখানোর সময়
      await Future.delayed(const Duration(seconds: 2));

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const OfflineModeScreen()),
      );
    }
  }

  // 🔹 Role-based dashboard resolution
  void _navigateByRole(String role) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const RoleBasedDashboard()),
    );
  }

  // 🔹 ed (AI agent) activation placeholder
  void _activateEdAgent(Map<String, dynamic> context) {
    debugPrint('[ed] Agent activated for role: ${context['user']['role']}');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.school, size: 80, color: Colors.blue),
                const SizedBox(height: 24),
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(statusText, style: const TextStyle(fontSize: 16)),
              ],
            ),
          ),

          // 🔹 Debug overlay (online + offline both)
          if (showDebugOverlay && bootstrapContext != null)
            BootstrapDebugOverlay(
              userId: bootstrapContext!['user']['id'],
              role: bootstrapContext!['user']['role'],
              instituteId: bootstrapContext!['institute']['id'],
              plan: bootstrapContext!['institute']['plan'],
              pluginCount:
                  (bootstrapContext!['allowed_plugins'] as List).length,
            ),
        ],
      ),
    );
  }
}
