"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
// 금융 캘린더 관련 타입과 API는 삭제됨 - 컴포넌트만 유지

// 금융 일정 아이템 타입 정의
interface FinancialScheduleItem {
  indicatorCode: string;
  nameKo: string;
  nameEn: string;
  cycle: string;
  unit: string;
  scheduledDate: string;
  publishedAt: string | null;
  timeKey: string;
  previous?: string;
  actual?: string;
  status: "SCHEDULED" | "RELEASED" | "DELAYED";
  source: string;
}

// 금융 캘린더 컴포넌트 Props
interface FinancialCalendarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function FinancialCalendar({
  className = "",
  isCollapsed = false,
  onToggle,
  onClose,
}: FinancialCalendarProps) {
  const [indicators, setIndicators] = useState<FinancialScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState<boolean>(false);

  useEffect(() => {
    fetchFinancialCalendar();
  }, []);

  const fetchFinancialCalendar = async () => {
    setLoading(true);
    setError(null);

    try {
      // 현재 날짜를 YYYY-MM-DD 형식으로
      const today = new Date();
      const baseDate = today.toISOString().split("T")[0];

      // API 호출
      const response = await fetch(
        `/api/v1/calendar/weekly?baseDate=${baseDate}&includeAll=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // API 응답 데이터 변환
        const transformedIndicators: FinancialScheduleItem[] =
          data.data.items.map((item: any) => ({
            indicatorCode: item.indicatorCode,
            nameKo: item.nameKo,
            nameEn: item.nameEn,
            cycle: item.cycle,
            unit: item.unit,
            scheduledDate: item.scheduledDate,
            publishedAt: item.publishedAt,
            timeKey: item.timeKey,
            previous: item.previous,
            actual: item.actual,
            status: item.status,
            source: item.source,
          }));

        setIndicators(transformedIndicators);
        setIsRealData(true);
      } else {
        throw new Error(data.message || "API 호출에 실패했습니다.");
      }
    } catch (err) {
      console.error("금융 캘린더 데이터 조회 실패:", err);
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
      setIsRealData(false);

      // 오류 시 더미 데이터로 폴백
      const dummyIndicators: FinancialScheduleItem[] = [
        {
          indicatorCode: "CPI_M",
          nameKo: "소비자물가지수",
          nameEn: "Consumer Price Index",
          cycle: "월간",
          unit: "전월 대비",
          scheduledDate: "2025-10-02",
          publishedAt: null,
          timeKey: "매월 2일",
          status: "SCHEDULED",
          source: "ECOS",
        },
        {
          indicatorCode: "IP_M",
          nameKo: "산업생산지수",
          nameEn: "Industrial Production Index",
          cycle: "월간",
          unit: "전월 대비",
          scheduledDate: "2025-09-30",
          publishedAt: null,
          timeKey: "매월 말일",
          status: "SCHEDULED",
          source: "ECOS",
        },
        {
          indicatorCode: "GDP_Q_ADV",
          nameKo: "GDP성장률(전기대비)",
          nameEn: "GDP Growth Rate",
          cycle: "분기",
          unit: "%",
          scheduledDate: "2025-11-15",
          publishedAt: null,
          timeKey: "분기 종료 후 45일",
          status: "SCHEDULED",
          source: "ECOS",
        },
      ];

      setIndicators(dummyIndicators);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RELEASED":
        return <div className="w-3 h-3 bg-green-500 rounded-full" />;
      case "DELAYED":
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      case "SCHEDULED":
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RELEASED":
        return "발표됨";
      case "DELAYED":
        return "지연";
      case "SCHEDULED":
      default:
        return "예정";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "내일";
    } else {
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const renderIndicator = (indicator: FinancialScheduleItem, index: number) => {
    const isTodayScheduled = isToday(indicator.scheduledDate);

    return (
      <div
        key={`${indicator.scheduledDate}-${indicator.indicatorCode}-${index}`}
        className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-sm ${
          isTodayScheduled
            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
            : "bg-white/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <div className="flex items-center gap-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {indicator.nameKo}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({indicator.nameEn})
                </span>
              </div>
              {getStatusIcon(indicator.status)}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getStatusLabel(indicator.status)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              {indicator.actual && (
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                    {indicator.actual}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    실제
                  </span>
                </div>
              )}

              {indicator.previous && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    이전:
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {indicator.previous}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(indicator.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{indicator.timeKey}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{indicator.cycle}</div>
                <div className="text-xs text-gray-400">{indicator.unit}</div>
              </div>
            </div>

            {/* 발표 시간 표시 */}
            {indicator.publishedAt && (
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                발표됨:{" "}
                {new Date(indicator.publishedAt).toLocaleString("ko-KR")}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            📅 금융 캘린더
          </h3>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
              <div className="flex justify-between">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-red-200 dark:border-red-700 p-3 ${className}`}
      >
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-lg ${className} ${
        isCollapsed ? "w-12" : "w-80"
      } transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 ${
              isCollapsed ? "text-xs" : "text-sm"
            }`}
          >
            📅 금융 캘린더
          </h3>
          {/* 데이터 상태 표시 */}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {isRealData ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">실제</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs">불러오는 중...</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isCollapsed ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {indicators.length > 0 ? (
            indicators.map((indicator, index) =>
              renderIndicator(indicator, index)
            )
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                이번 주 금융 일정이 없습니다.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                한국은행 API에서 데이터를 불러올 수 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {isCollapsed && indicators.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          {indicators.slice(0, 3).map((indicator, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              {getStatusIcon(indicator.status)}
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-8 text-center">
                {indicator.nameKo.length > 3
                  ? indicator.nameKo.substring(0, 3) + "..."
                  : indicator.nameKo}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
