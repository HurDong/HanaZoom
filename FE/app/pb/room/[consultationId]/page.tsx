"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import VideoConsultation from "@/components/pb/VideoConsultation";
import PbRoomVideoConsultation from "@/components/pb/PbRoomVideoConsultation";
import Navbar from "@/app/components/Navbar";
import { useAuthStore } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Users,
  Settings,
  X,
  MessageSquare,
  PieChart,
} from "lucide-react";
import { getMyInfo } from "@/lib/api/members";
import { Client } from "@stomp/stompjs";
import ClientPortfolioView from "@/components/pb/ClientPortfolioView";

export default function ConsultationRoomPage() {
  const params = useParams<{ consultationId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { accessToken, getCurrentUserId } = useAuthStore();

  const originalConsultationId = params.consultationId;
  const clientName = sp.get("clientName") || "고객";
  const clientRegion = sp.get("clientRegion") || "지역 정보 없음";
  const pbNameFromUrl = sp.get("pbName") || "PB";
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
  const [actualPbName, setActualPbName] = useState(pbNameFromUrl);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showPortfolioView, setShowPortfolioView] = useState(false);
  const [actualClientId, setActualClientId] = useState<string | null>(null);

  // 채팅 관련 상태
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      message: string;
      senderId: string;
      senderName: string;
      userType: string;
      timestamp: number;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [chatStompClient, setChatStompClient] = useState<Client | null>(null);

  // 사용자 정보 가져오기 (PB인 경우)
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isPb && accessToken) {
        try {
          const userInfo = await getMyInfo();
          setActualPbName(userInfo.name);
          console.log("✅ PB 사용자 정보 가져오기 성공:", userInfo.name);
        } catch (error) {
          console.error("❌ PB 사용자 정보 가져오기 실패:", error);
          setActualPbName(pbNameFromUrl); // URL에서 가져온 값으로 fallback
        }
      }
    };

    fetchUserInfo();
  }, [isPb, accessToken, pbNameFromUrl]);

  // 초대 URL 생성
  useEffect(() => {
    if (isPbRoom && consultationId) {
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/pb/room/${consultationId}?type=pb-room&pbName=${encodeURIComponent(
        actualPbName
      )}&userType=guest`;
      setInviteUrl(inviteUrl);
    }
  }, [isPbRoom, consultationId, actualPbName]);

  // 채팅 WebSocket 연결
  useEffect(() => {
    if (consultationId && accessToken && showChatPanel) {
      connectChatWebSocket();
    }

    return () => {
      if (chatStompClient) {
        chatStompClient.deactivate();
      }
    };
  }, [consultationId, accessToken, showChatPanel]);

  // 채팅 WebSocket 연결 함수
  const connectChatWebSocket = () => {
    try {
      // 스토어에서 직접 토큰 가져오기
      const currentToken = useAuthStore.getState().accessToken;

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const wsUrl = apiBaseUrl.replace(/^http/, "ws") + "/ws/pb-room";

      console.log("🔌 채팅 WebSocket 연결 시도:", {
        consultationId,
        hasToken: !!currentToken,
        tokenPreview: currentToken
          ? currentToken.substring(0, 20) + "..."
          : "없음",
        brokerURL: wsUrl,
      });

      const client = new Client({
        brokerURL: wsUrl,
        connectHeaders: {
          Authorization: `Bearer ${currentToken}`,
        },
        debug: (str) => {
          console.log("🔍 채팅 STOMP Debug:", str);
        },
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame) => {
          console.log("✅ 채팅 WebSocket 연결 성공:", {
            frame,
            consultationId,
            subscriptionTopic: `/topic/pb-room/${consultationId}/chat`,
            sessionId: frame.headers["session-id"],
            server: frame.headers["server"],
          });
          setIsChatConnected(true);

          // 채팅 메시지 구독
          const subscription = client.subscribe(
            `/topic/pb-room/${consultationId}/chat`,
            (message) => {
              console.log("📥 채팅 메시지 수신 - Raw:", message);
              const data = JSON.parse(message.body);
              console.log("📥 채팅 메시지 수신 - Parsed:", data);

              // 백엔드에서 보내는 메시지 구조에 맞춰 처리
              const newMessage = {
                id: data.messageId || data.id || Date.now().toString(),
                message: data.message || data.content, // 백엔드에서 'message' 필드로 보냄
                senderId: data.senderId || "other",
                senderName: data.senderName || "사용자",
                userType: data.userType || "guest",
                timestamp: data.timestamp || Date.now(), // 백엔드에서 이미 timestamp로 보냄
              };

              console.log("📝 수신된 메시지를 상태에 추가:", newMessage);
              setChatMessages((prev) => {
                // 중복된 메시지가 있는지 확인
                const exists = prev.some((msg) => msg.id === newMessage.id);
                if (exists) {
                  console.log(
                    "⚠️ 중복된 메시지 감지, 추가하지 않음:",
                    newMessage.id
                  );
                  return prev;
                }
                const updated = [...prev, newMessage];
                console.log("📊 메시지 상태 업데이트:", {
                  before: prev.length,
                  after: updated.length,
                });
                return updated;
              });
            }
          );

          console.log("📡 채팅 구독 완료:", subscription);
        },
        onStompError: (frame) => {
          console.error("❌ 채팅 STOMP 오류:", frame);
          setIsChatConnected(false);
        },
        onWebSocketError: (error) => {
          console.error("❌ 채팅 WebSocket 오류:", error);
          setIsChatConnected(false);
        },
      });

      client.activate();
      setChatStompClient(client);
    } catch (error) {
      console.error("❌ 채팅 WebSocket 연결 실패:", error);
      setIsChatConnected(false);
    }
  };

  // 채팅 메시지 전송
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const messageText = chatInput.trim();
    const senderName = actualPbName || (isPb ? "PB" : "고객");
    const messageUserType = isPb ? "pb" : "guest";

    console.log("📤 채팅 메시지 전송 시도:", {
      messageText,
      senderName,
      messageUserType,
      isChatConnected,
      chatStompClient: !!chatStompClient,
      currentMessagesCount: chatMessages.length,
    });

    // 로컬 상태에 즉시 메시지 추가 (내가 보낸 메시지)
    const newMessage = {
      id: Date.now().toString(),
      message: messageText,
      senderId: "me",
      senderName: senderName,
      userType: messageUserType,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => {
      // 중복된 메시지가 있는지 확인
      const exists = prev.some((msg) => msg.id === newMessage.id);
      if (exists) {
        console.log(
          "⚠️ 중복된 로컬 메시지 감지, 추가하지 않음:",
          newMessage.id
        );
        return prev;
      }
      const updated = [...prev, newMessage];
      console.log("📝 로컬 메시지 상태 업데이트:", {
        before: prev.length,
        after: updated.length,
        newMessage,
      });
      return updated;
    });
    setChatInput("");

    // WebSocket으로 전송 (연결된 경우에만)
    if (chatStompClient && isChatConnected) {
      const messageData = {
        message: messageText, // 백엔드에서 'message' 필드를 찾고 있음
        senderName: senderName,
        userType: messageUserType,
        timestamp: new Date().toISOString(),
      };

      console.log("🌐 WebSocket으로 메시지 전송:", {
        messageData,
        destination: `/app/chat/${consultationId}/send`,
        clientConnected: chatStompClient.connected,
      });

      chatStompClient.publish({
        destination: `/app/chat/${consultationId}/send`,
        body: JSON.stringify(messageData),
      });

      console.log("✅ 메시지 전송 완료");

      // 테스트용 메시지도 전송
      chatStompClient.publish({
        destination: "/app/test",
        body: JSON.stringify({ test: "hello" }),
      });
      console.log("🧪 테스트 메시지도 전송");
    } else {
      console.log("⚠️ WebSocket 연결되지 않음 - 로컬에만 저장됨");
    }
  };

  // Enter 키로 메시지 전송
  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // PB가 방의 주인인지 확인
  useEffect(() => {
    if (isPb && accessToken) {
      // JWT 토큰에서 사용자 정보 확인하여 방의 주인인지 판단
      // 실제로는 백엔드 API를 호출해야 하지만, 여기서는 간단히 userType으로 판단
      setIsRoomOwner(userType === "pb");
    }
  }, [isPb, accessToken, userType]);

  // 고객 입장 처리
  const handleGuestJoin = useCallback(async () => {
    try {
      console.log("🎯 고객 입장 처리 시작:", consultationId);

      // 스토어에서 직접 토큰 가져오기
      const currentToken = useAuthStore.getState().accessToken;
      console.log("🔑 Access Token:", currentToken ? "있음" : "없음");
      console.log("🔍 API 호출 정보:", {
        url: `/api/pb-rooms/${consultationId}/join`,
        consultationId,
        method: "POST",
      });

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // 토큰이 있는 경우에만 Authorization 헤더 추가
      if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
      }

      console.log("📡 요청 헤더:", headers);
      console.log("📡 요청 본문:", {
        consultationId: consultationId,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(`/api/pb-rooms/${consultationId}/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          consultationId: consultationId,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log("📡 응답 상태:", response.status, response.statusText);
      console.log(
        "📡 응답 헤더:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            console.log("✅ 고객 입장 성공:", data);
          } else {
            console.error("❌ 고객 입장 실패:", data.error);
          }
        } catch (jsonError) {
          console.log("✅ 고객 입장 성공 (JSON 파싱 없음)");
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
          };
        }

        console.error("❌ 고객 입장 API 오류:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          url: `/api/pb-rooms/${consultationId}/join`,
          method: "POST",
          consultationId: consultationId,
          hasToken: !!currentToken,
        });

        // 사용자에게 친화적인 에러 메시지 표시
        if (response.status === 401) {
          console.error("🔐 인증 실패 - 로그인이 필요합니다");
          alert("로그인이 필요합니다. 다시 로그인해주세요.");
        } else if (response.status === 404) {
          console.error("🔍 방을 찾을 수 없습니다");
          alert("존재하지 않는 방입니다.");
        } else if (response.status === 403) {
          console.error("🚫 접근 권한이 없습니다 - 백엔드 보안 설정 확인 필요");
          console.error(
            "💡 해결 방법: SecurityConfig.java에서 /api/pb-rooms/*/join 경로를 permitAll()로 설정"
          );
          alert("접근 권한이 없습니다. 관리자에게 문의하세요.");
        } else {
          console.error("❌ 서버 오류:", response.status);
          alert(`서버 오류가 발생했습니다: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("❌ 고객 입장 중 오류:", error);
    }
  }, [consultationId, accessToken, isGuest, isRoomOwner, userType]);

  // 참여자 목록 가져오기 및 고객 입장 처리
  useEffect(() => {
    const zustandState = useAuthStore.getState();
    console.log("🔍 useEffect 실행:", {
      consultationId,
      isGuest,
      isRoomOwner,
      userType,
      accessToken: accessToken ? "있음" : "없음",
    });
    console.log("🔍 Zustand 스토어 상태:", {
      accessToken: zustandState.accessToken ? "있음" : "없음",
      user: zustandState.user ? "있음" : "없음",
      hasUser: !!zustandState.user,
      userId: zustandState.user?.id,
    });

    // 하이드레이션 상태 확인
    const hasHydrated = useAuthStore.persist?.hasHydrated();
    console.log("🔍 하이드레이션 상태:", hasHydrated);

    // 하이드레이션이 완료되지 않았다면 대기
    if (!hasHydrated) {
      console.log("⏳ 하이드레이션 대기 중...");
      return;
    }

    if (consultationId) {
      // 고객이 입장하는 경우 - 로그인 필수
      if (isGuest) {
        // 스토어에서 직접 토큰 가져오기
        const currentToken = zustandState.accessToken;
        if (!currentToken) {
          console.log(
            "🚫 고객 입장 시 로그인 필요 - 로그인 페이지로 리다이렉트"
          );
          alert("화상상담에 참여하려면 로그인이 필요합니다.");
          router.push("/login");
          return;
        }
        console.log("🎯 고객 입장 감지 - API 호출 시작");
        handleGuestJoin();
      }

      // PB인 경우 초기 참여자 목록 설정 (accessToken이 있을 때만)
      if (isRoomOwner && accessToken) {
        console.log("👑 PB 방 주인 - 참여자 목록 설정");
        setParticipants([
          {
            id: getCurrentUserId() || "pb-user",
            name: actualPbName,
            role: "PB",
            joinedAt: new Date().toLocaleTimeString(),
          },
        ]);
      }
    }
  }, [
    consultationId,
    accessToken,
    isGuest,
    isRoomOwner,
    actualPbName,
    getCurrentUserId,
    handleGuestJoin,
    router,
  ]);

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
    <div className="h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* Navbar */}
      <Navbar />

      {/* 상단 헤더 - 회의방 정보 및 상태 */}
      <div className="absolute top-16 left-0 right-0 z-[100] bg-gradient-to-r from-emerald-600/95 via-green-600/95 to-emerald-700/95 backdrop-blur-md border-b border-emerald-500/30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-3 h-3 bg-white/90 rounded-full animate-pulse flex-shrink-0 shadow-sm"></div>
              <h1 className="text-sm md:text-lg font-semibold text-white truncate drop-shadow-sm">
                {isPbRoom ? `${actualPbName}의 상담방` : "화상 상담"}
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm text-white/90">
              <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                <Users className="w-4 h-4" />
                <span>{participants.length}명 참여</span>
              </span>
              <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                <span>연결됨</span>
              </span>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 포트폴리오 조회 버튼 (PB만 표시) */}
            {isRoomOwner && (
              <button
                onClick={() => setShowPortfolioView(!showPortfolioView)}
                className={`relative w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 backdrop-blur-sm rounded-full md:rounded-lg transition-all duration-200 flex items-center justify-center group ${
                  showPortfolioView
                    ? "bg-white/30 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                <PieChart className="w-4 h-4 md:mr-2 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden md:inline font-medium">포트폴리오</span>
              </button>
            )}

            {/* 채팅 토글 버튼 */}
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className={`relative w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 backdrop-blur-sm rounded-full md:rounded-lg transition-all duration-200 flex items-center justify-center group ${
                showChatPanel
                  ? "bg-white/30 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 md:mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden md:inline font-medium">채팅</span>
            </button>

            {/* PB 관리 버튼 */}
            {isRoomOwner && (
              <button
                onClick={() => setShowManagementPanel(!showManagementPanel)}
                className={`relative w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 backdrop-blur-sm rounded-full md:rounded-lg transition-all duration-200 flex items-center justify-center group ${
                  showManagementPanel
                    ? "bg-white/30 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                <Settings className="w-4 h-4 md:mr-2 group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden md:inline font-medium">방 관리</span>
              </button>
            )}
          </div>
        </div>

        {/* 모바일용 상태 정보 */}
        <div className="md:hidden px-4 pb-2">
          <div className="flex items-center space-x-4 text-xs text-white/90">
            <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <Users className="w-3 h-3" />
              <span>{participants.length}명 참여</span>
            </span>
            <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-white/90 rounded-full"></div>
              <span>연결됨</span>
            </span>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <main className="h-full pt-32 md:pt-36">
        <div className="flex h-full">
          {/* 메인 화상상담 영역 */}
          <div
            className={`flex-1 transition-all duration-300 ${
              showChatPanel ? "mr-0 md:mr-80" : ""
            } ${isRoomOwner && showManagementPanel ? "mr-0 md:mr-80" : ""}`}
          >
            {isPbRoom ? (
              <PbRoomVideoConsultation
                roomId={consultationId}
                pbName={actualPbName}
                clientId={clientId || undefined}
                userType={userType || "pb"}
                isPb={isPb}
                isGuest={isGuest}
                onEndConsultation={() => router.push(isPb ? "/pb-admin" : "/")}
                onParticipantJoined={(participant) => {
                  console.log("👤 참여자 입장:", participant);

                  // 고객이 입장한 경우 clientId 업데이트
                  if (participant.role === "GUEST") {
                    console.log(
                      "🎯 고객 입장 감지 - clientId 업데이트:",
                      participant.id
                    );
                    setActualClientId(participant.id);
                  }

                  setParticipants((prev) => {
                    // 중복된 참여자가 있는지 확인
                    const exists = prev.some((p) => p.id === participant.id);
                    if (exists) {
                      console.log(
                        "⚠️ 중복된 참여자 감지, 추가하지 않음:",
                        participant.id
                      );
                      return prev;
                    }
                    return [...prev, participant];
                  });
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
                pbName={actualPbName}
                clientId={clientId || undefined}
                onEndConsultation={() => router.push("/pb-admin")}
              />
            )}
          </div>

          {/* 채팅 패널 */}
          <div
            className={`fixed top-32 md:top-36 right-0 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] w-full md:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 z-40 border-l border-emerald-200/30 dark:border-emerald-700/30 ${
              showChatPanel ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-4 md:p-6 h-full flex flex-col">
              {/* 채팅 헤더 */}
              <div className="mb-4 md:mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    채팅
                  </h2>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isChatConnected
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {isChatConnected ? "연결됨" : "연결 안됨"}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  실시간 메시지 공유
                </p>
              </div>

              {/* 채팅 메시지 영역 */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4 overflow-y-auto">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm">아직 메시지가 없습니다.</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        채팅을 시작해보세요!
                      </p>
                    </div>
                  ) : (
                    (() => {
                      console.log("📋 채팅 메시지 렌더링:", {
                        messagesCount: chatMessages.length,
                        messages: chatMessages,
                      });
                      return chatMessages.map((msg, index) => (
                        <div
                          key={`${msg.id}-${index}`}
                          className="flex flex-col space-y-1"
                        >
                          <div
                            className={`flex ${
                              msg.userType === "pb"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                                msg.userType === "pb"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                          <div
                            className={`flex ${
                              msg.userType === "pb"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              {msg.senderName} •{" "}
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>

              {/* 채팅 입력 영역 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="메시지를 입력하세요..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  disabled={!isChatConnected}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!isChatConnected || !chatInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                >
                  전송
                </button>
              </div>
            </div>
          </div>

          {/* PB 관리 패널 (방의 주인일 때만 표시) */}
          {isRoomOwner && (
            <div
              className={`fixed top-32 md:top-36 right-0 h-[calc(100vh-8rem)] md:h-[calc(100vh-9rem)] w-full md:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 z-50 border-l border-emerald-200/30 dark:border-emerald-700/30 ${
                showManagementPanel ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="p-4 md:p-6 h-full flex flex-col">
                {/* 헤더 */}
                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    방 관리
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    고객 초대 및 참여자 관리
                  </p>
                </div>

                {/* 초대 링크 섹션 */}
                <div className="mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 flex items-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    고객 초대
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      아래 링크를 고객에게 공유하세요
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inviteUrl}
                        readOnly
                        className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-xs md:text-sm font-mono"
                      />
                      <Button
                        onClick={handleCopyInviteUrl}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white px-2 md:px-3"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 md:w-4 md:h-4" />
                        ) : (
                          <Copy className="w-3 h-3 md:w-4 md:h-4" />
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
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                    참여자 ({participants.length}명)
                  </h3>
                  <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                    {participants.map((participant, index) => (
                      <div
                        key={`${participant.id}-${index}`}
                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              participant.role === "PB"
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {participant.role === "PB" ? "PB" : "G"}
                          </div>
                          <div>
                            <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-colors p-1 md:p-2"
                            title="강제 퇴장"
                          >
                            <X className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 방 정보 */}
                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>방 ID: {consultationId}</p>
                    <p>방 유형: PB 개별방</p>
                    <p>최대 참여자: 2명</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 고객 포트폴리오 조회 모달 */}
      <ClientPortfolioView
        clientId={actualClientId || clientId || ""}
        clientName={clientName}
        isVisible={showPortfolioView}
        onClose={() => setShowPortfolioView(false)}
      />
    </div>
  );
}
