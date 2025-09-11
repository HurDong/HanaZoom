"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import {
  PieChart as PieChartIcon,
  DollarSign,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  type: "cash" | "stock" | "unknown";
  color: string;
  stockSymbol?: string;
  profitLoss?: number;
  profitLossRate?: number;
  isVisible: boolean;
  angle?: number;
  startAngle?: number;
  endAngle?: number;
}

interface AdvancedPortfolioChartProps {
  portfolioSummary: any;
  portfolioStocks: any[];
}

// Okabe-Ito 색상 팔레트 (색각이상 친화적)
const OKABE_ITO_PALETTE = [
  "#E69F00", // 주황색
  "#56B4E9", // 하늘색
  "#009E73", // 녹색
  "#F0E442", // 노란색
  "#0072B2", // 파란색
  "#D55E00", // 주황빨강
  "#CC79A7", // 분홍색
  "#999999", // 회색 (알 수 없음용)
];

// 다크모드 대비를 위한 색상 보정 함수
const adjustColorForDarkMode = (color: string, brightness: number = 15, saturation: number = 10) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  l = Math.min(1, l + brightness / 100);
  s = Math.min(1, s + saturation / 100);
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  if (s === 0) {
    const gray = Math.round(l * 255);
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};

// 색상 간 차이 계산
const calculateColorDifference = (color1: string, color2: string) => {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
};

// 색상 할당 함수
const assignColors = (data: Omit<ChartData, 'color' | 'isVisible'>[]) => {
  const assignedColors = new Map<string, string>();
  const usedColors: string[] = [];
  
  return data.map((item, index) => {
    let color: string;
    
    if (assignedColors.has(item.name)) {
      color = assignedColors.get(item.name)!;
    } else {
      let colorIndex = index % OKABE_ITO_PALETTE.length;
      color = OKABE_ITO_PALETTE[colorIndex];
      
      while (usedColors.some(usedColor => calculateColorDifference(color, usedColor) < 20)) {
        colorIndex = (colorIndex + 1) % OKABE_ITO_PALETTE.length;
        color = OKABE_ITO_PALETTE[colorIndex];
      }
      
      assignedColors.set(item.name, color);
      usedColors.push(color);
    }
    
    return {
      ...item,
      color: adjustColorForDarkMode(color),
      isVisible: true,
    };
  });
};

// 외부 라벨 컴포넌트
const ExternalLabel = ({ data, index, cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        }}
      >
        {`${data.name} · ${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export default function AdvancedPortfolioChart({
  portfolioSummary,
  portfolioStocks,
}: AdvancedPortfolioChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (portfolioSummary && portfolioStocks) {
      generateChartData();
    }
  }, [portfolioSummary, portfolioStocks]);

  const generateChartData = () => {
    const data: Omit<ChartData, 'color' | 'isVisible'>[] = [];

    // 현금 비율 추가
    if (portfolioSummary.totalCash > 0) {
      data.push({
        name: "현금",
        value: portfolioSummary.totalCash,
        percentage: Number(
          ((portfolioSummary.totalCash / portfolioSummary.totalBalance) * 100).toFixed(1)
        ),
        type: "cash",
      });
    }

    // 주식 종목별 비율 추가
    portfolioStocks.forEach((stock) => {
      if (stock.currentValue > 0) {
        const percentage = Number(
          ((stock.currentValue / portfolioSummary.totalBalance) * 100).toFixed(1)
        );

        const displayName = stock.stockName || stock.stockSymbol || "알 수 없음";

        data.push({
          name: displayName,
          value: stock.currentValue,
          percentage: percentage,
          type: displayName === "알 수 없음" ? "unknown" : "stock",
          stockSymbol: stock.stockSymbol,
          profitLoss: stock.profitLoss,
          profitLossRate: stock.profitLossRate,
        });
      }
    });

    const dataWithColors = assignColors(data);
    setChartData(dataWithColors);
  };

  // 정렬된 차트 데이터 (비율 내림차순)
  const sortedChartData = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.percentage - a.percentage);
  }, [chartData]);

  // 항목 호버 함수
  const handleItemHover = (index: number) => {
    setHoveredIndex(index);
    setActiveIndex(index);
  };

  const handleItemLeave = () => {
    setHoveredIndex(null);
    setActiveIndex(null);
  };

  // 기하학적으로 안정적인 activeShape 컴포넌트
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
    } = props;

    return (
      <g>
        {/* 기본 슬라이스 - 원래 색상 그대로 */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
          style={{
            shapeRendering: 'geometricPrecision'
          }}
        />
        
        {/* 내부 빛나는 오버레이 - 전체 슬라이스 덧칠 */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="rgba(255,255,255,0.15)"
          stroke="none"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))'
          }}
        />
        
        {/* 두꺼운 흰색 테두리 - 외곽 (outerRadius) */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={outerRadius - 3}
          outerRadius={outerRadius + 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.8))'
          }}
        />
        
        {/* 두꺼운 흰색 테두리 - 내곽 (innerRadius) */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={innerRadius + 3}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.7))'
          }}
        />
        
        {/* 두꺼운 흰색 테두리 - 양쪽 측면 (startAngle, endAngle) */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle - 0.5}
          endAngle={startAngle + 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={4}
          strokeLinecap="round"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.8))'
          }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={endAngle - 0.5}
          endAngle={endAngle + 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={4}
          strokeLinecap="round"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.8))'
          }}
        />
      </g>
    );
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            {data.type === "cash" && <DollarSign className="w-4 h-4 text-green-500" />}
            {data.type === "stock" && <TrendingUp className="w-4 h-4 text-blue-500" />}
            {data.type === "unknown" && <HelpCircle className="w-4 h-4 text-gray-500" />}
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {data.name}
            </p>
          </div>
          {data.stockSymbol && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              종목코드: {data.stockSymbol}
            </p>
          )}
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              비중: <span className="font-medium">{data.percentage}%</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              금액: <span className="font-medium">{data.value.toLocaleString()}원</span>
            </p>
            {data.type === "stock" && data.profitLoss !== undefined && (
              <>
                <p className={`font-medium ${
                  data.profitLoss >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                }`}>
                  손익: {data.profitLoss >= 0 ? "+" : ""}{data.profitLoss.toLocaleString()}원
                </p>
                <p className={`font-medium ${
                  data.profitLossRate >= 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                }`}>
                  수익률: {data.profitLossRate >= 0 ? "+" : ""}{data.profitLossRate?.toFixed(2)}%
                </p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 단일 데이터 처리
  if (sortedChartData.length === 1) {
    return (
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            자산 배분 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div 
                className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ 
                  backgroundColor: sortedChartData[0].color,
                  border: '3px solid rgba(255,255,255,0.2)'
                }}
              >
                <div className="text-white font-bold text-lg">
                  {sortedChartData[0].percentage}%
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {sortedChartData[0].name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {sortedChartData[0].value.toLocaleString()}원
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="text-xl text-green-900 dark:text-green-100 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          자산 배분 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 도넛 차트 */}
          <div className="h-80 relative" ref={chartRef}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {/* 하칭 패턴 정의 */}
                  <pattern id="hatchPattern" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
                  </pattern>
                  {/* 클리핑 패스 정의 */}
                  <clipPath id="donutClip">
                    <rect x="0" y="0" width="100%" height="100%"/>
                  </clipPath>
                </defs>
                <Pie
                  data={sortedChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={0}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.2}
                  label={ExternalLabel}
                  labelLine={false}
                  style={{
                    shapeRendering: 'geometricPrecision'
                  }}
                >
                  {sortedChartData.map((entry, index) => {
                    console.log(`🎨 Cell ${index}:`, entry.name, entry.color); // 디버깅용 로그
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1.2}
                        style={{
                          filter: entry.percentage < 3 ? 'url(#hatchPattern)' : 'none',
                          shapeRendering: 'geometricPrecision'
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 범례 및 상세 정보 */}
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              총 자산:{" "}
              <span className="font-semibold text-green-900 dark:text-green-100">
                {portfolioSummary.totalBalance?.toLocaleString()}원
              </span>
            </div>

            <div className="space-y-2">
              {chartData
                .sort((a, b) => b.percentage - a.percentage)
                .map((item, index) => {
                  // 차트에서 해당 항목의 인덱스 찾기
                  const chartIndex = sortedChartData.findIndex(chartItem => chartItem.name === item.name);
                  const isHovered = hoveredIndex === chartIndex;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        isHovered 
                          ? "bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 shadow-lg" 
                          : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onMouseEnter={() => handleItemHover(chartIndex)}
                      onMouseLeave={handleItemLeave}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                            item.type === "unknown" ? "bg-gray-400" : ""
                          } ${isHovered ? "scale-125 ring-2 ring-yellow-400 ring-opacity-50" : ""}`}
                          style={{ 
                            backgroundColor: item.color,
                            backgroundImage: item.type === "unknown" ? "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)" : "none",
                            boxShadow: isHovered ? "0 0 10px rgba(255, 193, 7, 0.5)" : "none"
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium transition-colors duration-200 ${
                              isHovered 
                                ? "text-yellow-800 dark:text-yellow-200 font-bold" 
                                : "text-gray-900 dark:text-gray-100"
                            }`}>
                              {item.name}
                            </span>
                            {item.type === "cash" && <DollarSign className="w-3 h-3 text-green-500" />}
                            {item.type === "stock" && <TrendingUp className="w-3 h-3 text-blue-500" />}
                            {item.type === "unknown" && <HelpCircle className="w-3 h-3 text-gray-500" />}
                          </div>
                          {item.stockSymbol && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.stockSymbol}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold transition-colors duration-200 ${
                          isHovered 
                            ? "text-yellow-800 dark:text-yellow-200 font-bold" 
                            : "text-gray-900 dark:text-green-100"
                        }`}>
                          {item.percentage}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.value.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
