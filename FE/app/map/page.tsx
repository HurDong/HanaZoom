"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import { RegionMarker } from "@/app/components/RegionMarker";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Compass, Layers, TrendingUp, Loader2, GitBranch } from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import { getTopStocksByRegion } from "@/lib/api/stock";
import { MouseFollower } from "@/components/mouse-follower";
import { useRouter } from "next/navigation";
import { useMapBounds } from "@/app/hooks/useMapBounds";
import { useMarkerPool } from "@/app/hooks/useMarkerPool";
import { useFPSMonitor } from "@/app/hooks/useFPSMonitor";
import { filterMarkersByLOD, PerformanceMonitor } from "@/app/utils/lodUtils";
import { ClusteredMarkers } from "@/app/components/ClusteredMarkers";

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
  const [isMapReady, setIsMapReady] = useState(false);
  const router = useRouter();

  // LOD 최적화 hooks
  const { viewport, updateBounds, isPointInBounds } = useMapBounds();
  const { acquireMarker, releaseAllMarkers, getPoolStats, cleanupPool } = useMarkerPool(200);
  const { fps, avgFps } = useFPSMonitor(process.env.NODE_ENV === 'development');

  // 디바운싱을 위한 ref
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedZoomLevel, setDebouncedZoomLevel] = useState(9);
  const [renderStats, setRenderStats] = useState({ visible: 0, total: 0, renderTime: 0 });
  
  // 클러스터링 설정
  const [useClusteringEnabled, setUseClusteringEnabled] = useState(true);
  const shouldUseClusteringBasedOnZoom = debouncedZoomLevel >= 6; // 줌 레벨 6 이상에서 클러스터링

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
        // 지역 데이터 로딩 완료 후 지도 준비 상태로 변경
        setTimeout(() => setIsMapReady(true), 100);
      } catch (err) {
        console.error("지역 데이터를 불러오는 데 실패했습니다.", err);
        setError("지역 데이터를 불러오는 데 실패했습니다.");
      }
    };
    fetchRegions();
  }, []);

  // 디바운싱된 줌 레벨 변경 핸들러
  const handleZoomChange = useCallback((newZoomLevel: number) => {
    // 기존 타임아웃 클리어
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    // 즉시 UI 업데이트 (반응성 유지)
    setZoomLevel(newZoomLevel);

    // 디바운싱된 필터링 업데이트
    zoomTimeoutRef.current = setTimeout(() => {
      setDebouncedZoomLevel(newZoomLevel);
    }, 150); // 150ms 딜레이
  }, []);

  // 컴포넌트 언마운트 시 타임아웃 클리어 및 마커 풀 정리
  useEffect(() => {
    // 주기적으로 마커 풀 정리 (30초마다)
    const poolCleanupInterval = setInterval(() => {
      const cleaned = cleanupPool();
      if (cleaned > 0 && process.env.NODE_ENV === 'development') {
        console.log(`Cleaned up ${cleaned} inactive markers from pool`);
      }
    }, 30000);

    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      clearInterval(poolCleanupInterval);
      releaseAllMarkers();
    };
  }, [cleanupPool, releaseAllMarkers]);

  // LOD 기반 마커 필터링
  const visibleMarkers = useMemo(() => {
    PerformanceMonitor.start('marker-filtering');
    
    if (!regions || regions.length === 0 || !viewport) {
      PerformanceMonitor.end('marker-filtering');
      return [];
    }

    const filtered = filterMarkersByLOD(
      regions,
      debouncedZoomLevel,
      viewport.center.lat,
      viewport.center.lng,
      isPointInBounds
    );

    const renderTime = PerformanceMonitor.end('marker-filtering');
    
    // 성능 통계 업데이트
    setRenderStats({
      visible: filtered.length,
      total: regions.length,
      renderTime: Math.round(renderTime * 100) / 100
    });

    return filtered;
  }, [regions, debouncedZoomLevel, viewport, isPointInBounds]);

  // 상위 주식 정보를 가져오는 함수
  const fetchTopStocks = useCallback(async (regionId: number) => {
    setLoadingStocks(true);
    try {
      const response = await getTopStocksByRegion(regionId);
      setTopStocks(response.data);
    } catch (err) {
      console.error("상위 주식 정보를 가져오는 데 실패했습니다.", err);
      setTopStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  }, []);

  // 마커 클릭 핸들러 최적화
  const handleMarkerClick = useCallback(
    (region: Region) => {
      setCenter({ lat: region.latitude, lng: region.longitude });
      setSelectedRegion(region);

      if (region.type === "CITY") setZoomLevel(7);
      if (region.type === "DISTRICT") setZoomLevel(4);

      // 상위 주식 정보 가져오기
      fetchTopStocks(region.id);
    },
    [fetchTopStocks]
  );

  // 클러스터링 사용 여부 결정
  const useClusteringNow = useClusteringEnabled && shouldUseClusteringBasedOnZoom;

  // LOD 기반 마커 렌더링 최적화 (클러스터링 미사용 시)
  const renderedMarkers = useMemo(() => {
    if (useClusteringNow) return []; // 클러스터링 사용 시 빈 배열 반환
    
    PerformanceMonitor.start('marker-rendering');
    
    const markers = visibleMarkers.map((region) => {
      const markerElement = acquireMarker(region, (r) => (
        <RegionMarker
          key={r.id}
          region={r}
          onClick={handleMarkerClick}
          isVisible={true} // LOD 필터링으로 이미 가시성 결정됨
        />
      ));
      
      return markerElement;
    });

    const renderTime = PerformanceMonitor.end('marker-rendering');
    
    // 비활성 마커는 풀에서 정리
    if (visibleMarkers.length === 0) {
      releaseAllMarkers();
    }

    return markers;
  }, [visibleMarkers, handleMarkerClick, acquireMarker, releaseAllMarkers, useClusteringNow]);

  // 종목 클릭 시 해당 종목의 게시판으로 이동
  const handleStockClick = (stock: TopStock) => {
    router.push(`/community/${stock.symbol}`);
  };

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center font-semibold">{error}</div>
    );
  }

  if (!isMapReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
            지도를 준비하고 있습니다...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            마커를 로딩 중입니다
          </p>
        </div>
      </div>
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
                  onValueChange={(value) => handleZoomChange(value[0])}
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

              {/* 클러스터링 설정 */}
              <div className="space-y-2 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                <h4 className="font-semibold text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  마커 클러스터링
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    자동 그룹핑 {shouldUseClusteringBasedOnZoom ? '(활성)' : '(비활성)'}
                  </span>
                  <button
                    onClick={() => setUseClusteringEnabled(!useClusteringEnabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      useClusteringEnabled ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        useClusteringEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {useClusteringNow ? '🔗 클러스터링 활성' : '📍 개별 마커 표시'}
                </div>
              </div>

              {/* LOD 최적화 정보 */}
              <div className="space-y-2 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                <h4 className="font-semibold text-sm text-green-800 dark:text-green-200">
                  📊 렌더링 최적화
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>표시 중 마커:</span>
                    <span className="font-medium">{renderStats.visible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>전체 마커:</span>
                    <span className="font-medium">{renderStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>렌더링 효율:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {renderStats.total > 0 ? Math.round((renderStats.visible / renderStats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>풀 사용률:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {Math.round(getPoolStats().utilizationRate)}%
                    </span>
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
                        className="flex justify-between items-center p-3 rounded-lg bg-green-100/50 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50 cursor-pointer hover:bg-green-200/50 dark:hover:bg-green-800/30 transition-colors duration-200"
                        onClick={() => handleStockClick(stock)}
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
              onZoomChanged={(map) => {
                handleZoomChange(map.getLevel());
                updateBounds(map);
              }}
              onCenterChanged={(map) => updateBounds(map)}
              onBoundsChanged={(map) => updateBounds(map)}
              onTileLoaded={(map: kakao.maps.Map) => updateBounds(map)}
            >
              {renderedMarkers}
              {useClusteringNow && (
                <ClusteredMarkers 
                  markers={visibleMarkers}
                  onMarkerClick={handleMarkerClick}
                  minClusterSize={3}
                  gridSize={debouncedZoomLevel >= 8 ? 80 : 60}
                />
              )}
            </Map>
            
            {/* LOD 성능 통계 표시 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-2 rounded backdrop-blur-sm">
                <div className="font-semibold text-green-400 mb-1">🚀 LOD 성능 통계</div>
                <div>가시 마커: {renderStats.visible}/{renderStats.total}</div>
                <div>필터링 시간: {renderStats.renderTime}ms</div>
                <div>풀 사용률: {Math.round(getPoolStats().utilizationRate)}%</div>
                <div>클러스터링: {useClusteringNow ? 'ON' : 'OFF'}</div>
                <div>FPS: {fps} (평균: {avgFps})</div>
                <div>줌 레벨: {zoomLevel}</div>
                <div className="text-xs text-gray-400 mt-1">
                  성능 향상: {renderStats.total > 0 ? Math.round((1 - renderStats.visible / renderStats.total) * 100) : 0}%
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
