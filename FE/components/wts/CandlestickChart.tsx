"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Settings,
  Trash2,
  Wifi,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
// import { useMinuteData } from "@/hooks/useMinuteData";
import { getChartData, formatCandleForChart } from "@/lib/api/chart";
import type { CandleData } from "@/types/chart";
import type { StockPriceData } from "@/lib/api/stock";
// import type { StockMinutePrice } from "@/lib/api/minute";

interface CandlestickChartProps {
  stockCode: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  isComplete: boolean;
}

export function CandlestickChart({ stockCode }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState("5M");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [hoveredVolume, setHoveredVolume] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    data: ChartDataPoint;
    type: "candle" | "volume";
  } | null>(null);
  // 지표 토글 상태
  const [showBB, setShowBB] = useState<boolean>(true);
  const [showSMA5, setShowSMA5] = useState<boolean>(true);
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA60, setShowSMA60] = useState<boolean>(false);
  // 뷰포트 상태 (전체 데이터 표시)
  const [viewStart, setViewStart] = useState<number>(0);
  const [viewEnd, setViewEnd] = useState<number>(0);
  const [showMinuteToggle, setShowMinuteToggle] = useState(false);
  const [lastMinuteTimeframe, setLastMinuteTimeframe] = useState("5M");
  
  // 팬 기능을 위한 상태
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<number>(0);
  
  // 확대/축소 기능을 위한 상태
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 기본 크기
  const [zoomCenter, setZoomCenter] = useState<number>(0.5); // 0~1, 차트 중앙 기준
  const [isZooming, setIsZooming] = useState(false);
  
  const currentCandleRef = useRef<ChartDataPoint | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // localStorage 키 생성자
  const getMinuteKey = useCallback(() => `lastMinuteTimeframe_${stockCode}`, [stockCode]);

  // 초기 로드: localStorage에서 이전 분봉을 불러와 적용
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = getMinuteKey();
      const saved = localStorage.getItem(key);
      if (saved && ["1M", "5M", "15M"].includes(saved)) {
        console.log("🗂️ 저장된 분봉 초기화:", saved);
        setLastMinuteTimeframe(saved);
        // 현재가 분봉 계열이면 함께 동기화
        if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
          setTimeframe(saved);
        }
      }
    } catch (e) {
      console.warn("분봉 초기값 로드 실패:", e);
    }
  }, [getMinuteKey]);

  // 주기적 동기화: 다른 탭/페이지에서 변경된 값을 반영
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getMinuteKey();
    const sync = () => {
      try {
        const saved = localStorage.getItem(key);
        if (saved && ["1M", "5M", "15M"].includes(saved) && saved !== lastMinuteTimeframe) {
          console.log("🔁 분봉 동기화:", lastMinuteTimeframe, "→", saved);
          setLastMinuteTimeframe(saved);
          if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
            setTimeframe(saved);
          }
        }
      } catch (e) {
        console.warn("분봉 동기화 실패:", e);
      }
    };
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, [getMinuteKey, lastMinuteTimeframe, timeframe]);

  // 실시간 웹소켓 데이터
  const {
    connected: wsConnected,
    getStockData,
    lastUpdate,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    onStockUpdate: (data) => {
      updateCurrentCandle(data);
    },
    autoReconnect: true,
  });

  // 분봉 데이터 (현재는 사용하지 않음, 백엔드 API 구현 완료 후 활성화)
  // const { data: minuteData, loading: minuteLoading, error: minuteError, refresh: fetchMinuteData } =
  //   useMinuteData({ stockSymbol: stockCode, timeframe: lastMinuteTimeframe, limit: 100 });

  const timeframes = [
    { label: "1일", value: "1D" },
    { label: "1주", value: "1W" },
    { label: "1달", value: "1MO" },
  ];

  const minuteTimeframes = [
    { label: "1분", value: "1M" },   // 1분봉 버튼 → 1분봉 API 요청
    { label: "5분", value: "5M" },   // 5분봉 버튼 → 5분봉 API 요청
    { label: "15분", value: "15M" }, // 15분봉 버튼 → 15분봉 API 요청
  ];

  // 과거 차트 데이터 로드
  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ChartDataPoint[] = [];

      if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M" || timeframe === "1H") {
        // 분봉 데이터 사용
        const minuteLabels = {
          "1M": "1분봉",
          "5M": "5분봉", 
          "15M": "15분봉"
        };
        const selectedLabel = minuteLabels[timeframe as keyof typeof minuteLabels] || timeframe;
        
        console.log("🚀 API 호출 시작:", selectedLabel, "(", timeframe, ") - 종목:", stockCode);
        
        const dataLimit = 100;
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        console.log(
          "📊 분봉 데이터 응답:",
          pastCandles.length,
          "개, 타임프레임:",
          timeframe,
          "첫 번째:",
          pastCandles[0]
        );
        data = pastCandles.map(formatCandleForChart);
        console.log(
          "📊 포맷팅된 분봉 데이터:",
          data.length,
          "개, 타임프레임:",
          timeframe,
          "첫 번째:",
          data[0]
        );
      } else {
        // 일/주/월봉 데이터 사용
        console.log("📊 일/주/월봉 차트 요청됨:", timeframe, "종목:", stockCode);
        const dataLimit =
          timeframe === "1D" ? 2500 : timeframe === "1W" ? 520 : 120; // 10년치 데이터
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        data = pastCandles.map(formatCandleForChart);
      }

      // 시간순으로 정렬 (왼쪽이 오래된 데이터, 오른쪽이 최신 데이터)
      data.sort((a, b) => a.timestamp - b.timestamp);

      setChartData(data);
      // 초기 뷰포트 설정: 최신 데이터를 보여주되, 너무 많으면 일정 개수만 표시
      const maxVisibleCandles = 50; // 초기에 보여줄 최대 캔들 수
      const startIndex = Math.max(0, data.length - maxVisibleCandles);
      setViewStart(startIndex);
      setViewEnd(data.length);
      
      // 줌 레벨 초기화
      setZoomLevel(1);
      setZoomCenter(0.5);
      setIsZooming(false);
      
      console.log(
        "✅ 차트 데이터 로드 완료:",
        data.length,
        "개 캔들, 타임프레임:",
        timeframe,
        "뷰포트:",
        startIndex,
        "-",
        data.length
      );
    } catch (err) {
      console.error("차트 데이터 로드 실패:", err);
      setError(
        err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  // 실시간 데이터로 현재 캔들 업데이트
  const updateCurrentCandle = (stockData: StockPriceData) => {
    if (!currentCandleRef.current) return;

    const currentPrice = parseFloat(stockData.currentPrice);
    const volume = parseFloat(stockData.volume);

    setChartData((prevData) => {
      const newData = [...prevData];
      const lastIndex = newData.length - 1;

      if (lastIndex >= 0 && !newData[lastIndex].isComplete) {
        // 현재 진행 중인 캔들 업데이트
        const currentCandle = { ...newData[lastIndex] };

        currentCandle.close = currentPrice;
        currentCandle.high = Math.max(currentCandle.high, currentPrice);
        currentCandle.low = Math.min(currentCandle.low, currentPrice);
        currentCandle.volume = volume;
        currentCandle.change = currentPrice - currentCandle.open;
        currentCandle.changePercent =
          ((currentPrice - currentCandle.open) / currentCandle.open) * 100;
        currentCandle.timestamp = parseInt(stockData.updatedTime);

        newData[lastIndex] = currentCandle;
        currentCandleRef.current = currentCandle;
      }

      return newData;
    });
  };

  // 분봉 토글 클릭 핸들러
  const handleMinuteToggle = () => {
    setShowMinuteToggle(!showMinuteToggle);
  };

  // 분봉 텍스트 클릭 핸들러 (마지막으로 선택한 분봉으로 이동)
  const handleMinuteTextClick = () => {
    console.log("🎯 분봉 텍스트 버튼 클릭됨 - lastMinuteTimeframe:", lastMinuteTimeframe);
    setTimeframe(lastMinuteTimeframe);
    setShowMinuteToggle(false);
  };

  // 분봉 선택 핸들러
  const handleMinuteSelect = (minuteTf: string) => {
    // 개발자 도구에 분봉 선택 로그 출력
    const minuteLabels = {
      "1M": "1분봉",
      "5M": "5분봉", 
      "15M": "15분봉"
    };
    const selectedLabel = minuteLabels[minuteTf as keyof typeof minuteLabels] || minuteTf;
    
    console.log("🎯 분봉 드롭다운에서 선택됨:", selectedLabel, "(", minuteTf, ")");
    console.log("🎯 현재 timeframe:", timeframe, "새로 선택할 timeframe:", minuteTf);
    
    // API URL 로그 출력
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const apiUrl = `${API_BASE_URL}/api/v1/stocks/chart/${stockCode}?timeframe=${minuteTf}&limit=100`;
    console.log("🌐 API 요청 URL:", apiUrl);
    
    // 현재 선택된 타임프레임과 다를 때만 업데이트
    if (timeframe !== minuteTf) {
      console.log("🔄 타임프레임 변경:", timeframe, "→", minuteTf);
      setTimeframe(minuteTf);
      setLastMinuteTimeframe(minuteTf);
      // 선택값 저장
      try {
        const key = getMinuteKey();
        localStorage.setItem(key, minuteTf);
        console.log("💾 분봉 저장:", key, "=", minuteTf);
      } catch (e) {
        console.warn("분봉 저장 실패:", e);
      }
      setShowMinuteToggle(false);
      // 데이터 로드는 timeframe 변경에 따른 useEffect에서 수행
    } else {
      console.log("ℹ️ 같은 타임프레임이므로 토글만 닫기");
      // 같은 타임프레임이면 토글만 닫기
      setShowMinuteToggle(false);
    }
  };

  // 현재 타임프레임에 따른 분봉 토글 라벨
  const getMinuteToggleLabel = () => {
    if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
      return (
        minuteTimeframes.find((tf) => tf.value === timeframe)?.label || "분봉"
      );
    }
    return (
      minuteTimeframes.find((tf) => tf.value === lastMinuteTimeframe)?.label ||
      "분봉"
    );
  };

  // 시간봉 변경 시 데이터 재로드
  useEffect(() => {
    if (stockCode) {
      loadChartData();
    }
  }, [stockCode, timeframe]);

  // 분봉 데이터 변경 시 차트 업데이트 (현재는 비활성화)
  // useEffect(() => {
  //   if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
  //     loadChartData();
  //   }
  // }, [minuteData]);

  // 캔들스틱 색상 결정
  const getCandleColor = (dataPoint: ChartDataPoint) => {
    return dataPoint.close >= dataPoint.open ? "#ef4444" : "#3b82f6"; // 상승: 빨강, 하락: 파랑
  };

  // 시간 라벨 포맷팅 (타임프레임에 따라)
  const formatTimeLabel = (timeString: string, tf: string) => {
    try {
      const date = new Date(timeString);

      if (tf === "1M" || tf === "5M" || tf === "15M") {
        // 분봉: HH:MM 형식
        return date.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else if (tf === "1D") {
        // 일봉: MM/DD 형식
        return date.toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });
      } else if (tf === "1W") {
        // 주봉: MM/DD 형식
        return date.toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });
      } else if (tf === "1MO") {
        // 월봉: YYYY/MM 형식
        return date.toLocaleDateString("ko-KR", {
          year: "2-digit",
          month: "2-digit",
        });
      }

      // 기본: 시간만 표시
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.warn("시간 포맷팅 실패:", timeString, error);
      return timeString;
    }
  };

  // 차트 렌더링
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = chartContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 배경 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 80; // 패딩 증가로 축 공간 확보
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleData = chartData.slice(start, end);
    const candleWidth = Math.max(2, (chartWidth / visibleData.length) * 0.8);
    const candleSpacing = chartWidth / Math.max(1, visibleData.length);

    // 가격 범위 계산
    const prices = visibleData.flatMap((d) => [d.high, d.low]);

    // 이동평균 및 볼린저밴드 계산 (렌더 범위 내)
    const calcSMA = (data: ChartDataPoint[], period: number) => {
      const result: (number | null)[] = Array(data.length).fill(null);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i].close;
        if (i >= period) sum -= data[i - period].close;
        if (i >= period - 1) result[i] = sum / period;
      }
      return result;
    };

    const calcBB = (data: ChartDataPoint[], period: number, k: number) => {
      const ma = calcSMA(data, period);
      const upper: (number | null)[] = Array(data.length).fill(null);
      const lower: (number | null)[] = Array(data.length).fill(null);
      for (let i = 0; i < data.length; i++) {
        if (i >= period - 1 && ma[i] != null) {
          let variance = 0;
          for (let j = i - period + 1; j <= i; j++) {
            const diff = data[j].close - (ma[i] as number);
            variance += diff * diff;
          }
          const std = Math.sqrt(variance / period);
          upper[i] = (ma[i] as number) + k * std;
          lower[i] = (ma[i] as number) - k * std;
        }
      }
      return { ma, upper, lower };
    };

    const sma5 = showSMA5 ? calcSMA(visibleData, 5) : [];
    const sma20 = showSMA20 ? calcSMA(visibleData, 20) : [];
    const sma60 = showSMA60 ? calcSMA(visibleData, 60) : [];
    const bb = showBB ? calcBB(visibleData, 20, 2) : { ma: [], upper: [], lower: [] };

    // 가격 범위 확장: 지표 포함
    if (showSMA5) {
      sma5.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showSMA20) {
      sma20.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showSMA60) {
      sma60.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showBB) {
      bb.upper.forEach((v) => {
        if (v != null) prices.push(v);
      });
      bb.lower.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // 1단계: 배경 그리드 그리기 (가장 뒤쪽)
    ctx.strokeStyle = "#374151"; // 어두운 그리드 색상
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);

    // 수평 그리드
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // 수직 그리드
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    // 2단계: X축과 Y축 그리기 (그리드 위에)
    ctx.setLineDash([]); // 실선으로 설정
    ctx.strokeStyle = "#6b7280"; // 축 색상
    ctx.lineWidth = 2; // 축 두께

    // Y축 (왼쪽)
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // X축 (아래쪽)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // 3단계: 캔들스틱 그리기 (축 위에)
    visibleData.forEach((dataPoint, index) => {
      const x =
        padding + candleSpacing * index + (candleSpacing - candleWidth) / 2;
      const isUp = dataPoint.close >= dataPoint.open;
      const color = getCandleColor(dataPoint);

      // 고가-저가 선 (심지)
      const highY =
        padding + ((maxPrice - dataPoint.high) / priceRange) * chartHeight;
      const lowY =
        padding + ((maxPrice - dataPoint.low) / priceRange) * chartHeight;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // 캔들 몸통
      const openY =
        padding + ((maxPrice - dataPoint.open) / priceRange) * chartHeight;
      const closeY =
        padding + ((maxPrice - dataPoint.close) / priceRange) * chartHeight;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);

      // 호버 효과
      if (hoveredCandle === index) {
        // 호버된 캔들 강조 - 더 뚜렷하게
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 3, bodyTop - 3, candleWidth + 6, bodyHeight + 6);

        // 호버된 캔들 내부 하이라이트
        ctx.fillStyle = color + "CC"; // CC = 80% 투명도
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);

        // 호버된 캔들 테두리 다시 그리기
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
      }
    });

    // 이동평균선 및 볼린저밴드 그리기
    const drawLineSeries = (series: (number | null)[], color: string, width = 2) => {
      if (!series.length) return;
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      let started = false;
      for (let i = 0; i < series.length; i++) {
        const v = series[i];
        if (v == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - v) / priceRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) ctx.stroke();
    };

    if (showBB && bb.upper.length) {
      // 볼린저 상단/하단
      drawLineSeries(bb.upper, "#8b5cf6", 1.5);
      drawLineSeries(bb.lower, "#8b5cf6", 1.5);
      // 밴드 영역 채우기
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < bb.upper.length; i++) {
        const u = bb.upper[i];
        if (u == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - u) / priceRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      for (let i = bb.lower.length - 1; i >= 0; i--) {
        const l = bb.lower[i];
        if (l == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - l) / priceRange) * chartHeight;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
      ctx.fill();
    }

    if (showSMA5) drawLineSeries(sma5, "#10b981", 2);
    if (showSMA20) drawLineSeries(sma20, "#f59e0b", 2);
    if (showSMA60) drawLineSeries(sma60, "#6366f1", 2);

    // 4단계: 축 라벨 그리기 (가장 앞에)
    ctx.fillStyle = "#f3f4f6"; // 밝은 색상으로 변경
    ctx.font = "bold 12px Arial"; // 폰트 굵기 증가

    // Y축 라벨 (왼쪽)
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(price.toLocaleString(), padding - 15, y + 4);
    }

    // X축 라벨 (아래쪽)
    ctx.textAlign = "center";
    for (
      let i = 0;
      i < visibleData.length;
      i += Math.max(1, Math.floor(visibleData.length / 10))
    ) {
      const x = padding + candleSpacing * i + candleSpacing / 2;
      const time = formatTimeLabel(visibleData[i].time, timeframe);
      ctx.fillText(time, x, canvas.height - padding + 25);
    }

    // 현재가 라인 (토스증권 스타일)
    if (visibleData.length > 0) {
      const lastPrice = visibleData[visibleData.length - 1].close;
      const currentPriceY =
        padding + ((maxPrice - lastPrice) / priceRange) * chartHeight;

      // 현재가 수평선
      ctx.strokeStyle = "#ef4444"; // 빨간색
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // 점선
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(canvas.width - padding, currentPriceY);
      ctx.stroke();

      // 현재가 라벨
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`현재가: ${lastPrice.toLocaleString()}원`, canvas.width - padding + 10, currentPriceY + 4);
    }
  }, [chartData, timeframe, hoveredCandle, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);

  // 팬 기능을 위한 마우스 다운 핸들러
  const handleChartMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // 왼쪽 마우스 버튼만
      event.preventDefault(); // 기본 동작 방지
      setIsPanning(true);
      setPanStart(event.clientX);
      setPanOffset(0);
      // 마우스 커서 변경
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  // 팬 기능을 위한 마우스 이동 핸들러
  const handleChartMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 팬 중이면 뷰포트 업데이트
    if (isPanning) {
      const deltaX = event.clientX - panStart;
      const total = chartData.length;
      const visibleLen = viewEnd - viewStart;
      
      // 팬 오프셋 계산 (픽셀을 캔들 인덱스로 변환)
      const padding = 60;
      const chartWidth = canvas.width - padding * 2;
      const candleSpacing = chartWidth / Math.max(1, visibleLen);
      const deltaCandles = Math.round(deltaX / candleSpacing);
      
      // 새로운 뷰포트 범위 계산 (팬 방향 반대로)
      let newStart = viewStart - deltaCandles;
      let newEnd = viewEnd - deltaCandles;
      
      // 경계 제한
      newStart = Math.max(0, Math.min(newStart, total - visibleLen));
      newEnd = Math.max(visibleLen, Math.min(newEnd, total));
      
      // 뷰포트 업데이트
      setViewStart(newStart);
      setViewEnd(newEnd);
      setPanOffset(deltaX);
      
      // 팬 시작점을 현재 위치로 업데이트 (연속적인 팬을 위해)
      setPanStart(event.clientX);
      
      return; // 팬 중일 때는 호버 처리 안함
    }

    // 팬이 아닐 때만 호버 처리
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleLen = Math.max(1, end - start);
    const candleSpacing = chartWidth / visibleLen;

    const localIndex = Math.floor((x - padding) / candleSpacing);
    const globalIndex = start + localIndex;
    if (localIndex >= 0 && localIndex < visibleLen && globalIndex >= 0 && globalIndex < chartData.length) {
      setHoveredCandle(localIndex);
      setHoveredVolume(localIndex); // 거래량 차트도 동시에 활성화
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[globalIndex],
        type: "candle",
      });
    } else {
      setHoveredCandle(null);
      setHoveredVolume(null);
      setTooltipData(null);
    }
  };

  // 팬 기능을 위한 마우스 업 핸들러
  const handleChartMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      // 마우스 커서 복원
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };

  // 차트 클릭 핸들러 (팬이 아닐 때만)
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) {
      console.log("차트 클릭됨");
    }
  };

  // 확대/축소에 따른 뷰포트 업데이트 함수
  const updateViewportForZoom = (newZoomLevel: number, newZoomCenter: number) => {
    const total = chartData.length;
    if (total === 0) return;
    
    // 기본 표시할 캔들 수 (줌 레벨에 따라 조정)
    const baseVisibleCandles = 50;
    const visibleCandles = Math.max(5, Math.min(total, Math.round(baseVisibleCandles / newZoomLevel)));
    
    // 줌 중심점을 기준으로 뷰포트 범위 계산
    const centerIndex = Math.round(newZoomCenter * (total - 1));
    const halfVisible = Math.floor(visibleCandles / 2);
    
    let newStart = Math.max(0, centerIndex - halfVisible);
    let newEnd = Math.min(total, newStart + visibleCandles);
    
    // 끝에 도달했을 때 시작점 조정
    if (newEnd === total) {
      newStart = Math.max(0, total - visibleCandles);
    }
    
    setViewStart(newStart);
    setViewEnd(newEnd);
    
    console.log(`🔍 줌 업데이트: 레벨=${newZoomLevel.toFixed(2)}x, 중심=${newZoomCenter.toFixed(2)}, 뷰포트=${newStart}-${newEnd}`);
  };


  // 확대/축소를 위한 휠 이벤트 핸들러
  const handleChartWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 팬 중이면 확대/축소 비활성화
    if (isPanning) return;
    
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    
    // 마우스 위치를 기준으로 확대/축소 중심점 계산
    const relativeX = (x - padding) / chartWidth;
    const newZoomCenter = Math.max(0, Math.min(1, relativeX));
    
    // 휠 방향에 따른 확대/축소
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // 위로 = 확대, 아래로 = 축소
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor)); // 0.1x ~ 10x 제한
    
    // 줌 레벨이 변경되었을 때만 업데이트
    if (Math.abs(newZoomLevel - zoomLevel) > 0.01) {
      setZoomLevel(newZoomLevel);
      setZoomCenter(newZoomCenter);
      setIsZooming(true);
      
      // 줌에 따른 뷰포트 업데이트
      updateViewportForZoom(newZoomLevel, newZoomCenter);
      
      // 줌 애니메이션 완료 후 상태 초기화
      setTimeout(() => {
        setIsZooming(false);
      }, 150);
    }
  };

  // 차트 마우스 리브 핸들러
  const handleChartMouseLeave = () => {
    // 팬 중이면 팬 상태 초기화
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
    setHoveredCandle(null);
    setHoveredVolume(null); // 거래량 차트도 함께 비활성화
    setTooltipData(null);
  };

  // 거래량 차트 마우스 다운 핸들러 (팬 기능)
  const handleVolumeMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // 왼쪽 마우스 버튼만
      event.preventDefault(); // 기본 동작 방지
      setIsPanning(true);
      setPanStart(event.clientX);
      setPanOffset(0);
      // 마우스 커서 변경
      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grabbing';
      }
    }
  };

  // 거래량 차트 마우스 이동 핸들러 (팬 기능 포함)
  const handleVolumeMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = event.currentTarget;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // 팬 중이면 뷰포트 업데이트
    if (isPanning) {
      const deltaX = event.clientX - panStart;
      const total = chartData.length;
      const visibleLen = viewEnd - viewStart;
      
      // 팬 오프셋 계산 (픽셀을 캔들 인덱스로 변환)
      const padding = 60;
      const chartWidth = canvas.width - padding * 2;
      const barSpacing = chartWidth / Math.max(1, visibleLen);
      const deltaCandles = Math.round(deltaX / barSpacing);
      
      // 새로운 뷰포트 범위 계산 (팬 방향 반대로)
      let newStart = viewStart - deltaCandles;
      let newEnd = viewEnd - deltaCandles;
      
      // 경계 제한
      newStart = Math.max(0, Math.min(newStart, total - visibleLen));
      newEnd = Math.max(visibleLen, Math.min(newEnd, total));
      
      // 뷰포트 업데이트
      setViewStart(newStart);
      setViewEnd(newEnd);
      setPanOffset(deltaX);
      
      // 팬 시작점을 현재 위치로 업데이트 (연속적인 팬을 위해)
      setPanStart(event.clientX);
      
      return; // 팬 중일 때는 호버 처리 안함
    }

    // 팬이 아닐 때만 호버 처리
    const padding = 60; // 캔들차트와 동일한 패딩 사용
    const chartWidth = canvas.width - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleLen = Math.max(1, end - start);
    const barSpacing = chartWidth / visibleLen;

    const localIndex = Math.floor((x - padding) / barSpacing);
    const globalIndex = start + localIndex;
    if (localIndex >= 0 && localIndex < visibleLen && globalIndex >= 0 && globalIndex < chartData.length) {
      setHoveredVolume(localIndex);
      setHoveredCandle(localIndex); // 캔들차트도 동시에 활성화
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[globalIndex],
        type: "volume",
      });
    } else {
      setHoveredVolume(null);
      setHoveredCandle(null);
      setTooltipData(null);
    }
  };

  // 거래량 차트 마우스 업 핸들러 (팬 기능)
  const handleVolumeMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      // 마우스 커서 복원
      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grab';
      }
    }
  };

  // 거래량 차트 마우스 리브 핸들러
  const handleVolumeMouseLeave = () => {
    // 팬 중이면 팬 상태 초기화
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grab';
      }
    }
    setHoveredVolume(null);
    setHoveredCandle(null); // 캔들차트도 함께 비활성화
    setTooltipData(null);
  };

  // 거래량 차트 휠 이벤트 핸들러 (캔들차트와 동일)
  const handleVolumeWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 팬 중이면 확대/축소 비활성화
    if (isPanning) return;
    
    const canvas = volumeCanvasRef.current;
    if (!canvas || chartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    
    // 마우스 위치를 기준으로 확대/축소 중심점 계산
    const relativeX = (x - padding) / chartWidth;
    const newZoomCenter = Math.max(0, Math.min(1, relativeX));
    
    // 휠 방향에 따른 확대/축소
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // 위로 = 확대, 아래로 = 축소
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor)); // 0.1x ~ 10x 제한
    
    // 줌 레벨이 변경되었을 때만 업데이트
    if (Math.abs(newZoomLevel - zoomLevel) > 0.01) {
      setZoomLevel(newZoomLevel);
      setZoomCenter(newZoomCenter);
      setIsZooming(true);
      
      // 줌에 따른 뷰포트 업데이트
      updateViewportForZoom(newZoomLevel, newZoomCenter);
      
      // 줌 애니메이션 완료 후 상태 초기화
      setTimeout(() => {
        setIsZooming(false);
      }, 150);
    }
  };

  // 거래량 차트 렌더링
  const renderVolumeChart = useCallback(() => {
    const canvas = volumeCanvasRef.current as HTMLCanvasElement | null;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 배경 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캔들차트와 동일한 패딩과 간격 사용
    const padding = 80; // 캔들차트와 동일한 패딩
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleData = chartData.slice(start, end);
    const barWidth = Math.max(3, (chartWidth / visibleData.length) * 0.8); // 바 너비 더 증가
    const barSpacing = chartWidth / Math.max(1, visibleData.length); // 캔들차트와 동일한 간격

    // 거래량 범위 계산
    const volumes = visibleData.map((d) => d.volume);
    const maxVolume = Math.max(...volumes);

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(
      0,
      padding,
      0,
      canvas.height - padding
    );
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.03)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // 1단계: 먼저 그리드 그리기 (뒤쪽에 위치)
    ctx.strokeStyle = "#374151"; // 더 어두운 그리드 색상
    ctx.lineWidth = 0.5; // 선 두께 줄임
    ctx.setLineDash([6, 6]); // 점선 간격 더 늘림

    // 수평 그리드
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // 수직 그리드 (캔들차트와 동일한 위치)
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    // 2단계: X축과 Y축 그리기 (그리드 위에)
    ctx.setLineDash([]); // 실선으로 설정
    ctx.strokeStyle = "#6b7280"; // 축 색상
    ctx.lineWidth = 2; // 축 두께

    // Y축 (왼쪽)
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // X축 (아래쪽)
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // 3단계: 거래량 바 그리기 (축 위에 위치)
    visibleData.forEach((dataPoint, index) => {
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const height = (dataPoint.volume / maxVolume) * chartHeight;
      const y = canvas.height - padding - height;

      // 캔들 색상과 동일한 색상 사용하되 더 진하게
      const color = getCandleColor(dataPoint);

      // 바 배경 (더 진한 색상, 불투명도 증가)
      ctx.fillStyle = color + "E6"; // E6 = 90% 불투명도
      ctx.fillRect(x, y, barWidth, height);

      // 바 테두리 (실선으로 깔끔하게)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]); // 점선 제거, 실선으로 설정
      ctx.strokeRect(x, y, barWidth, height);

      // 호버 효과 - 더 뚜렷하게
      if (hoveredVolume === index) {
        // 호버된 바 강조 (가장 앞에 위치)
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 4;
        ctx.setLineDash([]); // 호버 시에도 실선 유지
        ctx.strokeRect(x - 3, y - 3, barWidth + 6, height + 6);

        // 호버된 바 내부 하이라이트
        ctx.fillStyle = color + "FF"; // FF = 100% 불투명도
        ctx.fillRect(x, y, barWidth, height);

        // 호버된 바 테두리 다시 그리기
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]); // 실선 유지
        ctx.strokeRect(x, y, barWidth, height);
      }
    });

    // 4단계: 마지막에 라벨 그리기 (가장 앞에 위치)
    ctx.setLineDash([]);

    // Y축 라벨 (거래량 단위) - 더 진한 색상
    ctx.fillStyle = "#f3f4f6"; // 밝은 색상으로 변경
    ctx.font = "bold 12px Arial"; // 폰트 굵기 증가
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const volume = maxVolume - (maxVolume / 4) * i;
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(`${(volume / 1000000).toFixed(1)}M`, padding - 15, y + 4);
    }

    // X축 라벨 (캔들차트와 동일한 위치) - 더 진한 색상
    ctx.fillStyle = "#f3f4f6"; // 밝은 색상으로 변경
    ctx.font = "bold 12px Arial"; // 폰트 굵기 증가
    ctx.textAlign = "center";
    for (let i = 0; i < visibleData.length; i += Math.max(1, Math.floor(visibleData.length / 10))) {
      const x = padding + barSpacing * i + barSpacing / 2;
      const time = formatTimeLabel(visibleData[i].time, timeframe);
      ctx.fillText(time, x, canvas.height - padding + 25);
    }

    // 거래량 라벨 - 더 진한 색상
    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `${(maxVolume / 1000000).toFixed(1)}M`,
      canvas.width - padding + 10,
      padding + 15
    );
  }, [chartData, timeframe, hoveredVolume, viewStart, viewEnd]);

  // 차트 리사이즈 및 렌더링
  useEffect(() => {
    renderChart();
    renderVolumeChart();
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);

  // 윈도우 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      renderChart();
      renderVolumeChart();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);

  // 차트 영역에서 스크롤 방지를 위한 전역 이벤트 리스너
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const chartContainer = chartContainerRef.current;
      const volumeContainer = volumeCanvasRef.current?.parentElement;
      
      // 차트 영역 내부에서 발생한 휠 이벤트인지 확인
      if (chartContainer && (
        chartContainer.contains(target) || 
        chartContainer === target ||
        (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const chartContainer = chartContainerRef.current;
      const volumeContainer = volumeCanvasRef.current?.parentElement;
      
      // 차트 영역 내부에서 발생한 터치 이벤트인지 확인
      if (chartContainer && (
        chartContainer.contains(target) || 
        chartContainer === target ||
        (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // passive: false로 설정하여 preventDefault가 작동하도록 함
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);



  // 차트 데이터 변경 시 거래량 차트도 함께 업데이트
  useEffect(() => {
    if (chartData.length > 0) {
      renderVolumeChart();
    }
  }, [chartData, timeframe, hoveredVolume, viewStart, viewEnd]);

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <Activity className="w-8 h-8 text-green-500 mx-auto animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              차트 데이터 로딩 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadChartData} variant="outline" size="sm">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full"
      onWheel={(e) => {
        // 차트 영역이 아닌 경우에만 기본 동작 허용
        const target = e.target as HTMLElement;
        const chartContainer = chartContainerRef.current;
        const volumeContainer = volumeCanvasRef.current?.parentElement;
        
        if (chartContainer && (
          chartContainer.contains(target) || 
          chartContainer === target ||
          (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
        )) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ overscrollBehavior: 'none' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              캔들 차트
            </CardTitle>
            <div className="flex items-center gap-1">
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    실시간
                  </span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">연결중...</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {timeframe}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {chartData.length}개 캔들
            </Badge>
            <Badge variant="outline" className="text-xs">
              {zoomLevel.toFixed(1)}x
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={loadChartData}
              title="데이터 새로고침"
            >
              <Activity className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => {
                setZoomLevel(1);
                setZoomCenter(0.5);
                setIsZooming(false);
                // 전체 데이터 표시
                setViewStart(0);
                setViewEnd(chartData.length);
              }}
              title="줌 리셋"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* 차트 컨트롤 */}
        <div className="flex flex-wrap gap-2">
          {/* 지표 토글 */}
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setShowSMA5((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA5
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="단기 이동평균선 (5)"
            >
              SMA5
            </button>
            <button
              onClick={() => setShowSMA20((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA20
                  ? "bg-amber-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="중기 이동평균선 (20)"
            >
              SMA20
            </button>
            <button
              onClick={() => setShowSMA60((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA60
                  ? "bg-indigo-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="장기 이동평균선 (60)"
            >
              SMA60
            </button>
            <button
              onClick={() => setShowBB((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showBB
                  ? "bg-violet-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="볼린저밴드 (20, 2σ)"
            >
              BB
            </button>
          </div>
          {/* 분봉 토글 */}
          <div className="relative">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={handleMinuteTextClick}
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l-md transition-colors"
              >
                {getMinuteToggleLabel()}
              </button>
              <button
                onClick={handleMinuteToggle}
                className="px-2 py-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r-md transition-colors"
              >
                {showMinuteToggle ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 분봉 드롭다운 */}
            {showMinuteToggle && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                {minuteTimeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => handleMinuteSelect(tf.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      timeframe === tf.value
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "text-gray-700 dark:text-gray-300"
                    } ${
                      tf.value === minuteTimeframes[0].value
                        ? "rounded-t-lg"
                        : ""
                    } ${
                      tf.value ===
                      minuteTimeframes[minuteTimeframes.length - 1].value
                        ? "rounded-b-lg"
                        : ""
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 시간대 선택 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-1.5 py-0.5 text-xs rounded transition-all ${
                  timeframe === tf.value
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 캔들 차트 영역 */}
        <div
          ref={chartContainerRef}
          className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onScroll={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{ 
            touchAction: 'none',
            overscrollBehavior: 'none',
            overflow: 'hidden'
          }}
        >
          {chartData.length > 0 ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab select-none"
              onMouseDown={handleChartMouseDown}
              onMouseUp={handleChartMouseUp}
              onClick={handleChartClick}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              onWheel={handleChartWheel}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{ 
                touchAction: 'none',
                overscrollBehavior: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Activity className="w-8 h-8 text-green-500 mx-auto animate-pulse" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  차트 데이터 준비 중...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 거래량 차트 영역 - 높이 증가 */}
        <div 
          className="relative h-[250px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onScroll={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{ 
            touchAction: 'none',
            overscrollBehavior: 'none',
            overflow: 'hidden'
          }}
        >
          {chartData.length > 0 ? (
            <canvas
              ref={volumeCanvasRef}
              className="w-full h-full cursor-grab select-none"
              onMouseDown={handleVolumeMouseDown}
              onMouseUp={handleVolumeMouseUp}
              onMouseMove={handleVolumeMouseMove}
              onMouseLeave={handleVolumeMouseLeave}
              onWheel={handleVolumeWheel}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{ 
                touchAction: 'none',
                overscrollBehavior: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  거래량 데이터 준비 중...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 야무진 툴팁 */}
        {tooltipData && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px] pointer-events-none"
            style={{
              left: tooltipData.x + 10,
              top: tooltipData.y - 10,
              transform: "translateY(-100%)",
            }}
          >
            <div className="space-y-2">
              {/* 시간 정보 */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatTimeLabel(tooltipData.data.time, timeframe)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(tooltipData.data.time).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  })}
                </p>
              </div>

              {/* 가격 정보 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">시가</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {tooltipData.data.open.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">고가</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {tooltipData.data.high.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">저가</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {tooltipData.data.low.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">종가</p>
                  <p
                    className={`font-semibold ${
                      tooltipData.data.close >= tooltipData.data.open
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {tooltipData.data.close.toLocaleString()}원
                  </p>
                </div>
              </div>

              {/* 변동 정보 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    변동
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      tooltipData.data.change >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {tooltipData.data.change >= 0 ? "+" : ""}
                    {tooltipData.data.change.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    변동률
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      tooltipData.data.changePercent >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {tooltipData.data.changePercent >= 0 ? "+" : ""}
                    {tooltipData.data.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* 거래량 정보 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    거래량
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {tooltipData.data.volume.toLocaleString()}주
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    거래대금
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {(
                      (tooltipData.data.volume * tooltipData.data.close) /
                      1000000
                    ).toFixed(1)}
                    M원
                  </span>
                </div>
              </div>

              {/* 차트 타입 표시 */}
              <div className="text-center pt-1">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    tooltipData.type === "candle"
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  }`}
                >
                  {tooltipData.type === "candle"
                    ? "📈 캔들차트"
                    : "📊 거래량차트"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
