"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  Users,
  Wifi,
  WifiOff,
  ChevronDown,
  Info,
  Smile,
  Paperclip,
  Image,
  AtSign,
  X,
} from "lucide-react";
import { getAccessToken, refreshAccessToken } from "@/app/utils/auth";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUnmounting = useRef(false);
  const receivedMessageIds = useRef(new Set<string>());
  const isClosing = useRef(false);
  const lastActionTimestamp = useRef<Record<string, number>>({});
  const ACTION_DEBOUNCE_MS = 2000; // 동일 액션 간 최소 간격
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
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
      <Card className="w-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex flex-col space-y-3">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">{regionName}</span>
                <Badge variant="outline" className="ml-2">
                  채팅방
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsGuideOpen(!isGuideOpen)}
                >
                  <Info
                    className={`h-4 w-4 transition-colors ${
                      isGuideOpen ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </Button>
                <div className="text-sm">
                  {readyState === "open" ? (
                    <Badge
                      variant="secondary"
                      className="flex items-center space-x-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    >
                      <Wifi className="w-3 h-3" />
                      <span>연결됨</span>
                    </Badge>
                  ) : readyState === "connecting" ? (
                    <Badge
                      variant="secondary"
                      className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    >
                      <span className="animate-spin">⌛</span>
                      <span>연결 중...</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="flex items-center space-x-1"
                    >
                      <WifiOff className="w-3 h-3" />
                      <span>연결 끊김</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 이용 안내 */}
            <Collapsible
              open={isGuideOpen}
              onOpenChange={setIsGuideOpen}
              className="w-full"
            >
              <CollapsibleContent className="space-y-2">
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="font-medium">채팅방 이용 안내</span>
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground text-xs pl-6">
                    <li>
                      • 모든 채팅 내용은 실시간으로 저장되며 모니터링됩니다.
                    </li>
                    <li>• 투자 정보와 지역 소식을 공유해보세요.</li>
                    <li>• 건전한 대화 문화를 만들어가요.</li>
                    <li>
                      • 부적절한 언어 사용이나 광고성 게시글은 제재될 수
                      있습니다.
                    </li>
                    <li>
                      • 채팅방 연결이 끊긴 경우 자동으로 재연결을 시도합니다.
                    </li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 참여자 목록 토글 */}
            <Collapsible
              open={isUserListOpen}
              onOpenChange={setIsUserListOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between hover:bg-accent"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>실시간 참여자</span>
                    <Badge variant="secondary" className="ml-2">
                      {onlineUsers.length}명
                    </Badge>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isUserListOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-24 rounded-lg border bg-muted/50 p-2">
                  <div className="flex flex-wrap gap-2">
                    {onlineUsers.sort().map((user) => (
                      <Badge
                        key={user}
                        variant="secondary"
                        className="text-xs bg-background hover:bg-accent transition-colors"
                      >
                        {user}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="my-1" />
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 min-h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 bg-background/50 rounded-lg">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isSameUser =
                  index > 0 &&
                  messages[index - 1].memberName === message.memberName;
                const showHeader =
                  !isSameUser ||
                  new Date(message.createdAt).getTime() -
                    new Date(messages[index - 1].createdAt).getTime() >
                    300000;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${
                      message.messageType === "SYSTEM" ||
                      message.messageType === "WELCOME" ||
                      message.messageType === "ENTER" ||
                      message.messageType === "LEAVE"
                        ? "items-center"
                        : "items-start"
                    }`}
                  >
                    {showHeader &&
                      message.messageType !== "SYSTEM" &&
                      message.messageType !== "WELCOME" &&
                      message.messageType !== "ENTER" &&
                      message.messageType !== "LEAVE" && (
                        <div className="flex items-center space-x-2 text-xs mb-1">
                          <span className="font-semibold text-foreground/80">
                            {message.memberName}
                          </span>
                        </div>
                      )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          className={`group relative flex items-end ${
                            !showHeader && "ml-4"
                          }`}
                        >
                          <div
                            className={`text-sm p-3 break-words ${
                              message.messageType === "SYSTEM"
                                ? "bg-muted/60 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[90%] text-xs"
                                : message.messageType === "WELCOME" ||
                                  message.messageType === "ENTER" ||
                                  message.messageType === "LEAVE"
                                ? "bg-muted/40 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[90%] text-xs"
                                : "bg-primary/10 hover:bg-primary/15 dark:bg-primary/20 dark:hover:bg-primary/25 text-foreground rounded-2xl max-w-[85%] transition-colors cursor-pointer"
                            }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </DropdownMenuTrigger>
                      {message.messageType !== "SYSTEM" &&
                        message.messageType !== "WELCOME" &&
                        message.messageType !== "ENTER" &&
                        message.messageType !== "LEAVE" && (
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(message.content)
                              }
                            >
                              복사하기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setSelectedMessage(message.id)}
                            >
                              답장하기
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {isTyping && (
            <div className="text-xs text-muted-foreground mb-2 ml-2">
              누군가 입력하고 있습니다...
            </div>
          )}

          <div className="flex items-center space-x-2 shrink-0 pt-3 border-t">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                /* TODO: Add emoji picker */
              }}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                /* TODO: Add file upload */
              }}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => {
                /* TODO: Add image upload */
              }}
            >
              <Image className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="flex-1 relative">
              {selectedMessage && (
                <div className="absolute -top-8 left-0 right-0 bg-muted/50 text-xs p-1 rounded flex items-center justify-between">
                  <span className="truncate">
                    답장:{" "}
                    {messages.find((m) => m.id === selectedMessage)?.content}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 hover:bg-transparent"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={readyState !== "open"}
                className="pr-20 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
              <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-transparent"
                  onClick={() => {
                    /* TODO: Add mention */
                  }}
                >
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || readyState !== "open"}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-transparent"
                >
                  <Send
                    className={`h-4 w-4 ${
                      newMessage.trim()
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
