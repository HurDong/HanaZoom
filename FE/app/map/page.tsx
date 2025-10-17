"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import { RegionMarker } from "@/app/components/RegionMarker";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Compass,
  Layers,
  TrendingUp,
  Loader2,
  ExternalLink,
  Heart,
  BarChart3,
  X,
  Star,
  Flame,
  Award,
  Crown,
  Sparkles,
  Info
} from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import { getTopStocksByRegion } from "@/lib/api/stock";
import { getPopularityDetails, type PopularityDetailsResponse } from "@/lib/api/stock";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";
import { useRouter } from "next/navigation";
import { useMapBounds } from "@/app/hooks/useMapBounds";
import { filterMarkersByLOD } from "@/app/utils/lodUtils";
import { SearchJump } from "@/components/search-jump";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { getMarketStatus, isMarketOpen } from "@/lib/utils/marketUtils";
import type { StockPriceData } from "@/lib/api/stock";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import OfflineIndicator from "@/components/OfflineIndicator";
import PopularityDonut from "@/components/popularity-donut";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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
  price: string | null; // null 허용
  change: string;
  logoUrl?: string;
  emoji?: string; // 임시로 유지
  sector: string; // 섹터 정보 (required로 변경)
  currentPrice?: number; // 현재가 (숫자)
  rank?: number; // 지역 내 순위
  // 실시간 데이터 필드들
  realtimeData?: StockPriceData;
  lastUpdated?: Date;
}

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapPage() {
  const user = useAuthStore((state) => state.user);
  const { settings, isInitialized } = useUserSettingsStore();
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [topStocks, setTopStocks] = useState<TopStock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedStock, setSelectedStock] = useState<TopStock | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [popDetails, setPopDetails] = useState<PopularityDetailsResponse | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const router = useRouter();

  // onLoaded 콜백을 useCallback으로 안정화
  const handlePopDetailsLoaded = useCallback((data: PopularityDetailsResponse | null) => {
    setPopDetails(data);
  }, []);

  // 시장 상태 관리
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [isRealtimeMode, setIsRealtimeMode] = useState(isMarketOpen());

  // 웹소켓을 통한 실시간 데이터 관리
  const stockCodes = useMemo(() => {
    return topStocks.map((stock: TopStock) => stock.symbol);
  }, [topStocks]);

  const {
    connected: wsConnected,
    stockData: wsStockData,
    subscribe,
    unsubscribe,
    getStockData,
  } = useStockWebSocket({
    stockCodes,
    onStockUpdate: (data: StockPriceData) => {
      console.log("📊 실시간 주식 데이터 업데이트:", data);

      // 롯데쇼핑 데이터인 경우 특별 로그
      if (data.stockCode === "023530") {
        console.log("🏪 롯데쇼핑 실시간 데이터 수신:", {
          stockCode: data.stockCode,
          stockName: data.stockName,
          currentPrice: data.currentPrice,
          changeRate: data.changeRate,
          timestamp: new Date().toISOString(),
        });
      }

      // 실시간 데이터로 상위 주식 정보 업데이트
      setTopStocks((prevStocks) =>
        prevStocks.map((stock: TopStock) => {
          if (stock.symbol === data.stockCode) {
            return {
              ...stock,
              price: data.currentPrice || "데이터 없음",
              change: data.changeRate?.replace("%", "") || "0.00",
              realtimeData: data,
              lastUpdated: new Date(),
            };
          }
          return stock;
        })
      );
    },
  });

  // LOD 최적화 hooks
  const { viewport, updateBounds, isPointInBounds } = useMapBounds();

  // 오프라인 상태 관리
  const { isOffline } = useOfflineStatus();

  // 디바운싱을 위한 ref
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedZoomLevel, setDebouncedZoomLevel] = useState(9);

  // kakao map script 로딩 상태를 관리합니다.
  useKakaoLoader({
    appkey: KAKAO_MAP_API_KEY!,
    libraries: ["services"],
  });

  // 위치 선택 핸들러 (검색 결과에서 사용)
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    console.log("🗺️ 지도 위치 변경:", { lat, lng });
    setCenter({ lat, lng });
    setZoomLevel(4);
    setDebouncedZoomLevel(4);
  }, []);

  // 지도 상태 초기화 (내 위치 버튼 클릭 시)
  const handleResetMap = useCallback(() => {
    console.log("🔄 지도 상태 초기화");
    setSelectedRegion(null);
    setTopStocks([]);
    setSelectedStock(null);
    // 사용자 위치로 이동 (새로고침과 동일한 효과)
    if (user?.latitude && user?.longitude && mapRef.current) {
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      console.log("📍 지도 중심 이동:", { lat, lng });

      // 사용자 설정의 기본 줌 레벨 사용
      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 기본 줌 레벨 적용:", defaultZoom);

      // 카카오맵 API를 사용하여 지도 중심 이동
      const newCenter = new kakao.maps.LatLng(lat, lng);
      mapRef.current.panTo(newCenter);
      mapRef.current.setLevel(defaultZoom);

      // 상태도 업데이트
      setCenter({ lat, lng });
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);

  // 사용자 위치로 이동하는 함수
  const moveToUserLocation = useCallback(() => {
    if (user?.latitude && user?.longitude && mapRef.current) {
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      console.log("📍 초기 사용자 위치로 이동:", { lat, lng });

      // 사용자 설정의 기본 줌 레벨 사용
      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 기본 줌 레벨 적용:", defaultZoom);

      // 카카오맵 API를 사용하여 지도 중심 이동
      const newCenter = new kakao.maps.LatLng(lat, lng);
      mapRef.current.panTo(newCenter);
      mapRef.current.setLevel(defaultZoom);

      // 상태도 업데이트
      setCenter({ lat, lng });
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);

  // 초기 중심점 설정
  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 }); // 서울시청 (기본값)

  // 사용자 설정에서 기본 줌 레벨 가져오기
  const getDefaultZoomLevel = () => {
    if (isInitialized && settings.defaultMapZoom) {
      return settings.defaultMapZoom;
    }
    return 9; // 기본값 (동/면)
  };

  const [zoomLevel, setZoomLevel] = useState(getDefaultZoomLevel());

  // 사용자 정보가 로드되면 초기 위치 설정
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      console.log("👤 사용자 정보 로드됨 - 초기 위치 설정");
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      setCenter({ lat, lng });

      // 사용자 설정의 기본 줌 레벨 사용
      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 초기 줌 레벨 적용:", defaultZoom);
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);

  // 사용자 설정이 변경될 때 줌 레벨 업데이트
  useEffect(() => {
    if (isInitialized && settings.defaultMapZoom) {
      console.log("🎯 사용자 설정 줌 레벨 적용:", settings.defaultMapZoom);
      setZoomLevel(settings.defaultMapZoom);
      setDebouncedZoomLevel(settings.defaultMapZoom);
    }
  }, [isInitialized, settings.defaultMapZoom]);

  // 시장 상태 주기적 체크 (1분마다)
  useEffect(() => {
    const checkMarketStatus = () => {
      const newStatus = getMarketStatus();
      const newIsRealtimeMode = isMarketOpen();

      setMarketStatus(newStatus);
      setIsRealtimeMode(newIsRealtimeMode);

      console.log("📈 시장 상태 체크:", {
        status: newStatus.marketStatus,
        isOpen: newStatus.isMarketOpen,
        isRealtimeMode: newIsRealtimeMode,
        wsConnected,
      });
    };

    // 즉시 체크
    checkMarketStatus();

    // 1분마다 체크
    const interval = setInterval(checkMarketStatus, 60000);

    return () => clearInterval(interval);
  }, [wsConnected]);

  // 지도 인스턴스가 준비되면 사용자 위치로 이동 (지도가 이미 올바른 위치에 있으면 이동하지 않음)
  useEffect(() => {
    if (mapRef.current && user?.latitude && user?.longitude) {
      const currentCenter = mapRef.current.getCenter();
      const userLat = Number(user.latitude);
      const userLng = Number(user.longitude);

      // 현재 지도 중심과 사용자 위치가 다르면 이동
      if (
        Math.abs(currentCenter.getLat() - userLat) > 0.001 ||
        Math.abs(currentCenter.getLng() - userLng) > 0.001
      ) {
        console.log("🚀 지도 준비됨 - 사용자 위치로 이동");
        moveToUserLocation();
      }
    }
  }, [mapRef.current, user?.latitude, user?.longitude, moveToUserLocation]);

  // 지역 데이터를 불러옵니다. (오프라인 캐싱 지원)
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        // 오프라인 상태일 때 캐시된 데이터 사용
        if (isOffline) {
          console.log("📱 오프라인 모드 - 캐시된 지역 데이터 사용");
          try {
            const cachedData = await caches.match("/api/regions");
            if (cachedData) {
              const response = await cachedData.json();
              if (response.success) {
                setRegions(response.data);
                console.log(
                  "🗺️ 캐시된 지역 데이터 로드 완료:",
                  response.data.length,
                  "개"
                );
              }
            }
          } catch (cacheError) {
            console.log("📱 캐시된 데이터 없음 - 기본 데이터 사용");
            setRegions([]);
          }
        } else {
          // 온라인 상태일 때 서버에서 데이터 로드
          const { data } = await api.get<ApiResponse<Region[]>>(
            API_ENDPOINTS.regions
          );
          setRegions(data.data);
          console.log("🗺️ 지역 데이터 로드 완료:", data.data.length, "개");
        }

        // 지역 데이터 로딩 완료 후 지도 준비 상태로 변경
        setTimeout(() => setIsMapReady(true), 100);
      } catch (err) {
        console.error("지역 데이터를 불러오는 데 실패했습니다.", err);
        // 비로그인/권한 오류 등으로 지역 데이터를 못 받아도 지도는 열 수 있도록 처리
        setRegions([]);
        setTimeout(() => setIsMapReady(true), 100);
        // 화면 전체를 막지 않기 위해 치명적 에러 상태는 설정하지 않음
      }
    };
    fetchRegions();
  }, [isOffline]);

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

  // 컴포넌트 언마운트 시 타임아웃 클리어
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  // LOD 기반 마커 필터링
  const visibleMarkers = useMemo(() => {
    if (!regions || regions.length === 0 || !viewport) {
      return [];
    }

    const filtered = filterMarkersByLOD(
      regions,
      debouncedZoomLevel,
      viewport.center.lat,
      viewport.center.lng,
      isPointInBounds
    );

    return filtered;
  }, [regions, debouncedZoomLevel, viewport, isPointInBounds]);

  // 상위 주식 정보를 가져오는 함수
  const fetchTopStocks = useCallback(
    async (regionId: number) => {
      setLoadingStocks(true);
      try {
        const response = await getTopStocksByRegion(regionId);
        console.log("🔍 받아온 주식 데이터:", response.data);
        console.log("🔍 첫 번째 주식 섹터:", response.data[0]?.sector);

        // 기본 데이터 설정 (실시간 데이터 우선 사용)
        const stocksWithRealtime = response.data.map((stock: any) => {
          // 웹소켓에서 실시간 데이터가 있는지 확인
          const realtimeData = getStockData(stock.symbol);

          return {
            ...stock,
            // 실시간 데이터가 있으면 우선 사용, 없으면 DB 데이터 사용 (null 처리 포함)
            price:
              realtimeData?.currentPrice ||
              (stock.price === null ||
              stock.price === "null" ||
              stock.price === "데이터 없음"
                ? "데이터 없음"
                : stock.price),
            change:
              realtimeData?.changeRate ||
              (stock.change === "nu%" ? "0.00" : stock.change),
            realtimeData: realtimeData || undefined,
            lastUpdated: realtimeData ? new Date() : new Date(),
          };
        });

        setTopStocks(stocksWithRealtime);

        // 실시간 모드이고 웹소켓이 연결된 경우 구독
        if (isRealtimeMode && wsConnected && stocksWithRealtime.length > 0) {
          const symbols = stocksWithRealtime.map(
            (stock: TopStock) => stock.symbol
          );
          console.log("📡 실시간 모드: 종목 구독 시작", symbols);
          console.log("📡 웹소켓 연결 상태:", wsConnected);
          console.log("📡 시장 상태:", marketStatus);
          subscribe(symbols);
        } else {
          console.log("📴 구독하지 않는 이유:", {
            isRealtimeMode,
            wsConnected,
            stocksLength: stocksWithRealtime.length,
            marketStatus,
          });
        }
      } catch (err) {
        console.error("상위 주식 정보를 가져오는 데 실패했습니다.", err);
        setTopStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    },
    [isRealtimeMode, wsConnected, subscribe]
  );

  // 실시간 모드 변경 시 웹소켓 구독 관리
  useEffect(() => {
    if (topStocks.length > 0) {
      const symbols = topStocks.map((stock: TopStock) => stock.symbol);

      if (isRealtimeMode && wsConnected) {
        console.log("📡 실시간 모드 활성화: 종목 구독", symbols);
        console.log("📡 롯데쇼핑 포함 여부:", symbols.includes("023530"));
        subscribe(symbols);
      } else {
        console.log("📴 실시간 모드 비활성화: 종목 구독 해제", symbols);
        unsubscribe(symbols);
      }
    }
  }, [isRealtimeMode, wsConnected, topStocks, subscribe, unsubscribe]);

  // 마커 클릭 핸들러 최적화
  const handleMarkerClick = useCallback(
    (region: Region) => {
      setSelectedRegion(region);

      // 부드러운 이동 애니메이션
      const moveToMarker = () => {
        if (mapRef.current) {
          // 현재 지도 중심과 목표 위치의 거리 계산
          const currentCenter = mapRef.current.getCenter();
          const targetPosition = new kakao.maps.LatLng(region.latitude, region.longitude);
          const distance = Math.sqrt(
            Math.pow(currentCenter.getLat() - region.latitude, 2) +
            Math.pow(currentCenter.getLng() - region.longitude, 2)
          );

          // 마커 클릭 시 줌 레벨은 절대 변경하지 않음 - 현재 줌 레벨 유지
          const newZoomLevel = zoomLevel;

          // 기존 타임아웃이 있다면 클리어 (마커 클릭은 즉시 적용)
          if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
            zoomTimeoutRef.current = null;
          }

          // 부드러운 이동 애니메이션 - 위치만 이동, 줌 레벨은 변경하지 않음
          if (distance > 0.01) { // 일정 거리 이상이면 애니메이션 적용
            mapRef.current.panTo(targetPosition);
          } else {
            // 가까운 거리는 즉시 이동
            mapRef.current.setCenter(targetPosition);
          }

          // 상태 업데이트
          setCenter({ lat: region.latitude, lng: region.longitude });
        }
      };

      // 약간의 지연 후 이동 (시각적 피드백을 위해)
      setTimeout(moveToMarker, 100);

      // 상위 주식 정보 가져오기
      fetchTopStocks(region.id);
    },
    [fetchTopStocks, zoomLevel]
  );

  // LOD 기반 마커 렌더링
  const renderedMarkers = useMemo(() => {
    const markers = visibleMarkers.map((region) => (
      <RegionMarker
        key={region.id}
        region={region}
        onClick={handleMarkerClick}
        isVisible={true} // LOD 필터링으로 이미 가시성 결정됨
        isSelected={selectedRegion?.id === region.id} // 선택된 상태 전달
      />
    ));

    return markers;
  }, [visibleMarkers, handleMarkerClick, selectedRegion]);

  // 종목 클릭 시 상세 정보 표시
  const handleStockClick = (stock: TopStock) => {
    setSelectedStock(stock);
    setShowStockModal(true);
  };

  // 종목 상세 정보 닫기
  const handleCloseStockDetail = () => {
    setSelectedStock(null);
    setShowStockModal(false);
    setPopDetails(null);
  };

  // 커뮤니티로 이동
  const handleGoToCommunity = (stock: TopStock) => {
    router.push(`/community/${stock.symbol}`);
  };

  // 찜하기 기능 (추후 구현)
  const handleToggleFavorite = (stock: TopStock) => {
    // TODO: 찜하기 API 호출
    console.log("찜하기:", stock.symbol);
  };

  // 차트 보기 (추후 구현)
  const handleViewChart = (stock: TopStock) => {
    // TODO: 차트 모달 또는 페이지로 이동
    console.log("차트 보기:", stock.symbol);
  };


  if (!isMapReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              지도 준비 중
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              지역 정보를 불러오는 중입니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* 마우스 따라다니는 아이콘들 (사용자 설정에 따라) */}
      {isInitialized && settings.customCursorEnabled && <MouseFollower />}

      {/* Floating Stock Symbols (사용자 설정에 따라) */}
      <FloatingEmojiBackground />

      {/* 오프라인 상태 표시 */}
      <OfflineIndicator />

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      {/* 검색·점프 기능 */}
      <SearchJump
        regions={regions}
        onLocationSelect={handleLocationSelect}
        onResetMap={handleResetMap}
      />


      <main className="relative z-10 pt-20">
        <div className="w-full px-6 py-4 h-[calc(100vh-8rem)] flex gap-6">
          {/* 비치명적 경고 배너 */}
          {error && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-300/60 dark:border-yellow-700/60 shadow">
              지역 데이터를 불러오지 못했습니다. 지도는 제한적으로 표시됩니다.
            </div>
          )}

          {/* 지도 컨트롤 사이드 패널 */}
          <Card className="w-80 hidden md:flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Compass className="w-5 h-5 text-emerald-600" />
                <span className="font-bold">지역 탐색</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 max-h-[calc(100vh-12rem)]">
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>탐색 범위</span>
                </label>

                <div className="bg-white dark:bg-gray-700 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      줌 레벨: {zoomLevel}
                    </span>
                    <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                      {zoomLevel <= 4 ? "동네" : zoomLevel <= 7 ? "도시" : "전국"}
                    </div>
                  </div>

                  <Slider
                    value={[zoomLevel]}
                    max={14}
                    min={1}
                    step={1}
                    onValueChange={(value) => handleZoomChange(value[0])}
                    className="mb-3"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>
                      {selectedRegion
                        ? `${selectedRegion.name} 인기 종목`
                        : "지역을 선택하세요"}
                    </span>
                  </h4>

                </div>

                {/* 인기 종목 패널 */}
                {loadingStocks ? (
                  <div className="flex flex-col items-center justify-center py-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      종목 정보 로딩중...
                    </span>
                  </div>
                ) : selectedRegion && topStocks.length > 0 ? (
                  <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        인기 종목 TOP 3
                      </h3>
                    </div>

                    {/* 종목 리스트 - 개선된 카드 형식 */}
                    {topStocks.map((stock, index) => {
                      const isSelected = selectedStock?.symbol === stock.symbol;
                      const actualRank = index + 1;

                      // 순위별 스타일 설정
                      const getRankStyle = (rank: number) => {
                        switch (rank) {
                          case 1:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900",
                              borderColor:
                                "border-yellow-300 dark:border-yellow-600",
                              cardSize: "scale-[1.02]",
                              label: "1위",
                            };
                          case 2:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900",
                              borderColor:
                                "border-gray-300 dark:border-gray-600",
                              cardSize: "scale-[1.01]",
                              label: "2위",
                            };
                          case 3:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-orange-400 to-amber-500 text-orange-900",
                              borderColor:
                                "border-orange-300 dark:border-orange-600",
                              cardSize: "scale-[1.005]",
                              label: "3위",
                            };
                          default:
                            return {
                              badgeColor:
                                "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                              borderColor:
                                "border-gray-200 dark:border-gray-700",
                              cardSize: "",
                              label: `${rank}위`,
                            };
                        }
                      };

                      const rankStyle = getRankStyle(actualRank);

                      // 등락률 색상 결정
                      const getChangeColor = (change: string) => {
                        if (change === "0.00%" || change === "0.00") {
                          return "text-gray-500 dark:text-gray-400";
                        }
                        if (change.startsWith("-")) {
                          return "text-red-500 dark:text-red-400";
                        }
                        return "text-green-500 dark:text-green-400";
                      };

                      // 등락률 아이콘
                      const getChangeIcon = (change: string) => {
                        if (change === "0.00%" || change === "0.00") {
                          return (
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          );
                        }
                        if (change.startsWith("-")) {
                          return <TrendingUp className="w-3 h-3 rotate-180" />;
                        }
                        return <TrendingUp className="w-3 h-3" />;
                      };

                      return (
                        <div
                          key={stock.symbol}
                          className={`relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 cursor-pointer group ${
                            rankStyle.cardSize
                          } ${
                            isSelected
                              ? `${rankStyle.borderColor} shadow-lg`
                              : `${rankStyle.borderColor} hover:shadow-md`
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                          {/* 1위 라벨 */}
                          {actualRank === 1 && (
                            <div className="absolute -top-2 left-4 z-10">
                              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                🏆 1위
                              </div>
                            </div>
                          )}

                          <div className="p-4">
                            {/* 간소화된 카드 내용 */}
                            <div className="flex items-center gap-4">
                              {/* 순위 뱃지 */}
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${rankStyle.badgeColor}`}
                                >
                                  <span className="text-sm font-bold">
                                    {actualRank}
                                  </span>
                                </div>
                              </div>

                              {/* 종목 로고 */}
                              <div className="flex-shrink-0">
                                {stock.logoUrl ? (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="w-12 h-12 rounded-full object-contain bg-gray-50 dark:bg-gray-700 p-1 shadow-sm"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const parent = (
                                        e.target as HTMLImageElement
                                      ).parentElement;
                                      if (parent && stock.emoji) {
                                        const span =
                                          document.createElement("span");
                                        span.className = "text-xl";
                                        span.textContent = stock.emoji;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xl shadow-sm">
                                    {stock.emoji || "📈"}
                                  </div>
                                )}
                              </div>

                              {/* 종목 정보 - 간소화 */}
                              <div className="flex-1 min-w-0">
                                {/* 종목명 - 완전히 표시 */}
                                <div className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight mb-1">
                                  {stock.name}
                                </div>

                                {/* 업종 */}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  <span className="truncate">
                                    {stock.sector}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

              {/* 선택 상태 표시 */}
              {isSelected && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              )}
                        </div>
                      );
                    })}
                  </div>
                ) : selectedRegion ? (
                  <div className="text-center py-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      종목 정보가 없습니다
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRegion.name} 지역의 종목 정보가 아직 등록되지 않았습니다
                    </p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </CardContent>
          </Card>

      {/* 지도 영역 */}
      <div className="flex-1 h-full rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center relative">
        <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
          <Map
            center={center}
            style={{ width: "100%", height: "100%" }}
            level={zoomLevel}
            onZoomChanged={(map) => {
              handleZoomChange(map.getLevel());
              updateBounds(map);
            }}
            onCenterChanged={(map) => {
              updateBounds(map);
              if (!mapRef.current) {
                console.log("🗺️ 카카오맵 인스턴스 저장");
                mapRef.current = map;
              }
            }}
            onBoundsChanged={(map) => updateBounds(map)}
            onTileLoaded={(map: kakao.maps.Map) => updateBounds(map)}
          >
            {renderedMarkers}
          </Map>

        </div>
      </div>
        </div>
      </main>

      {/* 종목 상세 정보 모달 */}
      {showStockModal && selectedStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999] animate-in fade-in duration-300">
          {/* 데스크톱: 중앙 정렬, 모바일: 바텀시트 */}
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] md:max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 relative flex flex-col">
            {/* 모바일 핸들 */}
            <div className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* 고정 닫기 버튼 */}
            <button
              onClick={handleCloseStockDetail}
              aria-label="닫기"
              className="absolute top-4 right-4 z-[10000] p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 스크롤 가능한 컨텐츠 영역 */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-12 md:pt-6">
                {/* 헤더 - 순위 배지 + 로고 + 종목명 */}
                <div className="flex items-start gap-3">
                  {/* 순위 배지 */}
                  {selectedStock.rank && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {selectedStock.rank}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 로고 + 종목명 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      {selectedStock.logoUrl ? (
                        <img
                          src={selectedStock.logoUrl}
                          alt={selectedStock.name}
                          className="w-12 h-12 rounded-xl object-contain bg-gray-50 dark:bg-gray-800 p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            const parent = (e.target as HTMLImageElement)
                              .parentElement;
                            if (parent && selectedStock.emoji) {
                              const span = document.createElement("span");
                              span.className = "text-2xl w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl";
                              span.textContent = selectedStock.emoji;
                              parent.appendChild(span);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                          <span className="text-xl">
                            {selectedStock.emoji || "📈"}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                        {selectedStock.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {selectedStock.symbol}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 가격 정보 카드 */}
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700/50 shadow-lg">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {selectedStock.price === "데이터 없음" ||
                      selectedStock.price === null
                        ? "데이터 없음"
                        : `₩${Number(selectedStock.price).toLocaleString()}`}
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold shadow-sm ${
                        selectedStock.change.startsWith("-")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-700"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                      }`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 ${
                          selectedStock.change.startsWith("-") ? "rotate-180" : ""
                        }`}
                      />
                      {selectedStock.change === "0.00%"
                        ? selectedStock.change
                        : selectedStock.change.startsWith("-")
                        ? `${selectedStock.change}%`
                        : selectedStock.change.includes("%")
                        ? selectedStock.change
                        : `${selectedStock.change}%`}
                    </div>
                  </div>
                </div>

                {/* 인기도 기여도 도넛(전일 기준) */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-sm">
                  <div className="mb-3 font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>인기지수</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label="인기지수 설명" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <Info className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="space-y-1">
                            <div className="font-semibold">인기지수 알고리즘</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              거래추세(45%) + 커뮤니티(35%) + 모멘텀(20%)의 가중합입니다.
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              각 요소는 0~100 범위로 로그 정규화됩니다.
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <PopularityDonut
                    key={`${selectedRegion?.id}-${selectedStock.symbol}`}
                    regionId={selectedRegion?.id || 0}
                    symbol={selectedStock.symbol}
                    name={selectedStock.name}
                    onLoaded={handlePopDetailsLoaded}
                  />
                </div>
              </div>
            </div>

            {/* 고정 액션 버튼: 커뮤니티 / WTS */}
            <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/community/${selectedStock.symbol}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>커뮤니티</span>
                </button>
                <button
                  onClick={() => router.push(`/stocks/${selectedStock.symbol}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>WTS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
