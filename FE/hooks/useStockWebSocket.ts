import { useState, useEffect, useRef, useCallback } from "react";
import type { StockPriceData } from "@/lib/api/stock";

interface UseStockWebSocketOptions {
  stockCodes?: string[];
  onStockUpdate?: (data: StockPriceData) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface WebSocketMessage {
  type: string;
  message: string;
  timestamp: number;
  data?: any;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  stockData: Map<string, StockPriceData>;
  lastUpdate: number;
  lastDataReceived: number;
  isMarketOpen: boolean;
  pingInterval: number;
}

export function useStockWebSocket({
  stockCodes = [],
  onStockUpdate,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseStockWebSocketOptions = {}) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    stockData: new Map(),
    lastUpdate: 0,
    lastDataReceived: 0,
    isMarketOpen: false,
    pingInterval: 10000, // 10초마다 ping
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const subscribedCodesRef = useRef<Set<string>>(new Set());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 데이터 수신 상태 추적 및 장 열림/종료 상태 결정
  const updateDataReceivedStatus = useCallback(() => {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      lastDataReceived: now,
    }));

    // 데이터 수신 타임아웃 설정 (30초)
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    dataTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isMarketOpen: false,
      }));
    }, 30000); // 30초 동안 데이터가 없으면 장 종료로 간주
  }, []);

  // 장 열림 상태로 설정
  const setMarketOpen = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isMarketOpen: true,
    }));
  }, []);

  const connect = useCallback(async () => {
    if (state.connecting || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    // 서버 상태 확인 (선택적)
    try {
      const protocol =
        window.location.protocol === "https:" ? "https:" : "http:";
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === "production" ? "" : ":8080";
      const healthCheckUrl = `${protocol}//${host}${port}/api/v1/websocket/health`;

      console.log("🔍 서버 상태 확인 중:", healthCheckUrl);

      const response = await fetch(healthCheckUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn(
          "⚠️ 서버 상태 확인 실패, WebSocket 연결 직접 시도:",
          response.status
        );
      } else {
        const healthData = await response.json();
        console.log("✅ 서버 상태 확인 완료:", healthData);
      }
    } catch (error) {
      console.warn("⚠️ 서버 상태 확인 실패, WebSocket 연결 직접 시도:", error);
      // 서버 상태 확인 실패해도 WebSocket 연결 시도
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === "production" ? "" : ":8080";
      const wsUrl = `${protocol}//${host}${port}/ws/stocks`;

      console.log("🔄 웹소켓 연결 시도:", wsUrl);
      console.log("🔄 연결 환경:", {
        protocol,
        host,
        port,
        NODE_ENV: process.env.NODE_ENV,
        fullUrl: wsUrl,
        windowLocation: window.location.href,
      });

      // 웹소켓 지원 여부 확인
      if (!window.WebSocket) {
        throw new Error("이 브라우저는 웹소켓을 지원하지 않습니다.");
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 연결 시간 제한 설정 (10초)
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log("⏰ 웹소켓 연결 시간 초과");
          ws.close();
          setState((prev) => ({
            ...prev,
            connected: false,
            connecting: false,
            error:
              "연결 시간이 초과되었습니다. 서버가 실행 중인지 확인해주세요.",
          }));
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("✅ 웹소켓 연결 성공");
        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "CONNECTION_ESTABLISHED":
              console.log("✅ 서버 연결 확인:", message.message);
              // 구독할 종목 코드들 전송
              if (stockCodes.length > 0) {
                subscribe(stockCodes);
              }
              break;

            case "SUBSCRIBED":
              console.log("📡 구독 완료:", message.data?.stockCodes);
              if (message.data?.stockCodes) {
                // 서버에서 확인된 구독 코드들만 추가
                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.add(code);
                });
                console.log("📡 현재 구독 중인 종목:", [
                  ...subscribedCodesRef.current,
                ]);
              }
              break;

            case "UNSUBSCRIBED":
              console.log("📴 구독 해제 완료:", message.data?.stockCodes);
              if (message.data?.stockCodes) {
                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.delete(code);
                });
                console.log("📴 현재 구독 중인 종목:", [
                  ...subscribedCodesRef.current,
                ]);
              }
              break;

            case "STOCK_UPDATE":
              if (message.data?.stockData) {
                const stockData: StockPriceData = message.data.stockData;

                setState((prev) => {
                  const newStockData = new Map(prev.stockData);
                  newStockData.set(stockData.stockCode, stockData);
                  return {
                    ...prev,
                    stockData: newStockData,
                    lastUpdate: Date.now(),
                    isMarketOpen: true, // 데이터가 들어오면 장 열림 상태
                  };
                });

                // 데이터 수신 상태 업데이트
                updateDataReceivedStatus();
                onStockUpdate?.(stockData);
              }
              break;

            case "PONG":
              // 하트비트 응답 - 서버가 살아있음을 확인
              updateDataReceivedStatus();
              break;

            case "ERROR":
              console.error("🔴 서버 오류:", message.message);
              setState((prev) => ({ ...prev, error: message.message }));
              break;

            default:
              console.log("📨 알 수 없는 메시지:", message);
          }
        } catch (error) {
          console.error("🔴 웹소켓 메시지 파싱 오류:", error, event.data);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("🔴 웹소켓 오류:", {
          error,
          readyState: ws.readyState,
          url: wsUrl,
          timestamp: new Date().toISOString(),
        });

        // 연결 상태에 따른 오류 메시지 개선
        let errorMessage = "웹소켓 연결 오류";
        if (ws.readyState === WebSocket.CONNECTING) {
          errorMessage =
            "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.";
        } else if (ws.readyState === WebSocket.CLOSED) {
          errorMessage = "연결이 종료되었습니다.";
        }

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: errorMessage,
        }));

        // 자동 재연결 시도
        if (autoReconnect && mountedRef.current) {
          console.log(`🔄 ${reconnectInterval / 1000}초 후 재연결 시도...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log("📴 웹소켓 연결 종료:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          url: wsUrl,
          timestamp: new Date().toISOString(),
        });

        // 연결 종료 코드별 상세 메시지
        let closeMessage = null;
        if (!event.wasClean) {
          switch (event.code) {
            case 1000:
              closeMessage = "정상 종료";
              break;
            case 1001:
              closeMessage = "서버가 종료됨";
              break;
            case 1002:
              closeMessage = "프로토콜 오류";
              break;
            case 1003:
              closeMessage = "지원하지 않는 데이터 타입";
              break;
            case 1006:
              closeMessage = "비정상 종료 (연결 실패)";
              break;
            case 1011:
              closeMessage = "서버 오류";
              break;
            default:
              closeMessage = `연결이 예기치 않게 종료되었습니다 (${event.code}: ${event.reason})`;
          }
        }

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: closeMessage,
          // 기존 주식 데이터는 유지 (장종료 후에도 표시하기 위해)
        }));

        subscribedCodesRef.current.clear();

        // 자동 재연결
        if (autoReconnect && mountedRef.current && !event.wasClean) {
          console.log(`🔄 ${reconnectInterval / 1000}초 후 재연결 시도...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error("🔴 웹소켓 생성 오류:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: `웹소켓 생성 실패: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }));
    }
  }, [autoReconnect, reconnectInterval, state.connecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    subscribedCodesRef.current.clear();

    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      stockData: new Map(), // 연결 해제시 데이터도 클리어
    }));
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error("🔴 메시지 전송 실패:", error);
        return false;
      }
    }
    console.warn("⚠️ 웹소켓이 연결되지 않음");
    return false;
  }, []);

  const subscribe = useCallback(
    (newStockCodes: string[]) => {
      const uniqueCodes = [...new Set(newStockCodes)].filter(
        (code) => code && code.trim()
      );
      if (uniqueCodes.length === 0) return false;

      const success = sendMessage({
        type: "SUBSCRIBE",
        stockCodes: uniqueCodes,
      });

      if (success) {
        console.log("📡 종목 구독 요청:", uniqueCodes);
        // 구독 상태는 서버 응답(SUBSCRIBED)에서만 업데이트
      }

      return success;
    },
    [sendMessage]
  );

  const unsubscribe = useCallback(
    (stockCodesToRemove: string[]) => {
      const validCodes = stockCodesToRemove.filter(
        (code) => code && code.trim()
      );
      if (validCodes.length === 0) return false;

      const success = sendMessage({
        type: "UNSUBSCRIBE",
        stockCodes: validCodes,
      });

      if (success) {
        console.log("📴 종목 구독 해제:", validCodes);
        // 구독 해제 상태는 서버 응답(UNSUBSCRIBED)에서만 업데이트
      }

      return success;
    },
    [sendMessage]
  );

  const ping = useCallback(() => {
    return sendMessage({ type: "PING" });
  }, [sendMessage]);

  // 컴포넌트 마운트시 연결
  useEffect(() => {
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);

  // 종목 코드 변경시 재구독
  useEffect(() => {
    if (state.connected && stockCodes.length > 0) {
      // 현재 구독 중인 코드와 요청된 코드 비교
      const currentCodes = new Set(subscribedCodesRef.current);
      const requestedCodes = new Set(stockCodes);

      // 차이가 있을 때만 재구독
      const hasDifference =
        currentCodes.size !== requestedCodes.size ||
        [...currentCodes].some((code) => !requestedCodes.has(code)) ||
        [...requestedCodes].some((code) => !currentCodes.has(code));

      if (hasDifference) {
        console.log("📡 종목 구독 변경 감지:", {
          current: [...currentCodes],
          requested: [...requestedCodes],
        });

        // 기존 구독 해제 (필요한 경우에만)
        const codesToUnsubscribe = [...currentCodes].filter(
          (code) => !requestedCodes.has(code)
        );
        if (codesToUnsubscribe.length > 0) {
          unsubscribe(codesToUnsubscribe);
        }

        // 새로운 구독 (필요한 경우에만)
        const codesToSubscribe = [...requestedCodes].filter(
          (code) => !currentCodes.has(code)
        );
        if (codesToSubscribe.length > 0) {
          setTimeout(() => {
            if (state.connected) {
              subscribe(codesToSubscribe);
            }
          }, 100);
        }
      }
    }
  }, [stockCodes, state.connected]);

  // 주기적 하트비트 및 데이터 수신 상태 확인
  useEffect(() => {
    if (state.connected) {
      // ping 전송
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          ping();
        }
      }, state.pingInterval);

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [state.connected, state.pingInterval, ping]);

  // 컴포넌트 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 상태
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    stockData: state.stockData,
    lastUpdate: state.lastUpdate,
    lastDataReceived: state.lastDataReceived,
    isMarketOpen: state.isMarketOpen,
    subscribedCodes: [...subscribedCodesRef.current],

    // 메서드
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
    setMarketOpen,

    // 유틸리티
    getStockData: (stockCode: string) => state.stockData.get(stockCode),
    hasStockData: (stockCode: string) => state.stockData.has(stockCode),
    getAllStockData: () => Array.from(state.stockData.values()),
    getStockDataMap: () => new Map(state.stockData),
  };
}
