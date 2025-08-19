"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { StockPriceData } from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

// 한국 주요 종목들
const POPULAR_STOCKS = [
  { code: "005930", name: "삼성전자", sector: "IT/전자" },
  { code: "000660", name: "SK하이닉스", sector: "IT/전자" },
  { code: "035420", name: "NAVER", sector: "IT/인터넷" },
  { code: "005380", name: "현대자동차", sector: "자동차" },
  { code: "006400", name: "삼성SDI", sector: "IT/전자" },
  { code: "051910", name: "LG화학", sector: "화학" },
  { code: "035720", name: "카카오", sector: "IT/인터넷" },
  { code: "028260", name: "삼성물산", sector: "건설" },
  { code: "207940", name: "삼성바이오로직스", sector: "바이오" },
  { code: "068270", name: "셀트리온", sector: "바이오" },
  { code: "323410", name: "카카오뱅크", sector: "금융" },
  { code: "003670", name: "포스코홀딩스", sector: "철강" },
  { code: "096770", name: "SK이노베이션", sector: "화학" },
  { code: "017670", name: "SK텔레콤", sector: "통신" },
  { code: "030200", name: "KT", sector: "통신" },
  { code: "036570", name: "엔씨소프트", sector: "IT/게임" },
  { code: "259960", name: "크래프톤", sector: "IT/게임" },
  { code: "373220", name: "LG에너지솔루션", sector: "IT/전자" },
  { code: "066570", name: "LG전자", sector: "IT/전자" },
  { code: "018260", name: "삼성에스디에스", sector: "IT/서비스" },
];

interface StockItemProps {
  stock: (typeof POPULAR_STOCKS)[0];
  priceData?: StockPriceData;
  wsConnected: boolean;
}

function StockItem({ stock, priceData, wsConnected }: StockItemProps) {
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
    <Link href={`/stocks/${stock.code}`}>
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200 dark:border-green-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {stock.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                {stock.code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getSectorColor(stock.sector)}>
                {stock.sector}
              </Badge>
              {wsConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>

          {/* 가격 정보 표시 */}
          {priceData ? (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getPriceChangeIcon(priceData.changeSign)}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatNumber(priceData.currentPrice)}원
                  </span>
                </div>
                <div
                  className={`text-xs ${getPriceChangeColor(
                    priceData.changeSign
                  )}`}
                >
                  {priceData.changePrice !== "0" && (
                    <>
                      {priceData.changeSign === "2" ||
                      priceData.changeSign === "1"
                        ? "+"
                        : ""}
                      {formatNumber(priceData.changePrice)} (
                      {priceData.changeRate}%)
                    </>
                  )}
                  {priceData.changePrice === "0" && "보합"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  실시간 데이터 대기 중...
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {wsConnected
                ? priceData
                  ? "실시간 데이터"
                  : "데이터 대기 중"
                : "연결 끊김"}
            </div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="text-xs font-medium">상세보기</span>
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStocks, setFilteredStocks] = useState(POPULAR_STOCKS);

  // 모든 종목 코드 추출
  const stockCodes = POPULAR_STOCKS.map((stock) => stock.code);

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
        "📈 목록 페이지 실시간 데이터:",
        data.stockCode,
        data.currentPrice
      );
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 검색 필터링
  useEffect(() => {
    const filtered = POPULAR_STOCKS.filter(
      (stock) =>
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.code.includes(searchQuery) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredStocks(filtered);
  }, [searchQuery]);

  // 수동 새로고침 (웹소켓 재연결)
  const handleRefresh = () => {
    if (wsConnected) {
      wsDisconnect();
      setTimeout(() => wsConnect(), 1000);
    } else {
      wsConnect();
    }
  };

  // 스톡 데이터 맵 가져오기
  const stockPricesMap = getStockDataMap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📊
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          📈
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          💹
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          💰
        </div>
        <div className="floating-symbol absolute top-32 right-1/3 text-emerald-400 dark:text-emerald-300 text-lg animate-pulse delay-200">
          🎯
        </div>
      </div>

      {/* NavBar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      <main className="relative z-10 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
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
              </div>
            </div>
            <p className="text-lg text-green-700 dark:text-green-300 max-w-2xl mx-auto">
              실시간 주식 시세, 호가창, 차트 분석을 한눈에! 원하는 종목을
              선택하여 전문적인 거래 정보를 확인하세요.
            </p>
          </div>

          {/* 검색 섹션 */}
          <div className="mb-8">
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
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    총 종목 수
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {POPULAR_STOCKS.length}개
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    검색 결과
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {filteredStocks.length}개
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Wifi className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    구독 종목
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  {subscribedCodes.length}개
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-green-200 dark:border-green-700">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    실시간 데이터
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {stockPricesMap.size}개
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 종목 리스트 */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                📋 주요 종목 목록
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
                  웹소켓 실시간
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
            {filteredStocks.length === 0 && (
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

            {/* 종목 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStocks.map((stock) => (
                <StockItem
                  key={stock.code}
                  stock={stock}
                  priceData={stockPricesMap.get(stock.code)}
                  wsConnected={wsConnected}
                />
              ))}
            </div>
          </div>

          {/* 안내 정보 */}
          <div className="mt-12 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="text-center">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                실시간 웹소켓 연결 완료!
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
                <div>
                  <strong>웹소켓 실시간:</strong>
                  <br />
                  KIS API 직접 연결로 즉시 업데이트
                  <br />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    연결된 종목: {stockPricesMap.size}/{POPULAR_STOCKS.length}개
                  </span>
                </div>
                <div>
                  <strong>전문 정보:</strong>
                  <br />
                  현재가, 호가창, 차트 분석 원스톱
                  <br />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {lastUpdate > 0 &&
                      `${Math.floor(
                        (Date.now() - lastUpdate) / 1000
                      )}초 전 업데이트`}
                  </span>
                </div>
                <div>
                  <strong>모의투자:</strong>
                  <br />
                  실제 데이터로 안전한 모의거래 환경
                  <br />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    한국투자증권 KIS API 연동
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
