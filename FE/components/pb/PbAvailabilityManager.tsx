"use client";

import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { useAuthStore } from "@/app/utils/auth"; // useAuthStore import

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

  const handleTimeSelect = (time: string) => {
    if (!isValidTimeBlock(time, selectedDuration)) {
      setError(
        `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다.`
      );
      return;
    }

    setError(""); // 에러 메시지 초기화

    const timeBlocks = getTimeBlocksForDuration(time, selectedDuration);

    setSelectedTimes((prev) => {
      // 이미 선택된 블록인지 확인
      const isAlreadySelected = timeBlocks.every((block) =>
        prev.includes(block)
      );

      if (isAlreadySelected) {
        // 선택 해제: 해당 블록의 모든 시간을 제거
        return prev.filter((t) => !timeBlocks.includes(t));
      } else {
        // 선택: 기존 선택을 모두 해제하고 새로운 블록 선택 (하나의 블록만 선택 가능)
        return timeBlocks;
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

    // 연속된 시간 블록을 하나의 상담 슬롯으로 처리
    const sortedTimes = [...selectedTimes].sort();
    const firstTime = sortedTimes[0];
    const [hours, minutes] = firstTime.split(":").map(Number);

    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(
      startTime.getTime() + selectedDuration * 60 * 1000
    );

    // 로컬 시간을 'yyyy-MM-ddTHH:mm:ss' 형식의 문자열로 변환
    const formatToLocalISO = (date: Date) => {
      const pad = (num: number) => String(num).padStart(2, "0");
      return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
          date.getDate()
        )}` +
        `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
          date.getSeconds()
        )}`
      );
    };

    const availableSlots = [
      {
        startTime: formatToLocalISO(startTime),
        endTime: formatToLocalISO(endTime),
      },
    ];

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
          `${selectedDuration}분 상담 불가능 시간이 성공적으로 등록되었습니다.`
        );
        setSelectedTimes([]);
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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">상담 불가능 시간 등록</h2>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ko}
            modifiersClassNames={{
              selected: "my-selected",
              today: "my-today",
            }}
            styles={{
              caption: { color: "#005747" },
            }}
          />
        </div>
        <div className="flex-grow">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">상담 시간 선택</h3>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(Number(e.target.value));
                setSelectedTimes([]); // 시간 변경 시 선택 초기화
                setError(""); // 에러 메시지 초기화
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {consultationDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          <h3 className="font-semibold mb-2">
            {selectedDate
              ? `${selectedDate.toLocaleDateString("ko-KR")} - 불가능 시간 선택`
              : "날짜를 선택하세요"}
          </h3>
          {selectedDate && (
            <>
              <p className="text-sm text-gray-600 mb-3">
                {selectedDuration}분 상담 불가능 시간을 선택하세요. 선택한
                시간부터 {selectedDuration}분 동안 예약이 차단됩니다.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isSelected = selectedTimes.includes(time);
                  const isValidStart = isValidTimeBlock(time, selectedDuration);
                  const isPartOfSelectedBlock = selectedTimes.includes(time);

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={!isValidStart}
                      className={`p-2 border rounded-md text-center text-sm ${
                        isPartOfSelectedBlock
                          ? "bg-red-600 text-white border-red-600"
                          : isValidStart
                          ? "bg-gray-100 hover:bg-gray-200 border-gray-300"
                          : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                      title={
                        !isValidStart
                          ? `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다`
                          : isPartOfSelectedBlock
                          ? "선택된 불가능 시간"
                          : "클릭하여 불가능 시간으로 설정"
                      }
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
              {selectedTimes.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    <strong>선택된 불가능 시간:</strong>{" "}
                    {selectedTimes.sort().join(", ")}({selectedDuration}분 블록)
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate || selectedTimes.length === 0}
          className="px-6 py-2 bg-emerald-700 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-emerald-800 transition-colors"
        >
          {isSubmitting ? "등록 중..." : "선택 시간을 불가능으로 표시"}
        </button>
      </div>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}
