import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 초기 상태 설정
    setIsOffline(!navigator.onLine);
    setIsOnline(navigator.onLine);

    // 온라인 이벤트 리스너
    const handleOnline = () => {
      setIsOffline(false);
      setIsOnline(true);
    };

    // 오프라인 이벤트 리스너
    const handleOffline = () => {
      setIsOffline(true);
      setIsOnline(false);
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 클린업
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline, isOnline };
};
