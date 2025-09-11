"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Users,
  Crown,
  Lock,
  Unlock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuthStore } from "@/app/utils/auth";

export default function JoinRoomPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const inviteCode = searchParams.get("code");

  // WebRTC 훅 사용
  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    startConnection,
    endConnection,
    connectionStatus,
  } = useWebRTC({
    consultationId: roomInfo?.roomId || "",
    clientId: roomInfo?.roomId
      ? `guest-${roomInfo.roomId.substring(0, 8)}`
      : "client",
  });

  // 방 정보 조회
  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!inviteCode) {
        setError("초대 코드가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/pb-rooms/join-info?inviteCode=${inviteCode}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setRoomInfo(data.data);
            if (data.data.isPrivate) {
              setShowPasswordForm(true);
            }
          } else {
            setError(data.message || "방을 찾을 수 없습니다.");
          }
        } else {
          setError("방을 찾을 수 없습니다.");
        }
      } catch (error) {
        setError("방 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [inviteCode]);

  // 방 참여
  const handleJoinRoom = async () => {
    console.log("🚀 handleJoinRoom 호출됨", {
      roomInfo: !!roomInfo,
      inviteCode,
      password,
      joining,
      showPasswordForm,
    });

    if (!roomInfo) {
      console.log("❌ roomInfo가 없어서 함수 종료");
      return;
    }

    setJoining(true);
    try {
      // 로그인 상태 확인 (로그인 필수)
      const token = accessToken;
      console.log("🔍 토큰 확인:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + "..." : "null",
        source: "zustand",
      });

      // 로그인하지 않은 경우 에러
      if (!token) {
        setError("로그인이 필요합니다. 먼저 로그인해주세요.");
        return;
      }

      const apiEndpoint = "/api/pb-rooms/user/join";
      console.log("🔗 API 엔드포인트:", apiEndpoint);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteCode,
          roomPassword: password,
        }),
      });

      const data = await response.json();
      console.log("📊 방 참여 API 응답:", {
        status: response.status,
        ok: response.ok,
        success: data.success,
        data: data.data,
        message: data.message,
      });

      if (response.ok && data.success) {
        // PB 페이지로 이동 (권한에 따라 다른 컴포넌트 표시)
        const roomId = data.data.roomId;
        const inviteCode = data.data.inviteCode;
        const isLoggedIn = !!token;

        // 일반 사용자용 clientId 생성
        const clientId = `guest-${roomId.substring(0, 8)}`;

        console.log("✅ 방 참여 성공 - PB 페이지로 이동:", {
          roomId,
          inviteCode,
          clientId,
          isLoggedIn,
        });

        // PB 페이지로 이동 (일반 사용자 권한으로)
        const pbPageUrl = `/pb/room/${roomId}?type=pb-room&pbName=상담사&inviteCode=${inviteCode}&clientId=${clientId}&userType=guest`;
        console.log("🔗 PB 페이지로 이동:", pbPageUrl);
        router.push(pbPageUrl);
      } else {
        console.error("❌ 방 참여 실패:", data.message);
        setError(data.message || "방 참여에 실패했습니다.");
      }
    } catch (error) {
      setError("방 참여 중 오류가 발생했습니다.");
    } finally {
      setJoining(false);
    }
  };

  // 화상상담 종료
  const handleEndCall = () => {
    endConnection();
    router.push("/");
  };

  // 로그인 상태 확인
  const isLoggedIn = !!accessToken;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 dark:text-green-300">
            방 정보를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 안내 메시지
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              로그인이 필요합니다
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              화상상담에 참여하려면 먼저 로그인해주세요.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/login")} className="flex-1">
                로그인하기
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="flex-1"
              >
                홈으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-red-200 dark:border-red-800">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
              오류 발생
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              비공개 방 입장
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">방 비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => {
                console.log("🖱️ 방 입장 버튼 클릭됨 (비공개 방)");
                handleJoinRoom();
              }}
              disabled={joining || !password}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {joining ? "입장 중..." : "방 입장"}
            </Button>
            <div className="text-xs text-gray-500 mt-2">
              디버그: password="{password}", joining={joining.toString()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              {roomInfo?.roomName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-green-700 dark:text-green-300 mb-4">
                {roomInfo?.roomDescription}
              </p>
              <div className="flex gap-2 justify-center">
                <Badge
                  className={
                    roomInfo?.isPrivate
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {roomInfo?.isPrivate ? (
                    <Lock className="w-3 h-3 mr-1" />
                  ) : (
                    <Unlock className="w-3 h-3 mr-1" />
                  )}
                  {roomInfo?.isPrivate ? "비공개" : "공개"}
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Users className="w-3 h-3 mr-1" />
                  {roomInfo?.currentParticipants}/{roomInfo?.maxParticipants}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => {
                console.log("🖱️ 화상상담 시작 버튼 클릭됨");
                handleJoinRoom();
              }}
              disabled={joining}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {joining ? "입장 중..." : "화상상담 시작"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <div className="text-xs text-gray-500 mt-2">
              디버그: joining={joining.toString()}, roomInfo=
              {roomInfo ? "있음" : "없음"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 화상상담 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-900 dark:text-green-100">
              {roomInfo?.roomName}
            </h1>
            <p className="text-green-700 dark:text-green-300">
              PB와의 1대1 화상상담
            </p>
          </div>
          <Badge
            className={
              isConnected
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }
          >
            {connectionStatus}
          </Badge>
        </div>

        {/* 비디오 영역 */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
              {/* 원격 비디오 (PB) */}
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
                      {connectionStatus === "연결 중..."
                        ? "연결 중..."
                        : "연결 대기 중"}
                    </p>
                    <p className="text-sm text-gray-300">
                      PB가 화상상담을 시작하면 연결됩니다
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
      </div>
    </div>
  );
}
