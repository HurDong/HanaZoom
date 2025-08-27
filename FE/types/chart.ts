export interface ChartDataDto {
  stockSymbol: string;
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  volume: number;
  priceChange: number;
  priceChangePercent: number;
  // 추가된 속성들
  timestamp?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  change?: string;
  changePercent?: string;
  isComplete?: boolean;
}

// 백엔드 CandleData와 일치하는 타입
export interface CandleData {
  stockCode: string;
  dateTime: string;
  timeframe: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  changePrice: string;
  changeRate: string;
  changeSign: string;
  isComplete: boolean;
  timestamp: number;
}

export type ChartPeriod = "daily" | "weekly" | "monthly";

export interface ChartConfig {
  period: ChartPeriod;
  days?: number;
  weeks?: number;
  months?: number;
}

export interface ChartData {
  daily: ChartDataDto[];
  weekly: ChartDataDto[];
  monthly: ChartDataDto[];
}
