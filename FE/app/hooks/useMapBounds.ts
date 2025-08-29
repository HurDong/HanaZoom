import { useState, useCallback } from "react";

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
  // 초기 viewport 설정 (한국 전체 영역)
  const [viewport, setViewport] = useState<MapViewport>({
    center: { lat: 36.5, lng: 127.5 }, // 한국 중심
    bounds: {
      north: 38.6, // 북쪽 경계
      south: 33.0, // 남쪽 경계
      east: 132.0, // 동쪽 경계
      west: 124.0, // 서쪽 경계
    },
    zoomLevel: 9,
  });

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
      if (!viewport) return true; // fallback

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
