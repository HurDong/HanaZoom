"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPeriod } from "@/types/chart";
import { BarChart3, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ChartDataStatusProps {
  period: ChartPeriod;
  dataCount: number;
  className?: string;
}

export function ChartDataStatus({
  period,
  dataCount,
  className,
}: ChartDataStatusProps) {
  const getPeriodLabel = (period: ChartPeriod) => {
    switch (period) {
      case "daily":
        return "일봉";
      case "weekly":
        return "주봉";
      case "monthly":
        return "월봉";
      default:
        return "차트";
    }
  };

  const getPeriodDescription = (period: ChartPeriod) => {
    switch (period) {
      case "daily":
        return "일별 가격 변동 데이터";
      case "weekly":
        return "주별 가격 변동 데이터";
      case "monthly":
        return "월별 가격 변동 데이터";
      default:
        return "가격 변동 데이터";
    }
  };

  if (dataCount === 0) {
    return (
      <Card
        className={`bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 ${className}`}
      >
        <CardHeader>
          <CardTitle className="text-lg font-bold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {getPeriodLabel(period)} 데이터 없음
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            {getPeriodDescription(period)}가 아직 준비되지 않았습니다.
          </p>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            <p>• 데이터 수집이 진행 중일 수 있습니다</p>
            <p>• 다른 기간을 선택해보세요</p>
            <p>• 잠시 후 다시 시도해보세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {getPeriodLabel(period)} 데이터 준비 완료
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-700 dark:text-green-300">
          총 <span className="font-semibold">{dataCount}개</span>의{" "}
          {getPeriodLabel(period)} 데이터가 로드되었습니다.
        </p>
      </CardContent>
    </Card>
  );
}
