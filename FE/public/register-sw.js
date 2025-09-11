// Service Worker 등록 스크립트
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 모든 Service Worker 완전 제거
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('🗑️ 기존 Service Worker 제거 중...', registrations.length, '개');
      return Promise.all(registrations.map(registration => registration.unregister()));
    }).then(() => {
      console.log('✅ 모든 Service Worker 제거 완료');
      // 1초 대기 후 새로 등록
      setTimeout(() => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker 등록 성공:', registration);
            // PWA 설치 가능 여부 확인
            if (registration.installing || registration.waiting) {
              console.log('🔄 Service Worker 설치 중...');
            } else if (registration.active) {
              console.log('✅ Service Worker 활성화됨');
            }
          })
          .catch((error) => {
            console.log('❌ Service Worker 등록 실패:', error);
          });
      }, 1000);
    });
  });
}
