'use client';

import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOffline, isOnline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-900 px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>오프라인 모드 - 캐시된 데이터를 표시합니다</span>
      </div>
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = useOfflineStatus();

  if (!isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-green-900 px-4 py-2 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <Wifi className="w-4 h-4" />
        <span>온라인 모드 - 실시간 데이터를 동기화합니다</span>
      </div>
    </div>
  );
}
