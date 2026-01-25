import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class RoleSwitchScreen extends StatefulWidget {
  final String accessToken;

  const RoleSwitchScreen({super.key, required this.accessToken});

  @override
  State<RoleSwitchScreen> createState() => _RoleSwitchScreenState();
}

class _RoleSwitchScreenState extends State<RoleSwitchScreen> {
  List<String> roles = [];
  String? selectedRole;
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchRoles();
  }

  Future<void> fetchRoles() async {
    final res = await http.get(
      Uri.parse('http://localhost:3000/api/auth/roles'),
      headers: {'Authorization': 'Bearer ${widget.accessToken}'},
    );

    final data = jsonDecode(res.body);
    setState(() {
      roles = List<String>.from(data['roles']);
      loading = false;
    });
  }

  Future<void> switchRole() async {
    if (selectedRole == null) return;

    final res = await http.post(
      Uri.parse('http://localhost:3000/api/auth/switch-role'),
      headers: {
        'Authorization': 'Bearer ${widget.accessToken}',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'role': selectedRole, 'device_id': 'device-001'}),
    );

    final data = jsonDecode(res.body);

    // TODO: save new tokens securely
    print('NEW ACCESS TOKEN = ${data['access_token']}');

    // Navigate to dashboard
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Select Role')),
      body: Column(
        children: [
          ...roles.map(
            (r) => RadioListTile<String>(
              title: Text(r),
              value: r,
              groupValue: selectedRole,
              onChanged: (v) => setState(() => selectedRole = v),
            ),
          ),
          ElevatedButton(
            onPressed: switchRole,
            child: const Text('Confirm Role'),
          ),
        ],
      ),
    );
  }
}
