"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import VideoConsultation from "@/components/pb/VideoConsultation";
import Navbar from "@/app/components/Navbar";

export default function ConsultationRoomPage() {
  const params = useParams<{ consultationId: string }>();
  const sp = useSearchParams();
  const router = useRouter();

  const consultationId = params.consultationId;
  const clientName = sp.get("clientName") || "고객";
  const clientRegion = sp.get("clientRegion") || "지역 정보 없음";
  const pbName = sp.get("pbName") || "PB";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>
      <main className="relative z-10 pt-16">
        <VideoConsultation
          consultationId={consultationId}
          clientName={clientName}
          clientRegion={clientRegion}
          pbName={pbName}
          onEndConsultation={() => router.push("/pb-admin")}
        />
      </main>
    </div>
  );
}



