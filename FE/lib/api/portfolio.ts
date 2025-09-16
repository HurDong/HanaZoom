import api from '@/app/config/api';

export interface Account {
  id: number;
  memberId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  id: number;
  accountId: number;
  availableCash: number;
  totalBalance: number;
  balanceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStock {
  id: number;
  accountId?: number;
  // 백엔드 응답은 stockSymbol을 사용하므로 둘 다 허용
  stockCode?: string;
  stockSymbol?: string;
  stockName?: string;
  quantity?: number;
  availableQuantity?: number;
  avgPurchasePrice?: number;
  currentPrice?: number;
  currentValue?: number;
  totalPurchaseAmount?: number;
  profitLoss?: number;
  profitLossRate?: number;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPurchaseAmount: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  stockCount: number;
}

// 계좌 정보 조회
export const getAccount = async (): Promise<Account> => {
  const response = await api.get('/portfolio/account');
  return response.data;
};

// 계좌 잔고 조회
export const getAccountBalance = async (): Promise<AccountBalance> => {
  const response = await api.get('/portfolio/account/balance');
  return response.data;
};

// 포트폴리오 요약 조회
export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  const response = await api.get('/portfolio/summary');
  return response.data;
};

// 보유 주식 목록 조회
export const getPortfolioStocks = async (): Promise<PortfolioStock[]> => {
  const response = await api.get('/portfolio/stocks');
  return response.data;
};

// 특정 종목 보유 수량 조회
export const getStockQuantity = async (stockCode: string): Promise<number> => {
  try {
    const stocks = await getPortfolioStocks();
    const stock = stocks.find(s => (s.stockCode || s.stockSymbol) === stockCode);
    return stock?.availableQuantity ?? 0;
  } catch (error) {
    console.error('보유 수량 조회 실패:', error);
    return 0;
  }
};

// PB가 고객의 포트폴리오 요약 조회
export const getClientPortfolioSummary = async (clientId: string): Promise<PortfolioSummary> => {
  const response = await api.get(`/portfolio/client/${clientId}/summary`);
  return response.data;
};

// PB가 고객의 포트폴리오 보유 주식 목록 조회
export const getClientPortfolioStocks = async (clientId: string): Promise<PortfolioStock[]> => {
  const response = await api.get(`/portfolio/client/${clientId}/stocks`);
  return response.data;
};

// PB가 고객의 거래 내역 조회
export const getClientTradeHistory = async (clientId: string): Promise<any[]> => {
  const response = await api.get(`/portfolio/client/${clientId}/trades`);
  return response.data;
};