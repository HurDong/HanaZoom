/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 최적화 (standalone 비활성화)
  // output: 'standalone',

  // 빌드 에러 무시 (강화)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 이미지 최적화 비활성화
  images: {
    unoptimized: true,
  },

  // 빌드 성능 최적화
  swcMinify: true,
  compress: true,

  // 빌드 안정성 개선
  poweredByHeader: false,
  reactStrictMode: false,

  // 웹팩 설정 (에러 무시)
  webpack: (config, { isServer }) => {
    // 빌드 경고 무시
    config.stats = "errors-only";
    return config;
  },
};

export default nextConfig;
