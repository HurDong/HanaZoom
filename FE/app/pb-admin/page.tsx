"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PBConsultationDashboard from "@/components/pb/PBConsultationDashboard";
import Navbar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { useAuthStore } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { getMyInfo } from "@/lib/api/members";

export default function PBAdminPage() {
  const router = useRouter();
  const { accessToken, getCurrentUserId } = useAuthStore();
  const [pbId, setPbId] = useState<string>("");
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("PB");

  // 실제로는 인증된 사용자의 PB ID를 가져와야 함
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    console.log("🔍 현재 사용자 ID:", currentUserId);
    console.log("🔍 JWT 토큰:", accessToken ? "존재함" : "없음");

    // UUID 형식 검증
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (currentUserId && uuidPattern.test(currentUserId)) {
      console.log("✅ 유효한 UUID 사용자 ID:", currentUserId);
      setPbId(currentUserId);
    } else {
      // UUID가 아닌 경우 강제로 유효한 UUID 사용
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      console.warn("⚠️ UUID가 아닌 사용자 ID입니다:", currentUserId);
      console.warn("🔧 유효한 UUID로 강제 변경:", validUuid);
      setPbId(validUuid);
    }
  }, [getCurrentUserId, accessToken]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (accessToken) {
        try {
          const userInfo = await getMyInfo();
          setUserName(userInfo.name);
          console.log("✅ 사용자 정보 가져오기 성공:", userInfo.name);
        } catch (error) {
          console.error("❌ 사용자 정보 가져오기 실패:", error);
          setUserName("PB"); // 기본값으로 설정
        }
      }
    };

    fetchUserInfo();
  }, [accessToken]);

  const handleStartConsultation = async (consultation: any) => {
    console.log("화상상담 시작 요청:", consultation);
    console.log("🔍 현재 pbId:", pbId);
    console.log("🔍 현재 accessToken:", accessToken ? "존재함" : "없음");

    try {
      // 새로운 WebRTC 시스템으로 화상상담 시작
      console.log("🆕 화상상담 방 생성 중...");
      const response = await fetch("/api/pb-rooms/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const roomId = data.roomId;
          const inviteUrl = data.inviteUrl;
          console.log("화상상담 방 생성 성공:", roomId);
          console.log("초대 URL:", inviteUrl);

          // 고객용 초대 URL 생성 (기존 page.tsx 사용)
          const customerInviteUrl = `${
            window.location.origin
          }/pb/room/${roomId}?type=pb-room&pbName=${encodeURIComponent(
            userName
          )}&userType=guest`;
          setInviteUrl(customerInviteUrl);

          // 클립보드에 초대 URL 복사
          try {
            await navigator.clipboard.writeText(customerInviteUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 3000); // 3초 후 복사 상태 초기화
          } catch (clipboardError) {
            console.error("클립보드 복사 실패:", clipboardError);
          }

          // 화상상담방으로 이동 (기존 page.tsx 사용)
          router.push(
            `/pb/room/${roomId}?type=pb-room&pbName=${encodeURIComponent(
              userName
            )}&userType=pb`
          );
        } else {
          console.error("화상상담 방 생성 실패:", data.message);
          alert("화상상담 방 생성에 실패했습니다: " + data.message);
        }
      } else {
        const errorData = await response.json();
        console.error("화상상담 방 생성 API 오류:", errorData);
        alert(
          "화상상담 방 생성에 실패했습니다: " +
            (errorData.error || "알 수 없는 오류")
        );
      }
    } catch (error) {
      console.error("화상상담 방 생성 중 오류:", error);
      alert("화상상담 방 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols (사용자 설정에 따라) */}
      <FloatingEmojiBackground />

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>

      {/* Mouse Follower */}
      <MouseFollower />

      {/* Main Content */}
      <main className="relative z-10 pt-16">
        {pbId && (
          <div className="container mx-auto px-4 py-8">
            {/* 초대 URL 표시 */}
            {inviteUrl && (
              <div className="mb-8">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    🎉 방이 생성되었습니다!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    아래 URL을 고객에게 공유하세요. (자동으로 클립보드에
                    복사되었습니다)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(inviteUrl);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 3000);
                        } catch (error) {
                          console.error("복사 실패:", error);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          복사
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <PBConsultationDashboard
              pbId={pbId}
              onStartConsultation={handleStartConsultation}
            />
          </div>
        )}
      </main>
    </div>
  );
}
