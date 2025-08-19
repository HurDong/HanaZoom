import { useState, useCallback } from 'react';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: { lat: number; lng: number };
  bounds: MapBounds;
  zoomLevel: number;
}

export function useMapBounds() {
  const [viewport, setViewport] = useState<MapViewport | null>(null);

  const updateBounds = useCallback((map: kakao.maps.Map) => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    const zoomLevel = map.getLevel();

    setViewport({
      center: { lat: center.getLat(), lng: center.getLng() },
      bounds: {
        north: bounds.getNorthEast().getLat(),
        south: bounds.getSouthWest().getLat(),
        east: bounds.getNorthEast().getLng(),
        west: bounds.getSouthWest().getLng(),
      },
      zoomLevel,
    });
  }, []);

  const isPointInBounds = useCallback(
    (lat: number, lng: number): boolean => {
      if (!viewport) return true; // 초기 상태에서는 모든 마커 표시
      
      const { bounds } = viewport;
      return (
        lat <= bounds.north &&
        lat >= bounds.south &&
        lng <= bounds.east &&
        lng >= bounds.west
      );
    },
    [viewport]
  );

  return {
    viewport,
    updateBounds,
    isPointInBounds,
  };
}
