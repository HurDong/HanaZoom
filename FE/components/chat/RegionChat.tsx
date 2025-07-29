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
import EmojiPicker from "./EmojiPicker";
import StockMention from "./StockMention";

interface ChatMessage {
  id: string;
  type: string;
  messageType: string;
  memberName: string;
  content: string;
  createdAt: string;
  showHeader?: boolean; // 서버에서 보내는 추가 정보
  senderId?: string; // 현재 사용자 식별용
  isMyMessage?: boolean; // 내가 보낸 메시지 여부
}

interface RegionChatProps {
  regionId: number;
  regionName: string;
}

type WebSocketReadyState = "connecting" | "open" | "closed";

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const CONNECTION_TIMEOUT = 5000;

// WebSocket 상태 코드에 대한 설명
const WS_CLOSE_CODES: Record<number, string> = {
  1000: "정상 종료",
  1001: "서버 종료",
  1002: "프로토콜 에러",
  1003: "잘못된 데이터",
  1005: "예약됨",
  1006: "비정상 종료",
  1007: "잘못된 메시지 형식",
  1008: "정책 위반",
  1009: "메시지가 너무 큼",
  1010: "확장 기능 누락",
  1011: "예상치 못한 서버 에러",
  1015: "TLS 핸드셰이크 실패",
};

export default function RegionChat({ regionId, regionName }: RegionChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [readyState, setReadyState] = useState<
    "connecting" | "open" | "closed"
  >("closed");
  const [error, setError] = useState<string | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectionTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  const isClosing = useRef(false);
  const lastActionTimestamp = useRef<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const receivedMessageIds = useRef(new Set<string>());
  const ACTION_DEBOUNCE_MS = 2000; // 동일 액션 간 최소 간격
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);

  const isActionAllowed = useCallback((action: string) => {
    const now = Date.now();
    const lastTime = lastActionTimestamp.current[action] || 0;
    if (now - lastTime < ACTION_DEBOUNCE_MS) {
      return false;
    }
    lastActionTimestamp.current[action] = now;
    return true;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const closeWebSocket = useCallback(() => {
    if (isClosing.current || !ws.current) return;

    isClosing.current = true;
    try {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    } catch (err) {
      console.error("Error closing WebSocket:", err);
    } finally {
      isClosing.current = false;
      setReadyState("closed");
    }
  }, []);

  const connectWebSocket = useCallback(
    async (token: string | null) => {
      if (!token || !isActionAllowed("connect")) return;

      if (ws.current?.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        return;
      }

      try {
        closeWebSocket();
        setReadyState("connecting");
        setError(null);

        // Clear any existing timeouts
        if (reconnectTimeoutId.current) {
          clearTimeout(reconnectTimeoutId.current);
        }
        if (connectionTimeoutId.current) {
          clearTimeout(connectionTimeoutId.current);
        }

        // Set connection timeout
        connectionTimeoutId.current = setTimeout(() => {
          if (ws.current?.readyState !== WebSocket.OPEN) {
            console.log("WebSocket connection timeout");
            closeWebSocket();
            handleReconnect(token);
          }
        }, CONNECTION_TIMEOUT);

        // Create new WebSocket connection with encoded token
        const encodedToken = encodeURIComponent(token);
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host =
          window.location.hostname === "localhost"
            ? "localhost:8080"
            : window.location.host;
        const wsUrl = `${protocol}//${host}/ws/chat/region?regionId=${regionId}&token=${encodedToken}`;

        console.log(
          "Connecting to WebSocket:",
          wsUrl.replace(encodedToken, "REDACTED")
        );

        ws.current = new WebSocket(wsUrl);

        // Set binary type to support potential binary messages
        ws.current.binaryType = "arraybuffer";

        ws.current.onopen = () => {
          setReadyState("open");
          reconnectAttempts.current = 0;
          if (connectionTimeoutId.current) {
            clearTimeout(connectionTimeoutId.current);
          }

          // Send initial heartbeat
          sendHeartbeat();
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // 타이핑 상태 메시지 처리 (content가 없어도 처리)
            if (data.type === "TYPING") {
              if (data.isTyping) {
                setTypingUsers((prev) => new Set(prev).add(data.memberName));
              } else {
                setTypingUsers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(data.memberName);
                  return newSet;
                });
              }
              return;
            }

            // heartbeat 메시지 필터링
            if (data.type === "PING" || data.type === "PONG") {
              return;
            }

            // 빈 메시지나 불필요한 메시지 필터링 (타이핑 메시지 제외)
            if (!data || !data.content || data.content.trim() === "") {
              return;
            }

            // 사용자 목록 업데이트를 메시지 처리보다 먼저 수행
            if (Array.isArray(data.users)) {
              setOnlineUsers(data.users);
            }

            // 현재 사용자의 session ID 저장 (첫 번째 메시지에서)
            if (data.senderId && !currentSessionId) {
              setCurrentSessionId(data.senderId);
            }

            if (!receivedMessageIds.current.has(data.id)) {
              receivedMessageIds.current.add(data.id);
              setMessages((prev) => [...prev, data]);
            }
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        };

        ws.current.onclose = (event) => {
          const reason = WS_CLOSE_CODES[event.code] || "알 수 없는 이유";
          console.log(
            `WebSocket closed with code: ${event.code} (${reason}), reason: ${event.reason}`
          );

          if (!isClosing.current) {
            if (event.code === 1006) {
              // 비정상 종료의 경우 즉시 재연결 시도
              handleReconnect(token);
            } else if (event.code === 1000) {
              // 정상 종료의 경우 재연결 시도하지 않음
              setReadyState("closed");
            } else {
              // 그 외의 경우 재연결 시도
              handleReconnect(token);
            }
          }
        };

        ws.current.onerror = (event) => {
          console.error("WebSocket error:", event);
          console.log("Connection state:", ws.current?.readyState);
          console.log("Region ID:", regionId);

          // 연결 상태가 CONNECTING인 경우에만 재연결 시도
          if (ws.current?.readyState === WebSocket.CONNECTING) {
            handleReconnect(token);
          }
        };
      } catch (err) {
        console.error("Error connecting to WebSocket:", err);
        handleReconnect(token);
      }
    },
    [regionId, isActionAllowed, closeWebSocket]
  );

  const handleReconnect = useCallback(
    (token: string) => {
      if (!isActionAllowed("reconnect")) return;

      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("연결에 실패했습니다. 페이지를 새로고침해주세요.");
        return;
      }

      console.log(
        `Reconnecting... Attempt ${
          reconnectAttempts.current + 1
        }/${MAX_RECONNECT_ATTEMPTS}`
      );
      reconnectAttempts.current += 1;

      reconnectTimeoutId.current = setTimeout(() => {
        connectWebSocket(token);
      }, RECONNECT_DELAY * Math.min(reconnectAttempts.current, 3));
    },
    [connectWebSocket, isActionAllowed]
  );

  const initializeWebSocket = useCallback(async () => {
    try {
      let token = await getAccessToken();

      if (!token) {
        const refreshResult = await refreshAccessToken();
        if (!refreshResult) {
          setError("인증이 필요합니다.");
          return;
        }
        token = await getAccessToken();
      }

      if (!token) {
        setError("인증이 필요합니다.");
        return;
      }

      connectWebSocket(token);
    } catch (err) {
      console.error("Error initializing WebSocket:", err);
      setError("연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [connectWebSocket]);

  useEffect(() => {
    initializeWebSocket();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨질 때는 연결을 유지
        console.log("페이지 비활성화 - 연결 유지");
      } else {
        // 페이지가 다시 보일 때 연결 상태 확인
        if (ws.current?.readyState !== WebSocket.OPEN) {
          console.log("페이지 활성화 - 재연결 시도");
          initializeWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      closeWebSocket();
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (connectionTimeoutId.current) {
        clearTimeout(connectionTimeoutId.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [closeWebSocket, initializeWebSocket]);

  // Heartbeat mechanism
  const heartbeatInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "PING" }));
    }
  }, []);

  useEffect(() => {
    if (readyState === "open") {
      heartbeatInterval.current = setInterval(sendHeartbeat, 30000);
    }
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [readyState, sendHeartbeat]);

  const sendMessage = () => {
    if (
      !newMessage.trim() ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    // 타이핑 상태 초기화
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "TYPING", isTyping: false }));
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

  const renderMessageContent = (content: string) => {
    // @멘션을 클릭 가능한 링크로 변환
    const mentionRegex = /@([가-힣a-zA-Z0-9]+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // 멘션 부분 - 주식명으로 검색하여 심볼 찾기
        return (
          <button
            key={index}
            onClick={() => {
              // 주식명으로 검색하여 심볼 찾기
              fetch(`/api/v1/stocks/search?query=${encodeURIComponent(part)}`)
                .then((response) => response.json())
                .then((data) => {
                  if (data.data && data.data.length > 0) {
                    const stock = data.data[0];
                    router.push(`/community/${stock.symbol}`);
                  }
                })
                .catch((error) => {
                  console.error("주식 검색 실패:", error);
                });
            }}
            className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            @{part}
          </button>
        );
      }
      return part;
    });
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
    if (ws.current?.readyState === WebSocket.OPEN) {
      // 타이핑 시작 메시지 전송
      ws.current.send(JSON.stringify({ type: "TYPING", isTyping: true }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      // 타이핑 종료 메시지 전송
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "TYPING", isTyping: false }));
      }
    }, 1000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    // 이모지 추가 후 타이핑 상태 업데이트
    handleTyping();
  };

  const handleMentionSelect = (stock: {
    symbol: string;
    name: string;
    emoji: string;
  }) => {
    const beforeMention = newMessage.substring(0, mentionPosition);
    const afterMention = newMessage.substring(
      mentionPosition + mentionQuery.length + 1
    );
    const mentionText = `@${stock.name}`;

    setNewMessage(beforeMention + mentionText + afterMention);
    setShowMention(false);
    setMentionQuery("");
    setMentionPosition(0);

    // 멘션 추가 후 타이핑 상태 업데이트
    handleTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // @ 멘션 감지
    const lastAtSymbol = value.lastIndexOf("@");
    if (lastAtSymbol !== -1) {
      const query = value.substring(lastAtSymbol + 1);
      if (query.length > 0 && !query.includes(" ")) {
        setShowMention(true);
        setMentionQuery(query);
        setMentionPosition(lastAtSymbol);
      } else {
        setShowMention(false);
      }
    } else {
      setShowMention(false);
    }

    handleTyping();
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
                        className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 text-blue-700 dark:text-blue-300 font-medium"
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
              {messages
                .filter(
                  (message) => message.content && message.content.trim() !== ""
                )
                .map((message, index) => {
                  // 서버에서 보낸 showHeader 정보 사용
                  const showHeader =
                    message.showHeader !== undefined
                      ? message.showHeader
                      : true;

                  // 현재 사용자의 메시지인지 확인
                  const isMyMessage = message.isMyMessage === true;

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
                          : isMyMessage
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      {showHeader &&
                        message.messageType !== "SYSTEM" &&
                        message.messageType !== "WELCOME" &&
                        message.messageType !== "ENTER" &&
                        message.messageType !== "LEAVE" && (
                          <div
                            className={`flex items-center space-x-2 text-xs mb-1 ${
                              isMyMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-semibold text-foreground/80">
                              {message.memberName}
                            </span>
                          </div>
                        )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            className={`group relative flex items-end ${
                              message.messageType === "SYSTEM" ||
                              message.messageType === "WELCOME" ||
                              message.messageType === "ENTER" ||
                              message.messageType === "LEAVE"
                                ? "justify-center"
                                : ""
                            }`}
                          >
                            <div
                              className={`text-sm p-3 break-words ${
                                message.messageType === "SYSTEM"
                                  ? "bg-muted/60 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[90%] text-xs"
                                  : message.messageType === "WELCOME" ||
                                    message.messageType === "ENTER" ||
                                    message.messageType === "LEAVE"
                                  ? "bg-muted/40 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[95%] text-xs whitespace-nowrap"
                                  : isMyMessage
                                  ? "bg-blue-500 text-white rounded-2xl rounded-br-md max-w-[85%] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md max-w-[85%] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                              }`}
                            >
                              {renderMessageContent(message.content)}
                            </div>
                            {message.messageType !== "SYSTEM" &&
                              message.messageType !== "WELCOME" &&
                              message.messageType !== "ENTER" &&
                              message.messageType !== "LEAVE" && (
                                <span
                                  className={`text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity ${
                                    isMyMessage ? "mr-2" : "ml-2"
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </span>
                              )}
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
                                className="cursor-pointer"
                              >
                                복사하기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSelectedMessage(message.id)}
                                className="cursor-pointer"
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

          {typingUsers.size > 0 && (
            <div className="text-xs text-muted-foreground mb-2 ml-2">
              {Array.from(typingUsers).join(", ")}님이 입력하고 있습니다...
            </div>
          )}

          <div className="flex items-center space-x-2 shrink-0 pt-3 border-t">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
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

              {showMention && (
                <StockMention
                  query={mentionQuery}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMention(false)}
                />
              )}

              <Input
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요... (@로 주식 검색)"
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
