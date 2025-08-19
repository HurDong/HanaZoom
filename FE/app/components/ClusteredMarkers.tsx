"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-kakao-maps-sdk";
import { Region } from "@/app/map/page";
import { RegionMarker } from "./RegionMarker";

interface ClusteredMarkersProps {
  markers: Region[];
  onMarkerClick: (region: Region) => void;
  minClusterSize?: number;
  gridSize?: number;
}

export function ClusteredMarkers({ 
  markers, 
  onMarkerClick,
  minClusterSize = 2,
  gridSize = 60 
}: ClusteredMarkersProps) {
  const map = useMap();
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  // 클러스터러 초기화
  useEffect(() => {
    if (!map || !window.kakao?.maps?.MarkerClusterer) return;

    // 기존 클러스터러 정리
    if (clustererRef.current) {
      clustererRef.current.clear();
      clustererRef.current = null;
    }

    // 새 클러스터러 생성
    clustererRef.current = new kakao.maps.MarkerClusterer({
      map: map,
      averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
      minLevel: 5, // 클러스터 할 최소 지도 레벨
      disableClickZoom: true, // 클러스터 마커 클릭 시 지도 확대 방지
      gridSize: gridSize, // 클러스터의 격자 크기
      minClusterSize: minClusterSize, // 클러스터링 할 최소 마커 수
      styles: [
        {
          // 작은 클러스터 스타일 (2-10개)
          width: '40px',
          height: '40px',
          background: 'rgba(34, 197, 94, 0.8)',
          borderRadius: '50%',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          lineHeight: '40px',
          fontSize: '12px'
        },
        {
          // 중간 클러스터 스타일 (10-50개)
          width: '50px',
          height: '50px',
          background: 'rgba(59, 130, 246, 0.8)',
          borderRadius: '50%',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          lineHeight: '50px',
          fontSize: '14px'
        },
        {
          // 큰 클러스터 스타일 (50개 이상)
          width: '60px',
          height: '60px',
          background: 'rgba(239, 68, 68, 0.8)',
          borderRadius: '50%',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          lineHeight: '60px',
          fontSize: '16px'
        }
      ]
    });

    // 클러스터 클릭 이벤트
    kakao.maps.event.addListener(clustererRef.current, 'clusterclick', (cluster) => {
      // 클러스터를 구성하는 마커들의 평균 위치로 이동하고 줌인
      const level = map.getLevel() - 1;
      map.setLevel(level < 1 ? 1 : level, { animate: { duration: 300 } });
      map.setCenter(cluster.getCenter());
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clear();
      }
    };
  }, [map, minClusterSize, gridSize]);

  // 마커 업데이트
  useEffect(() => {
    if (!clustererRef.current || !map) return;

    // 기존 마커들 정리
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    clustererRef.current.clear();

    // 새 마커들 생성
    const newMarkers = markers.map((region) => {
      const markerPosition = new kakao.maps.LatLng(region.latitude, region.longitude);
      
      // 카카오 마커 객체 생성
      const marker = new kakao.maps.Marker({
        position: markerPosition,
        clickable: true
      });

      // 마커 클릭 이벤트
      kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerClick(region);
      });

      // 커스텀 오버레이로 마커 스타일링
      const customOverlay = new kakao.maps.CustomOverlay({
        position: markerPosition,
        content: createMarkerContent(region),
        yAnchor: 1.4
      });

      // 마커 대신 커스텀 오버레이 사용
      customOverlay.setMap(map);
      
      // 클러스터링을 위해서는 일반 Marker 객체가 필요
      return marker;
    });

    markersRef.current = newMarkers;
    
    // 클러스터러에 마커들 추가
    if (newMarkers.length > 0) {
      clustererRef.current.addMarkers(newMarkers);
    }

    return () => {
      newMarkers.forEach(marker => {
        marker.setMap(null);
      });
    };
  }, [markers, onMarkerClick, map]);

  return null; // 렌더링할 컴포넌트 없음 (카카오맵 네이티브 API 사용)
}

// 마커 콘텐츠 생성 함수
function createMarkerContent(region: Region): string {
  const getMarkerStyles = () => {
    switch (region.type) {
      case "CITY":
        return {
          padding: "px-4 py-2",
          fontSize: "text-base font-bold",
          shadow: "drop-shadow-lg",
          borderColor: "border-emerald-500",
          textColor: "text-emerald-800",
          bgColor: "bg-white/90"
        };
      case "DISTRICT":
        return {
          padding: "px-3 py-1.5",
          fontSize: "text-sm font-semibold", 
          shadow: "drop-shadow-md",
          borderColor: "border-green-500",
          textColor: "text-green-800",
          bgColor: "bg-white/90"
        };
      case "NEIGHBORHOOD":
        return {
          padding: "px-2 py-1",
          fontSize: "text-xs font-medium",
          shadow: "drop-shadow",
          borderColor: "border-teal-500",
          textColor: "text-teal-800",
          bgColor: "bg-white/90"
        };
      default:
        return {
          padding: "px-2 py-1",
          fontSize: "text-xs font-medium",
          shadow: "drop-shadow",
          borderColor: "border-gray-500",
          textColor: "text-gray-800",
          bgColor: "bg-white/90"
        };
    }
  };

  const styles = getMarkerStyles();

  return `
    <div style="cursor: pointer; transform: translateZ(0); transition: all 200ms ease-out;" 
         onmouseover="this.style.transform='translateZ(0) scale(1.1)'" 
         onmouseout="this.style.transform='translateZ(0) scale(1)'">
      <div style="
        position: relative;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 600;
        color: #065f46;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        border-radius: 8px;
        border: 2px solid #10b981;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      ">
        ${region.name}
        <div style="
          position: absolute;
          left: 50%;
          bottom: -9px;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.9);
          transform: translateX(-50%) rotate(45deg);
          border-bottom: 2px solid #10b981;
          border-right: 2px solid #10b981;
        "></div>
      </div>
    </div>
  `;
}
