import api from "@/app/config/api";

export interface Stock {
  symbol: string;
  name: string;
  market: string;
  sector: string;
  emoji: string;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  volume: number | null;
  marketCap: number | null;
}

export const getStock = async (symbol: string): Promise<Stock> => {
  const response = await api.get<{ success: boolean; data: Stock }>(
    `/stocks/${symbol}`
  );
  return response.data.data;
};

export const getStocks = async (page = 0, size = 20) => {
  const response = await api.get("/stocks", {
    params: { page, size },
  });
  return response.data;
};

export const searchStocks = async (query: string) => {
  const response = await api.get("/stocks/search", {
    params: { query },
  });
  return response.data;
};
