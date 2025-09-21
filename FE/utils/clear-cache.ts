// PWA 캐시 클리어 유틸리티
export const clearPWACache = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Service Worker에 캐시 클리어 메시지 전송
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }
      
      // 모든 캐시 삭제
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      console.log('PWA cache cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear PWA cache:', error);
      return false;
    }
  }
  return false;
};

// Service Worker 업데이트 강제 실행
export const forceUpdateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        // 대기 중인 Service Worker가 있으면 활성화
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Service Worker 재등록
      await navigator.serviceWorker.register('/sw.js');
      
      console.log('Service Worker updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update Service Worker:', error);
      return false;
    }
  }
  return false;
};

// 개발 환경에서 캐시 무시하고 새로고침
export const hardRefresh = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 개발 환경에서는 캐시 무시하고 새로고침
    window.location.reload();
  } else {
    // 프로덕션 환경에서는 캐시 클리어 후 새로고침
    clearPWACache().then(() => {
      window.location.reload();
    });
  }
};
