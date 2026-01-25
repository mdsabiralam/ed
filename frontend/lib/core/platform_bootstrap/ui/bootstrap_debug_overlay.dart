import 'package:flutter/material.dart';

class BootstrapDebugOverlay extends StatelessWidget {
  final String userId;
  final String role;
  final String instituteId;
  final String plan;
  final int pluginCount;

  const BootstrapDebugOverlay({
    super.key,
    required this.userId,
    required this.role,
    required this.instituteId,
    required this.plan,
    required this.pluginCount,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 16,
      left: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.8),
          borderRadius: BorderRadius.circular(8),
        ),
        child: DefaultTextStyle(
          style: const TextStyle(color: Colors.white, fontSize: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '🔧 Bootstrap Debug Overlay',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text('User ID: $userId'),
              Text('Role: $role'),
              Text('Institute ID: $instituteId'),
              Text('Plan: $plan'),
              Text('Loaded Plugins: $pluginCount'),
            ],
          ),
        ),
      ),
    );
  }
}
