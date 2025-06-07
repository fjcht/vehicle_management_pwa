const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Eliminado: output: process.env.NEXT_OUTPUT_MODE,
  // Ajustado: outputFileTracingRoot para apuntar al directorio actual si next.config.js está en la raíz
  outputFileTracingRoot: path.join(__dirname, './'), 
  eslint: {
    // Advertencia: Ignorar errores de ESLint durante la construcción puede ocultar problemas.
    // Se recomienda resolver los errores de ESLint y establecer esto en `false` para producción.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Advertencia: Ignorar errores de TypeScript durante la construcción puede ocultar problemas.
    // Se recomienda resolver los errores de TypeScript y establecer esto en `false` para producción.
    ignoreBuildErrors: true,
  },
  images: { 
    // Advertencia: unoptimized: true desactiva la optimización de imágenes de Next.js.
    // Considera establecerlo en `false` para mejorar el rendimiento de las imágenes en producción.
    unoptimized: true 
  },
};

module.exports = nextConfig;