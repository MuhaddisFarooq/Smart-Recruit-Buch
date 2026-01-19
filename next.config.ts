import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  images: {
    domains: ['files.binc.pk', 'www.gravatar.com', 'placehold.co', 'binc-host.s3.us-east-005.backblazeb2.com', 'buchhospital.com'],
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/consultants/:path(.+\\.(?:jpg|jpeg|png|gif|webp|svg|ico))$',
        destination: '/uploads/consultants/:path',
      },
      {
        source: '/slider/:path(.+\\.(?:jpg|jpeg|png|gif|webp|svg|ico))$',
        destination: '/uploads/slider/:path',
      },
      {
        source: '/popup/:path(.+\\.(?:jpg|jpeg|png|gif|webp|svg|ico))$',
        destination: '/uploads/popup/:path',
      },
      {
        source: '/blogs/:path(.+\\.(?:jpg|jpeg|png|gif|webp|svg|ico))$',
        destination: '/uploads/blogs/:path',
      },
      {
        source: '/testimonials/:path(.+\\.(?:jpg|jpeg|png|gif|webp|svg|ico))$',
        destination: '/uploads/testimonials/:path',
      },
    ];
  },
};

export default nextConfig;
