"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Users, Wifi, WifiOff } from "lucide-react";
import { getAccessToken, refreshAccessToken } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  type: string;
  messageType: string;
  memberName: string;
  content: string;
  createdAt: string;
}

interface RegionChatProps {
  regionId: number;
  regionName: string;
}

type WebSocketReadyState = "connecting" | "open" | "closed";

export default function RegionChat({ regionId, regionName }: RegionChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [readyState, setReadyState] = useState<WebSocketReadyState>("closed");
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUnmounting = useRef(false);
  const receivedMessageIds = useRef(new Set<string>());
  const isClosing = useRef(false);
  const lastActionTimestamp = useRef<Record<string, number>>({});
  const ACTION_DEBOUNCE_MS = 2000; // 동일 액션 간 최소 간격

  const isActionAllowed = (action: string) => {
    const now = Date.now();
    const lastTime = lastActionTimestamp.current[action] || 0;

    if (now - lastTime >= ACTION_DEBOUNCE_MS) {
      lastActionTimestamp.current[action] = now;
      return true;
    }
    return false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }
  };

  const closeWebSocket = useCallback(() => {
    if (!ws.current || isClosing.current || !isActionAllowed("close")) {
      return;
    }

    isClosing.current = true;
    try {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onerror = null;
      ws.current.onclose = null;

      if (
        ws.current.readyState === WebSocket.OPEN ||
        ws.current.readyState === WebSocket.CONNECTING
      ) {
        ws.current.close();
      }
    } finally {
      ws.current = null;
      isClosing.current = false;
      setReadyState("closed");
    }
  }, []);

  const connectWebSocket = useCallback(
    async (token: string | null) => {
      if (ws.current || !isActionAllowed("connect")) {
        return;
      }

      if (!token) {
        console.error("No token provided for WebSocket connection");
        return;
      }

      if (isUnmounting.current) return;

      closeWebSocket();
      clearReconnectTimeout();

      try {
        setReadyState("connecting");
        await new Promise((resolve) => setTimeout(resolve, 500)); // 연결 시도 전 잠시 대기

        const socket = new WebSocket(
          `ws://localhost:8080/ws/chat/region?token=${token}`
        );
        ws.current = socket;

        socket.onopen = () => {
          if (isUnmounting.current || ws.current !== socket) return;
          console.log("채팅방 연결됨");
          setReadyState("open");
          reconnectAttempts.current = 0;
        };

        socket.onmessage = (event) => {
          if (isUnmounting.current || ws.current !== socket) return;

          try {
            const data = JSON.parse(event.data);

            if (receivedMessageIds.current.has(data.id)) {
              return;
            }
            receivedMessageIds.current.add(data.id);

            // 메시지 ID Set 크기 제한 (메모리 관리)
            if (receivedMessageIds.current.size > 1000) {
              const oldIds = Array.from(receivedMessageIds.current).slice(
                0,
                500
              );
              receivedMessageIds.current = new Set(oldIds);
            }

            const receivedMessage: ChatMessage = {
              id: data.id,
              type: data.type,
              messageType: data.messageType,
              memberName: data.memberName,
              content: data.content,
              createdAt: data.createdAt,
            };

            switch (data.type) {
              case "WELCOME":
                setMessages([receivedMessage]);
                setOnlineUsers(data.users || []);
                break;
              case "CHAT":
                setMessages((prev) => [...prev, receivedMessage]);
                break;
              case "ENTER":
                // 입장 메시지 처리 전 잠시 대기
                setTimeout(() => {
                  setMessages((prev) => [...prev, receivedMessage]);
                  setOnlineUsers((prev) =>
                    [...prev, data.memberName].filter(
                      (v, i, a) => a.indexOf(v) === i
                    )
                  );
                }, 100);
                break;
              case "LEAVE":
                // 퇴장 메시지 처리 전 잠시 대기
                setTimeout(() => {
                  setMessages((prev) => [...prev, receivedMessage]);
                  setOnlineUsers((prev) =>
                    prev.filter((user) => user !== data.memberName)
                  );
                }, 100);
                break;
              default:
                console.warn("알 수 없는 메시지 타입:", data.type);
            }
          } catch (error) {
            console.error("메시지 파싱 오류:", error);
          }
        };

        socket.onclose = (event) => {
          if (isUnmounting.current || ws.current !== socket) return;

          console.log("채팅방 연결 종료", event.code, event.reason);
          setReadyState("closed");
          ws.current = null;

          if (reconnectAttempts.current < 5 && isActionAllowed("reconnect")) {
            reconnectAttempts.current += 1;
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts.current - 1),
              10000
            );
            console.log(`${delay}ms 후 재연결 시도...`);
            reconnectTimeoutId.current = setTimeout(() => {
              initializeWebSocket();
            }, delay);
          } else {
            setError(
              "채팅방 연결이 종료되었습니다. 페이지를 새로고침해주세요."
            );
          }
        };

        socket.onerror = (error) => {
          if (isUnmounting.current || ws.current !== socket) return;
          console.error("WebSocket 오류:", error);
          setReadyState("closed");
        };
      } catch (error) {
        if (isUnmounting.current) return;
        console.error("WebSocket 연결 실패:", error);
        setReadyState("closed");
      }
    },
    [closeWebSocket]
  );

  const initializeWebSocket = useCallback(async () => {
    // 이미 연결되어 있거나 연결 중인 경우 중복 실행 방지
    if (ws.current) {
      return;
    }

    try {
      let token = getAccessToken();
      if (!token) {
        console.log("Token not found, refreshing...");
        token = await refreshAccessToken();
      }
      if (!isUnmounting.current) {
        connectWebSocket(token);
      }
    } catch (error) {
      if (!isUnmounting.current) {
        console.error("Failed to initialize WebSocket:", error);
        setError(
          "채팅 서버에 연결할 수 없습니다. 로그인 상태를 확인하고 페이지를 새로고침해주세요."
        );
      }
    }
  }, [connectWebSocket]);

  useEffect(() => {
    isUnmounting.current = false;
    isClosing.current = false;

    // 페이지 가시성 변화 감지
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨질 때 (탭 전환 등)
        closeWebSocket();
      } else {
        // 페이지가 다시 보일 때
        if (!ws.current && !isClosing.current) {
          initializeWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    initializeWebSocket();

    return () => {
      isUnmounting.current = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearReconnectTimeout();
      closeWebSocket();
      receivedMessageIds.current.clear();
    };
  }, [initializeWebSocket, closeWebSocket]);

  const sendMessage = () => {
    if (
      !newMessage.trim() ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    ws.current.send(JSON.stringify({ content: newMessage }));
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getMessageTypeColor = (messageType: string) => {
    switch (messageType) {
      case "ENTER":
        return "text-green-600 dark:text-green-400";
      case "LEAVE":
        return "text-red-600 dark:text-red-400";
      case "CHAT":
        return "text-gray-800 dark:text-gray-200";
      default:
        return "text-gray-800 dark:text-gray-200";
    }
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">연결 오류</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <Card className="w-full h-[500px] flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">{regionName} 채팅방</span>
            <div className="flex items-center space-x-2 text-sm">
              {readyState === "open" ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span>
                {readyState === "connecting"
                  ? "연결 중..."
                  : readyState === "open"
                  ? "연결됨"
                  : "연결 끊김"}
              </span>
              <Users className="w-4 h-4 ml-2" />
              <span>{onlineUsers.length}</span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 bg-gray-50 dark:bg-gray-900 rounded">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="font-medium">{message.memberName}</span>
                  <span>{formatTime(message.createdAt)}</span>
                </div>
                <div
                  className={`text-sm ${getMessageTypeColor(
                    message.messageType
                  )}`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex space-x-2 shrink-0">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={readyState !== "open"}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || readyState !== "open"}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full p-4 space-y-2">
        <h3 className="font-semibold text-lg">채팅방 이용 안내</h3>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <li>• 모든 채팅 내용은 실시간으로 저장되며 모니터링됩니다.</li>
          <li>• 투자 정보와 지역 소식을 공유해보세요.</li>
          <li>• 건전한 대화 문화를 만들어가요.</li>
          <li>• 부적절한 언어 사용이나 광고성 게시글은 제재될 수 있습니다.</li>
          <li>• 채팅방 연결이 끊긴 경우 자동으로 재연결을 시도합니다.</li>
        </ul>
      </Card>
      <div>
        <h4 className="font-semibold">참여자 목록 ({onlineUsers.length}명)</h4>
        <div className="text-sm text-gray-500">{onlineUsers.join(", ")}</div>
      </div>
    </div>
  );
}
