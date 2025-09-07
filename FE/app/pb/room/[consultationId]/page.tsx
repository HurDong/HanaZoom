"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import VideoConsultation from "@/components/pb/VideoConsultation";
import PbRoomVideoConsultation from "@/components/pb/PbRoomVideoConsultation";
import Navbar from "@/app/components/Navbar";

export default function ConsultationRoomPage() {
  const params = useParams<{ consultationId: string }>();
  const sp = useSearchParams();
  const router = useRouter();

  const originalConsultationId = params.consultationId;
  const clientName = sp.get("clientName") || "고객";
  const clientRegion = sp.get("clientRegion") || "지역 정보 없음";
  const pbName = sp.get("pbName") || "PB";
  const roomType = sp.get("type"); // "pb-room" 또는 일반 상담
  const clientId = sp.get("clientId"); // 클라이언트 ID 파라미터
  const userType = sp.get("userType"); // "pb" 또는 "guest"

  // 실제 데이터베이스의 UUID를 그대로 사용
  const consultationId = originalConsultationId;

  // PB 개별방인지 확인
  const isPbRoom = roomType === "pb-room";

  // 사용자 타입에 따른 권한 확인
  const isPb = userType === "pb" || !userType; // userType이 없으면 기본적으로 PB
  const isGuest = userType === "guest";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>
      <main className="relative z-10 pt-16">
        {isPbRoom ? (
          <PbRoomVideoConsultation
            roomId={consultationId}
            pbName={pbName}
            clientId={clientId || undefined}
            userType={userType || "pb"}
            isPb={isPb}
            isGuest={isGuest}
            onEndConsultation={() => router.push(isPb ? "/pb-admin" : "/")}
          />
        ) : (
          <VideoConsultation
            consultationId={consultationId}
            clientName={clientName}
            clientRegion={clientRegion}
            pbName={pbName}
            clientId={clientId || undefined}
            onEndConsultation={() => router.push("/pb-admin")}
          />
        )}
      </main>
    </div>
  );
}
