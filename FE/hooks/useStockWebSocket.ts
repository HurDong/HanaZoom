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
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const subscribedCodesRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (state.connecting || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === "production" ? "" : ":8080";
      const wsUrl = `${protocol}//${host}${port}/ws/stocks`;

      console.log("🔄 웹소켓 연결 시도:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
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
                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.add(code);
                });
              }
              break;

            case "UNSUBSCRIBED":
              console.log("📴 구독 해제 완료:", message.data?.stockCodes);
              if (message.data?.stockCodes) {
                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.delete(code);
                });
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
                  };
                });

                onStockUpdate?.(stockData);
                console.log(
                  "📈 실시간 데이터 수신:",
                  stockData.stockCode,
                  stockData.currentPrice
                );
              }
              break;

            case "PONG":
              // 하트비트 응답
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
        console.error("🔴 웹소켓 오류:", error);
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: "웹소켓 연결 오류",
        }));
      };

      ws.onclose = (event) => {
        console.log("📴 웹소켓 연결 종료:", event.code, event.reason);

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: event.wasClean ? null : "연결이 예기치 않게 종료되었습니다",
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
      console.error("🔴 웹소켓 생성 오류:", error);
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: "웹소켓 생성 실패",
      }));
    }
  }, [
    stockCodes,
    onStockUpdate,
    autoReconnect,
    reconnectInterval,
    state.connecting,
  ]);

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
      // 기존 구독 해제
      if (subscribedCodesRef.current.size > 0) {
        unsubscribe([...subscribedCodesRef.current]);
      }

      // 새로운 구독
      setTimeout(() => {
        if (state.connected) {
          subscribe(stockCodes);
        }
      }, 100);
    }
  }, [stockCodes, state.connected, subscribe, unsubscribe]);

  // 주기적 하트비트 (30초마다)
  useEffect(() => {
    if (state.connected) {
      const heartbeat = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          ping();
        }
      }, 30000);

      return () => clearInterval(heartbeat);
    }
  }, [state.connected, ping]);

  return {
    // 상태
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    stockData: state.stockData,
    lastUpdate: state.lastUpdate,
    subscribedCodes: [...subscribedCodesRef.current],

    // 메서드
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,

    // 유틸리티
    getStockData: (stockCode: string) => state.stockData.get(stockCode),
    hasStockData: (stockCode: string) => state.stockData.has(stockCode),
    getAllStockData: () => Array.from(state.stockData.values()),
    getStockDataMap: () => new Map(state.stockData),
  };
}
