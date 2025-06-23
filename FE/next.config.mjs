/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 최적화를 위한 standalone 모드
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 빌드 성능 최적화
  swcMinify: true,
  compress: true,
  // 개발 시 빠른 새로고침
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
