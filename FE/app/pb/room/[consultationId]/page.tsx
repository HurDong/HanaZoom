"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import VideoConsultation from "@/components/pb/VideoConsultation";
import PbRoomVideoConsultation from "@/components/pb/PbRoomVideoConsultation";
import Navbar from "@/app/components/Navbar";
import { useAuthStore } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users, Settings, X } from "lucide-react";

export default function ConsultationRoomPage() {
  const params = useParams<{ consultationId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { accessToken, getCurrentUserId } = useAuthStore();

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

  // PB 관리 UI 상태
  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string; role: string; joinedAt: string }>
  >([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isRoomOwner, setIsRoomOwner] = useState(false);

  // 초대 URL 생성
  useEffect(() => {
    if (isPbRoom && consultationId) {
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/pb/room/${consultationId}?type=pb-room&pbName=${encodeURIComponent(
        pbName
      )}&userType=guest`;
      setInviteUrl(inviteUrl);
    }
  }, [isPbRoom, consultationId, pbName]);

  // PB가 방의 주인인지 확인
  useEffect(() => {
    if (isPb && accessToken) {
      // JWT 토큰에서 사용자 정보 확인하여 방의 주인인지 판단
      // 실제로는 백엔드 API를 호출해야 하지만, 여기서는 간단히 userType으로 판단
      setIsRoomOwner(userType === "pb");
    }
  }, [isPb, accessToken, userType]);

  // 참여자 목록 가져오기 (실제로는 WebSocket이나 API를 통해 실시간 업데이트)
  useEffect(() => {
    if (isRoomOwner && consultationId) {
      // 초기 참여자 목록 설정 (PB 포함)
      setParticipants([
        {
          id: getCurrentUserId() || "pb-user",
          name: pbName,
          role: "PB",
          joinedAt: new Date().toLocaleTimeString(),
        },
      ]);
    }
  }, [isRoomOwner, consultationId, pbName, getCurrentUserId]);

  // 초대 링크 복사
  const handleCopyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  // 참여자 강제 퇴장 (백엔드 API 호출)
  const handleKickParticipant = async (participantId: string) => {
    console.log("=== 강제 퇴장 요청 시작 ===");
    console.log("참여자 ID:", participantId);
    console.log("방 ID:", consultationId);
    console.log("Access Token:", accessToken ? "있음" : "없음");

    // 확인 다이얼로그
    const confirmed = window.confirm(
      "정말로 이 참여자를 강제 퇴장시키시겠습니까?"
    );
    if (!confirmed) {
      return;
    }

    try {
      const apiUrl = `/api/pb-rooms/${consultationId}/kick/${participantId}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("응답 상태:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log("✅ 참여자 강제 퇴장 성공:", participantId);
          // 프론트엔드에서도 참여자 목록에서 제거
          setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        } else {
          console.error("❌ 참여자 강제 퇴장 실패:", data.error);
          alert("참여자 강제 퇴장에 실패했습니다: " + data.error);
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        console.error("❌ 참여자 강제 퇴장 API 오류:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
        });
        alert(
          "참여자 강제 퇴장에 실패했습니다: " +
            (errorData.error || `HTTP ${response.status}`)
        );
      }
    } catch (error) {
      console.error("❌ 참여자 강제 퇴장 중 오류:", error);
      alert("참여자 강제 퇴장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>
      <main className="relative z-10 pt-16">
        <div className="flex h-screen">
          {/* 메인 화상상담 영역 */}
          <div
            className={`flex-1 transition-all duration-300 ${
              isRoomOwner && showManagementPanel ? "mr-80" : ""
            }`}
          >
            {isPbRoom ? (
              <PbRoomVideoConsultation
                roomId={consultationId}
                pbName={pbName}
                clientId={clientId || undefined}
                userType={userType || "pb"}
                isPb={isPb}
                isGuest={isGuest}
                onEndConsultation={() => router.push(isPb ? "/pb-admin" : "/")}
                onParticipantJoined={(participant) => {
                  setParticipants((prev) => [...prev, participant]);
                }}
                onParticipantLeft={(participantId) => {
                  console.log("👤 참여자 퇴장:", participantId);

                  // 현재 사용자가 강제 퇴장당한 경우
                  if (participantId === getCurrentUserId()) {
                    console.log("🚫 본인이 강제 퇴장되었습니다.");
                    alert("강제 퇴장되었습니다.");
                    router.push("/");
                    return;
                  }

                  // 다른 참여자 퇴장 - 목록에서 제거
                  setParticipants((prev) =>
                    prev.filter((p) => p.id !== participantId)
                  );
                }}
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
          </div>

          {/* PB 관리 패널 (방의 주인일 때만 표시) */}
          {isRoomOwner && (
            <>
              {/* 관리 패널 토글 버튼 */}
              <div className="fixed top-20 right-4 z-50">
                <Button
                  onClick={() => setShowManagementPanel(!showManagementPanel)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-2" />방 관리
                </Button>
              </div>

              {/* 관리 패널 사이드바 */}
              <div
                className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 z-40 ${
                  showManagementPanel ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <div className="p-6 h-full flex flex-col">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      방 관리
                    </h2>
                    <Button
                      onClick={() => setShowManagementPanel(false)}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 초대 링크 섹션 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      고객 초대
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        아래 링크를 고객에게 공유하세요
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inviteUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-sm font-mono"
                        />
                        <Button
                          onClick={handleCopyInviteUrl}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {isCopied && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          클립보드에 복사되었습니다!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 참여자 목록 섹션 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      참여자 ({participants.length}명)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                participant.role === "PB"
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              {participant.role === "PB" ? "PB" : "G"}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {participant.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {participant.role} • {participant.joinedAt}
                              </p>
                            </div>
                          </div>
                          {participant.role !== "PB" && (
                            <Button
                              onClick={() =>
                                handleKickParticipant(participant.id)
                              }
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                              title="강제 퇴장"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 방 정보 */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>방 ID: {consultationId}</p>
                      <p>방 유형: PB 개별방</p>
                      <p>최대 참여자: 2명</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
