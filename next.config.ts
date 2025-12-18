import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  allowedDevOrigins: [
    'https://47c61f06-9cef-4464-956c-292021f44d4d-00-1dsug9ck8e0gr.pike.replit.dev',
    'http://127.0.0.1:5000',
    'http://localhost:5000',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
