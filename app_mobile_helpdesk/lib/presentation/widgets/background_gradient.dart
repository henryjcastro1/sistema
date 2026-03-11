import 'package:flutter/material.dart';

class BackgroundGradient extends StatelessWidget {
  final Widget child;
  final bool showDecorativeElements;

  const BackgroundGradient({
    super.key,
    required this.child,
    this.showDecorativeElements = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        image: DecorationImage(
          image: AssetImage(
            'assets/images/fondo1.png',
          ), // 👈 Tu imagen de fondo
          fit: BoxFit.cover, // Cubre toda la pantalla
          colorFilter: showDecorativeElements
              ? ColorFilter.mode(
                  Colors.black.withOpacity(
                    0.3,
                  ), // Oscurece la imagen para mejor contraste
                  BlendMode.darken,
                )
              : null,
        ),
      ),
      child: Stack(
        children: [
          // Elementos decorativos (opcionales)
          if (showDecorativeElements) ...[
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                ),
              ),
            ),
            Positioned(
              bottom: -30,
              left: -30,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                ),
              ),
            ),
            Positioned(
              top: 100,
              left: 20,
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.03),
                ),
              ),
            ),
            Positioned(
              bottom: 150,
              right: 40,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.03),
                ),
              ),
            ),
          ],
          child,
        ],
      ),
    );
  }
}

// Opcional: Versión con gradiente (si quieres mantener ambas opciones)
class BackgroundGradientWithImage extends StatelessWidget {
  final Widget child;
  final List<Color>? colors;
  final bool showDecorativeElements;

  const BackgroundGradientWithImage({
    super.key,
    required this.child,
    this.colors,
    this.showDecorativeElements = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors:
              colors ??
              const [Color(0xFF1a1a2e), Color(0xFF16213e), Color(0xFF0f3460)],
        ),
      ),
      child: child,
    );
  }
}
