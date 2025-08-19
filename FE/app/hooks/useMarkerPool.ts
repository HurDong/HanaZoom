import { useMemo, useCallback, useRef } from 'react';
import { Region } from '@/app/map/page';

interface MarkerPoolItem {
  id: string;
  isActive: boolean;
  region: Region | null;
  element: JSX.Element | null;
}

export function useMarkerPool(maxPoolSize: number = 100) {
  const poolRef = useRef<Map<string, MarkerPoolItem>>(new Map());
  const activeMarkersRef = useRef<Set<string>>(new Set());

  // 마커 풀에서 사용 가능한 마커 가져오기 또는 새로 생성
  const acquireMarker = useCallback((region: Region, renderFunction: (region: Region) => JSX.Element): JSX.Element => {
    const pool = poolRef.current;
    const regionKey = `${region.type}-${region.id}`;
    
    // 기존 마커가 있으면 재사용
    let poolItem = pool.get(regionKey);
    
    if (!poolItem) {
      // 풀 크기 제한 확인
      if (pool.size >= maxPoolSize) {
        // 가장 오래된 비활성 마커 제거
        const oldestInactive = Array.from(pool.entries())
          .find(([key, item]) => !item.isActive);
        
        if (oldestInactive) {
          pool.delete(oldestInactive[0]);
        }
      }
      
      // 새 풀 아이템 생성
      poolItem = {
        id: regionKey,
        isActive: false,
        region: null,
        element: null
      };
      pool.set(regionKey, poolItem);
    }
    
    // 마커 활성화
    poolItem.isActive = true;
    poolItem.region = region;
    
    // 엘리먼트가 없거나 region이 변경된 경우 새로 생성
    if (!poolItem.element || poolItem.region?.id !== region.id) {
      poolItem.element = renderFunction(region);
    }
    
    activeMarkersRef.current.add(regionKey);
    
    return poolItem.element;
  }, [maxPoolSize]);

  // 마커 풀에 반환 (비활성화)
  const releaseMarker = useCallback((regionKey: string) => {
    const pool = poolRef.current;
    const poolItem = pool.get(regionKey);
    
    if (poolItem) {
      poolItem.isActive = false;
      activeMarkersRef.current.delete(regionKey);
    }
  }, []);

  // 모든 마커 해제
  const releaseAllMarkers = useCallback(() => {
    const pool = poolRef.current;
    
    activeMarkersRef.current.forEach(key => {
      const poolItem = pool.get(key);
      if (poolItem) {
        poolItem.isActive = false;
      }
    });
    
    activeMarkersRef.current.clear();
  }, []);

  // 풀 통계
  const getPoolStats = useCallback(() => {
    const pool = poolRef.current;
    const totalMarkers = pool.size;
    const activeMarkers = activeMarkersRef.current.size;
    const inactiveMarkers = totalMarkers - activeMarkers;
    
    return {
      total: totalMarkers,
      active: activeMarkers,
      inactive: inactiveMarkers,
      utilizationRate: totalMarkers > 0 ? (activeMarkers / totalMarkers) * 100 : 0
    };
  }, []);

  // 비활성 마커 정리
  const cleanupPool = useCallback(() => {
    const pool = poolRef.current;
    const keysToDelete: string[] = [];
    
    pool.forEach((item, key) => {
      if (!item.isActive) {
        keysToDelete.push(key);
      }
    });
    
    // 절반만 제거하여 풀의 이점을 유지
    const toDelete = keysToDelete.slice(0, Math.floor(keysToDelete.length / 2));
    toDelete.forEach(key => pool.delete(key));
    
    return toDelete.length;
  }, []);

  return {
    acquireMarker,
    releaseMarker,
    releaseAllMarkers,
    getPoolStats,
    cleanupPool
  };
}
