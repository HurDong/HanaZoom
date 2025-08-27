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
