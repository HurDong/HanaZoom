"use client";

import { useState, useEffect, useRef } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  PortfolioSummary,
  PortfolioStock,
  TradeHistory,
} from "@/types/portfolio";
import PortfolioSummaryCard from "./PortfolioSummaryCard";
import PortfolioStocksTable from "./PortfolioStocksTable";
import TradeHistoryTable from "./TradeHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, History, Wallet, Users, X } from "lucide-react";
import PortfolioAnalysis from "./PortfolioAnalysis";
import RegionPortfolioComparison from "./RegionPortfolioComparison";
import { useRouter } from "next/navigation";
import ConsultationBooking from "../pb/ConsultationBooking";
import { getStock } from "@/lib/api/stock";

export default function PortfolioDashboard() {
  const router = useRouter();
  const {
    loading,
    error,
    getPortfolioSummary,
    getPortfolioStocks,
    getTradeHistory,
    clearError,
  } = usePortfolio();

  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummary | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [activeTab, setActiveTab] = useState("regional");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  // 심볼 -> 종목명 캐시 (세션 동안 재사용)
  const stockNameCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setIsInitialLoading(true);
    setLoadErrors([]);
    clearError();

    try {
      // 개별적으로 API 호출하여 일부 실패해도 다른 데이터는 표시
      const summary = await getPortfolioSummary();
      if (summary) {
        console.log("🚀 PortfolioSummary API 응답:", summary);
        setPortfolioSummary(summary);
      }

      const stocks = await getPortfolioStocks();
      if (stocks) {
        // 종목명이 누락된 항목을 보완: 심볼 기반으로 백엔드에서 이름 조회
        const missingSymbols = Array.from(
          new Set(
            stocks
              .filter(
                (s) => !s.stockName || String(s.stockName).trim().length === 0
              )
              .map((s) => s.stockSymbol)
          )
        ).filter(Boolean);

        if (missingSymbols.length > 0) {
          const promises = missingSymbols
            .filter((sym) => !stockNameCacheRef.current.has(sym))
            .map(async (sym) => {
              try {
                const info = await getStock(sym);
                if (info?.name) {
                  stockNameCacheRef.current.set(sym, info.name);
                }
              } catch (_) {
                // 무시: 이름 보완 실패 시 심볼 그대로 사용
              }
            });
          if (promises.length > 0) {
            await Promise.allSettled(promises);
          }
        }

        const enriched = stocks.map((s) => ({
          ...s,
          stockName:
            (s.stockName && String(s.stockName).trim().length > 0
              ? s.stockName
              : stockNameCacheRef.current.get(s.stockSymbol)) || s.stockName || s.stockSymbol,
        }));

        setPortfolioStocks(enriched);
      }

      const trades = await getTradeHistory();
      if (trades) {
        console.log("📊 TradeHistory API 응답:", trades);
        setTradeHistory(trades);
      }

      // 에러가 발생한 API가 있는지 확인
      const errors: string[] = [];
      if (!summary) errors.push("포트폴리오 요약");
      if (!stocks) errors.push("보유 주식 목록");
      if (!trades) errors.push("거래 내역");

      if (errors.length > 0) {
        setLoadErrors(errors);
      }
    } catch (err) {
      console.error("포트폴리오 데이터 로딩 실패:", err);
      setLoadErrors(["데이터 로딩 중 오류가 발생했습니다"]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 초기 로딩 중일 때
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            포트폴리오 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러가 발생했지만 일부 데이터는 있는 경우
  if (
    loadErrors.length > 0 &&
    !portfolioSummary &&
    !portfolioStocks.length &&
    !tradeHistory.length
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-xl font-semibold">
            데이터 로딩에 실패했습니다
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {loadErrors.join(", ")} 조회에 실패했습니다.
          </div>
        </div>
        <button
          onClick={loadPortfolioData}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-green-900 dark:text-green-100">
            포트폴리오
          </h1>
          <p className="text-green-700 dark:text-green-300 mt-2 text-lg">
            하나증권 계좌 현황 및 거래 관리
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowConsultationModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4" />
            PB 상담하기
          </button>
        </div>
      </div>

      {/* 포트폴리오 요약 카드 */}
      {portfolioSummary && <PortfolioSummaryCard summary={portfolioSummary} />}

      {/* 메인 콘텐츠 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            종합현황
          </TabsTrigger>
          <TabsTrigger value="stocks" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            보유주식
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            거래내역
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            기본 분석
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            지역별 비교
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 계좌 정보 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  계좌 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    계좌번호
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.accountNumber || "정보 없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    계좌명
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.accountName || "정보 없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    증권사
                  </span>
                  <span className="text-green-900 dark:text-green-100">
                    하나증권
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    잔고일자
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.balanceDate
                      ? new Date(
                          portfolioSummary.balanceDate
                        ).toLocaleDateString()
                      : "정보 없음"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 현금 현황 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  현금 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    사용가능
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {portfolioSummary?.availableCash?.toLocaleString() || "0"}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    정산대기
                  </span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {portfolioSummary?.settlementCash?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    인출가능
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {portfolioSummary?.withdrawableCash?.toLocaleString() ||
                      "0"}
                    원
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 주식 현황 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  주식 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    보유종목
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalStockCount || 0}종목
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가금액
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalStockValue?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가손익
                  </span>
                  <span
                    className={`font-medium ${
                      (portfolioSummary?.totalProfitLoss || 0) >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {portfolioSummary?.totalProfitLoss?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stocks">
          <PortfolioStocksTable
            stocks={portfolioStocks}
            onRefresh={loadPortfolioData}
          />
        </TabsContent>

        <TabsContent value="trades">
          <TradeHistoryTable trades={tradeHistory} />
        </TabsContent>

        <TabsContent value="analysis">
          <PortfolioAnalysis
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
          />
        </TabsContent>

        <TabsContent value="regional">
          <RegionPortfolioComparison
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
            userRegion="강남구"
          />
        </TabsContent>
      </Tabs>

      {/* 상담 예약 모달 */}
      {showConsultationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                PB 상담 예약
              </h2>
              <button
                onClick={() => setShowConsultationModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ConsultationBooking
              pbId="pb-001"
              onBookingComplete={(booking) => {
                console.log("예약 완료:", booking);
                setShowConsultationModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
