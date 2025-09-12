// Service Worker 수동 등록
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Service Worker 업데이트 감지
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 새 버전이 설치되었을 때 사용자에게 알림
              if (confirm('새 버전이 사용 가능합니다. 지금 업데이트하시겠습니까?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Service Worker 등록 해제
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('Service Workers unregistered');
      return true;
    } catch (error) {
      console.error('Failed to unregister Service Workers:', error);
      return false;
    }
  }
  return false;
};
