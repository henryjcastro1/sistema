import 'package:flutter/material.dart';
import '../../widgets/background_gradient.dart';
import '../../widgets/custom_button.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BackgroundGradient(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const Spacer(),

              // LOGO
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  color: Colors.white.withOpacity(0.08),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.support_agent,
                  size: 65,
                  color: Colors.white,
                ),
              ),

              const SizedBox(height: 40),

              // TITULO
              const Text(
                "HelpDesk",
                style: TextStyle(
                  fontSize: 42,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),

              const SizedBox(height: 10),

              // SUBTITULO
              Text(
                "Gestión inteligente de servicios técnicos",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withOpacity(0.75),
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 50),

              // FEATURES
              Column(
                children: [
                  _featureCard(
                    icon: Icons.build_outlined,
                    text: "Solicita soporte técnico rápidamente",
                  ),
                  const SizedBox(height: 14),

                  _featureCard(
                    icon: Icons.inventory_2_outlined,
                    text: "Gestiona pedidos y servicios",
                  ),
                  const SizedBox(height: 14),

                  _featureCard(
                    icon: Icons.lock_outline,
                    text: "Pagos seguros y seguimiento",
                  ),
                ],
              ),

              const SizedBox(height: 60),

              // BOTON CENTRAL
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: "Ingresar",
                  onPressed: () {
                    Navigator.pushNamed(context, '/main');
                  },
                  color: Colors.white,
                  textColor: Colors.black,
                ),
              ),

              const SizedBox(height: 25),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _featureCard({required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: Colors.white.withOpacity(0.08),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Colors.white, fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}
