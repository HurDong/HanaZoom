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
}

export default function PbRoomVideoConsultation({
  roomId,
  pbName,
  clientId,
  userType = "pb",
  isPb = true,
  isGuest = false,
  onEndConsultation,
}: PbRoomVideoConsultationProps) {
  // Zustand store에서 accessToken 가져오기
  const { accessToken } = useAuthStore();

  // 디버그 로그
  console.log(
    "🔑 PbRoomVideoConsultation accessToken:",
    accessToken ? "있음" : "없음"
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
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  } = usePbRoomWebRTC({
    roomId: roomId,
    accessToken: accessToken,
    userType: userType, // 사용자 타입 전달
    onError: (error) => {
      console.error("WebRTC 에러:", error);
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
  });

  // WebRTC 연결 시작
  useEffect(() => {
    if (roomId && accessToken) {
      connectWebSocket();
    }
  }, [roomId, accessToken]); // accessToken이 변경될 때만 실행

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // 한 번만 실행

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
              {isPb ? "PB 개별방 화상상담" : "화상상담 참여"}
            </h1>
            <p className="text-green-700 dark:text-green-300">
              {isPb ? "PB 상담실" : "상담실"}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge
              className={
                connectionState === "connected"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : connectionState === "offline"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                  : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {connectionState === "offline"
                ? "오프라인 모드"
                : connectionState}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* 메인 화상 영역 */}
          <div className="space-y-4">
            {/* 비디오 영역 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {/* 원격 비디오 */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* 로컬 비디오 (작은 화면) */}
                  <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>

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
                        <p className="text-sm text-gray-300">
                          {connectionState === "offline"
                            ? "오프라인 모드: 백엔드 서버(Spring Boot)가 실행되지 않아 로컬 비디오만 확인 가능합니다. 실제 화상상담을 위해서는 백엔드 서버를 실행해주세요."
                            : "고객이 초대 링크로 접속하면 화상상담이 시작됩니다"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 컨트롤 버튼들 */}
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    onClick={toggleAudio}
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    {isAudioEnabled ? (
                      <Mic className="w-6 h-6" />
                    ) : (
                      <MicOff className="w-6 h-6" />
                    )}
                  </Button>

                  <Button
                    onClick={toggleVideo}
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    {isVideoEnabled ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <VideoOff className="w-6 h-6" />
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (typeof window === "undefined" || !document) return;
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                      } else {
                        document.exitFullscreen();
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    <Monitor className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={() => {
                      disconnect();
                      onEndConsultation();
                    }}
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    <Phone className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 채팅 영역 (간단한 형태) */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100">
                  채팅
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-y-auto">
                  <p className="text-sm text-gray-500 text-center">
                    채팅 기능은 추후 구현 예정입니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
