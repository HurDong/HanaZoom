"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "@/app/components/Navbar";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { StockPriceData } from "@/lib/api/stock";
import { searchStocks, StockSearchResult } from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { StockTicker } from "@/components/stock-ticker";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import api from "@/app/config/api";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  logoUrl?: string;
  currentPrice?: string;
  priceChange?: string;
  changeRate?: string;
}

interface StockPage {
  content: Stock[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface StockItemProps {
  stock: Stock;
  priceData?: StockPriceData;
  wsConnected: boolean;
  isLoading?: boolean;
  onRef?: (element: HTMLDivElement | null, stockCode: string) => void;
}

function StockItem({ stock, priceData, wsConnected, isLoading = false, onRef }: StockItemProps) {
  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "IT/전자":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "IT/인터넷":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "IT/게임":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "자동차":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "화학":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "바이오":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "금융":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "통신":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriceChangeColor = (changeSign: string) => {
    switch (changeSign) {
      case "1": // 상한가
      case "2": // 상승
        return "text-red-600 dark:text-red-400";
      case "4": // 하락
      case "5": // 하한가
        return "text-blue-600 dark:text-blue-400";
      default: // 보합
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriceChangeIcon = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return <TrendingUp className="w-3 h-3" />;
      case "4":
      case "5":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <Card 
        ref={(el) => onRef?.(el, stock.symbol)}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-48"
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* 상단: 섹터와 연결상태 */}
          <div className="flex items-center justify-between mb-2">
            <Badge 
              className={`${getSectorColor(stock.sector)} text-xs`}
              title={stock.sector} // 툴팁으로 전체 섹터명 표시
            >
              {stock.sector.length > 18 ? `${stock.sector.substring(0, 18)}...` : stock.sector}
            </Badge>
            {wsConnected ? (
              <Wifi className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
          </div>

          {/* 종목명과 종목코드 */}
          <div className="mb-3">
            <h3 
              className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight"
              title={stock.name} // 툴팁으로 전체 종목명 표시
            >
              {stock.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {stock.symbol}
            </p>
          </div>

          {/* 중앙: 가격 정보 (한 줄로 정리) */}
          <div className="flex-1 flex items-center justify-center">
            {priceData ? (
              <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {getPriceChangeIcon(priceData.changeSign)}
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatNumber(priceData.currentPrice)}원
                  </span>
                </div>
                <div
                  className={`text-sm font-semibold ${getPriceChangeColor(
                    priceData.changeSign
                  )} mb-2`}
                >
                  {priceData.changePrice !== "0" && (
                    <>
                      {priceData.changeSign === "2" ||
                      priceData.changeSign === "1"
                        ? "+"
                        : ""}
                      {formatNumber(priceData.changePrice)} ({priceData.changeRate}%)
                    </>
                  )}
                  {priceData.changePrice === "0" && "보합"}
                </div>
              </div>
            ) : (
              <div className="text-center">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      종가 데이터 조회 중...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {wsConnected ? "실시간 데이터 대기 중..." : "연결 중..."}
                    </div>
                    {!wsConnected && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        WebSocket 연결 후 실시간 데이터 제공
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 하단: 상세보기 */}
          <div className="flex items-center justify-end mt-auto">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
              <span className="text-xs font-medium">상세보기</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StocksPage() {
  const { settings, isInitialized } = useUserSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastStockElementRef = useRef<HTMLDivElement>(null);

  const pageSize = 50;

  // 가시 영역에 있는 종목만 구독 (성능 최적화)
  const [visibleStockCodes, setVisibleStockCodes] = useState<string[]>([]);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // 모든 종목 코드 추출 (웹소켓용)
  const stockCodes = stocks.map((stock) => stock.symbol);

  // 웹소켓으로 실시간 주식 데이터 수신 (가시 영역 종목만)
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
    stockCodes: visibleStockCodes, // 가시 영역 종목만 구독
    onStockUpdate: (data) => {
      console.log(
        "📈 목록 페이지 실시간 데이터:",
        data.stockCode,
        data.currentPrice
      );
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 주식 데이터 가져오기
  const fetchStocks = useCallback(
    async (page: number, reset: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const response = await api.get("/stocks/list", {
          params: {
            page,
            size: pageSize,
            sortBy,
            sortDir,
          },
        });

        if (response.data && response.data.success) {
          const stockPage: StockPage = response.data.data;

          if (reset) {
            setStocks(stockPage.content);
            setFilteredStocks(stockPage.content);
          } else {
            setStocks((prev) => [...prev, ...stockPage.content]);
            setFilteredStocks((prev) => [...prev, ...stockPage.content]);
          }

          setTotalPages(stockPage.totalPages);
          setTotalElements(stockPage.totalElements);
          setHasMore(!stockPage.last);
        }
      } catch (error) {
        console.error("주식 데이터 가져오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy, sortDir]
  );

  // 초기 데이터 로드
  useEffect(() => {
    fetchStocks(0, true);
  }, []);

  // 정렬 변경 시 데이터 재로드
  useEffect(() => {
    setCurrentPage(0);
    setStocks([]);
    setFilteredStocks([]);
    fetchStocks(0, true);
  }, [sortBy, sortDir, fetchStocks]);

  // 가시 영역 종목 감지 (Intersection Observer)
  const stockObserver = useRef<IntersectionObserver | null>(null);
  const stockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 가시 영역에 있는 종목들을 추적
  useEffect(() => {
    const updateVisibleStocks = () => {
      const visibleCodes: string[] = [];
      
      stockRefs.current.forEach((element, stockCode) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
          if (isVisible) {
            visibleCodes.push(stockCode);
          }
        }
      });
      
      setVisibleStockCodes(visibleCodes);
      console.log("👁️ 가시 영역 종목 업데이트:", visibleCodes.length, "개");
    };

    // 스크롤 이벤트로 가시 영역 업데이트
    const handleScroll = () => {
      requestAnimationFrame(updateVisibleStocks);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // 초기 실행
    updateVisibleStocks();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [filteredStocks]);

  // 무한 스크롤 설정
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchStocks(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, currentPage, fetchStocks]
  );

  // Elasticsearch 검색 결과 상태
  const [elasticSearchResults, setElasticSearchResults] = useState<
    StockSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Elasticsearch 검색 (디바운싱)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setElasticSearchResults([]);
      setIsSearching(false);
      // 검색어가 없으면 전체 목록 표시
      setFilteredStocks(stocks);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await searchStocks(searchQuery);
        if (response.success) {
          setElasticSearchResults(response.data);
          // Elasticsearch 결과를 Stock 형식으로 변환
          const converted = response.data.map((result) => ({
            symbol: result.symbol,
            name: result.name,
            sector: result.sector,
            logoUrl: result.logoUrl,
            currentPrice: result.currentPrice,
            priceChange: result.priceChangePercent,
            changeRate: result.priceChangePercent,
          }));
          setFilteredStocks(converted);
        }
      } catch (error) {
        console.error("Elasticsearch 검색 실패:", error);
        setElasticSearchResults([]);
        // 에러 시 로컬 필터링 fallback
        const filtered = stocks.filter(
          (stock) =>
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.symbol.includes(searchQuery) ||
            stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStocks(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks]);

  // 수동 새로고침 (웹소켓 재연결)
  const handleRefresh = () => {
    if (wsConnected) {
      wsDisconnect();
      setTimeout(() => wsConnect(), 1000);
    } else {
      wsConnect();
    }
  };

  // 정렬 변경
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // 스톡 데이터 맵 가져오기
  const stockPricesMap = getStockDataMap();

  // 구독되지 않은 종목에 대한 fallback 데이터 제공
  const [fallbackData, setFallbackData] = useState<Map<string, StockPriceData>>(new Map());
  const [loadingStocks, setLoadingStocks] = useState<Set<string>>(new Set());

  const getStockPriceData = useCallback((stock: Stock) => {
    const wsData = stockPricesMap.get(stock.symbol);
    if (wsData) {
      return wsData;
    }

    // Fallback 데이터 확인
    const fallback = fallbackData.get(stock.symbol);
    if (fallback) {
      return fallback;
    }

    // WebSocket 데이터와 fallback 데이터가 모두 없으면 API 호출
    if (!loadingStocks.has(stock.symbol)) {
      fetchFallbackPrice(stock.symbol);
    }

    // 기본 데이터 반환 (API 호출 중이거나 실패한 경우)
    if (stock.currentPrice && stock.priceChange && stock.changeRate) {
      return {
        stockCode: stock.symbol,
        stockName: stock.name,
        currentPrice: stock.currentPrice,
        changePrice: stock.priceChange,
        changeRate: stock.changeRate,
        changeSign: parseFloat(stock.priceChange) > 0 ? "2" : parseFloat(stock.priceChange) < 0 ? "4" : "3",
        volume: "0",
        openPrice: "0",
        highPrice: "0",
        lowPrice: "0",
        marketCap: "0",
        marketStatus: "CLOSED",
        timestamp: Date.now()
      } as StockPriceData;
    }

    return undefined;
  }, [stockPricesMap, fallbackData, loadingStocks]);

  // 백엔드 API에서 종가 데이터 가져오기
  const fetchFallbackPrice = useCallback(async (stockCode: string) => {
    if (loadingStocks.has(stockCode)) return;

    setLoadingStocks(prev => new Set(prev).add(stockCode));

    try {
      console.log(`🔍 종가 데이터 조회 중: ${stockCode}`);
      
      const response = await api.get(`/stocks/realtime/${stockCode}`);
      
      if (response.data && response.data.success) {
        const priceData = response.data.data;
        console.log(`✅ 종가 데이터 조회 성공: ${stockCode} - ${priceData.currentPrice}원`);
        
        setFallbackData(prev => {
          const newMap = new Map(prev);
          newMap.set(stockCode, priceData);
          return newMap;
        });
      }
    } catch (error) {
      console.warn(`⚠️ 종가 데이터 조회 실패: ${stockCode}`, error);
    } finally {
      setLoadingStocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(stockCode);
        return newSet;
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* 마우스 따라다니는 아이콘들 (사용자 설정에 따라) */}
      {isInitialized && settings.customCursorEnabled && <MouseFollower />}

      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols (사용자 설정에 따라) */}
      {isInitialized && settings.emojiAnimationEnabled && (
        <FloatingEmojiBackground />
      )}

      {/* NavBar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      {/* StockTicker 추가 */}
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-28 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* 헤더 섹션 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-green-800 dark:text-green-200">
                📊 WTS 거래 시스템
              </h1>
              {/* 웹소켓 연결 상태 */}
              <div className="flex items-center gap-2">
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
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-green-200">
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
              </div>
            </div>
            <p className="text-lg text-green-700 dark:text-green-300 max-w-2xl mx-auto">
              실시간 주식 시세, 호가창, 차트 분석을 한눈에! 원하는 종목을
              선택하여 전문적인 거래 정보를 확인하세요.
            </p>
          </div>

          {/* 검색 및 정렬 섹션 */}
          <div className="mb-8 space-y-4">
            {/* 검색 */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg max-w-md mx-auto">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="종목명, 종목코드, 업종으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-900"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 정렬 옵션 */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("symbol")}
                className={`border-green-600 ${
                  sortBy === "symbol"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                종목코드
                {sortBy === "symbol" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("name")}
                className={`border-green-600 ${
                  sortBy === "name"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                종목명
                {sortBy === "name" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("sector")}
                className={`border-green-600 ${
                  sortBy === "sector"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                업종
                {sortBy === "sector" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
            </div>
          </div>

          {/* 종목 리스트 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                📋 전체 종목 목록
              </h2>
              <div className="flex items-center gap-2">
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
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  웹소켓 실시간 ({visibleStockCodes.length}개 구독)
                </Badge>
              </div>
            </div>

            {/* 웹소켓 오류 메시지 */}
            {wsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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

            {/* 검색 결과가 없을 때 */}
            {filteredStocks.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  다른 검색어를 시도해보세요
                </p>
                <Button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                >
                  전체 목록 보기
                </Button>
              </div>
            )}

            {/* 종목 그리드 - 증권가 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredStocks.map((stock, index) => {
                if (filteredStocks.length === index + 1) {
                  return (
                    <div key={stock.symbol} ref={lastElementRef}>
                      <StockItem
                        stock={stock}
                        priceData={getStockPriceData(stock)}
                        wsConnected={wsConnected}
                        isLoading={loadingStocks.has(stock.symbol)}
                        onRef={(el, stockCode) => {
                          if (el) {
                            stockRefs.current.set(stockCode, el);
                          } else {
                            stockRefs.current.delete(stockCode);
                          }
                        }}
                      />
                    </div>
                  );
                } else {
                  return (
                    <StockItem
                      key={stock.symbol}
                      stock={stock}
                      priceData={getStockPriceData(stock)}
                      wsConnected={wsConnected}
                      isLoading={loadingStocks.has(stock.symbol)}
                      onRef={(el, stockCode) => {
                        if (el) {
                          stockRefs.current.set(stockCode, el);
                        } else {
                          stockRefs.current.delete(stockCode);
                        }
                      }}
                    />
                  );
                }
              })}
            </div>

            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-green-600 dark:text-green-400">
                  종목을 불러오는 중...
                </p>
              </div>
            )}

            {/* 더 이상 로드할 데이터가 없을 때 또는 검색 결과 표시 */}
            {filteredStocks.length > 0 && (
              <div className="text-center py-8">
                {searchQuery.trim() ? (
                  // 검색 결과 표시
                  <>
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        "{searchQuery}"
                      </span>{" "}
                      검색 결과
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {filteredStocks.length}개 종목
                      {isSearching && " (검색 중...)"}
                    </p>
                  </>
                ) : !hasMore ? (
                  // 전체 목록 로드 완료
                  <>
                    <div className="text-2xl mb-2">🏁</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      모든 종목을 불러왔습니다
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      총 {totalElements.toLocaleString()}개 종목
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
