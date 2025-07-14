"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { KakaoMapProps } from "@/types/react-kakao-maps";

const KAKAO_MAP_SCRIPT_ID = "kakao-map-script";
const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

export function KakaoMap({
  center,
  level = 3,
  style = { width: "100%", height: "100%" },
  draggable = true,
  zoomable = true,
  onZoomChanged,
  onCenterChanged,
  onBoundsChanged,
  onLoad,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  // 지도 옵션을 useMemo로 메모이제이션
  const mapOptions = useMemo(
    () => ({
      center,
      level,
      draggable,
      zoomable,
    }),
    [center, level, draggable, zoomable]
  );

  // 이벤트 핸들러들을 useCallback으로 메모이제이션
  const handleZoomChanged = useCallback(
    (mapInstance: any) => {
      if (onZoomChanged) {
        onZoomChanged(mapInstance.getLevel());
      }
    },
    [onZoomChanged]
  );

  const handleCenterChanged = useCallback(
    (mapInstance: any) => {
      if (onCenterChanged) {
        const center = mapInstance.getCenter();
        onCenterChanged({
          lat: center.getLat(),
          lng: center.getLng(),
        });
      }
    },
    [onCenterChanged]
  );

  const handleBoundsChanged = useCallback(
    (mapInstance: any) => {
      if (onBoundsChanged) {
        const bounds = mapInstance.getBounds();
        onBoundsChanged(bounds);
      }
    },
    [onBoundsChanged]
  );

  // 카카오맵 스크립트 로딩 함수
  const loadKakaoMapScript = useCallback(() => {
    return new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.id = KAKAO_MAP_SCRIPT_ID;
      script.type = "text/javascript";
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(() => {
          resolve();
        });
      };
      document.head.appendChild(script);
    });
  }, []);

  // 지도 이벤트 리스너 설정 함수
  const setupMapEventListeners = useCallback(
    (mapInstance: any) => {
      if (onZoomChanged) {
        window.kakao.maps.event.addListener(mapInstance, "zoom_changed", () =>
          handleZoomChanged(mapInstance)
        );
      }

      if (onCenterChanged) {
        window.kakao.maps.event.addListener(mapInstance, "center_changed", () =>
          handleCenterChanged(mapInstance)
        );
      }

      if (onBoundsChanged) {
        window.kakao.maps.event.addListener(mapInstance, "bounds_changed", () =>
          handleBoundsChanged(mapInstance)
        );
      }
    },
    [handleZoomChanged, handleCenterChanged, handleBoundsChanged]
  );

  // 지도 초기화
  useEffect(() => {
    const initializeMap = async () => {
      const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID);

      if (!existingScript) {
        await loadKakaoMapScript();
      } else if (!window.kakao?.maps) {
        return;
      }

      if (!mapRef.current) return;

      try {
        const mapInstance = new window.kakao.maps.Map(mapRef.current, {
          ...mapOptions,
          center: new window.kakao.maps.LatLng(
            mapOptions.center.lat,
            mapOptions.center.lng
          ),
        });

        setMap(mapInstance);
        setupMapEventListeners(mapInstance);

        if (onLoad) onLoad(mapInstance);
      } catch (error) {
        console.error("카카오맵 초기화 중 오류 발생:", error);
      }
    };

    initializeMap();

    return () => {
      const script = document.getElementById(KAKAO_MAP_SCRIPT_ID);
      if (script) {
        script.remove();
      }
    };
  }, [mapOptions, setupMapEventListeners, onLoad, loadKakaoMapScript]);

  // 지도 중심 이동
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;
    try {
      const moveLatLng = new window.kakao.maps.LatLng(center.lat, center.lng);
      map.setCenter(moveLatLng);
    } catch (error) {
      console.error("지도 중심 이동 중 오류 발생:", error);
    }
  }, [center, map]);

  // 줌 레벨 변경
  useEffect(() => {
    if (!map) return;
    map.setLevel(level);
  }, [level, map]);

  return (
    <div
      ref={mapRef}
      style={{
        ...style,
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    />
  );
}
