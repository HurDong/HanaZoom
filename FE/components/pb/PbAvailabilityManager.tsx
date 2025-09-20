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

export default function PbAvailabilityManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTimeSelect = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSubmit = async () => {
    if (!selectedDate || selectedTimes.length === 0) {
      setError("날짜와 시간을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const availableSlots = selectedTimes.map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30분 슬롯

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

      return {
        startTime: formatToLocalISO(startTime),
        endTime: formatToLocalISO(endTime),
      };
    });

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
        setSuccess("상담 가능 시간이 성공적으로 등록되었습니다.");
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
      <h2 className="text-2xl font-bold mb-4">상담 가능 시간 등록</h2>
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
          <h3 className="font-semibold mb-2">
            {selectedDate
              ? `${selectedDate.toLocaleDateString("ko-KR")}`
              : "날짜를 선택하세요"}
          </h3>
          {selectedDate && (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className={`p-2 border rounded-md text-center ${
                    selectedTimes.includes(time)
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate || selectedTimes.length === 0}
          className="px-6 py-2 bg-emerald-700 text-white font-semibold rounded-md disabled:bg-gray-400 hover:bg-emerald-800 transition-colors"
        >
          {isSubmitting ? "등록 중..." : "선택 시간 등록"}
        </button>
      </div>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}
