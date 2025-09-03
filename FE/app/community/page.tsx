"use client";
import { getAccessToken } from "@/app/utils/auth";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  MapPin,
  Search,
  Filter,
  Star,
  Users,
  Activity,
  Minus,
  Heart,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/app/config/api";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkIsInWatchlist,
} from "@/lib/api/watchlist";
import { toast } from "sonner";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  logoUrl?: string;
  emoji?: string; // fallback용
  sector?: string; // 업종 정보 추가
  volume?: number; // 거래량 정보 추가
  // 실시간 데이터용 필드들
  currentPrice?: string;
  priceChange?: string;
  changeRate?: string;
  changeSign?: string;
}

interface UserRegionInfo {
  regionId: number;
  roomName: string;
}

// 업종별 색상 매핑
const sectorColors: { [key: string]: string } = {
  IT: "bg-gradient-to-r from-blue-400 to-cyan-400 text-white dark:from-blue-500 dark:to-cyan-500 shadow-lg",
  금융: "bg-gradient-to-r from-emerald-400 to-green-400 text-white dark:from-emerald-500 dark:to-green-500 shadow-lg",
  제조업:
    "bg-gradient-to-r from-violet-400 to-purple-400 text-white dark:from-violet-500 dark:to-purple-500 shadow-lg",
  에너지:
    "bg-gradient-to-r from-orange-400 to-red-400 text-white dark:from-orange-500 dark:to-red-500 shadow-lg",
  소비재:
    "bg-gradient-to-r from-pink-400 to-rose-400 text-white dark:from-pink-500 dark:to-rose-500 shadow-lg",
  헬스케어:
    "bg-gradient-to-r from-red-400 to-pink-400 text-white dark:from-red-500 dark:to-pink-500 shadow-lg",
  바이오:
    "bg-gradient-to-r from-teal-400 to-cyan-400 text-white dark:from-teal-500 dark:to-cyan-500 shadow-lg",
  반도체:
    "bg-gradient-to-r from-indigo-400 to-blue-400 text-white dark:from-indigo-500 dark:to-blue-500 shadow-lg",
  자동차:
    "bg-gradient-to-r from-slate-400 to-gray-400 text-white dark:from-slate-500 dark:to-gray-500 shadow-lg",
  건설: "bg-gradient-to-r from-amber-400 to-orange-400 text-white dark:from-amber-500 dark:to-orange-500 shadow-lg",
  기타: "bg-gradient-to-r from-gray-400 to-slate-400 text-white dark:from-gray-500 dark:to-slate-500 shadow-lg",
};

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("stocks");
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [userRegion, setUserRegion] = useState<UserRegionInfo | null>(null);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  // 새로운 상태들
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "change" | "volume">("name");

  // 관심종목 관련 상태
  const [watchlistStatus, setWatchlistStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [watchlistLoading, setWatchlistLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // 모든 종목 코드 추출 (웹소켓용)
  const stockCodes = allStocks.map((stock) => stock.symbol);

  // 웹소켓으로 실시간 주식 데이터 수신
  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    subscribedCodes,
    connect: wsConnect,
    disconnect: wsDisconnect,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: stockCodes,
    onStockUpdate: (data) => {
      console.log(
        "📈 커뮤니티 페이지 실시간 데이터:",
        data.stockCode,
        data.currentPrice
      );
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 백엔드에서 종목 데이터 가져오기
  const fetchStocks = async () => {
    try {
      setIsLoadingStocks(true);
      const response = await api.get("/stocks/ticker");
      if (response.data && response.data.success) {
        const stocks = response.data.data.map((stock: any) => ({
          symbol: stock.symbol || stock.stockCode || "",
          name: stock.name || stock.stockName || "종목명 없음",
          price: stock.price
            ? parseInt(stock.price)
            : stock.currentPrice
            ? parseInt(stock.currentPrice)
            : undefined,
          change: stock.priceChange ? parseInt(stock.priceChange) : undefined,
          changePercent: stock.changeRate
            ? parseFloat(stock.changeRate)
            : stock.change
            ? parseFloat(stock.change)
            : undefined,
          logoUrl: stock.logoUrl,
          emoji: stock.emoji || "📈", // fallback
          sector: stock.sector || "기타", // 업종 정보
          volume: stock.volume || 0, // 거래량 - 실시간 데이터에서 가져올 예정
          // 실시간 데이터용 필드들 (초기값)
          currentPrice: stock.currentPrice || stock.price || "0",
          priceChange: stock.priceChange || "0",
          changeRate: stock.changeRate || "0",
          changeSign: stock.changeSign || "3", // 기본값: 보합
        }));
        setAllStocks(stocks);
      }
    } catch (error) {
      console.error("종목 데이터 가져오기 실패:", error);
      // 에러 시 빈 배열로 설정
      setAllStocks([]);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // 컴포넌트 마운트 시 종목 데이터 가져오기
  useEffect(() => {
    fetchStocks();
  }, []);

  // 종목 데이터가 로드된 후 관심종목 상태 확인
  useEffect(() => {
    if (allStocks.length > 0 && user) {
      allStocks.forEach((stock) => {
        checkWatchlistStatus(stock.symbol);
      });
    }
  }, [allStocks, user]);

  // 실시간 데이터로 주식 정보 업데이트
  useEffect(() => {
    if (wsStockData && allStocks.length > 0) {
      const stockPricesMap = getStockDataMap();
      
      setAllStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const realtimeData = stockPricesMap.get(stock.symbol);
          if (realtimeData) {
            return {
              ...stock,
              // 실시간 데이터로 업데이트
              currentPrice: realtimeData.currentPrice,
              priceChange: realtimeData.changePrice,
              changeRate: realtimeData.changeRate,
              changeSign: realtimeData.changeSign,
              volume: realtimeData.volume ? parseInt(realtimeData.volume) : stock.volume,
              // 기존 price 필드도 업데이트 (호환성)
              price: realtimeData.currentPrice ? parseInt(realtimeData.currentPrice) : stock.price,
              change: realtimeData.changePrice ? parseInt(realtimeData.changePrice) : stock.change,
              changePercent: realtimeData.changeRate ? parseFloat(realtimeData.changeRate) : stock.changePercent,
            };
          }
          return stock;
        })
      );
    }
  }, [wsStockData, allStocks.length, getStockDataMap]);

  useEffect(() => {
    // 위치 정보가 없는 경우 최신 사용자 정보 조회
    const refreshUserInfo = async () => {
      if (!user?.latitude || !user?.longitude) {
        try {
          const token = getAccessToken();
          if (token) {
            const response = await fetch(
              "http://localhost:8080/api/v1/members/me",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              // TODO: setLoginData를 호출하여 사용자 정보 업데이트
            }
          }
        } catch (error) {
          // 사용자 정보 새로고침 실패 시 무시
        }
      }
    };

    refreshUserInfo();

    const fetchUserRegion = async () => {
      if (activeTab !== "regions") return;

      const token = getAccessToken();
      if (!token) {
        setUserRegion(null);
        return;
      }

      try {
        setIsLoadingRegion(true);
        const response = await fetch(
          "http://localhost:8080/api/v1/chat/region-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserRegion({
            regionId: data.data.regionId,
            roomName: data.data.roomName || `지역 ${data.data.regionId}`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user region:", error);
      } finally {
        setIsLoadingRegion(false);
      }
    };

    fetchUserRegion();
  }, [activeTab]);

  // 필터링 및 정렬된 종목 목록
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = allStocks.filter((stock) => {
      const matchesSearch =
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector =
        selectedSector === "all" || stock.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "change":
          return (b.changePercent || 0) - (a.changePercent || 0);
        case "volume":
          return (b.volume || 0) - (a.volume || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allStocks, searchQuery, selectedSector, sortBy]);

  // 고유한 업종 목록
  const uniqueSectors = useMemo(() => {
    const sectors = [...new Set(allStocks.map((stock) => stock.sector))];
    return sectors.sort();
  }, [allStocks]);

  // 관심종목 상태 확인
  const checkWatchlistStatus = async (stockSymbol: string) => {
    if (!user) return;

    try {
      const status = await checkIsInWatchlist(stockSymbol);
      setWatchlistStatus((prev) => ({ ...prev, [stockSymbol]: status }));
    } catch (error) {
      console.error("관심종목 상태 확인 실패:", error);
    }
  };

  // 관심종목 토글
  const toggleWatchlist = async (stockSymbol: string, stockName: string) => {
    if (!user) {
      toast.error("관심종목을 관리하려면 로그인이 필요합니다.");
      return;
    }

    setWatchlistLoading((prev) => ({ ...prev, [stockSymbol]: true }));
    try {
      if (watchlistStatus[stockSymbol]) {
        await removeFromWatchlist(stockSymbol);
        setWatchlistStatus((prev) => ({ ...prev, [stockSymbol]: false }));
        toast.success(`${stockName}이(가) 관심종목에서 제거되었습니다.`);
      } else {
        await addToWatchlist({ stockSymbol });
        setWatchlistStatus((prev) => ({ ...prev, [stockSymbol]: true }));
        toast.success(`${stockName}이(가) 관심종목에 추가되었습니다.`);
      }
    } catch (error) {
      console.error("관심종목 토글 실패:", error);
      toast.error("관심종목 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setWatchlistLoading((prev) => ({ ...prev, [stockSymbol]: false }));
    }
  };

  // 수동 새로고침 (웹소켓 재연결)
  const handleRefresh = () => {
    if (wsConnected) {
      wsDisconnect();
      setTimeout(() => wsConnect(), 1000);
    } else {
      wsConnect();
    }
  };

  // 한국어 조사 결정 함수
  const getKoreanJosa = (word: string) => {
    if (!word) return "이";

    const lastChar = word.charAt(word.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);

    if (lastCharCode >= 44032 && lastCharCode <= 55203) {
      const hangulCode = lastCharCode - 44032;
      const finalConsonant = hangulCode % 28;
      return finalConsonant === 0 ? "가" : "이";
    }

    return "이";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <MouseFollower />
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="container mx-auto px-4 py-8 pt-36">
        {/* 헤더 섹션 */}
        <div className="mb-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
            <span className="text-4xl">💬</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-300 dark:to-emerald-300 bg-clip-text text-transparent mb-6">
            HanaZoom 커뮤니티
          </h1>
          <p className="text-xl text-green-700 dark:text-green-300 max-w-3xl mx-auto leading-relaxed mb-4">
            지역별 투자 정보와 종목별 토론방에서 다양한 의견을 나눠보세요!
          </p>
          
          {/* 웹소켓 연결 상태 표시 */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {wsConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  실시간 연결
                </Badge>
              </>
            ) : wsConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  연결 중...
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  연결 안됨
                </Badge>
              </>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={wsConnecting}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${
                  wsConnecting ? "animate-spin" : ""
                }`}
              />
              {wsConnected ? "재연결" : "연결"}
            </Button>
          </div>
        </div>

        {/* 탭 선택 인터페이스 */}
        <div className="mb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-green-200 dark:border-green-700 shadow-xl rounded-2xl p-1">
              <TabsTrigger
                value="stocks"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-semibold"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                종목별 토론
              </TabsTrigger>
              <TabsTrigger
                value="regions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-semibold"
              >
                <MapPin className="w-5 h-5 mr-2" />
                지역별 채팅
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 종목별 토론방 목록 */}
        {activeTab === "stocks" && (
          <div>
            {/* 검색 및 필터 섹션 */}
            <div className="mb-8 space-y-4">
              {/* 검색바 */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="종목명 또는 심볼 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-green-200 dark:border-green-700 rounded-xl shadow-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* 필터 및 정렬 */}
              <div className="flex flex-wrap justify-center gap-3">
                {/* 업종 필터 */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-green-600" />
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="all">전체 업종</option>
                    {uniqueSectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 정렬 옵션 */}
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="name">이름순</option>
                    <option value="change">등락률순</option>
                    <option value="volume">거래량순</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 웹소켓 오류 메시지 */}
            {wsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">{wsError}</span>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-600 text-red-600 hover:bg-red-50"
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            )}

            {isLoadingStocks ? (
              <div className="text-center py-20">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                </div>
                <p className="text-2xl text-green-700 dark:text-green-300 font-medium">
                  종목 정보를 불러오는 중...
                </p>
                <p className="text-lg text-green-600 dark:text-green-400 mt-2">
                  잠시만 기다려주세요
                </p>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {filteredAndSortedStocks.map((stock) => (
                  <div key={stock.symbol} className="break-inside-avoid">
                    <Link href={`/community/${stock.symbol}`}>
                      <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl overflow-hidden cursor-pointer">
                        <CardContent className="p-6">
                          {/* 종목 헤더 */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 flex-1">
                              {stock.logoUrl ? (
                                <div className="relative">
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="w-12 h-12 rounded-xl object-contain bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 p-1"
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
                                        span.className =
                                          "text-3xl w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/50 rounded-xl";
                                        span.textContent = stock.emoji;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                </div>
                              ) : stock.emoji ? (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/50 rounded-xl flex items-center justify-center">
                                  <span className="text-3xl">
                                    {stock.emoji}
                                  </span>
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/50 rounded-xl flex items-center justify-center">
                                  <span className="text-3xl">📈</span>
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-green-800 dark:text-green-200 truncate group-hover:text-green-600 dark:group-hover:text-green-300 transition-colors">
                                  {stock.name}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                  {stock.symbol}
                                </p>
                              </div>
                            </div>

                            {/* 등락률 배지 */}
                            {(stock.changePercent !== undefined || stock.changeRate) && (
                              <div
                                className={`flex items-center px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                                  (stock.changeSign === "1" || stock.changeSign === "2") || 
                                  (stock.change && stock.change > 0)
                                    ? "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 dark:from-red-900/50 dark:to-pink-900/50 dark:text-red-300"
                                    : (stock.changeSign === "4" || stock.changeSign === "5") || 
                                      (stock.change && stock.change < 0)
                                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/50 dark:to-cyan-900/50 dark:text-blue-300"
                                    : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 dark:from-gray-800/50 dark:to-slate-800/50 dark:text-gray-300"
                                }`}
                              >
                                {(stock.changeSign === "1" || stock.changeSign === "2") || 
                                 (stock.change && stock.change > 0) ? (
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                ) : (stock.changeSign === "4" || stock.changeSign === "5") || 
                                      (stock.change && stock.change < 0) ? (
                                  <TrendingDown className="w-4 h-4 mr-1" />
                                ) : (
                                  <Minus className="w-4 h-4 mr-1" />
                                )}
                                <span>
                                  {(stock.changeSign === "1" || stock.changeSign === "2") || 
                                   (stock.change && stock.change > 0) ? "+" : ""}
                                  {stock.changeRate 
                                    ? parseFloat(stock.changeRate).toFixed(2)
                                    : stock.changePercent?.toFixed(2) || "0.00"}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 업종 태그 */}
                          <div className="mb-4">
                            <Badge
                              className={`${
                                sectorColors[stock.sector || "기타"]
                              } text-xs font-medium px-2 py-1 rounded-lg`}
                            >
                              {stock.sector || "기타"}
                            </Badge>
                          </div>

                          {/* 가격 정보 */}
                          <div className="mb-4">
                            <div className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                              {stock.currentPrice && stock.currentPrice !== "0"
                                ? `₩${parseInt(stock.currentPrice).toLocaleString()}`
                                : stock.price
                                ? `₩${stock.price.toLocaleString()}`
                                : "가격 정보 없음"}
                            </div>
                            {stock.volume && stock.volume > 0 && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                거래량: {stock.volume.toLocaleString()}
                                {wsConnected && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    실시간
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex justify-between items-center pt-4 border-t border-green-100 dark:border-green-800">
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              <span>토론방 입장</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWatchlist(stock.symbol, stock.name);
                              }}
                              disabled={watchlistLoading[stock.symbol]}
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                                watchlistStatus[stock.symbol]
                                  ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                              } ${
                                watchlistLoading[stock.symbol]
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              {watchlistLoading[stock.symbol] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                              ) : (
                                <Heart
                                  className={`w-4 h-4 ${
                                    watchlistStatus[stock.symbol]
                                      ? "fill-current"
                                      : ""
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* 검색 결과가 없을 때 */}
            {!isLoadingStocks && filteredAndSortedStocks.length === 0 && (
              <div className="text-center py-20">
                <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center shadow-2xl mb-8">
                  <span className="text-5xl">🔍</span>
                </div>
                <p className="text-2xl text-gray-600 dark:text-gray-400 font-medium mb-4">
                  검색 결과가 없습니다
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-500">
                  다른 검색어나 필터를 시도해보세요
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSector("all");
                    setSortBy("name");
                  }}
                  className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 지역별 채팅방 */}
        {activeTab === "regions" && (
          <div className="space-y-6">
            {!user ||
            !user.address ||
            !user.latitude ||
            !user.longitude ||
            user.latitude === 0 ||
            user.longitude === 0 ? (
              // 위치 정보가 없는 경우 또는 좌표가 0인 경우
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-3">
                    위치 정보 설정 필요
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    지역별 채팅방을 이용하려면 위치 정보를 설정해주세요
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    최초 1회만 설정하면 됩니다
                  </p>
                  <Button
                    onClick={() => router.push("/auth/location-setup")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    위치 설정하기
                  </Button>
                </CardContent>
              </Card>
            ) : isLoadingRegion ? (
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl">
                <CardContent className="p-16 text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                  </div>
                  <p className="text-xl text-green-700 dark:text-green-300 font-medium">
                    지역 정보를 불러오는 중...
                  </p>
                </CardContent>
              </Card>
            ) : userRegion ? (
              <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                      <MapPin className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-3">
                        나의 지역 채팅방
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                        {userRegion.roomName}
                      </p>
                      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        같은 지역 주민들과 실시간으로 투자 정보를 공유해보세요
                      </p>
                    </div>
                    <Link href={`/community/region/${userRegion.regionId}`}>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
                      >
                        <MessageSquare className="w-6 h-6 mr-2" />
                        채팅방 입장하기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl hover:shadow-lg transition-all duration-300">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">
                    지역 정보를 불러올 수 없습니다.
                  </p>
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    로그인 후 이용해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 종목이 없을 때만 표시 (지역 탭은 이미 위에서 처리) */}
        {activeTab === "stocks" &&
          allStocks.length === 0 &&
          !isLoadingStocks && (
            <div className="text-center py-20">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center shadow-2xl mb-8">
                <span className="text-5xl">🔍</span>
              </div>
              <p className="text-2xl text-gray-600 dark:text-gray-400 font-medium mb-4">
                표시할 종목이 없습니다.
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-500">
                잠시 후 다시 시도해주세요.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}
