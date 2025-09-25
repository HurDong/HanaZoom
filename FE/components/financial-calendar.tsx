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

    // 더미 금융 일정 데이터 (월~금 주간 일정)
    const dummyIndicators: FinancialScheduleItem[] = [
      // 월요일
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
        date: "2025-09-29",
        dayOfWeek: "월요일",
        time: "09:30",
        indicator: "제조업 구매관리자지수 (Manufacturing PMI)",
        importance: "medium",
        country: "한국",
        forecast: "48.2",
        previous: "47.8",
      },
      {
        date: "2025-09-29",
        dayOfWeek: "월요일",
        time: "14:00",
        indicator: "소매판매 (Retail Sales)",
        importance: "low",
        country: "한국",
        forecast: "전월 대비 1.2%",
        previous: "전월 대비 0.8%",
      },

      // 화요일
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
      {
        date: "2025-09-30",
        dayOfWeek: "화요일",
        time: "10:00",
        indicator: "소비자신뢰지수 (Consumer Confidence)",
        importance: "low",
        country: "한국",
        forecast: "95.5",
        previous: "94.2",
      },

      // 수요일
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
        date: "2025-10-01",
        dayOfWeek: "수요일",
        time: "08:00",
        indicator: "생산자물가지수 (PPI)",
        importance: "medium",
        country: "한국",
        forecast: "전년 대비 3.1%",
        previous: "전년 대비 2.9%",
      },
      {
        date: "2025-10-01",
        dayOfWeek: "수요일",
        time: "11:00",
        indicator: "무역수지 (Trade Balance)",
        importance: "high",
        country: "한국",
        forecast: "25억 달러 흑자",
        previous: "22억 달러 흑자",
      },

      // 목요일
      {
        date: "2025-10-02",
        dayOfWeek: "목요일",
        time: "08:00",
        indicator: "수출입 동향 (Export/Import)",
        importance: "high",
        country: "한국",
        forecast: "수출 +5.2%",
        previous: "수출 +3.8%",
      },
      {
        date: "2025-10-02",
        dayOfWeek: "목요일",
        time: "09:00",
        indicator: "기업경기실사지수 (BSI)",
        importance: "low",
        country: "한국",
        forecast: "78.5",
        previous: "76.3",
      },

      // 금요일
      {
        date: "2025-10-03",
        dayOfWeek: "금요일",
        time: "08:00",
        indicator: "국내총생산 (GDP) 잠정치",
        importance: "high",
        country: "한국",
        forecast: "전기 대비 0.7%",
        previous: "전기 대비 0.6%",
      },
      {
        date: "2025-10-03",
        dayOfWeek: "금요일",
        time: "10:30",
        indicator: "외환보유액 (Foreign Reserves)",
        importance: "medium",
        country: "한국",
        forecast: "4,250억 달러",
        previous: "4,230억 달러",
      },
    ];

    // 더미 데이터 설정
    setTimeout(() => {
      setIndicators(dummyIndicators);
      setIsRealData(false); // 더미 데이터임을 표시
      setLoading(false);
    }, 1000); // 로딩 효과를 위한 지연
  }, []);

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
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 animate-pulse bg-white/90 dark:bg-gray-800/50"
            >
              <div className="flex-shrink-0 w-12 text-center">
                <div className="text-sm font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  08:00
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                이번 주 금융 일정이 없습니다.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                데이터를 불러올 수 없습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {isCollapsed && Object.keys(groupedIndicators).length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
