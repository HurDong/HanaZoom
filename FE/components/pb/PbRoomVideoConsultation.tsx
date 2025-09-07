"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  Crown,
  UserX,
  Share2,
  Copy,
  Settings,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  generateSharedClientId,
  clearAllSharedClientIds,
} from "@/lib/utils/clientId";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // 안정적인 클라이언트 ID 생성 (한 번만 생성)
  const stableClientId = useMemo(() => {
    return clientId || generateSharedClientId(roomId, "pb");
  }, [clientId, roomId]);

  // WebRTC 훅 사용
  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    participants: webrtcParticipants,
    connectionState,
    error: webrtcError,
    mediaMode,
    startConnection,
    endConnection,
    initiateCall,
    requestPermissions,
    checkDeviceStatus,
    setConnectionState,
  } = useWebRTC({
    consultationId: roomId,
    clientId: stableClientId,
    onConnectionStateChange: (state) => {
      console.log("WebRTC 연결 상태 변경:", state);
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
    onError: (error) => {
      console.error("WebRTC 에러:", error);
    },
  });

  // 기존 클라이언트 ID 클리어 (SockJS 경로 문제 해결)
  useEffect(() => {
    clearAllSharedClientIds();
  }, []);

  // 방 정보 조회
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        // 인증 토큰 가져오기
        const authState = useAuthStore.getState();
        const token = authState.accessToken;

        if (!token) {
          console.warn("인증 토큰이 없어서 방 정보를 조회할 수 없습니다.");
          return;
        }

        const response = await fetch(`/api/pb-rooms/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRoomInfo(data.data);
            setInviteCode(data.data.inviteCode);
            setParticipants(data.data.participants || []);
            // 참여자 정보 업데이트 로그 (필요시에만 활성화)
            // console.log(
            //   "🔄 참여자 정보 업데이트:",
            //   data.data.participants?.length || 0,
            //   "명"
            // );

            // 일반 사용자가 참여하지 않은 경우 자동으로 참여
            if (isGuest && data.data.participants?.length === 1) {
              console.log("👤 일반 사용자 자동 참여 처리");
              // 일반 사용자 참여 로직은 이미 join-room에서 처리되었으므로
              // 여기서는 참여자 수만 업데이트
            }
          }
        } else {
          console.error(
            "방 정보 조회 실패:",
            response.status,
            response.statusText
          );

          // 방이 존재하지 않는 경우 오프라인 모드로 전환
          if (response.status === 500) {
            console.warn("방이 존재하지 않습니다. 오프라인 모드로 전환합니다.");
            setConnectionState("offline");
          }
        }
      } catch (error) {
        console.error("방 정보 조회 실패:", error);
      }
    };

    // 즉시 조회
    fetchRoomInfo();

    // 5초마다 참여자 정보 업데이트
    const interval = setInterval(fetchRoomInfo, 5000);

    return () => clearInterval(interval);
  }, [roomId]);

  // 화상상담 시작
  const handleStartCall = async () => {
    try {
      console.log("🎥 화상상담 시작 요청", {
        roomId,
        clientId: stableClientId,
        connectionState,
        isConnected,
      });

      await startConnection();

      // 연결 상태에 따라 처리
      setTimeout(() => {
        if (connectionState === "offline") {
          console.log("📹 오프라인 모드 - 로컬 비디오 활성화");
          // 오프라인 모드에서는 로컬 비디오만 표시
        } else {
          console.log("🌐 온라인 모드 - WebRTC 연결 시작");
          // 온라인 모드에서는 WebRTC 연결 시작
          initiateCall();
        }
      }, 1000);
    } catch (error) {
      console.error("화상상담 시작 실패:", error);
    }
  };

  // 화상상담 종료
  const handleEndCall = () => {
    endConnection();
    onEndConsultation();
  };

  // 오디오 토글
  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  // 비디오 토글
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // 참여자 강퇴
  const handleKickParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/pb-rooms/${roomId}/kick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          reason: "방장에 의한 강퇴",
        }),
      });

      if (response.ok) {
        // 참여자 목록 새로고침
        const roomResponse = await fetch(`/api/pb-rooms/${roomId}`);
        if (roomResponse.ok) {
          const data = await roomResponse.json();
          if (data.success) {
            setParticipants(data.data.participants || []);
          }
        }
      }
    } catch (error) {
      console.error("참여자 강퇴 실패:", error);
    }
  };

  // 초대 링크 복사
  const copyInviteLink = () => {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    const inviteLink = `${window.location.origin}/join-room?code=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert("초대 링크가 복사되었습니다!");
  };

  // 초대 코드 복사
  const copyInviteCode = () => {
    if (typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(inviteCode);
    alert("초대 코드가 복사되었습니다!");
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (typeof window === "undefined" || !document) return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
              {roomInfo?.roomName || (isPb ? "PB 상담실" : "상담실")}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 화상 영역 */}
          <div className="lg:col-span-2 space-y-4">
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
                        <Button
                          onClick={handleStartCall}
                          className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          화상상담 시작
                        </Button>
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
                    onClick={toggleFullscreen}
                    variant="outline"
                    size="lg"
                    className="rounded-full w-12 h-12"
                  >
                    {isFullscreen ? (
                      <MonitorOff className="w-6 h-6" />
                    ) : (
                      <Monitor className="w-6 h-6" />
                    )}
                  </Button>

                  <Button
                    onClick={handleEndCall}
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

          {/* 사이드바 */}
          <div className="space-y-4">
            {/* 방 정보 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />방 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPb && (
                  <div>
                    <Label className="text-sm font-medium">초대 코드</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={inviteCode}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyInviteCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {isPb && (
                  <div>
                    <Label className="text-sm font-medium">초대 링크</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/join-room?code=${inviteCode}`
                            : ""
                        }
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyInviteLink}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    초대 링크를 고객에게 공유하면 1대1 화상상담을 시작할 수
                    있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 참여자 목록 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  참여자 ({participants.length}/2)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.participantId}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {participant.memberName}
                        </span>
                        {participant.role === "HOST" && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      {participant.role === "GUEST" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleKickParticipant(participant.participantId)
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {participants.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      아직 참여자가 없습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 액션 버튼들 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    onClick={handleStartCall}
                    disabled={isConnected || isConnecting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isConnecting
                      ? "연결 중..."
                      : isConnected
                      ? connectionState === "offline"
                        ? "오프라인 모드"
                        : "연결됨"
                      : "화상상담 시작"}
                  </Button>

                  <Button
                    onClick={handleEndCall}
                    variant="outline"
                    className="w-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    상담 종료
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
