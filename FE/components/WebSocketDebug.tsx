"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Settings
} from "lucide-react";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

const TEST_STOCKS = ["005930", "035420", "035720"];

export function WebSocketDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testStarted, setTestStarted] = useState(false);

  const {
    connected,
    connecting,
    error,
    stockData,
    lastUpdate,
    subscribedCodes,
    connect,
    disconnect,
    ping,
    getAllStockData,
  } = useStockWebSocket({
    stockCodes: testStarted ? TEST_STOCKS : [],
    onStockUpdate: (data) => {
      addLog(`📈 실시간 데이터 수신: ${data.stockCode} = ${data.currentPrice}원`);
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    if (connected) {
      addLog("✅ 웹소켓 연결 성공");
    } else if (connecting) {
      addLog("🔄 웹소켓 연결 중...");
    } else if (error) {
      addLog(`❌ 웹소켓 오류: ${error}`);
    }
  }, [connected, connecting, error]);

  const handleStartTest = () => {
    setTestStarted(true);
    addLog("🚀 웹소켓 테스트 시작");
  };

  const handleStopTest = () => {
    setTestStarted(false);
    disconnect();
    addLog("🛑 웹소켓 테스트 중단");
  };

  const handlePing = () => {
    const success = ping();
    addLog(success ? "🏓 핑 전송 성공" : "❌ 핑 전송 실패");
  };

  const handleReconnect = () => {
    addLog("🔄 수동 재연결 시도");
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  };

  const getStatusIcon = () => {
    if (connecting) return <Clock className="w-4 h-4 animate-spin" />;
    if (connected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <WifiOff className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (connecting) return "연결 중";
    if (connected) return "연결됨";
    if (error) return "오류";
    return "연결 안됨";
  };

  const getStatusColor = () => {
    if (connecting) return "bg-yellow-100 text-yellow-800";
    if (connected) return "bg-green-100 text-green-800";
    if (error) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-4">
      {/* 상태 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            웹소켓 디버그 도구
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 연결 상태 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">연결 상태:</span>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>
            {lastUpdate > 0 && (
              <span className="text-sm text-gray-500">
                마지막 업데이트: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">오류:</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* 구독 정보 */}
          <div>
            <span className="font-medium">구독 종목:</span>
            <div className="flex gap-2 mt-1">
              {subscribedCodes.length > 0 ? (
                subscribedCodes.map(code => (
                  <Badge key={code} variant="outline">{code}</Badge>
                ))
              ) : (
                <span className="text-gray-500 text-sm">없음</span>
              )}
            </div>
          </div>

          {/* 수신 데이터 */}
          <div>
            <span className="font-medium">수신 데이터 ({getAllStockData().length}개):</span>
            <div className="mt-2 space-y-1">
              {getAllStockData().slice(0, 3).map(stock => (
                <div key={stock.stockCode} className="text-sm bg-gray-50 p-2 rounded">
                  {stock.stockCode}: {stock.currentPrice}원 ({stock.changeRate}%)
                </div>
              ))}
              {getAllStockData().length === 0 && (
                <span className="text-gray-500 text-sm">수신된 데이터 없음</span>
              )}
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex gap-2 flex-wrap">
            {!testStarted ? (
              <Button onClick={handleStartTest} className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                테스트 시작
              </Button>
            ) : (
              <Button onClick={handleStopTest} variant="destructive" className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                테스트 중단
              </Button>
            )}
            
            <Button 
              onClick={handlePing} 
              variant="outline" 
              disabled={!connected}
              className="flex items-center gap-2"
            >
              🏓 핑 테스트
            </Button>
            
            <Button 
              onClick={handleReconnect} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              재연결
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>실시간 로그</span>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline" 
              size="sm"
            >
              로그 지우기
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">로그가 없습니다...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
