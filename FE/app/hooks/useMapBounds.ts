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
    (lat: number, lng: number, padding: number = 0.2): boolean => {
      if (!viewport) return true; // 초기 상태에서는 모든 마커 표시
      
      const { bounds } = viewport;
      const latPadding = (bounds.north - bounds.south) * padding;
      const lngPadding = (bounds.east - bounds.west) * padding;
      
      return (
        lat <= bounds.north + latPadding &&
        lat >= bounds.south - latPadding &&
        lng <= bounds.east + lngPadding &&
        lng >= bounds.west - lngPadding
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
