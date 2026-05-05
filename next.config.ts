import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.7',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
    // ✅ AGREGAR localPatterns para permitir imágenes locales
    localPatterns: [
      {
        pathname: '/images/**',      // Para imágenes como /images/menu.webp
        search: '',                   // Permite query strings si es necesario
      },
      {
        pathname: '/uploads/**',     // Para las imágenes de productos
      },
    ],
  },
  // Asegurar que los archivos estáticos se sirvan correctamente
  output: 'standalone',
  distDir: '.next',
};

export default nextConfig;