import 'package:flutter/material.dart';

class RoleBasedDashboard extends StatelessWidget {
  const RoleBasedDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          'Role Based Dashboard',
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}
