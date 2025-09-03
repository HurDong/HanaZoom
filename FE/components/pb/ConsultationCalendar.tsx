"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Video,
  Phone,
  MessageSquare,
  Clock,
  User,
  MapPin,
} from "lucide-react";

interface ConsultationEvent {
  id: string;
  clientName: string;
  clientRegion: string;
  scheduledTime: string;
  type: "video" | "phone" | "chat";
  duration: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  notes?: string;
}

interface ConsultationCalendarProps {
  consultations: ConsultationEvent[];
  onEventClick?: (event: ConsultationEvent) => void;
}

export default function ConsultationCalendar({
  consultations,
  onEventClick,
}: ConsultationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 월 이름 배열
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  // 요일 이름 배열
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // 특정 날짜의 상담 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return consultations.filter((consultation) => {
      const consultationDate = new Date(consultation.scheduledTime)
        .toISOString()
        .split("T")[0];
      return consultationDate === dateStr;
    });
  };

  // 상담 유형별 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-3 h-3" />;
      case "phone":
        return <Phone className="w-3 h-3" />;
      case "chat":
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  // 상담 유형별 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "phone":
        return "bg-green-100 text-green-800 border-green-200";
      case "chat":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 상담 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "border-l-blue-500";
      case "in-progress":
        return "border-l-green-500";
      case "completed":
        return "border-l-gray-500";
      case "cancelled":
        return "border-l-red-500";
      default:
        return "border-l-gray-500";
    }
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // 달력 날짜 생성
  const generateCalendarDays = () => {
    const days = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      0
    );
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      days.push({
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day),
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isToday = date.toDateString() === new Date().toDateString();
      const events = getEventsForDate(date);

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        events,
      });
    }

    // 다음 달의 첫 날들 (42개 셀을 채우기 위해)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        day
      );
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-4">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              오늘
            </Button>
          </div>
        </div>

        {/* 상담 유형 범례 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              화상 상담
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-gray-600 dark:border-green-200 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              전화 상담
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              채팅 상담
            </span>
          </div>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
        <CardContent className="p-0">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 p-1
                  ${
                    !day.isCurrentMonth
                      ? "bg-gray-50 dark:bg-gray-800/50"
                      : "bg-white dark:bg-gray-900"
                  }
                  ${day.isToday ? "bg-green-50 dark:bg-green-900/20" : ""}
                  ${
                    selectedDate?.toDateString() === day.date.toDateString()
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }
                  hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
                `}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="flex flex-col h-full">
                  {/* 날짜 */}
                  <div
                    className={`
                    text-sm font-medium mb-1
                    ${
                      !day.isCurrentMonth
                        ? "text-gray-400"
                        : "text-gray-900 dark:text-gray-100"
                    }
                    ${day.isToday ? "text-green-600 font-bold" : ""}
                  `}
                  >
                    {day.date.getDate()}
                  </div>

                  {/* 상담 이벤트들 */}
                  <div className="flex-1 space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`
                          text-xs p-1 rounded border-l-2 cursor-pointer
                          ${getTypeColor(event.type)} ${getStatusColor(
                          event.status
                        )}
                          hover:shadow-sm transition-shadow
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {getTypeIcon(event.type)}
                          <span className="font-semibold text-xs truncate">
                            {event.clientName}
                          </span>
                        </div>
                        <div className="text-xs font-medium opacity-90">
                          {new Date(event.scheduledTime).toLocaleTimeString(
                            "ko-KR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.events.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 선택된 날짜의 상담 상세 정보 */}
      {selectedDate && (
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}{" "}
              상담 일정
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                          p-2 rounded-lg ${getTypeColor(event.type)}
                        `}
                        >
                          {getTypeIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {event.clientName}
                            </h4>
                            <Badge className={getTypeColor(event.type)}>
                              {event.type === "video"
                                ? "화상"
                                : event.type === "phone"
                                ? "전화"
                                : "채팅"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getStatusColor(event.status)}
                            >
                              {event.status === "scheduled"
                                ? "예정"
                                : event.status === "in-progress"
                                ? "진행중"
                                : event.status === "completed"
                                ? "완료"
                                : "취소"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(event.scheduledTime).toLocaleTimeString(
                                "ko-KR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}{" "}
                              ({event.duration}분)
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.clientRegion}
                            </div>
                          </div>
                          {event.notes && (
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {event.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>이 날에는 예정된 상담이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
