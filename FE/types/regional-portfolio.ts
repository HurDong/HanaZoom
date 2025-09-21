export interface RegionalPortfolioAnalysis {
  regionName: string;
  userPortfolio: UserPortfolioInfo;
  regionalAverage: RegionalAverageInfo;
  comparison: ComparisonResult;
  suitabilityScore: number;
}

export interface UserPortfolioInfo {
  stockCount: number;
  totalValue: number;
  riskLevel: string;
  diversificationScore: number;
  topStocks: StockInfo[];
}

export interface RegionalAverageInfo {
  averageStockCount: number;
  averageTotalValue: number;
  commonRiskLevel: string;
  averageDiversificationScore: number;
  popularStocks: PopularStockInfo[];
  investmentTrends: InvestmentTrend[];
}

export interface InvestmentTrend {
  sector: string;
  percentage: number;
  trend?: "up" | "down" | "stable";
}

export interface ComparisonResult {
  stockCountDifference: number;
  riskLevelMatch: boolean;
  recommendationCount: number;
  recommendations: string[];
}

export interface StockInfo {
  symbol: string;
  name: string;
  percentage: number;
  sector?: string;
  logoUrl?: string;
}

export interface PopularStockInfo {
  symbol: string;
  name: string;
  popularityScore: number;
  ranking: number;
  sector?: string;
  logoUrl?: string;
}
