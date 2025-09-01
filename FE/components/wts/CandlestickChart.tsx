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
  const [showMinuteToggle, setShowMinuteToggle] = useState(false);
  const [lastMinuteTimeframe, setLastMinuteTimeframe] = useState("5M");
  const currentCandleRef = useRef<ChartDataPoint | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

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
    { label: "1분", value: "15M" },  // 1분봉 버튼 → 15분봉 API 요청
    { label: "5분", value: "1M" },   // 5분봉 버튼 → 1분봉 API 요청
    { label: "15분", value: "5M" },  // 15분봉 버튼 → 5분봉 API 요청
  ];

  // 과거 차트 데이터 로드
  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ChartDataPoint[] = [];

      if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M" || timeframe === "1H") {
        // 분봉 데이터 사용
        console.log("분봉 차트 요청됨:", timeframe);
        const dataLimit = 100;
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        console.log(
          "분봉 데이터 응답:",
          pastCandles.length,
          "개, 첫 번째:",
          pastCandles[0]
        );
        data = pastCandles.map(formatCandleForChart);
        console.log(
          "포맷팅된 분봉 데이터:",
          data.length,
          "개, 첫 번째:",
          data[0]
        );
      } else {
        // 일/주/월봉 데이터 사용
        const dataLimit =
          timeframe === "1D" ? 1000 : timeframe === "1W" ? 200 : 100;
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        data = pastCandles.map(formatCandleForChart);
      }

      // 시간순으로 정렬 (왼쪽이 오래된 데이터, 오른쪽이 최신 데이터)
      data.sort((a, b) => a.timestamp - b.timestamp);

      setChartData(data);
      console.log(
        "✅ 차트 데이터 로드 완료:",
        data.length,
        "개 캔들, 타임프레임:",
        timeframe
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
    setTimeframe(lastMinuteTimeframe);
    setShowMinuteToggle(false);
  };

  // 분봉 선택 핸들러
  const handleMinuteSelect = (minuteTf: string) => {
    console.log("분봉 선택됨:", minuteTf);
    setTimeframe(minuteTf);
    setLastMinuteTimeframe(minuteTf);
    setShowMinuteToggle(false);

    // 분봉 변경 시 즉시 데이터 로드
    setTimeout(() => {
      loadChartData();
    }, 100);
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
    const candleWidth = Math.max(2, (chartWidth / chartData.length) * 0.8);
    const candleSpacing = chartWidth / chartData.length;

    // 가격 범위 계산
    const prices = chartData.flatMap((d) => [d.high, d.low]);
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
    chartData.forEach((dataPoint, index) => {
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
      i < chartData.length;
      i += Math.max(1, Math.floor(chartData.length / 10))
    ) {
      const x = padding + candleSpacing * i + candleSpacing / 2;
      const time = formatTimeLabel(chartData[i].time, timeframe);
      ctx.fillText(time, x, canvas.height - padding + 25);
    }

    // 현재가 라인 (토스증권 스타일)
    if (chartData.length > 0) {
      const lastPrice = chartData[chartData.length - 1].close;
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
      ctx.fillText(
        `현재가: ${lastPrice.toLocaleString()}원`,
        canvas.width - padding + 10,
        currentPriceY + 4
      );
    }
  }, [chartData, timeframe, hoveredCandle, tooltipData]);

  // 차트 클릭 핸들러
  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 클릭된 캔들 찾기
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const candleSpacing = chartWidth / chartData.length;

    const index = Math.floor((x - padding) / candleSpacing);
    if (index >= 0 && index < chartData.length) {
      console.log("클릭된 캔들:", chartData[index]);
    }
  };

  // 차트 마우스 이동 핸들러
  const handleChartMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const candleSpacing = chartWidth / chartData.length;

    const index = Math.floor((x - padding) / candleSpacing);
    if (index >= 0 && index < chartData.length) {
      setHoveredCandle(index);
      setHoveredVolume(index); // 거래량 차트도 동시에 활성화
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[index],
        type: "candle",
      });
    } else {
      setHoveredCandle(null);
      setHoveredVolume(null);
      setTooltipData(null);
    }
  };

  // 차트 마우스 리브 핸들러
  const handleChartMouseLeave = () => {
    setHoveredCandle(null);
    setHoveredVolume(null); // 거래량 차트도 함께 비활성화
    setTooltipData(null);
  };

  // 거래량 차트 마우스 이동 핸들러
  const handleVolumeMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = event.currentTarget;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    const padding = 60; // 캔들차트와 동일한 패딩 사용
    const chartWidth = canvas.width - padding * 2;
    const barSpacing = chartWidth / chartData.length;

    const index = Math.floor((x - padding) / barSpacing);
    if (index >= 0 && index < chartData.length) {
      setHoveredVolume(index);
      setHoveredCandle(index); // 캔들차트도 동시에 활성화
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[index],
        type: "volume",
      });
    } else {
      setHoveredVolume(null);
      setHoveredCandle(null);
      setTooltipData(null);
    }
  };

  // 거래량 차트 마우스 리브 핸들러
  const handleVolumeMouseLeave = () => {
    setHoveredVolume(null);
    setHoveredCandle(null); // 캔들차트도 함께 비활성화
    setTooltipData(null);
  };

  // 거래량 차트 렌더링
  const renderVolumeChart = useCallback(() => {
    const canvas = document.getElementById("volumeCanvas") as HTMLCanvasElement;
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
    const barWidth = Math.max(3, (chartWidth / chartData.length) * 0.8); // 바 너비 더 증가
    const barSpacing = chartWidth / chartData.length; // 캔들차트와 동일한 간격

    // 거래량 범위 계산
    const volumes = chartData.map((d) => d.volume);
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
    chartData.forEach((dataPoint, index) => {
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
    for (
      let i = 0;
      i < chartData.length;
      i += Math.max(1, Math.floor(chartData.length / 10))
    ) {
      const x = padding + barSpacing * i + barSpacing / 2;
      const time = formatTimeLabel(chartData[i].time, timeframe);
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
  }, [chartData, timeframe, hoveredVolume]);

  // 차트 리사이즈 및 렌더링
  useEffect(() => {
    renderChart();
    renderVolumeChart();
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData]);

  // 윈도우 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => {
      renderChart();
      renderVolumeChart();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData]);

  // 차트 데이터 변경 시 거래량 차트도 함께 업데이트
  useEffect(() => {
    if (chartData.length > 0) {
      renderVolumeChart();
    }
  }, [chartData, timeframe, hoveredVolume]);

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
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
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
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={loadChartData}
            >
              <Activity className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* 차트 컨트롤 */}
        <div className="flex flex-wrap gap-2">
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
          className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {chartData.length > 0 ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onClick={handleChartClick}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
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
        <div className="relative h-[250px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {chartData.length > 0 ? (
            <canvas
              id="volumeCanvas"
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleVolumeMouseMove}
              onMouseLeave={handleVolumeMouseLeave}
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
