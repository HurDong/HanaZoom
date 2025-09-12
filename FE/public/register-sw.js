// Service Worker 등록 스크립트 (개발 환경 최적화)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 개발 환경에서는 기존 Service Worker 제거 후 새로 등록
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔧 개발 환경: Service Worker 재등록 중...');
      
      // 모든 Service Worker 제거
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('🗑️ 기존 Service Worker 제거 중...', registrations.length, '개');
        return Promise.all(registrations.map(registration => registration.unregister()));
      }).then(() => {
        console.log('✅ 모든 Service Worker 제거 완료');
        
        // 캐시 완전 삭제
        caches.keys().then(cacheNames => {
          console.log('🗑️ 기존 캐시 삭제 중...', cacheNames.length, '개');
          return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }).then(() => {
          console.log('✅ 모든 캐시 삭제 완료');
          
          // 1초 대기 후 새로 등록
          setTimeout(() => {
            navigator.serviceWorker.register('/sw.js')
              .then((registration) => {
                console.log('✅ Service Worker 등록 성공:', registration);
                
                // Service Worker 업데이트 감지
                registration.addEventListener('updatefound', () => {
                  const newWorker = registration.installing;
                  if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 새 Service Worker 설치됨, 페이지 새로고침...');
                        window.location.reload();
                      }
                    });
                  }
                });
              })
              .catch((error) => {
                console.log('❌ Service Worker 등록 실패:', error);
              });
          }, 1000);
        });
      });
    } else {
      // 프로덕션 환경에서는 일반적인 등록
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker 등록 성공:', registration);
        })
        .catch((error) => {
          console.log('❌ Service Worker 등록 실패:', error);
        });
    }
  });
}

// 개발 환경에서 캐시 클리어 함수 (전역)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.clearPWACache = async () => {
    console.log('🗑️ PWA 캐시 클리어 중...');
    
    // Service Worker 제거
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
    
    // 캐시 삭제
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    
    console.log('✅ PWA 캐시 클리어 완료');
    window.location.reload();
  };
  
  window.hardRefresh = () => {
    console.log('🔄 하드 새로고침 실행...');
    window.location.reload();
  };
}