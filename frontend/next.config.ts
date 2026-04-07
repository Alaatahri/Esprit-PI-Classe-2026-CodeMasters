import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  /** Proxy API NestJS (port 3001) quand le front utilise une URL relative `/api`. */
  async rewrites() {
    const backend =
      process.env.BACKEND_ORIGIN ||
      process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
      "http://127.0.0.1:3001";
    const origin = backend.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${origin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
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
