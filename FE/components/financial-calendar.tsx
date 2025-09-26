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
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 실제 API 엔드포인트 호출
      const response = await fetch('/api/financial-schedule');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setIndicators(data.data);
        setIsRealData(true);
      } else {
        throw new Error(data.message || '데이터를 가져올 수 없습니다.');
      }
    } catch (err) {
      console.error('금융 일정 데이터 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIndicators([]);
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 중요도 아이콘 및 색상
  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case "high":
        return "🔴";
      case "medium":
        return "🟠";
      case "low":
        return "🟢";
      default:
        return "🟢";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "medium":
        return "text-orange-600 dark:text-orange-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  // 날짜별 그룹핑
  const groupIndicatorsByDate = (indicators: FinancialScheduleItem[]) => {
    const grouped: { [key: string]: FinancialScheduleItem[] } = {};
    indicators.forEach((indicator) => {
      const dateKey = indicator.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(indicator);
    });
    return grouped;
  };

  const groupedIndicators = groupIndicatorsByDate(indicators);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.toLocaleDateString("ko-KR", { weekday: "short" });

    // 요일 한글 변환
    const dayNames: { [key: string]: string } = {
      월: "월",
      화: "화",
      수: "수",
      목: "목",
      금: "금",
      토: "토",
      일: "일",
    };

    return `${month}월 ${day}일 (${dayNames[dayOfWeek] || dayOfWeek})`;
  };

  const renderIndicator = (indicator: FinancialScheduleItem, index: number) => {
    const importanceIcon = getImportanceIcon(indicator.importance);
    const importanceColor = getImportanceColor(indicator.importance);

    return (
      <div
        key={`${indicator.date}-${indicator.indicator}-${index}`}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
          isToday(indicator.date)
            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700"
            : "bg-white/90 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700"
        } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
      >
        {/* 고정된 시간 (좌측) */}
        <div className="flex-shrink-0 w-12 text-center">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {indicator.time}
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>

        {/* 지표 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {indicator.indicator}
            </h4>
            <span
              className="text-sm"
              title={`중요도: ${
                indicator.importance === "high"
                  ? "높음"
                  : indicator.importance === "medium"
                  ? "중간"
                  : "낮음"
              }`}
            >
              {importanceIcon}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
              {indicator.forecast || "예측치 없음"}
            </span>
            {indicator.previous && (
              <span className="text-gray-500 dark:text-gray-500">
                (이전: {indicator.previous})
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDateGroup = (
    dateString: string,
    indicators: FinancialScheduleItem[]
  ) => {
    const isDateToday = isToday(dateString);

    return (
      <div key={dateString} className="mb-4">
        {/* 날짜 헤더 */}
        <div
          className={`text-sm font-semibold mb-2 px-2 py-1 rounded ${
            isDateToday
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {formatDateHeader(dateString)}
        </div>

        {/* 일정 리스트 */}
        <div className="space-y-2">
          {indicators.map((indicator, index) =>
            renderIndicator(indicator, index)
          )}
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              📅 금융 캘린더
            </h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400">로딩 중...</span>
            </div>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              disabled={loading}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="space-y-2">
            {/* 로딩 스켈레톤 */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/90 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-shrink-0 w-12 text-center">
                  <div className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded animate-pulse">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>

                <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}

            {/* 로딩 메시지 */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                금융 일정 데이터를 불러오고 있습니다...
              </div>
            </div>
          </div>
        )}
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
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400" title="실제 금융 일정 데이터">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">실시간</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title="데이터 로딩 실패">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs">오류</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400" title="데이터 없음">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs">준비 중</span>
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
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {Object.keys(groupedIndicators).length > 0 ? (
            Object.entries(groupedIndicators)
              .sort(
                ([dateA], [dateB]) =>
                  new Date(dateA).getTime() - new Date(dateB).getTime()
              )
              .map(([dateString, indicators]) =>
                renderDateGroup(dateString, indicators)
              )
          ) : (
            <div className="text-center py-8">
              {error ? (
                // 에러 상태 - 데이터 로딩 실패
                <>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                    데이터 로딩 실패
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    금융 일정 데이터를 불러올 수 없습니다.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {error}
                  </p>
                  <button
                    onClick={fetchFinancialData}
                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </>
              ) : (
                // 데이터 없음 상태 - 정상적인 빈 상태
                <>
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    이번 주 금융 일정이 없습니다.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    새로운 일정이 등록되면 표시됩니다.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center gap-1">
          {error ? (
            // 에러 상태
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="데이터 로딩 실패"></div>
          ) : isRealData && Object.keys(groupedIndicators).length > 0 ? (
            // 데이터 있음
            <>
              {Object.keys(groupedIndicators).length > 0 &&
                Object.entries(groupedIndicators)
                  .flatMap(([_, indicators]) => indicators)
                  .filter((_, index) => index < 3) // 최대 3개까지만 표시
                  .map((indicator, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        indicator.importance === 'high'
                          ? 'bg-red-500'
                          : indicator.importance === 'medium'
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      title={`${indicator.indicator} (${indicator.importance})`}
                    ></div>
                  ))
              }
              {Object.keys(groupedIndicators).length === 0 && (
                <div className="w-2 h-2 bg-gray-400 rounded-full" title="데이터 없음"></div>
              )}
            </>
          ) : (
            // 로딩 중 또는 데이터 없음
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" title="로딩 중"></div>
          )}
        </div>
      )}
    </div>
  );
}
