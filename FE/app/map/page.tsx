"use client";

import { useEffect, useState, useMemo } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import { RegionMarker } from "@/app/components/RegionMarker";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Compass, Layers, TrendingUp, Loader2 } from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import { getTopStocksByRegion } from "@/lib/api/stock";
import { MouseFollower } from "@/components/mouse-follower";

// 백엔드 RegionResponse DTO와 일치하는 타입 정의
export interface Region {
  id: number;
  name: string;
  type: "CITY" | "DISTRICT" | "NEIGHBORHOOD";
  parentId: number | null;
  latitude: number;
  longitude: number;
}

// 상위 주식 정보 타입
interface TopStock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  emoji: string;
}

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapPage() {
  const user = useAuthStore((state) => state.user);
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [topStocks, setTopStocks] = useState<TopStock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);

  // kakao map script 로딩 상태를 관리합니다.
  useKakaoLoader({
    appkey: KAKAO_MAP_API_KEY!,
    libraries: ["clusterer", "services"],
  });

  // 사용자 위치로 이동하는 함수
  const moveToUserLocation = () => {
    if (user?.latitude && user?.longitude) {
      setCenter({ lat: Number(user.latitude), lng: Number(user.longitude) });
      setZoomLevel(4);
    }
  };

  // 초기 중심점 설정
  const initialCenter = { lat: 37.5665, lng: 126.978 }; // 서울시청
  const [center, setCenter] = useState(initialCenter);
  const [zoomLevel, setZoomLevel] = useState(9);

  // 컴포넌트 마운트 또는 새로고침 시 사용자 위치로 이동
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      moveToUserLocation();
    }
  }, [user]);

  // 지역 데이터를 불러옵니다.
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data } = await api.get<ApiResponse<Region[]>>(
          API_ENDPOINTS.regions
        );
        setRegions(data.data);
      } catch (err) {
        console.error("지역 데이터를 불러오는 데 실패했습니다.", err);
        setError("지역 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchRegions();
  }, []);

  // useMemo를 사용해 regions나 zoomLevel이 변경될 때만 필터링을 다시 실행합니다.
  const visibleRegions = useMemo(() => {
    if (!regions || regions.length === 0) return [];
    if (zoomLevel > 8) return regions.filter((r) => r.type === "CITY");
    if (zoomLevel > 5) return regions.filter((r) => r.type === "DISTRICT");
    return regions.filter((r) => r.type === "NEIGHBORHOOD");
  }, [regions, zoomLevel]);

  // 상위 주식 정보를 가져오는 함수
  const fetchTopStocks = async (regionId: number) => {
    console.log("API 요청 시작 - regionId:", regionId); // 디버깅용 로그
    setLoadingStocks(true);
    try {
      const response = await getTopStocksByRegion(regionId);
      console.log("API 응답:", response); // 디버깅용 로그
      setTopStocks(response.data);
    } catch (err) {
      console.error("상위 주식 정보를 가져오는 데 실패했습니다.", err);
      setTopStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  };

  const handleMarkerClick = (region: Region) => {
    console.log("마커 클릭:", region); // 디버깅용 로그
    setCenter({ lat: region.latitude, lng: region.longitude });
    setSelectedRegion(region);

    if (region.type === "CITY") setZoomLevel(7);
    if (region.type === "DISTRICT") setZoomLevel(4);

    // 상위 주식 정보 가져오기
    console.log("요청할 region_id:", region.id); // 디버깅용 로그
    fetchTopStocks(region.id);
  };

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center font-semibold">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <MouseFollower />
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-36">
        <div className="w-full px-6 py-4 h-[calc(100vh-10rem)] flex gap-6">
          {/* 지도 컨트롤 사이드 패널 */}
          <Card className="w-80 hidden md:flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Compass className="w-6 h-6" />
                <span>지도 제어</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 max-h-[calc(100vh-16rem)]">
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
                <div className="relative mt-1">
                  {/* 구분선 마커 */}
                  <div className="absolute w-full flex justify-between px-1 -mt-3">
                    <div className="relative left-[35%]">
                      <div className="h-3 w-0.5 bg-green-600/50 dark:bg-green-400/50"></div>
                      <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                    <div className="relative right-[42%]">
                      <div className="h-3 w-0.5 bg-green-600/50 dark:bg-green-400/50"></div>
                      <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                  </div>
                  {/* 텍스트 레이블 */}
                  <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span>읍/면/동</span>
                    <span className="absolute left-[38%]">시/군/구</span>
                    <span>광역시/도</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-0.5">
                    <span>(~5)</span>
                    <span className="absolute left-[40%]">(6~8)</span>
                    <span>(9~)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                <h4 className="font-bold text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
                  <TrendingUp className="w-5 h-5" />
                  <span>
                    {selectedRegion
                      ? `${selectedRegion.name} 인기 종목`
                      : "지역을 선택하세요"}
                  </span>
                </h4>

                {loadingStocks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      주식 정보를 불러오는 중...
                    </span>
                  </div>
                ) : selectedRegion && topStocks.length > 0 ? (
                  <div className="space-y-3">
                    {topStocks.map((stock, index) => (
                      <div
                        key={stock.symbol}
                        className="flex justify-between items-center p-3 rounded-lg bg-green-100/50 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{stock.emoji}</span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">
                              {stock.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {stock.symbol}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{stock.price}</div>
                          <div
                            className={`text-xs ${
                              stock.change.startsWith("-")
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {stock.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedRegion ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">해당 지역의 주식 정보가 없습니다.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">지도를 클릭하여 지역을 선택하세요</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 지도 영역 */}
          <div className="flex-1 h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/50 dark:border-gray-800/50 flex items-center justify-center bg-green-50/50 dark:bg-green-950/50">
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
          </div>
        </div>
      </main>
    </div>
  );
}
