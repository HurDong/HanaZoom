/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 개발 모드에서 Hot Reload 최적화
  ...(process.env.NODE_ENV === "development" && {
    experimental: {
      // 개발 모드에서는 CSS 최적화 비활성화
    },
  }),
  // 프로덕션 모드에서만 CSS 최적화
  ...(process.env.NODE_ENV === "production" && {
    experimental: {
      optimizeCss: true,
    },
    compiler: {
      removeConsole: true,
    },
  }),
  // favicon.ico 처리 개선
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
        ],
      },
      // CSS 캐싱 개선
      {
        source: "/_next/static/css/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
