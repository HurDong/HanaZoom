"use client";

import { useState } from "react";
import PBConsultationDashboard from "@/components/pb/PBConsultationDashboard";
import VideoConsultation from "@/components/pb/VideoConsultation";

export default function PBAdminPage() {
  const [currentView, setCurrentView] = useState<"dashboard" | "consultation">(
    "dashboard"
  );
  const [consultationData, setConsultationData] = useState<any>(null);

  const handleStartConsultation = (consultation: any) => {
    setConsultationData(consultation);
    setCurrentView("consultation");
  };

  const handleEndConsultation = () => {
    setConsultationData(null);
    setCurrentView("dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      {currentView === "dashboard" && (
        <PBConsultationDashboard
          pbId="pb-001"
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
    </div>
  );
}
