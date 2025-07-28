"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Users } from "lucide-react";
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

export default function RegionChat({ regionId, regionName }: RegionChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const isReconnecting = useRef(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUnmounting = useRef(false);

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
    if (ws.current) {
      ws.current.onclose = null; // 정상 종료 시에는 재연결 시도하지 않음
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const connectWebSocket = useCallback(
    async (token: string | null) => {
      const handleReconnect = async () => {
        if (
          isUnmounting.current ||
          isReconnecting.current ||
          reconnectAttempts.current >= 5
        )
          return;

        isReconnecting.current = true;
        reconnectAttempts.current += 1;

        try {
          let token = getAccessToken();
          if (!token) {
            token = await refreshAccessToken();
          }

          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current - 1),
            10000
          );
          console.log(
            `${delay}ms 후 재연결 시도... (시도 ${reconnectAttempts.current}/5)`
          );

          clearReconnectTimeout();
          reconnectTimeoutId.current = setTimeout(() => {
            if (!isUnmounting.current) {
              connectWebSocket(token);
            }
          }, delay);
        } catch (error) {
          if (isUnmounting.current) return;

          console.error("재연결 실패:", error);
          isReconnecting.current = false;

          if (reconnectAttempts.current >= 5) {
            router.push("/login");
          }
        }
      };

      if (!token) {
        console.error("No token provided for WebSocket connection");
        return;
      }

      if (isUnmounting.current) return;

      if (ws.current?.readyState === WebSocket.OPEN) {
        console.log("WebSocket이 이미 연결되어 있습니다.");
        return;
      }

      closeWebSocket();
      clearReconnectTimeout();

      try {
        const socket = new WebSocket(
          `ws://localhost:8080/ws/chat/region?token=${token}`
        );

        socket.onopen = () => {
          if (isUnmounting.current) {
            socket.close();
            return;
          }
          console.log("채팅방 연결됨");
          setIsConnected(true);
          isReconnecting.current = false;
          reconnectAttempts.current = 0;
          ws.current = socket;
        };

        socket.onmessage = (event) => {
          if (isUnmounting.current) return;

          try {
            const data = JSON.parse(event.data);
            const newMessage: ChatMessage = {
              id: data.id,
              type: data.type,
              messageType: data.messageType,
              memberName: data.memberName,
              content: data.content,
              createdAt: data.createdAt,
            };

            setMessages((prev) => {
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          } catch (error) {
            console.error("메시지 파싱 오류:", error);
          }
        };

        socket.onclose = (event) => {
          if (isUnmounting.current) return;

          console.log("채팅방 연결 종료", event.code, event.reason);
          setIsConnected(false);
          ws.current = null;

          if (
            !isUnmounting.current &&
            !isReconnecting.current &&
            reconnectAttempts.current < 5
          ) {
            handleReconnect();
          }
        };

        socket.onerror = (error) => {
          if (isUnmounting.current) return;

          console.error("WebSocket 오류:", error);
          setIsConnected(false);
        };
      } catch (error) {
        if (isUnmounting.current) return;

        console.error("WebSocket 연결 실패:", error);
        setIsConnected(false);
      }
    },
    [closeWebSocket, router]
  );

  useEffect(() => {
    isUnmounting.current = false;

    const initializeWebSocket = async () => {
      try {
        let token = getAccessToken();
        if (!token) {
          console.log("Token not found, refreshing...");
          try {
            token = await refreshAccessToken();
          } catch (error) {
            throw new Error("Failed to refresh token");
          }
        }

        if (!token) {
          throw new Error("No valid token available");
        }

        if (!isUnmounting.current) {
          console.log("Connecting with token");
          connectWebSocket(token);
        }
      } catch (error) {
        if (!isUnmounting.current) {
          console.error("Failed to initialize WebSocket:", error);
          router.push("/login");
        }
      }
    };

    initializeWebSocket();

    return () => {
      isUnmounting.current = true;
      clearReconnectTimeout();
      closeWebSocket();
    };
  }, [regionId, router, connectWebSocket, closeWebSocket]);

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

  return (
    <div className="flex flex-col space-y-4">
      <Card className="w-full h-[500px] flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg font-semibold">{regionName} 채팅방</span>
            <div className="flex items-center space-x-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span>{isConnected ? "연결됨" : "연결 끊김"}</span>
              <Users className="w-4 h-4 ml-2" />
              <span>{onlineUsers}</span>
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
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
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
    </div>
  );
}
