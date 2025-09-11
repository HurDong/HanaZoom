"use client";

import { useState } from "react";
import ConsultationBooking from "@/components/pb/ConsultationBooking";


export default function PBPage() {
  const [showBooking, setShowBooking] = useState(false);

  const handleBookingComplete = (booking: any) => {
    console.log("예약 완료:", booking);
    setShowBooking(false);
  };


  if (showBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
        <ConsultationBooking
          pbId="pb-001"
          onBookingComplete={handleBookingComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          PB 상담 서비스
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          전문 PB와의 맞춤형 투자 상담을 받아보세요
        </p>
        <button
          onClick={() => {
            setShowBooking(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          상담 예약하기
        </button>
      </div>
    </div>
  );
}
