"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { useAuthStore } from "@/app/utils/auth";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

// 상담 시간 옵션 (분 단위)
const consultationDurations = [
  { label: "30분", value: 30 },
  { label: "45분", value: 45 },
  { label: "60분", value: 60 },
  { label: "90분", value: 90 },
  { label: "120분", value: 120 },
];

export default function PbAvailabilityManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30); // 기본 30분
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 로컬 날짜를 'yyyy-MM-dd' 형식의 문자열로 변환 (시간대 문제 방지)
  const formatToLocalDate = useCallback((date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  }, []);

  // 로컬 시간을 'yyyy-MM-ddTHH:mm:ss' 형식의 문자열로 변환
  const formatToLocalISO = useCallback((date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`
    );
  }, []);

  // 기존 시간 상태 데이터
  const [existingUnavailableTimes, setExistingUnavailableTimes] = useState<
    string[]
  >([]);
  const [clientBookings, setClientBookings] = useState<
    Array<{
      time: string;
      clientName: string;
      status: string;
      durationMinutes: number;
      consultationType: string;
    }>
  >([]);

  // 기존 시간 상태 로드
  const loadExistingTimeStatus = async (date: Date) => {
    try {
      const dateStr = formatToLocalDate(date);
      const accessToken = useAuthStore.getState().accessToken;

      if (!accessToken) {
        console.warn("액세스 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `/api/consultations/pb-time-status?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExistingUnavailableTimes(data.data.unavailableTimes || []);
          setClientBookings(data.data.clientBookings || []);
        } else {
          console.error("시간 상태 조회 API 응답 실패:", data.message);
        }
      } else {
        console.error(
          "시간 상태 조회 HTTP 실패:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("시간 상태 로드 에러:", error);
      // 네트워크 에러 등의 경우에도 기존 상태를 유지
    }
  };

  // 날짜 변경 시 기존 시간 상태 로드
  useEffect(() => {
    if (selectedDate) {
      loadExistingTimeStatus(selectedDate);
      setSelectedTimes([]); // 새 날짜 선택 시 선택된 시간 초기화
    }
  }, [selectedDate]);

  // 연속된 시간 블록을 계산하는 함수
  const getTimeBlocksForDuration = (
    startTime: string,
    durationMinutes: number
  ): string[] => {
    const startIndex = timeSlots.indexOf(startTime);
    if (startIndex === -1) return [];

    const blocksNeeded = Math.ceil(durationMinutes / 30); // 30분 단위로 계산
    const endIndex = startIndex + blocksNeeded;

    // 18:00를 넘지 않도록 확인
    if (endIndex > timeSlots.length) return [];

    return timeSlots.slice(startIndex, endIndex);
  };

  // 특정 시간이 18:00를 넘지 않는지 확인
  const isValidTimeBlock = (
    startTime: string,
    durationMinutes: number
  ): boolean => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    const maxEndMinutes = 18 * 60; // 18:00

    return endMinutes <= maxEndMinutes;
  };

  // 기존 불가능 시간 해제
  const removeUnavailableTime = async (time: string) => {
    if (!selectedDate) return;

    // 이전 상태 백업 (롤백용)
    const previousUnavailableTimes = [...existingUnavailableTimes];

    try {
      setIsSubmitting(true);
      setError(""); // 기존 에러 메시지 클리어

      const dateStr = formatToLocalDate(selectedDate);
      const accessToken = useAuthStore.getState().accessToken;

      // 즉시 UI 상태 업데이트 (낙관적 업데이트)
      setExistingUnavailableTimes((prev) => prev.filter((t) => t !== time));

      const response = await fetch(
        `/api/pb/unavailable-time?date=${dateStr}&time=${time}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`${time} 불가능 시간이 해제되었습니다.`);

          // 백그라운드에서 서버 상태와 동기화 (확실한 동기화)
          setTimeout(async () => {
            await loadExistingTimeStatus(selectedDate);
          }, 100);
        } else {
          // API 응답이 실패인 경우 롤백
          setExistingUnavailableTimes(previousUnavailableTimes);
          throw new Error(data.message || "불가능 시간 해제에 실패했습니다.");
        }
      } else {
        // HTTP 에러인 경우 롤백
        setExistingUnavailableTimes(previousUnavailableTimes);
        throw new Error("불가능 시간 해제에 실패했습니다.");
      }
    } catch (err: any) {
      // 에러 발생 시 상태 롤백
      setExistingUnavailableTimes(previousUnavailableTimes);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setError(""); // 에러 메시지 초기화
    setSuccess(""); // 성공 메시지 초기화

    // 고객 예약 시간인지 확인
    const isClientBooked = clientBookings.some(
      (booking) => booking.time === time
    );
    if (isClientBooked) {
      const booking = clientBookings.find((b) => b.time === time);

      if (booking?.status === "PENDING") {
        // PENDING 상태일 때는 상담 관리 안내
        setSuccess(
          `${booking.clientName}님의 ${time} 예약 요청이 있습니다. 상담 관리 탭에서 승인/거절을 결정해주세요.`
        );
        // 여기서 상담 관리 탭으로 이동하는 로직을 추가할 수 있습니다
        // 예: onNavigateToConsultationTab?.();
        return;
      } else {
        // 기타 상태일 때는 에러 메시지
        let statusMessage = "";
        switch (booking?.status) {
          case "APPROVED":
            statusMessage = "승인된 상담 - 수정할 수 없습니다";
            break;
          case "IN_PROGRESS":
            statusMessage = "진행중인 상담 - 수정할 수 없습니다";
            break;
          case "COMPLETED":
            statusMessage = "완료된 상담 - 수정할 수 없습니다";
            break;
          default:
            statusMessage = `${booking?.status} 상태`;
        }

        setError(
          `${time}은 ${booking?.clientName}님이 예약한 시간입니다. (${statusMessage})`
        );
        return;
      }
    }

    // 기존 불가능 시간인지 확인
    const isExistingUnavailable = existingUnavailableTimes.includes(time);
    if (isExistingUnavailable) {
      // 기존 불가능 시간 해제
      removeUnavailableTime(time);
      return;
    }

    // 새로운 불가능 시간 선택
    if (!isValidTimeBlock(time, selectedDuration)) {
      setError(
        `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다.`
      );
      return;
    }

    const timeBlocks = getTimeBlocksForDuration(time, selectedDuration);

    // 선택하려는 블록 중 고객 예약 시간이나 기존 불가능 시간이 있는지 확인
    const hasConflict = timeBlocks.some(
      (block) =>
        clientBookings.some((booking) => booking.time === block) ||
        existingUnavailableTimes.includes(block)
    );

    if (hasConflict) {
      setError(
        `선택한 시간 범위에 이미 예약된 시간이나 불가능한 시간이 포함되어 있습니다.`
      );
      return;
    }

    setSelectedTimes((prev) => {
      // 이미 선택된 블록인지 확인
      const isAlreadySelected = timeBlocks.every((block) =>
        prev.includes(block)
      );

      if (isAlreadySelected) {
        // 선택 해제: 해당 블록의 모든 시간을 제거
        return prev.filter((t) => !timeBlocks.includes(t));
      } else {
        // 새로 선택: 기존 선택에 추가 (여러 블록 선택 가능)
        // 겹치는 시간이 있으면 제거하고 새 블록 추가
        const filteredPrev = prev.filter((t) => !timeBlocks.includes(t));
        return [...filteredPrev, ...timeBlocks].sort();
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedDate || selectedTimes.length === 0) {
      setError("날짜와 시간을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // 선택된 시간들을 duration 단위로 그룹화하여 여러 슬롯 생성
    const sortedTimes = [...selectedTimes].sort();
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];

    // selectedDuration 분 단위로 연속된 블록들을 찾아서 슬롯 생성
    const blocksNeeded = Math.ceil(selectedDuration / 30);

    for (let i = 0; i < sortedTimes.length; i += blocksNeeded) {
      const blockTimes = sortedTimes.slice(i, i + blocksNeeded);

      // 연속된 시간인지 확인
      let isConsecutive = true;
      for (let j = 1; j < blockTimes.length; j++) {
        const prevTime = blockTimes[j - 1];
        const currentTime = blockTimes[j];
        const prevIndex = timeSlots.indexOf(prevTime);
        const currentIndex = timeSlots.indexOf(currentTime);

        if (currentIndex !== prevIndex + 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive && blockTimes.length === blocksNeeded) {
        const firstTime = blockTimes[0];
        const [hours, minutes] = firstTime.split(":").map(Number);

        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(
          startTime.getTime() + selectedDuration * 60 * 1000
        );

        availableSlots.push({
          startTime: formatToLocalISO(startTime),
          endTime: formatToLocalISO(endTime),
        });
      }
    }

    try {
      const accessToken = useAuthStore.getState().accessToken; // 수정된 부분
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch("/api/pb/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ availableSlots }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `${availableSlots.length}개의 ${selectedDuration}분 상담 불가능 시간이 성공적으로 등록되었습니다.`
        );

        // 즉시 UI 상태 업데이트 (빠른 반응성을 위해)
        const newUnavailableTimes = selectedTimes.map((time) => time);
        setExistingUnavailableTimes((prev) => [
          ...prev,
          ...newUnavailableTimes,
        ]);
        setSelectedTimes([]);

        // 백그라운드에서 서버 상태와 동기화
        if (selectedDate) {
          setTimeout(async () => {
            await loadExistingTimeStatus(selectedDate);
          }, 100);
        }
      } else {
        throw new Error(data.message || "시간 등록에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            상담 불가능 시간 등록
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          고객이 예약할 수 없는 시간을 설정하여 개인 일정을 관리하세요
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                날짜 선택
              </h2>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ko}
                disabled={(date) => {
                  // 과거 날짜 비활성화
                  if (date < new Date()) return true;
                  // 주말(토요일=6, 일요일=0) 비활성화
                  const dayOfWeek = date.getDay();
                  return dayOfWeek === 0 || dayOfWeek === 6;
                }}
                className="mx-auto"
                classNames={{
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label:
                    "text-sm font-medium text-slate-900 dark:text-slate-100",
                  nav: "space-x-1 flex items-center",
                  nav_button:
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-slate-500 dark:text-slate-400 rounded-md w-8 font-normal text-xs",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-slate-100",
                  day_selected:
                    "bg-emerald-600 text-white hover:bg-emerald-700 focus:bg-emerald-600",
                  day_today:
                    "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium",
                  day_outside: "text-slate-400 dark:text-slate-600 opacity-50",
                  day_disabled: "text-slate-400 dark:text-slate-600 opacity-50",
                }}
              />
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                상담 시간
              </h3>
            </div>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(Number(e.target.value));
                setSelectedTimes([]);
                setError("");
              }}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {consultationDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Selection Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {selectedDate
                ? `${selectedDate.toLocaleDateString("ko-KR")} 시간 선택`
                : "날짜를 먼저 선택하세요"}
            </h2>
            {selectedDate && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{selectedDuration}분 동안 예약이 차단됩니다</span>
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              {/* 색상 범례 */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  시간 상태 안내
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      선택 가능
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      새로 선택
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      기존 불가능
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      예약 대기중
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      확정 예약
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isValidStart = isValidTimeBlock(time, selectedDuration);
                  const isPartOfSelectedBlock = selectedTimes.includes(time);
                  const isExistingUnavailable =
                    existingUnavailableTimes.includes(time);
                  const clientBooking = clientBookings.find(
                    (booking) => booking.time === time
                  );
                  const isClientBooked = !!clientBooking;

                  // 버튼 스타일 결정
                  let buttonStyle = "";
                  let iconComponent = null;
                  let titleText = "";

                  if (isPartOfSelectedBlock) {
                    // 새로 선택된 불가능 시간 (주황색)
                    buttonStyle =
                      "bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 shadow-sm";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    );
                    titleText = "새로 선택된 불가능 시간";
                  } else if (isExistingUnavailable) {
                    // 기존 불가능 시간 (빨간색, 클릭하면 해제)
                    buttonStyle =
                      "bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-950/50";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    );
                    titleText = "기존 불가능 시간 (클릭하여 해제)";
                  } else if (isClientBooked) {
                    // 고객 예약 시간 - 상태에 따라 다른 스타일
                    if (clientBooking?.status === "PENDING") {
                      // PENDING 상태 (노란색, 클릭 가능)
                      buttonStyle =
                        "bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 shadow-sm hover:bg-yellow-100 dark:hover:bg-yellow-950/50";
                      iconComponent = (
                        <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      );
                      titleText = `${clientBooking.clientName}님 예약 대기중 - 클릭하여 상담 관리로 이동`;
                    } else {
                      // 기타 상태 (파란색, 클릭 불가)
                      buttonStyle =
                        "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-sm cursor-not-allowed";
                      iconComponent = (
                        <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      );

                      let statusText = "";
                      switch (clientBooking?.status) {
                        case "APPROVED":
                          statusText = "승인된 상담";
                          break;
                        case "IN_PROGRESS":
                          statusText = "진행중인 상담";
                          break;
                        case "COMPLETED":
                          statusText = "완료된 상담";
                          break;
                        default:
                          statusText = clientBooking?.status || "예약됨";
                      }
                      titleText = `${clientBooking.clientName}님 ${statusText} - 수정할 수 없습니다`;
                    }
                  } else if (isValidStart) {
                    // 선택 가능한 시간 (회색)
                    buttonStyle =
                      "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm";
                    iconComponent = (
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    );
                    titleText = "클릭하여 불가능 시간으로 설정";
                  } else {
                    // 선택 불가능한 시간 (연한 회색)
                    buttonStyle =
                      "bg-slate-25 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    );
                    titleText = `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다`;
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={
                        !isValidStart &&
                        !isExistingUnavailable &&
                        !(isClientBooked && clientBooking?.status === "PENDING")
                      }
                      className={`
                        relative p-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${buttonStyle}
                      `}
                      title={titleText}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {iconComponent}
                        <span>{time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 고객 예약 정보 */}
              {clientBookings.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        고객 예약 현황
                      </p>
                      <div className="space-y-2">
                        {clientBookings.map((booking, index) => {
                          const isPending = booking.status === "PENDING";
                          const bgColor = isPending
                            ? "bg-yellow-50/80 dark:bg-yellow-950/20"
                            : "bg-white/50 dark:bg-slate-800/50";
                          const textColor = isPending
                            ? "text-yellow-700 dark:text-yellow-400"
                            : "text-blue-700 dark:text-blue-400";

                          let statusText = "";
                          let statusBgColor = "";

                          switch (booking.status) {
                            case "PENDING":
                              statusText = "승인 대기중";
                              statusBgColor =
                                "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300";
                              break;
                            case "APPROVED":
                              statusText = "승인됨";
                              statusBgColor =
                                "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300";
                              break;
                            case "IN_PROGRESS":
                              statusText = "진행중";
                              statusBgColor =
                                "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300";
                              break;
                            case "COMPLETED":
                              statusText = "완료됨";
                              statusBgColor =
                                "bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300";
                              break;
                            default:
                              statusText = booking.status;
                              statusBgColor =
                                "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300";
                          }

                          return (
                            <div
                              key={index}
                              className={`text-sm ${textColor} ${bgColor} p-3 rounded-lg border ${
                                isPending
                                  ? "border-yellow-200 dark:border-yellow-800"
                                  : "border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono font-medium text-base">
                                    {booking.time}
                                  </span>
                                  <span className="ml-2">
                                    {booking.clientName}님
                                  </span>
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${statusBgColor}`}
                                >
                                  {statusText}
                                </span>
                              </div>
                              {isPending && (
                                <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                                  👆 승인/거절을 결정해주세요
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 기존 불가능 시간 정보 */}
              {existingUnavailableTimes.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-medium text-red-900 dark:text-red-300 mb-2">
                        기존 불가능 시간 (클릭하여 해제 가능)
                      </p>
                      <div className="text-sm text-red-700 dark:text-red-400">
                        <p className="font-mono">
                          {existingUnavailableTimes.sort().join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 새로 선택된 불가능 시간 */}
              {selectedTimes.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-medium text-orange-900 dark:text-orange-300 mb-2">
                        새로 선택된 불가능 시간
                      </p>
                      <div className="text-sm text-orange-700 dark:text-orange-400">
                        <p className="mb-1">
                          총 {selectedTimes.length}개 시간 슬롯 선택됨 (
                          {selectedDuration}분 단위)
                        </p>
                        <p className="font-mono">
                          {(() => {
                            const sortedTimes = [...selectedTimes].sort();
                            const blocksNeeded = Math.ceil(
                              selectedDuration / 30
                            );
                            const blocks: string[] = [];

                            for (
                              let i = 0;
                              i < sortedTimes.length;
                              i += blocksNeeded
                            ) {
                              const blockTimes = sortedTimes.slice(
                                i,
                                i + blocksNeeded
                              );
                              if (blockTimes.length === blocksNeeded) {
                                const startTime = blockTimes[0];
                                const [hours, minutes] = startTime
                                  .split(":")
                                  .map(Number);
                                const endMinutes =
                                  hours * 60 + minutes + selectedDuration;
                                const endHours = Math.floor(endMinutes / 60);
                                const endMins = endMinutes % 60;
                                const endTime = `${endHours
                                  .toString()
                                  .padStart(2, "0")}:${endMins
                                  .toString()
                                  .padStart(2, "0")}`;
                                blocks.push(`${startTime} ~ ${endTime}`);
                              }
                            }

                            return blocks.join(", ");
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Section */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate || selectedTimes.length === 0}
          className="
            px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-lg
            disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed
            hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800
            transition-all duration-200 shadow-sm hover:shadow-md
            min-w-[200px] flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>등록 중...</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>불가능 시간 등록</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
