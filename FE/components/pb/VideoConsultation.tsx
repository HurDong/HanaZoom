"use client";

import VideoConsultationRoom from "./VideoConsultationRoom";

interface VideoConsultationProps {
  consultationId: string;
  clientName: string;
  clientRegion: string;
  pbName: string;
  onEndConsultation: () => void;
}

export default function VideoConsultation({
  consultationId,
  clientName,
  clientRegion,
  pbName,
  onEndConsultation,
}: VideoConsultationProps) {
  return (
    <VideoConsultationRoom
      consultationId={consultationId}
      clientName={clientName}
      clientRegion={clientRegion}
      pbName={pbName}
      onEndConsultation={onEndConsultation}
    />
  );
}
