"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from "lucide-react";

interface RegionPortfolioComparisonProps {
  portfolioSummary: any;
  portfolioStocks: any[];
  userRegion?: string;
}

interface RegionData {
  regionName: string;
  regionType: string;
  popularStocks: Array<{
    symbol: string;
    name: string;
    popularityScore: number;
    ranking: number;
  }>;
  averagePortfolio: {
    stockCount: number;
    totalValue: number;
    riskLevel: string;
    diversificationScore: number;
  };
  investmentTrends: {
    sector: string;
    percentage: number;
    trend: "up" | "down" | "stable";
  }[];
}

interface ComparisonResult {
  userPortfolio: {
    stockCount: number;
    totalValue: number;
    riskLevel: string;
    diversificationScore: number;
    topStocks: Array<{
      symbol: string;
      name: string;
      percentage: number;
    }>;
  };
  regionAverage: RegionData;
  comparison: {
    stockCountDiff: number;
    riskLevelMatch: boolean;
    diversificationScore: number;
    recommendations: string[];
    score: number;
  };
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

export default function RegionPortfolioComparison({
  portfolioSummary,
  portfolioStocks,
  userRegion = "강남구",
}: RegionPortfolioComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "overview" | "detailed" | "recommendations"
  >("overview");

  useEffect(() => {
    // 실제로는 API 호출로 데이터를 가져와야 함
    generateMockComparisonData();
  }, [portfolioSummary, portfolioStocks, userRegion]);

  const generateMockComparisonData = () => {
    setLoading(true);

    // 모의 데이터 생성 (실제로는 API에서 가져와야 함)
    const mockRegionData: RegionData = {
      regionName: userRegion,
      regionType: "DISTRICT",
      popularStocks: [
        {
          symbol: "005930",
          name: "삼성전자",
          popularityScore: 95.5,
          ranking: 1,
        },
        {
          symbol: "000660",
          name: "SK하이닉스",
          popularityScore: 87.2,
          ranking: 2,
        },
        { symbol: "035420", name: "NAVER", popularityScore: 82.1, ranking: 3 },
        {
          symbol: "207940",
          name: "삼성바이오로직스",
          popularityScore: 78.9,
          ranking: 4,
        },
        {
          symbol: "006400",
          name: "삼성SDI",
          popularityScore: 75.3,
          ranking: 5,
        },
      ],
      averagePortfolio: {
        stockCount: 8,
        totalValue: 15000000,
        riskLevel: "보통",
        diversificationScore: 72,
      },
      investmentTrends: [
        { sector: "IT/반도체", percentage: 35, trend: "up" },
        { sector: "바이오/제약", percentage: 20, trend: "up" },
        { sector: "금융", percentage: 15, trend: "stable" },
        { sector: "자동차", percentage: 12, trend: "down" },
        { sector: "기타", percentage: 18, trend: "stable" },
      ],
    };

    // 사용자 포트폴리오 분석
    const userTopStocks = portfolioStocks
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 5)
      .map((stock) => ({
        symbol: stock.stockSymbol,
        name: stock.stockName || stock.stockSymbol,
        percentage: (stock.currentValue / portfolioSummary.totalBalance) * 100,
      }));

    const userPortfolio = {
      stockCount: portfolioSummary.totalStockCount || 0,
      totalValue: portfolioSummary.totalBalance || 0,
      riskLevel: calculateRiskLevel(portfolioSummary.stockAllocationRate),
      diversificationScore: calculateDiversificationScore(
        portfolioStocks,
        portfolioSummary.totalBalance
      ),
      topStocks: userTopStocks,
    };

    // 비교 분석
    const stockCountDiff =
      userPortfolio.stockCount - mockRegionData.averagePortfolio.stockCount;
    const riskLevelMatch =
      userPortfolio.riskLevel === mockRegionData.averagePortfolio.riskLevel;
    const diversificationScore = userPortfolio.diversificationScore;

    const recommendations = generateRecommendations(
      userPortfolio,
      mockRegionData,
      stockCountDiff,
      riskLevelMatch
    );

    const score = calculateOverallScore(
      userPortfolio,
      mockRegionData,
      recommendations.length
    );

    const comparison: ComparisonResult = {
      userPortfolio,
      regionAverage: mockRegionData,
      comparison: {
        stockCountDiff,
        riskLevelMatch,
        diversificationScore,
        recommendations,
        score,
      },
    };

    setComparisonData(comparison);
    setLoading(false);
  };

  const calculateRiskLevel = (stockAllocationRate: number) => {
    if (stockAllocationRate < 30) return "낮음";
    if (stockAllocationRate < 70) return "보통";
    return "높음";
  };

  const calculateDiversificationScore = (
    stocks: any[],
    totalBalance: number
  ) => {
    if (stocks.length === 0) return 0;

    const weights = stocks.map((stock) => stock.currentValue / totalBalance);
    const hhi = weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);

    if (hhi <= 0.25) return 90;
    if (hhi <= 0.5) return 75;
    if (hhi <= 0.75) return 60;
    if (hhi <= 1.0) return 40;
    return 20;
  };

  const generateRecommendations = (
    userPortfolio: any,
    regionData: RegionData,
    stockCountDiff: number,
    riskLevelMatch: boolean
  ) => {
    const recommendations: string[] = [];

    if (stockCountDiff < -2) {
      recommendations.push(
        "지역 평균보다 종목 수가 적습니다. 분산 투자를 고려해보세요."
      );
    }

    if (!riskLevelMatch) {
      recommendations.push(
        "지역 평균과 위험도가 다릅니다. 투자 성향을 재검토해보세요."
      );
    }

    if (userPortfolio.diversificationScore < 60) {
      recommendations.push(
        "포트폴리오 집중도가 높습니다. 리밸런싱을 권장합니다."
      );
    }

    // 지역 인기 종목과의 겹침 확인
    const userStockSymbols = userPortfolio.topStocks.map((s: any) => s.symbol);
    const regionStockSymbols = regionData.popularStocks.map((s) => s.symbol);
    const overlap = userStockSymbols.filter((symbol: string) =>
      regionStockSymbols.includes(symbol)
    );

    if (overlap.length < 2) {
      recommendations.push(
        "지역 인기 종목과 겹치는 종목이 적습니다. 지역 트렌드를 참고해보세요."
      );
    }

    return recommendations;
  };

  const calculateOverallScore = (
    userPortfolio: any,
    regionData: RegionData,
    recommendationCount: number
  ) => {
    let score = 100;

    // 종목 수 차이에 따른 감점
    const stockCountDiff = Math.abs(
      userPortfolio.stockCount - regionData.averagePortfolio.stockCount
    );
    score -= stockCountDiff * 5;

    // 위험도 불일치 감점
    if (userPortfolio.riskLevel !== regionData.averagePortfolio.riskLevel) {
      score -= 15;
    }

    // 다양성 점수 반영
    score -= (100 - userPortfolio.diversificationScore) * 0.3;

    // 추천사항 개수에 따른 감점
    score -= recommendationCount * 10;

    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/20";
    if (score >= 60)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:bg-red-900/20";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "🌟";
    if (score >= 60) return "👍";
    return "⚠️";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            지역별 포트폴리오 분석 중...
          </p>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">분석 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            {userRegion} 포트폴리오 분석
          </h2>
          <p className="text-green-700 dark:text-green-300 mt-1">
            지역별 투자 패턴과 비교한 포트폴리오 분석
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedView === "overview" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("overview")}
          >
            개요
          </Button>
          <Button
            variant={selectedView === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("detailed")}
          >
            상세분석
          </Button>
          <Button
            variant={selectedView === "recommendations" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("recommendations")}
          >
            추천사항
          </Button>
        </div>
      </div>

      {/* 종합 점수 */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {getScoreEmoji(comparisonData.comparison.score)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                  지역 적합도 점수
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  {userRegion} 지역 투자 패턴과의 일치도
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge
                className={`text-2xl px-4 py-2 ${getScoreColor(
                  comparisonData.comparison.score
                )}`}
              >
                {comparisonData.comparison.score.toFixed(0)}점
              </Badge>
              <div className="mt-2">
                <Progress
                  value={comparisonData.comparison.score}
                  className="w-32 h-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedView === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 사용자 포트폴리오 요약 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                <Users className="w-5 h-5" />내 포트폴리오
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  보유 종목
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.userPortfolio.stockCount}종목
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  총 자산
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.userPortfolio.totalValue.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  위험도
                </span>
                <Badge
                  className={getScoreColor(
                    comparisonData.userPortfolio.diversificationScore
                  )}
                >
                  {comparisonData.userPortfolio.riskLevel}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  분산도
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.userPortfolio.diversificationScore}점
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 지역 평균 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {userRegion} 평균
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  보유 종목
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.regionAverage.averagePortfolio.stockCount}종목
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  평균 자산
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.regionAverage.averagePortfolio.totalValue.toLocaleString()}
                  원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  위험도
                </span>
                <Badge
                  className={getScoreColor(
                    comparisonData.regionAverage.averagePortfolio
                      .diversificationScore
                  )}
                >
                  {comparisonData.regionAverage.averagePortfolio.riskLevel}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  분산도
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {
                    comparisonData.regionAverage.averagePortfolio
                      .diversificationScore
                  }
                  점
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 비교 결과 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                비교 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  종목 수 차이
                </span>
                <div className="flex items-center gap-1">
                  {comparisonData.comparison.stockCountDiff > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-blue-500" />
                  )}
                  <span
                    className={`font-medium ${
                      comparisonData.comparison.stockCountDiff > 0
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {comparisonData.comparison.stockCountDiff > 0 ? "+" : ""}
                    {comparisonData.comparison.stockCountDiff}종목
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  위험도 일치
                </span>
                <div className="flex items-center gap-1">
                  {comparisonData.comparison.riskLevelMatch ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span
                    className={`font-medium ${
                      comparisonData.comparison.riskLevelMatch
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {comparisonData.comparison.riskLevelMatch ? "일치" : "차이"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-green-300">
                  추천사항
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comparisonData.comparison.recommendations.length}개
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "detailed" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 지역 인기 종목 vs 내 보유 종목 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                지역 인기 종목 vs 내 보유 종목
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    {userRegion} 인기 종목 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {comparisonData.regionAverage.popularStocks.map(
                      (stock, index) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {stock.ranking}위
                            </Badge>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {stock.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {stock.symbol}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              {stock.popularityScore.toFixed(1)}점
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    내 포트폴리오 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {comparisonData.userPortfolio.topStocks.map(
                      (stock, index) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}위
                            </Badge>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {stock.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {stock.symbol}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              {stock.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 지역 투자 트렌드 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {userRegion} 투자 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData.regionAverage.investmentTrends}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === "recommendations" && (
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
              <Target className="w-5 h-5" />
              포트폴리오 개선 추천사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonData.comparison.recommendations.length > 0 ? (
                comparisonData.comparison.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 dark:text-yellow-400 text-sm font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-gray-100">
                          {recommendation}
                        </p>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    훌륭한 포트폴리오입니다!
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    지역 투자 패턴과 잘 맞는 포트폴리오를 구성하고 있습니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
