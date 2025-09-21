// Fallback development script
console.log('Fallback development script loaded');

// fallback 함수 정의
self.fallback = async (request) => {
  console.log('Fallback triggered for:', request.url);
  
  // favicon.ico 요청에 대한 특별 처리
  if (request.url.includes('/favicon.ico')) {
    try {
      // 캐시에서 favicon.ico 찾기
      const cache = await caches.open('favicon-cache');
      const cachedResponse = await cache.match('/favicon.ico');
      
      if (cachedResponse) {
        console.log('Serving favicon.ico from cache');
        return cachedResponse;
      }
      
      // 캐시에 없으면 기본 응답 생성
      return new Response('', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000'
        }
      });
    } catch (error) {
      console.error('Error in favicon fallback:', error);
      return new Response('', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'image/x-icon'
        }
      });
    }
  }
  
  // 다른 요청에 대해서는 기본 오프라인 페이지 반환
  return new Response('오프라인 상태입니다. 네트워크 연결을 확인해주세요.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
};