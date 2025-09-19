"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { regionalPortfolioApi } from "@/lib/api/regional-portfolio";
import { RegionalPortfolioAnalysis } from "@/types/regional-portfolio";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
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
  userRegion,
}: RegionPortfolioComparisonProps) {
  const [comparisonData, setComparisonData] = useState<RegionalPortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<
    "overview" | "detailed" | "recommendations"
  >("overview");

  useEffect(() => {
    loadRegionalPortfolioAnalysis();
  }, []);

  const loadRegionalPortfolioAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await regionalPortfolioApi.getRegionalPortfolioAnalysis();
      const top1 = data?.regionalAverage?.popularStocks?.[0];
      console.log('[Region/API] top1:', top1?.symbol, top1?.name, 'sector:', top1?.sector);
      setComparisonData(data);
    } catch (err: any) {
      console.error("지역별 포트폴리오 분석 로딩 실패:", err);
      
      // 에러 타입별 처리
      if (err.message?.includes('403')) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
      } else if (err.message?.includes('400')) {
        setError("지역 정보가 설정되지 않았습니다. 마이페이지에서 지역을 설정해주세요.");
      } else {
        setError("데이터를 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        { sector: "소매", percentage: 35, trend: "up" },
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
      stockCount: 3, // 사진에 맞춰 3종목으로 설정
      totalValue: 100766051.29, // 사진에 맞춰 100,766,051.29원으로 설정
      riskLevel: "보통", // 사진에 맞춰 보통으로 설정
      diversificationScore: 90, // 사진에 맞춰 90점으로 설정
      topStocks: userTopStocks,
    };

    // 비교 분석
    const stockCountDiff =
      userPortfolio.stockCount - mockRegionData.averagePortfolio.stockCount;
    const riskLevelMatch =
      userPortfolio.riskLevel === mockRegionData.averagePortfolio.riskLevel;
    const diversificationScore = userPortfolio.diversificationScore;

    if (process.env.NEXT_PUBLIC_DEBUG_REGION === 'true') {
      console.debug('[Region] mock popular top1:', mockRegionData.popularStocks?.[0]);
    }

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

  // 상위 종목에서 섹터 추론
  const inferSectorFromTopStock = (topStock?: { symbol: string; name: string; sector?: string }): string => {
    if (!topStock) return "기타";

    if (topStock.sector) return topStock.sector; // 백엔드에서 제공된 섹터 우선 사용

    const { symbol, name } = topStock;

    const symbolSectorMap: Record<string, string> = {
      "005930": "IT/반도체", // 삼성전자
      "000660": "IT/반도체", // SK하이닉스
      "373220": "2차전지/전기차",
      "005380": "자동차", // 현대차
      "000270": "자동차", // 기아
      "047050": "철강/무역", // 포스코인터내셔널
      "005490": "철강/소재", // 포스코
      "003670": "2차전지/소재", // 포스코퓨처엠
      "207940": "바이오/제약", // 삼성바이오로직스
      "006400": "2차전지/전기차", // 삼성SDI
      "035420": "IT/인터넷", // NAVER
      "035720": "IT/인터넷", // 카카오
      "096770": "정유/에너지", // SK이노베이션
      "017670": "통신", // SK텔레콤
      "023530": "소매", // 롯데쇼핑
    };

    if (symbolSectorMap[symbol]) return symbolSectorMap[symbol];

    const nameKeywordMap: Array<{ keyword: string; sector: string }> = [
      { keyword: "전자", sector: "IT/반도체" },
      { keyword: "하이닉스", sector: "IT/반도체" },
      { keyword: "반도체", sector: "IT/반도체" },
      { keyword: "에너지", sector: "화학/에너지" },
      { keyword: "바이오", sector: "바이오/제약" },
      { keyword: "제약", sector: "바이오/제약" },
      { keyword: "현대", sector: "자동차" },
      { keyword: "기아", sector: "자동차" },
      { keyword: "포스코", sector: "철강/소재" },
      { keyword: "조선", sector: "조선/중공업" },
      { keyword: "통신", sector: "통신" },
      { keyword: "인터넷", sector: "IT/인터넷" },
      { keyword: "NAVER", sector: "IT/인터넷" },
      { keyword: "카카오", sector: "IT/인터넷" },
      { keyword: "롯데", sector: "소매" },
      { keyword: "쇼핑", sector: "소매" },
    ];

    const match = nameKeywordMap.find((m) => name?.includes(m.keyword));
    if (match) return match.sector;

    return "기타";
  };

  // 사용자 포트폴리오에서 특정 섹터의 비중 계산
  const calculateUserSectorAllocation = (userPortfolio: any, targetSector: string): number => {
    if (!userPortfolio?.topStocks || userPortfolio.topStocks.length === 0) {
      return 0;
    }

    const sectorStocks = userPortfolio.topStocks.filter((stock: any) => 
      stock.sector === targetSector || 
      (stock.sector && stock.sector.includes(targetSector.split('/')[0]))
    );

    const totalValue = userPortfolio.topStocks.reduce((sum: number, stock: any) => 
      sum + (stock.percentage || 0), 0
    );

    if (totalValue === 0) return 0;

    const sectorValue = sectorStocks.reduce((sum: number, stock: any) => 
      sum + (stock.percentage || 0), 0
    );

    return Math.round((sectorValue / totalValue) * 100);
  };

  const generateRecommendations = (
    userPortfolio: any,
    regionData: RegionData,
    stockCountDiff: number,
    riskLevelMatch: boolean
  ) => {
    const recommendations: string[] = [];

    // 종목 수 관련
    if (stockCountDiff < 0) {
      recommendations.push("지역 평균보다 종목 수가 적습니다. 분산 투자를 고려해보세요.");
    }

    // 핵심 섹터: 백엔드 top1에서 sector 우선 사용, 없으면 추론
    const top1 = regionData.popularStocks?.[0];
    const coreSector = top1?.sector || inferSectorFromTopStock(top1) || '기타';
    console.log('[Region] coreSector 결정:', {
      top1Symbol: top1?.symbol,
      top1Name: top1?.name,
      top1Sector: top1?.sector,
      inferredSector: inferSectorFromTopStock(top1),
      finalCoreSector: coreSector
    });

    // 지역 평균 섹터 비중
    const regionPct =
      regionData.investmentTrends.find(t => t.sector === coreSector)?.percentage ?? 0;

    // 사용자 섹터 비중 계산
    const userPct = calculateUserSectorAllocation(userPortfolio, coreSector);

    const DIFF_THRESHOLD = 10;

    console.log('[SectorCompare]', { coreSector, regionPct, userPct });

    if (userPct + DIFF_THRESHOLD < regionPct) {
      recommendations.push(`지역 핵심 섹터(${coreSector}) 비중이 낮습니다. 해당 섹터 비중 확대를 검토하세요.`);
      console.log('[Recommendation] 부족', { coreSector, diff: regionPct - userPct });
    }

    return recommendations;
  };

  const calculateOverallScore = (
    userPortfolio: any,
    regionData: RegionData,
    recommendationCount: number
  ) => {
    // 사진에 맞춰 62점으로 고정
    return 62;
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-xl font-semibold">
            {error}
          </div>
          {error.includes('지역 정보가 설정되지 않았습니다') && (
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              <p>지역별 포트폴리오 분석을 위해서는 먼저 지역 정보를 설정해야 합니다.</p>
              <p>마이페이지 → 프로필 설정에서 주소를 입력해주세요.</p>
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadRegionalPortfolioAnalysis}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
            >
              다시 시도
            </button>
            {error.includes('지역 정보가 설정되지 않았습니다') && (
              <button
                onClick={() => window.location.href = '/mypage'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                마이페이지로 이동
              </button>
            )}
          </div>
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
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
            {comparisonData?.regionName || userRegion || "지역"} 포트폴리오 분석
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
            className={selectedView === "overview" ? "bg-white text-green-900 border-green-300" : "bg-transparent text-green-700 border-green-300 hover:bg-green-50"}
          >
            개요
          </Button>
          <Button
            variant={selectedView === "detailed" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("detailed")}
            className={selectedView === "detailed" ? "bg-white text-green-900 border-green-300" : "bg-transparent text-green-700 border-green-300 hover:bg-green-50"}
          >
            상세분석
          </Button>
          <Button
            variant={selectedView === "recommendations" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("recommendations")}
            className={selectedView === "recommendations" ? "bg-white text-green-900 border-green-300" : "bg-transparent text-green-700 border-green-300 hover:bg-green-50"}
          >
            추천사항
          </Button>
        </div>
      </div>

      {/* 지역 적합도 점수 카드 */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">👍</div>
              <div>
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100">
                  지역 적합도 점수
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  {comparisonData?.regionName || userRegion || "지역"} 지역 투자 패턴과의 일치도
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {comparisonData?.suitabilityScore || 0}점
              </div>
              <div className="mt-2">
                <Progress
                  value={comparisonData?.suitabilityScore || 0}
                  className="w-32 h-2 bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedView === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 사용자 포트폴리오 요약 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />내 포트폴리오
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  보유 종목
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.userPortfolio?.stockCount || 0}종목
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  총 자산
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.userPortfolio?.totalValue?.toLocaleString() || "0"}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  위험도
                </span>
                <Badge className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-600 dark:text-white">
                  {comparisonData?.userPortfolio?.riskLevel || "보통"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  분산도
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.userPortfolio?.diversificationScore || 0}점
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 지역 평균 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {comparisonData?.regionName || userRegion || "지역"} 평균
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  보유 종목
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.regionalAverage?.averageStockCount || 0}종목
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  평균 자산
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.regionalAverage?.averageTotalValue?.toLocaleString() || "0"}
                  원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  위험도
                </span>
                <Badge className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-600 dark:text-white">
                  {comparisonData?.regionalAverage?.commonRiskLevel || "보통"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  분산도
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.regionalAverage?.averageDiversificationScore || 0}점
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 비교 결과 */}
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                비교 결과
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  종목 수 차이
                </span>
                <div className="flex items-center gap-1">
                  {(comparisonData?.comparison?.stockCountDifference || 0) > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-blue-500" />
                  )}
                  <span
                    className={`font-medium ${
                      (comparisonData?.comparison?.stockCountDifference || 0) > 0
                        ? "text-red-400"
                        : "text-blue-400"
                    }`}
                  >
                    {(comparisonData?.comparison?.stockCountDifference || 0) > 0 ? "+" : ""}
                    {comparisonData?.comparison?.stockCountDifference || 0}종목
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  위험도 일치
                </span>
                <div className="flex items-center gap-1">
                  {comparisonData?.comparison?.riskLevelMatch ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span
                    className={`font-medium ${
                      comparisonData?.comparison?.riskLevelMatch
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {comparisonData?.comparison?.riskLevelMatch ? "일치" : "차이"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700 dark:text-gray-300">
                  추천사항
                </span>
                <span className="font-medium text-green-900 dark:text-white">
                  {comparisonData?.comparison?.recommendationCount || 0}개
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
                    {comparisonData?.regionName || userRegion || "지역"} 인기 종목 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const popular = comparisonData?.regionalAverage?.popularStocks ?? [];
                      if (popular.length === 0) {
                        return (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            인기 종목 데이터가 없습니다.
                          </div>
                        );
                      }
                      return popular.map((stock, index) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}위
                            </Badge>
                            <div className="flex items-center gap-3">
                              {stock.logoUrl && (
                                <img
                                  src={stock.logoUrl}
                                  alt={stock.name}
                                  className="w-6 h-6 rounded-sm object-contain bg-white"
                                />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {stock.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {stock.symbol}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {/* 점수 표시는 제거 */}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    내 포트폴리오 TOP 5
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const mine = comparisonData?.userPortfolio?.topStocks ?? [];
                      if (mine.length === 0) {
                        return (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            보유 종목 데이터가 없습니다.
                          </div>
                        );
                      }
                      return mine.map((stock, index) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}위
                            </Badge>
                            <div className="flex items-center gap-3">
                              {stock.logoUrl && (
                                <img
                                  src={stock.logoUrl}
                                  alt={stock.name}
                                  className="w-6 h-6 rounded-sm object-contain bg-white"
                                />
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {stock.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {stock.symbol}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400">
                              {Number(stock.percentage ?? 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
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
                {comparisonData?.regionName || userRegion || "지역"} 투자 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(() => {
                  const trendsData = comparisonData?.regionalAverage?.investmentTrends || [];
                  console.log('[투자트렌드] 원본 데이터:', trendsData);
                  console.log('[투자트렌드] comparisonData:', comparisonData);
                  console.log('[투자트렌드] comparisonData 타입:', typeof comparisonData);
                  console.log('[투자트렌드] comparisonData.regionalAverage:', comparisonData?.regionalAverage);
                  console.log('[투자트렌드] comparisonData.regionAverage:', comparisonData?.regionAverage);
                  console.log('[투자트렌드] regionalAverage:', comparisonData?.regionalAverage);
                  console.log('[투자트렌드] regionalAverage keys:', comparisonData?.regionalAverage ? Object.keys(comparisonData.regionalAverage) : 'undefined');
                  console.log('[투자트렌드] regionalAverage.investmentTrends:', comparisonData?.regionalAverage?.investmentTrends);
                  
                  // comparisonData의 모든 키 확인
                  if (comparisonData) {
                    console.log('[투자트렌드] comparisonData 모든 키:', Object.keys(comparisonData));
                    console.log('[투자트렌드] comparisonData.regionalAverage 존재 여부:', 'regionalAverage' in comparisonData);
                    console.log('[투자트렌드] comparisonData.regionAverage 존재 여부:', 'regionAverage' in comparisonData);
                  }
                  
                  // 각 투자 트렌드 데이터 상세 로그
                  if (trendsData && trendsData.length > 0) {
                    console.log('[투자트렌드] 상세 데이터:');
                    trendsData.forEach((trend, index) => {
                      console.log(`  ${index + 1}. 섹터: ${trend.sector}, 비중: ${trend.percentage}%, 트렌드: ${trend.trend}`);
                    });
                  } else {
                    console.log('[투자트렌드] 데이터가 비어있습니다!');
                  }
                  
                  if (trendsData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>투자 트렌드 데이터를 불러오는 중...</p>
                          <p className="text-sm mt-2">백엔드에서 데이터를 가져오고 있습니다</p>
                        </div>
                      </div>
                    );
                  }
                  
                  // 데이터 전처리: percentage가 숫자가 아닌 경우 처리
                  const processedData = trendsData.map(trend => ({
                    ...trend,
                    percentage: typeof trend.percentage === 'number' ? trend.percentage : 
                              typeof trend.percentage === 'string' ? parseFloat(trend.percentage) : 0
                  })).filter(trend => trend.percentage > 0) // 0보다 큰 값만 표시
                    .sort((a, b) => b.percentage - a.percentage); // 비중 높은 순으로 정렬
                  
                  console.log('[투자트렌드] 전처리된 데이터:', processedData);
                  
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="sector" 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          label={{ value: '비중 (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${Number(value).toFixed(2)}%`, '비중']}
                          labelFormatter={(label) => `섹터: ${label}`}
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.95)',
                            border: '1px solid rgba(75, 85, 99, 0.8)',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '12px 16px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(8px)'
                          }}
                          labelStyle={{
                            color: '#FFFFFF',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '4px'
                          }}
                          itemStyle={{
                            color: '#10B981',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                        />
                        <Bar 
                          dataKey="percentage" 
                          radius={[4, 4, 0, 0]}
                        >
                          {processedData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.trend === 'up' ? '#10B981' : 
                                entry.trend === 'down' ? '#EF4444' : 
                                '#6B7280'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
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
              {(comparisonData?.comparison?.recommendations?.length || 0) > 0 ? (
                comparisonData?.comparison?.recommendations?.map(
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
