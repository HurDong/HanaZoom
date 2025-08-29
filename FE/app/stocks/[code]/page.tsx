"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import NavBar from "@/app/components/Navbar";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockPriceInfo } from "@/components/wts/StockPriceInfo";
import { OrderBookDisplay } from "@/components/wts/OrderBookDisplay";
import { CandlestickChart } from "@/components/wts/CandlestickChart";
import {
  getStockOrderBook,
  validateStockCode,
  type StockPriceData,
  type OrderBookData,
} from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { StockTicker } from "@/components/stock-ticker";
import { MouseFollower } from "@/components/mouse-follower";
import { getStock, type Stock } from "@/lib/api/stock";

export default function StockDetailPage() {
  const params = useParams();
  const stockCode = params.code as string;
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(
    null
  );
  const [stockInfo, setStockInfo] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  // 실시간 틱 차트는 사용하지 않고 캔들차트만 표기

  // 웹소켓으로 실시간 주식 데이터 수신
  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    getStockData,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useStockWebSocket({
    stockCodes: validateStockCode(stockCode) ? [stockCode] : [],
    onStockUpdate: (data) => {
      console.log(
        "📈 웹소켓 데이터 업데이트:",
        data.stockCode,
        data.currentPrice
      );
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 현재 종목의 데이터 가져오기
  const stockData = getStockData(stockCode);

  // 기본 메타(로고, 이름, 시장/섹터 등)는 REST로 조회
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await getStock(stockCode);
        setStockInfo(meta);
      } catch (e) {
        console.warn("주식 메타 정보를 불러오지 못했습니다:", e);
      }
    };
    if (stockCode) fetchMeta();
  }, [stockCode]);

  // 호가창 데이터 가져오기 (웹소켓에 호가창 데이터가 있으면 우선 사용, 없으면 HTTP API 사용)
  const fetchOrderBookData = async () => {
    if (!validateStockCode(stockCode)) {
      setError("유효하지 않은 종목코드입니다. (6자리 숫자여야 합니다)");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // 웹소켓 데이터에 호가창 정보가 있으면 우선 사용
      if (stockData && stockData.askOrders && stockData.bidOrders) {
        console.log("📊 웹소켓 호가창 데이터 사용");
        const wsOrderBookData: OrderBookData = {
          stockCode: stockData.stockCode,
          stockName: stockData.stockName,
          currentPrice: stockData.currentPrice,
          updatedTime: stockData.updatedTime,
          askOrders: stockData.askOrders,
          bidOrders: stockData.bidOrders,
          totalAskQuantity: stockData.totalAskQuantity || "0",
          totalBidQuantity: stockData.totalBidQuantity || "0",
          imbalanceRatio: stockData.imbalanceRatio || 0.5,
          spread: stockData.spread || 0,
          buyDominant: stockData.buyDominant || false,
          sellDominant: stockData.sellDominant || false,
        };
        setOrderBookData(wsOrderBookData);
        return;
      }
      
      // 웹소켓에 호가창 데이터가 없으면 HTTP API 사용
      console.log("📊 HTTP API 호가창 데이터 사용");
      const orderBookData = await getStockOrderBook(stockCode);
      setOrderBookData(orderBookData);
    } catch (err) {
      console.error("호가창 데이터 fetch 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "호가창 데이터를 불러올 수 없습니다."
      );
    } finally {
      // 웹소켓이 연결되어 있다면 로딩 상태는 웹소켓 상태로 관리
      if (!wsConnected) {
        setLoading(false);
      }
      setInitialLoad(false);
    }
  };

  // 초기 호가창 데이터 로딩
  useEffect(() => {
    if (stockCode) {
      fetchOrderBookData();
    }
  }, [stockCode]);

  // 웹소켓 연결 상태에 따른 페이지 상태 관리
  useEffect(() => {
    if (wsConnected) {
      // 웹소켓이 연결되면 에러 상태 해제
      setError(null);
      setInitialLoad(false);

      if (stockData) {
        // 데이터가 있으면 로딩도 완료
        setLoading(false);
      }
    } else if (!wsConnected && !wsConnecting && !initialLoad) {
      // 웹소켓 연결이 끊어진 경우 (초기 로딩이 아닌 경우)
      setError(wsError || "웹소켓 연결이 끊어졌습니다.");
      setLoading(false);
    }
  }, [wsConnected, wsConnecting, stockData, wsError, initialLoad]);

  // 주식 데이터 수신 시 로딩 완료
  useEffect(() => {
    if (stockData && wsConnected) {
      setLoading(false);
      setError(null);
      console.log("📈 주식 데이터 수신 완료:", stockData.stockCode);
    }
  }, [stockData, wsConnected]);

  // 웹소켓 데이터가 업데이트될 때마다 호가창 데이터도 업데이트
  useEffect(() => {
    if (stockData && stockData.askOrders && stockData.bidOrders) {
      console.log("📊 웹소켓 호가창 데이터 자동 업데이트");
      const wsOrderBookData: OrderBookData = {
        stockCode: stockData.stockCode,
        stockName: stockData.stockName,
        currentPrice: stockData.currentPrice,
        updatedTime: stockData.updatedTime,
        askOrders: stockData.askOrders,
        bidOrders: stockData.bidOrders,
        totalAskQuantity: stockData.totalAskQuantity || "0",
        totalBidQuantity: stockData.totalBidQuantity || "0",
        imbalanceRatio: stockData.imbalanceRatio || 0.5,
        spread: stockData.spread || 0,
        buyDominant: stockData.buyDominant || false,
        sellDominant: stockData.sellDominant || false,
      };
      setOrderBookData(wsOrderBookData);
    }
  }, [stockData]);

  // 웹소켓이 연결되지 않은 경우에만 주기적으로 HTTP API 호출 (10초마다)
  useEffect(() => {
    if (!wsConnected && !error && stockCode && validateStockCode(stockCode)) {
      const interval = setInterval(() => {
        fetchOrderBookData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [stockCode, error, wsConnected]);

  // 수동 재시도 함수
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setInitialLoad(false);

    // 웹소켓 재연결
    if (!wsConnected) {
      console.log("🔄 웹소켓 수동 재연결 시도");
      wsConnect();
    }

    // 호가창 데이터 재조회
    fetchOrderBookData();
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
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
        return <TrendingUp className="w-4 h-4" />;
      case "4":
      case "5":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading || (initialLoad && wsConnecting)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <main className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mb-4"></div>
                <p className="text-lg text-green-700 dark:text-green-300">
                  종목 정보를 불러오는 중...
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {wsConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        웹소켓 연결됨
                      </span>
                    </>
                  ) : wsConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm text-yellow-600">
                        웹소켓 연결 중...
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        웹소켓 연결 안됨
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !wsConnected && !wsConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <main className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <p className="text-lg text-red-600 dark:text-red-400 mb-4">
                  {error || wsError || "종목 정보를 불러올 수 없습니다."}
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {wsConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        웹소켓 연결됨
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        웹소켓 연결 안됨
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    다시 시도
                  </Button>
                  <Link href="/stocks">
                    <Button
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      종목 목록으로 돌아가기
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* 마우스 따라다니는 아이콘들 */}
      <MouseFollower />

      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating WTS Symbols */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📊
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💹
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          📈
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          💰
        </div>
      </div>

      {/* NavBar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      {/* StockTicker 추가 */}
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

             <main className="relative z-10 pt-28 pb-0">
        <div className="container mx-auto px-6 max-w-[1400px]">
          {/* 뒤로가기 & 제목 + 로고 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/stocks">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 dark:text-green-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  종목 목록
                </Button>
              </Link>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full bg-white/80 dark:bg-gray-800/80 border border-green-200 dark:border-green-700 flex items-center justify-center overflow-hidden shadow-sm"
                  aria-hidden
                >
                  {stockInfo?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stockInfo.logoUrl}
                      alt={`${stockInfo.name} 로고`}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-xl">📈</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
                    {stockData?.stockName ||
                      stockInfo?.name ||
                      `종목 ${stockCode}`}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {stockCode}
                    </p>
                    {stockInfo?.market && (
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                      >
                        {stockInfo.market}
                      </Badge>
                    )}
                    {stockInfo?.sector && (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
                      >
                        {stockInfo.sector}
                      </Badge>
                    )}
                  </div>
                  {stockData && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-800 dark:text-emerald-200">
                        🔺 고가
                        <strong className="ml-1">
                          {parseInt(stockData.highPrice).toLocaleString()}원
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-800 dark:text-sky-200">
                        🔻 저가
                        <strong className="ml-1">
                          {parseInt(stockData.lowPrice).toLocaleString()}원
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-800 dark:text-amber-200">
                        📊 거래량
                        <strong className="ml-1">
                          {parseInt(stockData.volume).toLocaleString()}주
                        </strong>
                      </span>
                      {stockData.marketCap && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs text-teal-800 dark:text-teal-200">
                          💰 시가총액
                          <strong className="ml-1">
                            {parseInt(stockData.marketCap).toLocaleString()}억
                          </strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 연결 상태 표시 */}
            <div className="flex items-center gap-2 pl-4 ml-4 border-l border-white/30 dark:border-gray-700">
              {wsConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-600" />
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    실시간 연결
                  </Badge>
                </>
              ) : wsConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  <Badge
                    variant="outline"
                    className="text-yellow-600 border-yellow-600"
                  >
                    연결 중...
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <Badge
                    variant="outline"
                    className="text-red-600 border-red-600"
                  >
                    연결 안됨
                  </Badge>
                </>
              )}
              {lastUpdate > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.floor((Date.now() - lastUpdate) / 1000)}초 전
                </span>
              )}
            </div>
          </div>

                                           {/* 메인 그리드 레이아웃 (캔들차트 중심) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
                                                                                                                                                                                                               {/* 왼쪽: 현재가 정보 (균일 높이) */}
                <div className="xl:col-span-3">
                  {stockData ? (
                    <div className="min-h-[350px] h-full">
                      <StockPriceInfo stockData={stockData} className="h-full" />
                    </div>
                  ) : (
                    <Card className="h-full min-h-[350px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg">
                  <CardContent className="p-8 h-full">
                    <div className="text-center">
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        실시간 데이터 대기 중...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

                                                                                                                                                                                                               {/* 가운데: 캔들차트만 표시, 넓게 */}
                <div className="xl:col-span-6">
                  <Card className="h-full min-h-[350px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg">
                <CardContent className="p-4 h-full">
                  <CandlestickChart stockCode={stockCode} />
                </CardContent>
              </Card>
            </div>

                                                                                                       {/* 오른쪽: 호가창 */}
               <div className="xl:col-span-3">
                 <div className="min-h-[400px] h-full">
                   <OrderBookDisplay 
                     orderBookData={orderBookData}
                     realtimeData={stockData}
                     isWebSocketConnected={wsConnected}
                     onRefresh={fetchOrderBookData}
                     className="h-full"
                   />
                 </div>
               </div>
          </div>


        </div>
      </main>
    </div>
  );
}
