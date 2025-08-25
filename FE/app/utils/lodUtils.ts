import { Region } from '@/app/map/page';

// 두 지점 간 거리를 계산 (Haversine formula)
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 줌 레벨에 따른 마커 간 최소 거리 계산
export function getMinimumDistanceForZoom(zoomLevel: number): number {
  // 줌 레벨이 높을수록 (가까이 볼수록) 더 가까운 마커들도 표시
  if (zoomLevel <= 5) return 50;  // 50km
  if (zoomLevel <= 7) return 20;  // 20km  
  if (zoomLevel <= 9) return 10;  // 10km
  if (zoomLevel <= 11) return 5;  // 5km
  return 0; // 모든 마커 표시
}

// LOD 기반 마커 필터링 (단순화)
export function filterMarkersByLOD(
  markers: Region[],
  zoomLevel: number,
  centerLat: number,
  centerLng: number,
  isInBounds: (lat: number, lng: number, padding?: number) => boolean
): Region[] {
  // 1. 가시 영역 내 마커만 필터링 (패딩 포함)
  let visibleMarkers = markers.filter(marker => 
    isInBounds(marker.latitude, marker.longitude, 0.3) // 30% 패딩
  );

  // 2. 줌 레벨에 따른 타입 필터링만 적용 (거리 필터링 제거)
  const typeFilter = getMarkerTypeFilter(zoomLevel);
  visibleMarkers = visibleMarkers.filter(marker => typeFilter(marker.type));

  return visibleMarkers;
}

// 줌 레벨에 따른 마커 타입 필터 (원래 로직 복원)
function getMarkerTypeFilter(zoomLevel: number): (type: string) => boolean {
  if (zoomLevel > 8) {
    return (type: string) => type === "CITY";
  } else if (zoomLevel > 5) {
    return (type: string) => type === "DISTRICT";
  } else {
    return (type: string) => type === "NEIGHBORHOOD";
  }
}

// 거리 기반 마커 필터링 (중심점에서 가까운 것부터 우선)
function filterByDistance(
  markers: Region[], 
  minDistance: number, 
  centerLat: number, 
  centerLng: number
): Region[] {
  // 중심점에서 가까운 순으로 정렬
  const sortedMarkers = markers.sort((a, b) => {
    const distA = calculateDistance(centerLat, centerLng, a.latitude, a.longitude);
    const distB = calculateDistance(centerLat, centerLng, b.latitude, b.longitude);
    return distA - distB;
  });

  const filteredMarkers: Region[] = [];
  
  for (const marker of sortedMarkers) {
    let shouldInclude = true;
    
    // 이미 선택된 마커들과 거리 확인
    for (const existing of filteredMarkers) {
      const distance = calculateDistance(
        marker.latitude, marker.longitude,
        existing.latitude, existing.longitude
      );
      
      if (distance < minDistance) {
        shouldInclude = false;
        break;
      }
    }
    
    if (shouldInclude) {
      filteredMarkers.push(marker);
    }
  }
  
  return filteredMarkers;
}

// 마커 우선순위 계산 (도시 > 구 > 동 순)
export function getMarkerPriority(regionType: string): number {
  switch (regionType) {
    case "CITY": return 3;
    case "DISTRICT": return 2; 
    case "NEIGHBORHOOD": return 1;
    default: return 0;
  }
}

// 성능 측정 유틸리티
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();

  static start(label: string): void {
    performance.mark(`${label}-start`);
  }

  static end(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure.duration;
    
    // 측정값 저장
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    
    // 최근 10개만 유지
    const values = this.measurements.get(label)!;
    if (values.length > 10) {
      values.shift();
    }
    
    // 정리
    performance.clearMeasures(label);
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    
    return duration;
  }

  static getStats(label: string): { avg: number; min: number; max: number } | null {
    const values = this.measurements.get(label);
    if (!values || values.length === 0) return null;
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
