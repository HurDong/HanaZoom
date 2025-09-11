"use client";

import VideoConsultationRoom from "./VideoConsultationRoom";

interface VideoConsultationProps {
  consultationId: string;
  clientName: string;
  clientRegion: string;
  pbName: string;
  clientId?: string;
  onEndConsultation: () => void;
}

export default function VideoConsultation({
  consultationId,
  clientName,
  clientRegion,
  pbName,
  clientId,
  onEndConsultation,
}: VideoConsultationProps) {
  return (
    <VideoConsultationRoom
      consultationId={consultationId}
      clientName={clientName}
      clientRegion={clientRegion}
      pbName={pbName}
      clientId={clientId}
      onEndConsultation={onEndConsultation}
    />
  );
}
