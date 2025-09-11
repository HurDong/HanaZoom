"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Info,
  MapPin,
} from "lucide-react";
import RegionPortfolioComparison from "./RegionPortfolioComparison";
import EnhancedPortfolioChart from "./EnhancedPortfolioChart";

interface PortfolioAnalysisProps {
  portfolioSummary: any;
  portfolioStocks: any[];
}

const COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#06B6D4", // cyan-500
  "#F59E0B", // amber-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#EF4444", // red-500
  "#84CC16", // lime-500
  "#F97316", // orange-500
  "#6366F1", // indigo-500
];

export default function PortfolioAnalysis({
  portfolioSummary,
  portfolioStocks,
}: PortfolioAnalysisProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [riskLevel, setRiskLevel] = useState<string>("보통");
  const [diversificationScore, setDiversificationScore] = useState<number>(0);
  const [diversificationDetails, setDiversificationDetails] =
    useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    "basic" | "region"
  >("basic");

  useEffect(() => {
    if (portfolioSummary && portfolioStocks) {
      generateChartData();
      calculateRiskLevel();
      calculateDiversificationScore();
    }
  }, [portfolioSummary, portfolioStocks]);

  const generateChartData = () => {
    const data = [];

    // 현금 비율 추가
    if (portfolioSummary.totalCash > 0) {
      data.push({
        name: "현금",
        value: portfolioSummary.totalCash,
        percentage: (
          (portfolioSummary.totalCash / portfolioSummary.totalBalance) *
          100
        ).toFixed(1),
        type: "cash",
        color: "#10B981",
      });
    }

    // 주식 종목별 비율 추가
    portfolioStocks.forEach((stock, index) => {
      if (stock.currentValue > 0) {
        const percentage = (
          (stock.currentValue / portfolioSummary.totalBalance) *
          100
        ).toFixed(1);

        // 종목명이 있으면 종목명을, 없으면 종목번호를 사용
        const displayName = stock.stockName || stock.stockSymbol;

        data.push({
          name: displayName,
          value: stock.currentValue,
          percentage: percentage,
          type: "stock",
          color: COLORS[index % COLORS.length],
          profitLoss: stock.profitLoss,
          profitLossRate: stock.profitLossRate,
          stockSymbol: stock.stockSymbol, // 툴팁에서 종목번호도 표시하기 위해 추가
        });
      }
    });

    setChartData(data);
  };

  const calculateRiskLevel = () => {
    // 간단한 위험도 계산 (실제로는 더 복잡한 알고리즘 사용)
    const stockRatio = portfolioSummary.stockAllocationRate;
    if (stockRatio < 30) setRiskLevel("낮음");
    else if (stockRatio < 70) setRiskLevel("보통");
    else setRiskLevel("높음");
  };

  const calculateDiversificationScore = () => {
    // HHI 기반 다양성 점수 계산
    const weights = portfolioStocks.map(
      (stock) => stock.currentValue / portfolioSummary.totalBalance
    );

    const hhi = calculateHHI(weights);
    const interpretation = interpretHHI(hhi);
    const effectiveStocks = calculateEffectiveStocks(hhi);

    setDiversificationScore(interpretation.score);

    // 상세 정보 저장
    setDiversificationDetails({
      score: interpretation.score,
      level: interpretation.level,
      description: interpretation.description,
      hhi: hhi,
      effectiveStocks: effectiveStocks,
    });

    return {
      score: interpretation.score,
      level: interpretation.level,
      description: interpretation.description,
      hhi: hhi,
      effectiveStocks: effectiveStocks,
    };
  };

  // HHI 계산 함수
  const calculateHHI = (weights: number[]) => {
    if (weights.length === 0) return 1;
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  };

  // HHI 해석 함수
  const interpretHHI = (hhi: number) => {
    if (hhi <= 0.25)
      return {
        score: 90,
        level: "매우 잘 분산",
        description: "완벽한 분산 투자 - 리스크가 매우 낮음",
      };
    if (hhi <= 0.5)
      return {
        score: 75,
        level: "잘 분산",
        description: "적절한 분산 투자 - 리스크가 낮음",
      };
    if (hhi <= 0.75)
      return {
        score: 60,
        level: "보통",
        description: "보통 수준의 분산 - 리스크가 보통",
      };
    if (hhi <= 1.0)
      return {
        score: 40,
        level: "집중",
        description: "특정 종목에 집중 - 리스크가 높음",
      };
    return {
      score: 20,
      level: "매우 집중",
      description: "극도로 집중된 투자 - 리스크가 매우 높음",
    };
  };

  // 효과적 종목 수 계산
  const calculateEffectiveStocks = (hhi: number) => {
    return hhi > 0 ? (1 / hhi).toFixed(1) : 0;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          {data.type === "stock" && data.stockSymbol && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ({data.stockSymbol})
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            비중: {data.percentage}%
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            금액: {data.value.toLocaleString()}원
          </p>
          {data.type === "stock" && (
            <>
              <p
                className={`font-medium ${
                  data.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                손익: {data.profitLoss >= 0 ? "+" : ""}
                {data.profitLoss.toLocaleString()}원
              </p>
              <p
                className={`font-medium ${
                  data.profitLossRate >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                수익률: {data.profitLossRate >= 0 ? "+" : ""}
                {data.profitLossRate.toFixed(2)}%
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "낮음":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "보통":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "높음":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/20";
    if (score >= 60)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:bg-red-900/20";
  };

  return (
    <div className="space-y-6">
      {/* 분석 탭 */}
      <div className="flex gap-2 border-b border-green-200 dark:border-green-800">
        <button
          onClick={() => setActiveAnalysisTab("basic")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeAnalysisTab === "basic"
              ? "border-green-600 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          기본 분석
        </button>
        <button
          onClick={() => setActiveAnalysisTab("region")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeAnalysisTab === "region"
              ? "border-green-600 text-green-600 dark:text-green-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          지역별 비교
        </button>
      </div>

      {activeAnalysisTab === "basic" && (
        <>
          {/* 개선된 자산 배분 차트 */}
          <EnhancedPortfolioChart
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
          />

          {/* 포트폴리오 분석 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 위험도 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  위험도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`text-sm ${getRiskColor(riskLevel)}`}>
                  {riskLevel}
                </Badge>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  주식 비중: {portfolioSummary.stockAllocationRate?.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            {/* 다양성 점수 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  다양성 점수
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 min-w-80">
                      <div className="font-semibold mb-3 text-center">
                        HHI (Herfindahl-Hirschman Index)
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <div className="col-span-2 text-center text-gray-300 mb-2">
                          포트폴리오 집중도를 측정하는 업계 표준 지수
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-400">
                            0에 가까울수록
                          </div>
                          <div className="text-gray-300">잘 분산</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-400">
                            1에 가까울수록
                          </div>
                          <div className="text-gray-300">집중</div>
                        </div>
                        <div className="col-span-2 text-center mt-2 p-2 bg-gray-700 rounded">
                          <div className="font-medium text-blue-400">
                            HHI = Σ(각 종목 비중²)
                          </div>
                          <div className="text-gray-300 mt-1">
                            효과적 종목 수 = 1 / HHI
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {diversificationScore >= 80
                      ? "🌈"
                      : diversificationScore >= 60
                      ? "⚖️"
                      : diversificationScore >= 40
                      ? "🎯"
                      : "💥"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-lg px-3 py-1 ${getDiversificationColor(
                        diversificationScore
                      )}`}
                    >
                      {diversificationScore.toFixed(0)}점
                    </Badge>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {diversificationDetails?.level || ""}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    보유 종목: {portfolioSummary.totalStockCount}종목
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {diversificationDetails?.description || ""}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 수익률 */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  수익률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    (portfolioSummary.totalProfitLoss || 0) >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {portfolioSummary.totalProfitLossRate?.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  손익: {portfolioSummary.totalProfitLoss?.toLocaleString()}원
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 종목별 성과 분석 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                종목별 성과 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioStocks.map((stock, index) => (
                  <div
                    key={stock.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {stock.stockName || stock.stockSymbol}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {stock.stockSymbol}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {stock.quantity}주
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            stock.profitLoss >= 0
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {stock.profitLoss >= 0 ? "+" : ""}
                          {stock.profitLoss.toLocaleString()}원
                        </div>
                        <div
                          className={`text-sm ${
                            stock.profitLossRate >= 0
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {stock.profitLossRate >= 0 ? "+" : ""}
                          {stock.profitLossRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">
                          평균 매수가
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {stock.avgPurchasePrice?.toLocaleString()}원
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">
                          현재가
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {stock.currentPrice?.toLocaleString()}원
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">
                          평가금액
                        </div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {stock.currentValue?.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeAnalysisTab === "region" && (
        <RegionPortfolioComparison
          portfolioSummary={portfolioSummary}
          portfolioStocks={portfolioStocks}
          userRegion="강남구"
        />
      )}
    </div>
  );
}
