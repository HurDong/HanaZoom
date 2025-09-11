import withPWA from 'next-pwa';

const withPWAConfig = withPWA({
  dest: 'public',
  register: false, // 자동 등록 비활성화 (수동 등록 사용)
  skipWaiting: true,
  disable: false,
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  fallbacks: {
    document: '/offline.html',
  },
  runtimeCaching: [
    // 카카오맵 타일 캐싱 (모든 타일 서버 포함)
    {
      urlPattern: /^https:\/\/map[0-9]\.daumcdn\.net\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'kakao-map-tiles',
        expiration: {
          maxEntries: 5000, // 1000 → 5000으로 증가
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
        },
      },
    },
    // 카카오맵 추가 타일 서버들
    {
      urlPattern: /^https:\/\/t[0-9]\.daumcdn\.net\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'kakao-map-tiles-2',
        expiration: {
          maxEntries: 5000,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    // 카카오맵 API 캐싱
    {
      urlPattern: /^https:\/\/dapi\.kakao\.com\/v2\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'kakao-api',
        expiration: {
          maxEntries: 200, // 100 → 200으로 증가
          maxAgeSeconds: 24 * 60 * 60, // 1일
        },
      },
    },
    // 주식 데이터 캐싱
    {
      urlPattern: /^https?:\/\/.*\/api\/stocks.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'stock-data',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 5 * 60, // 5분
        },
      },
    },
    // 지역 데이터 캐싱
    {
      urlPattern: /^https?:\/\/.*\/api\/regions.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'region-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7일
        },
      },
    },
    // 정적 자산 캐싱
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 1000, // 500 → 1000으로 증가
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
        },
      },
    },
    // 모든 이미지 파일 캐싱 (지도 타일 포함)
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'all-images',
        expiration: {
          maxEntries: 10000, // 지도 타일을 위한 대용량 캐시
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    // HTML 페이지 캐싱 (오프라인 지원)
    {
      urlPattern: /^https?:\/\/localhost:3000\/.*$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1일
        },
      },
    },
    // 기본 네트워크 우선 캐싱
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
        networkTimeoutSeconds: 3, // 3초 후 오프라인으로 전환
      },
    },
  ],
});

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
};

export default withPWAConfig(nextConfig);
