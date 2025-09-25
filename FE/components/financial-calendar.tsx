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
  date: string; // 발표 날짜 (YYYY-MM-DD)
  dayOfWeek: string; // 요일
  time: string; // 발표 시간
  indicator: string; // 지표명
  importance: string; // 중요도
  country: string; // 국가
  previous?: string; // 이전 값
  forecast?: string; // 예상 값
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
    // 더미 데이터 설정 (실제 API 연동이 삭제되어 더미 데이터만 표시)
    setLoading(true);

    // 더미 금융 일정 데이터
    const dummyIndicators: FinancialScheduleItem[] = [
      {
        date: "2025-09-29",
        dayOfWeek: "월요일",
        time: "08:00",
        indicator: "산업생산지수 (Industrial Production Index)",
        importance: "high",
        country: "한국",
        forecast: "전월 대비 0.5%",
        previous: "전월 대비 -0.3%",
      },
      {
        date: "2025-10-01",
        dayOfWeek: "수요일",
        time: "08:00",
        indicator: "소비자물가지수 (CPI)",
        importance: "high",
        country: "한국",
        forecast: "전년 대비 2.5%",
        previous: "전년 대비 2.3%",
      },
      {
        date: "2025-09-30",
        dayOfWeek: "화요일",
        time: "08:00",
        indicator: "실업률 (Unemployment Rate)",
        importance: "medium",
        country: "한국",
        forecast: "2.4%",
        previous: "2.5%",
      },
    ];

    // 더미 데이터 설정
    setTimeout(() => {
      setIndicators(dummyIndicators);
      setIsRealData(false); // 더미 데이터임을 표시
      setLoading(false);
    }, 1000); // 로딩 효과를 위한 지연
  }, []);

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case "high":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case "medium":
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case "low":
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case "high":
        return "높음";
      case "medium":
        return "중간";
      case "low":
        return "낮음";
      default:
        return "알 수 없음";
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
    return (
      <div
        key={`${indicator.date}-${indicator.indicator}-${index}`}
        className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-sm ${
          isToday(indicator.date)
            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
            : "bg-white/80 border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <div className="flex items-center gap-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {indicator.indicator}
                </h4>
              </div>
              {getImportanceIcon(indicator.importance)}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getImportanceLabel(indicator.importance)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                  {indicator.forecast || "예측치 없음"}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {indicator.previous ? "예측" : ""}
                </span>
              </div>

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
                  <span>{formatDate(indicator.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{indicator.time}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{indicator.dayOfWeek}</div>
                <div className="text-xs text-gray-400">{indicator.country}</div>
              </div>
            </div>
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
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
