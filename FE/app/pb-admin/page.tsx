"use client";

import { useState, useEffect } from "react";
import PBConsultationDashboard from "@/components/pb/PBConsultationDashboard";
import VideoConsultation from "@/components/pb/VideoConsultation";
import Navbar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";

export default function PBAdminPage() {
  const [currentView, setCurrentView] = useState<"dashboard" | "consultation">(
    "dashboard"
  );
  const [consultationData, setConsultationData] = useState<any>(null);
  const [pbId, setPbId] = useState<string>("");

  // 실제로는 인증된 사용자의 PB ID를 가져와야 함
  useEffect(() => {
    // 임시로 하드코딩된 PB ID 사용 (실제로는 JWT 토큰에서 추출)
    setPbId("pb-001");
  }, []);

  const handleStartConsultation = (consultation: any) => {
    setConsultationData(consultation);
    setCurrentView("consultation");
  };

  const handleEndConsultation = () => {
    setConsultationData(null);
    setCurrentView("dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📈
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💰
        </div>
        <div className="floating-symbol absolute top-60 left-1/4 text-green-400 dark:text-green-300 text-lg animate-bounce delay-300">
          🚀
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          💎
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          📊
        </div>
        <div className="floating-symbol absolute top-32 right-1/3 text-emerald-400 dark:text-emerald-300 text-lg animate-pulse delay-200">
          🎯
        </div>
      </div>

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>

      {/* Mouse Follower */}
      <MouseFollower />

      {/* Main Content */}
      <main className="relative z-10 pt-16">
        {currentView === "dashboard" && pbId && (
          <PBConsultationDashboard
            pbId={pbId}
            onStartConsultation={handleStartConsultation}
          />
        )}
        {currentView === "consultation" && consultationData && (
          <VideoConsultation
            consultationId={consultationData.id}
            clientName={consultationData.clientName}
            clientRegion={consultationData.clientRegion}
            pbName="김영희 PB"
            onEndConsultation={handleEndConsultation}
          />
        )}
      </main>
    </div>
  );
}
