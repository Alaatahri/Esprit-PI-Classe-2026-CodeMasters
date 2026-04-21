import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  /** Proxy API NestJS (port 3001) quand le front utilise une URL relative `/api`. */
  async rewrites() {
    const backend =
      process.env.BACKEND_ORIGIN ||
      process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
      "http://127.0.0.1:3001";
    const origin = backend.replace(/\/$/, "");
    return [
      /** Évite le 404 navigateur sur `/favicon.ico` (fichier réel = SVG). */
      { source: "/favicon.ico", destination: "/favicon.svg" },
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Backend local (uploads, PDFs) en dev.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
