"use client";

import { useEffect, useState } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import axios from "axios";
import { RegionMarker } from "@/app/components/RegionMarker";
import { LoadingAnimation } from "@/components/loading-animation";

// 백엔드 RegionResponse DTO와 일치하는 타입 정의
export interface Region {
  id: number;
  name: string;
  type: "CITY" | "DISTRICT" | "NEIGHBORHOOD";
  parentId: number | null;
  latitude: number;
  longitude: number;
}

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapPage() {
  useKakaoLoader({
    appkey: KAKAO_MAP_API_KEY!,
    libraries: ["clusterer", "services"],
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [zoomLevel, setZoomLevel] = useState(9);
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsLoading(true);
        // 백엔드 API로부터 지역 데이터 가져오기
        const response = await axios.get<Region[]>(
          "http://localhost:8080/api/regions"
        );
        setRegions(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch regions:", err);
        setError(
          "지역 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const getVisibleRegions = () => {
    if (zoomLevel > 8) {
      // 시/도 레벨
      return regions.filter((r) => r.type === "CITY");
    } else if (zoomLevel > 5) {
      // 시/군/구 레벨
      return regions.filter((r) => r.type === "DISTRICT");
    } else {
      // 읍/면/동 레벨
      return regions.filter((r) => r.type === "NEIGHBORHOOD");
    }
  };

  const handleMarkerClick = (region: Region) => {
    setCenter({ lat: region.latitude, lng: region.longitude });
    if (region.type === "CITY") setZoomLevel(7);
    if (region.type === "DISTRICT") setZoomLevel(4);
  };

  const visibleRegions = getVisibleRegions();

  if (isLoading) {
    return <LoadingAnimation onComplete={() => {}} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Map
        center={center}
        style={{ width: "100%", height: "100%" }}
        level={zoomLevel}
        onZoomChanged={(map) => setZoomLevel(map.getLevel())}
        onCenterChanged={(map) =>
          setCenter({
            lat: map.getCenter().getLat(),
            lng: map.getCenter().getLng(),
          })
        }
      >
        {visibleRegions.map((region) => (
          <RegionMarker
            key={region.id}
            region={region}
            onClick={handleMarkerClick}
          />
        ))}
      </Map>
    </div>
  );
}
