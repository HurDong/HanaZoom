"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Phone, Monitor } from "lucide-react";
import { usePbRoomWebRTC } from "@/hooks/usePbRoomWebRTC";
import { useAuthStore } from "@/app/utils/auth";

interface PbRoomVideoConsultationProps {
  roomId: string;
  pbName: string;
  clientId?: string;
  userType?: string;
  isPb?: boolean;
  isGuest?: boolean;
  onEndConsultation: () => void;
  onParticipantJoined?: (participant: {
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export default function PbRoomVideoConsultation({
  roomId,
  pbName,
  clientId,
  userType = "pb",
  isPb = true,
  isGuest = false,
  onEndConsultation,
  onParticipantJoined,
  onParticipantLeft,
}: PbRoomVideoConsultationProps) {
  // Zustand store에서 accessToken 가져오기
  const { accessToken } = useAuthStore();

  // 디버그 로그 - 스토어에서 직접 가져온 토큰으로 확인
  const currentToken = useAuthStore.getState().accessToken;
  console.log(
    "🔑 PbRoomVideoConsultation accessToken:",
    currentToken ? "있음" : "없음"
  );

  // 새로운 WebRTC 훅 사용
  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    mediaMode,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  } = usePbRoomWebRTC({
    roomId: roomId,
    accessToken: currentToken,
    userType: userType, // 사용자 타입 전달
    onError: (error) => {
      console.error("WebRTC 에러:", error);
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
    onParticipantJoined: onParticipantJoined,
    onParticipantLeft: onParticipantLeft,
  });

  // WebRTC 연결 시작
  useEffect(() => {
    if (roomId && currentToken) {
      connectWebSocket();
    }
  }, [roomId, currentToken]); // currentToken이 변경될 때만 실행

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // 한 번만 실행

  return (
    <div className="h-full flex flex-col">
      {/* 메인 비디오 영역 */}
      <div className="flex-1 relative bg-gray-900 rounded-lg m-2 md:m-4 overflow-hidden">
        {mediaMode === "text" ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white max-w-md mx-auto px-4">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">텍스트 채팅 모드</h3>
              <p className="text-gray-300 mb-4">
                카메라나 마이크가 없어도 텍스트로 상담을 진행할 수 있습니다
              </p>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-200">
                  💡 화상 상담을 원하시면 카메라/마이크를 연결하고 권한을 허용해주세요
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 원격 비디오 */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* 로컬 비디오 (작은 화면) */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 w-24 h-18 md:w-48 md:h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-green-500">
              {mediaMode === "text" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-2xl mb-2">📝</div>
                    <p className="text-xs">텍스트 모드</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              {/* 로컬 비디오 오버레이 */}
              <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/50 text-white px-1 py-0.5 md:px-2 md:py-1 rounded text-xs">
                {isPb ? pbName : "나"}
              </div>
            </div>
          </>
        )}

        {/* 연결 상태 오버레이 */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <div className="text-center text-white">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold mb-2">
                {connectionState === "connecting"
                  ? "연결 중..."
                  : connectionState === "offline"
                  ? "오프라인 모드"
                  : "연결 대기 중"}
              </p>
              <p className="text-sm text-gray-300 max-w-md">
                {connectionState === "offline"
                  ? "오프라인 모드: 백엔드 서버가 실행되지 않아 로컬 비디오만 확인 가능합니다."
                  : "고객이 초대 링크로 접속하면 화상상담이 시작됩니다"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full p-2 md:p-4 shadow-xl border border-emerald-200/30 dark:border-emerald-700/30">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleAudio}
              className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all duration-200 ${
                isAudioEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <MicOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all duration-200 ${
                isVideoEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
              }`}
            >
              {isVideoEnabled ? (
                <Video className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <VideoOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              onClick={() => {
                if (typeof window === "undefined" || !document) return;
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200"
            >
              <Monitor className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={() => {
                disconnect();
                onEndConsultation();
              }}
              className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
