"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PBConsultationDashboard from "@/components/pb/PBConsultationDashboard";
import VideoConsultation from "@/components/pb/VideoConsultation";
import Navbar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";

export default function PBAdminPage() {
  const router = useRouter();
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

  // 디버깅을 위한 상태 로깅
  useEffect(() => {
    console.log("현재 뷰:", currentView);
    console.log("상담 데이터:", consultationData);
  }, [currentView, consultationData]);

  const handleStartConsultation = (consultation: any) => {
    console.log("상담 시작 요청:", consultation);
    
    // consultation 객체가 없거나 필요한 필드가 없는 경우 테스트용 데이터 사용
    const consultationData = {
      id: consultation?.id || "15103a9c-8427-4295-8dab-a02c50a47e38", // 유효한 UUID 형식
      clientName: consultation?.clientName || "테스트 고객",
      clientRegion: consultation?.clientRegion || "서울시 강남구",
      pbName: "김영희 PB"
    };
    
    console.log("화상상담 데이터:", consultationData);
    // 실제 페이지 라우팅으로 화상방 진입
    const qs = new URLSearchParams({
      clientName: consultationData.clientName,
      clientRegion: consultationData.clientRegion,
      pbName: consultationData.pbName,
    }).toString();
    router.push(`/pb/room/${consultationData.id}?${qs}`);
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
          <div>
            {/* 테스트용 버튼 */}
            <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg m-4">
              <h3 className="text-lg font-semibold mb-2">테스트용 화상상담 시작</h3>
              <button
                onClick={() => handleStartConsultation(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                테스트 화상상담 시작
              </button>
            </div>
            
            <PBConsultationDashboard
              pbId={pbId}
              onStartConsultation={handleStartConsultation}
            />
          </div>
        )}
        {currentView === "consultation" && consultationData && (
          <VideoConsultation
            consultationId={consultationData.id}
            clientName={consultationData.clientName}
            clientRegion={consultationData.clientRegion}
            pbName={consultationData.pbName}
            onEndConsultation={handleEndConsultation}
          />
        )}
      </main>
    </div>
  );
}
