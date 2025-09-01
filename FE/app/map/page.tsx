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
} from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import { getTopStocksByRegion } from "@/lib/api/stock";
import { MouseFollower } from "@/components/mouse-follower";
import { useRouter } from "next/navigation";
import { useMapBounds } from "@/app/hooks/useMapBounds";
import { filterMarkersByLOD } from "@/app/utils/lodUtils";
import { SearchJump } from "@/components/search-jump";

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
  logoUrl?: string;
  emoji?: string; // 임시로 유지
  sector: string; // 섹터 정보 (required로 변경)
  currentPrice?: number; // 현재가 (숫자)
  rank?: number; // 지역 내 순위
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
  const [selectedStock, setSelectedStock] = useState<TopStock | null>(null);
  const router = useRouter();



  // LOD 최적화 hooks
  const { viewport, updateBounds, isPointInBounds } = useMapBounds();

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
    setCenter({ lat, lng });
    setZoomLevel(4);
    setDebouncedZoomLevel(4);
  }, []);

  // 사용자 위치로 이동하는 함수
  const moveToUserLocation = useCallback(() => {
    if (user?.latitude && user?.longitude) {
      setCenter({ lat: Number(user.latitude), lng: Number(user.longitude) });
      setZoomLevel(4);
      setDebouncedZoomLevel(4);
    }
  }, [user?.latitude, user?.longitude]);

  // 초기 중심점 설정
  const initialCenter = { lat: 37.5665, lng: 126.978 }; // 서울시청
  const [center, setCenter] = useState(initialCenter);
  const [zoomLevel, setZoomLevel] = useState(9);

  // 컴포넌트 마운트 또는 새로고침 시 사용자 위치로 이동
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      moveToUserLocation();
    }
  }, [user, moveToUserLocation]);



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
        // 비로그인/권한 오류 등으로 지역 데이터를 못 받아도 지도는 열 수 있도록 처리
        setRegions([]);
        setTimeout(() => setIsMapReady(true), 100);
        // 화면 전체를 막지 않기 위해 치명적 에러 상태는 설정하지 않음
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
  const fetchTopStocks = useCallback(async (regionId: number) => {
    setLoadingStocks(true);
    try {
      const response = await getTopStocksByRegion(regionId);
      console.log("🔍 받아온 주식 데이터:", response.data);
      console.log("🔍 첫 번째 주식 섹터:", response.data[0]?.sector);
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

      let newZoomLevel: number;
      if (region.type === "CITY") {
        newZoomLevel = 7;
      } else if (region.type === "DISTRICT") {
        newZoomLevel = 4;
      } else {
        newZoomLevel = zoomLevel; // 기본값 유지
      }

      // 줌 레벨과 디바운싱된 줌 레벨 모두 즉시 업데이트
      setZoomLevel(newZoomLevel);
      setDebouncedZoomLevel(newZoomLevel);

      // 기존 타임아웃이 있다면 클리어 (마커 클릭은 즉시 적용)
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
        zoomTimeoutRef.current = null;
      }

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
      />
    ));

    return markers;
  }, [visibleMarkers, handleMarkerClick]);

  // 종목 클릭 시 상세 정보 표시
  const handleStockClick = (stock: TopStock) => {
    console.log("📊 선택된 종목 정보:", stock);
    console.log("📊 선택된 종목 섹터:", stock.sector);
    setSelectedStock(stock);
  };

  // 종목 상세 정보 닫기
  const handleCloseStockDetail = () => {
    setSelectedStock(null);
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

      {/* 검색·점프 기능 */}
      <SearchJump regions={regions} onLocationSelect={handleLocationSelect} />

      <main className="relative z-10 pt-44">
        <div className="w-full px-6 py-4 h-[calc(100vh-12rem)] flex gap-6">
          {/* 비치명적 경고 배너 */}
          {error && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-300/60 dark:border-yellow-700/60 shadow">
              지역 데이터를 불러오지 못했습니다. 지도는 제한적으로 표시됩니다.
            </div>
          )}

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

              <div className="space-y-4 pt-4 border-t border-green-200/50 dark:border-green-800/50">
                <h4 className="font-bold text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Flame className="w-5 h-5" />
                  <span>
                    {selectedRegion
                      ? `${selectedRegion.name} 인기 종목`
                      : "지역을 선택하세요"}
                  </span>
                </h4>

                {/* 항상 종목 리스트 먼저 표시 */}
                {loadingStocks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      주식 정보를 불러오는 중...
                    </span>
                  </div>
                ) : selectedRegion && topStocks.length > 0 ? (
                  <div className="space-y-3">
                    {topStocks.map((stock, index) => {
                      const isSelected = selectedStock?.symbol === stock.symbol;
                      const rankIcons = [Crown, Award, Star];
                      const RankIcon = rankIcons[index] || Star;

                      return (
                        <div
                          key={stock.symbol}
                          className={`relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 border-2 border-green-500 shadow-lg scale-[1.02]"
                              : "bg-gradient-to-r from-white to-green-50 dark:from-gray-800 dark:to-green-950 border border-green-200/50 dark:border-green-800/30 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md hover:scale-[1.01]"
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                          {/* 순위 배지 */}
                          <div className="absolute top-2 left-2">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                                index === 0
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : index === 1
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                              }`}
                            >
                              <RankIcon className="w-3 h-3" />
                              {index + 1}위
                            </div>
                          </div>

                          {/* 글로우 효과 */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-green-400/20 animate-pulse pointer-events-none"></div>
                          )}

                          <div className="flex justify-between items-center p-4 pt-10">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {stock.logoUrl ? (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="w-8 h-8 rounded-full object-contain"
                                    onError={(e) => {
                                      // 로고 로드 실패시 이모지로 대체
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const parent = (
                                        e.target as HTMLImageElement
                                      ).parentElement;
                                      if (parent && stock.emoji) {
                                        const span =
                                          document.createElement("span");
                                        span.className = "text-2xl";
                                        span.textContent = stock.emoji;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-2xl">
                                    {stock.emoji || "📈"}
                                  </span>
                                )}
                                {index === 0 && (
                                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 animate-pulse" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                                  {stock.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {stock.symbol}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                {stock.price}
                              </div>
                              <div
                                className={`text-sm font-semibold ${
                                  stock.change.startsWith("-")
                                    ? "text-red-500 dark:text-red-400"
                                    : "text-blue-500 dark:text-blue-400"
                                }`}
                              >
                                {stock.change}
                              </div>
                            </div>
                          </div>

                          {/* 호버 시 화살표 */}
                          <div
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                              isSelected
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 translate-x-2"
                            }`}
                          >
                            <div className="w-2 h-2 border-r-2 border-b-2 border-green-600 rotate-45"></div>
                          </div>
                        </div>
                      );
                    })}

                    {/* 선택된 종목 상세 정보 */}
                    {selectedStock && (
                      <div className="mt-6 p-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 space-y-4">
                          {/* 헤더 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {selectedStock.logoUrl ? (
                                  <img
                                    src={selectedStock.logoUrl}
                                    alt={selectedStock.name}
                                    className="w-12 h-12 rounded-full object-contain"
                                    onError={(e) => {
                                      // 로고 로드 실패시 이모지로 대체
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const parent = (
                                        e.target as HTMLImageElement
                                      ).parentElement;
                                      if (parent && selectedStock.emoji) {
                                        const span =
                                          document.createElement("span");
                                        span.className = "text-3xl";
                                        span.textContent = selectedStock.emoji;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-3xl">
                                    {selectedStock.emoji || "📈"}
                                  </span>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <TrendingUp className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">
                                  {selectedStock.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                  {selectedStock.symbol}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleCloseStockDetail}
                              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                            >
                              <X className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>

                          {/* 가격 정보 - 개선된 디자인 */}
                          <div className="relative p-6 rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-green-900 dark:via-emerald-900 dark:to-green-800 border border-green-200 dark:border-green-700 overflow-hidden">
                            <div className="absolute top-2 right-2">
                              <Sparkles className="w-5 h-5 text-green-500 opacity-60" />
                            </div>
                            <div className="text-center relative z-10">
                              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {selectedStock.price}
                              </div>
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-base font-bold ${
                                  selectedStock.change.startsWith("-")
                                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                }`}
                              >
                                <TrendingUp
                                  className={`w-4 h-4 ${
                                    selectedStock.change.startsWith("-")
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                                {selectedStock.change}
                              </div>
                            </div>
                          </div>

                          {/* 요약 정보 - 개선된 디자인 */}
                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 border border-purple-200 dark:border-purple-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <span className="font-medium text-purple-800 dark:text-purple-200">
                                    섹터
                                  </span>
                                </div>
                                <span className="font-bold text-purple-900 dark:text-purple-100">
                                  {selectedStock.sector}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900 dark:to-yellow-900 border border-orange-200 dark:border-orange-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                                    <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <span className="font-medium text-orange-800 dark:text-orange-200">
                                    지역 순위
                                  </span>
                                </div>
                                <span className="font-bold text-orange-900 dark:text-orange-100">
                                  {selectedStock.rank
                                    ? `${selectedStock.rank}위`
                                    : `상위 ${
                                        topStocks.findIndex(
                                          (s) =>
                                            s.symbol === selectedStock.symbol
                                        ) + 1
                                      }위`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 액션 버튼들 - 개선된 디자인 */}
                          <div className="space-y-3">
                            <button
                              onClick={() => handleGoToCommunity(selectedStock)}
                              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-base whitespace-nowrap"
                            >
                              <ExternalLink className="w-4 h-4" />
                              커뮤니티
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() =>
                                  handleToggleFavorite(selectedStock)
                                }
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-pink-200 dark:border-pink-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900 dark:to-rose-900 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-800 dark:hover:to-rose-800 text-pink-700 dark:text-pink-300 font-semibold transition-all duration-200 hover:scale-[1.02] whitespace-nowrap"
                              >
                                <Heart className="w-4 h-4" />찜
                              </button>

                              <button
                                onClick={() => handleViewChart(selectedStock)}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800 dark:hover:to-indigo-800 text-blue-700 dark:text-blue-300 font-semibold transition-all duration-200 hover:scale-[1.02] whitespace-nowrap"
                              >
                                <BarChart3 className="w-4 h-4" />
                                차트
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
            </Map>
          </div>
        </div>
      </main>
    </div>
  );
}
