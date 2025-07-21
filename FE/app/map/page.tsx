"use client";

import { useEffect, useState, useMemo } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import axios from "axios";
import { RegionMarker } from "@/app/components/RegionMarker";
import { LoadingAnimation } from "@/components/loading-animation";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Compass, Layers, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";

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
  const user = useAuthStore((state) => state.user);

  // 1. 사용자 정보에 좌표가 있으면 그것을, 없으면 서울 시청을 기본 위치로 설정
  const initialCenter =
    user?.latitude && user?.longitude
      ? { lat: user.latitude, lng: user.longitude }
      : { lat: 37.5665, lng: 126.978 };

  // kakao map script 로딩 상태를 관리합니다.
  useKakaoLoader({
    appkey: KAKAO_MAP_API_KEY!,
    libraries: ["clusterer", "services"],
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [zoomLevel, setZoomLevel] = useState(user?.address ? 4 : 9); // 주소 있으면 줌인
  const [center, setCenter] = useState(initialCenter);
  const [error, setError] = useState<string | null>(null);

  // 지역 데이터를 불러옵니다.
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get<Region[]>(
          "http://localhost:8080/api/regions"
        );
        setRegions(response.data);
      } catch (err) {
        setError("지역 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchRegions();
  }, []); // 이 효과는 한 번만 실행됩니다.

  // useMemo를 사용해 regions나 zoomLevel이 변경될 때만 필터링을 다시 실행합니다.
  const visibleRegions = useMemo(() => {
    if (regions.length === 0) return [];
    if (zoomLevel > 8) return regions.filter((r) => r.type === "CITY");
    if (zoomLevel > 5) return regions.filter((r) => r.type === "DISTRICT");
    return regions.filter((r) => r.type === "NEIGHBORHOOD");
  }, [regions, zoomLevel]);

  const handleMarkerClick = (region: Region) => {
    setCenter({ lat: region.latitude, lng: region.longitude });
    if (region.type === "CITY") setZoomLevel(7);
    if (region.type === "DISTRICT") setZoomLevel(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-36">
        <div className="container mx-auto px-4 py-4 h-[calc(100vh-10rem)] flex gap-4">
          {/* 지도 컨트롤 사이드 패널 */}
          <Card className="w-1/4 hidden md:flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Compass className="w-6 h-6" />
                <span>지도 제어</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                  <Layers className="w-5 h-5" />
                  <span>줌 레벨: {zoomLevel}</span>
                </label>
                <Slider
                  value={[zoomLevel]}
                  max={14}
                  min={1}
                  step={1}
                  onValueChange={(value) => setZoomLevel(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>상세</span>
                  <span>광역</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                <h4 className="font-bold text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
                  <TrendingUp className="w-5 h-5" />
                  <span>현재 지역 인기 종목 (예시)</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/30">
                    <span>삼성전자</span>
                    <span className="font-bold text-blue-600">82,000원</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/30">
                    <span>SK하이닉스</span>
                    <span className="font-bold text-red-600">220,000원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 지도 영역 */}
          <div className="w-full md:w-3/4 h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/50 dark:border-gray-800/50 flex items-center justify-center bg-green-50/50 dark:bg-green-950/50">
            {error ? (
              <div className="text-red-500 p-4 text-center font-semibold">
                {error}
              </div>
            ) : (
              <Map
                center={center}
                style={{ width: "100%", height: "100%" }}
                level={zoomLevel}
                onZoomChanged={(map) => setZoomLevel(map.getLevel())}
              >
                {visibleRegions.map((region) => (
                  <RegionMarker
                    key={region.id}
                    region={region}
                    onClick={handleMarkerClick}
                  />
                ))}
              </Map>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
