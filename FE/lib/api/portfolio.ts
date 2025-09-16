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
  stockSymbol: string;
  stockName: string;
  
  // 보유 수량
  quantity: number;
  availableQuantity: number;
  frozenQuantity: number;
  
  // 매수 정보
  avgPurchasePrice: number;
  totalPurchaseAmount: number;
  
  // 현재 평가 정보
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  
  // 거래 정보
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  lastSaleDate: string;
  
  // 종목별 비중
  allocationRate: number;
  
  // 성과 정보
  isProfitable: boolean;
  performanceStatus: string;
}

export interface PortfolioSummary {
  accountId: number;
  accountNumber: string;
  accountName: string;
  balanceDate: string;
  
  // 현금 잔고
  availableCash: number;
  settlementCash: number;
  withdrawableCash: number;
  frozenCash: number;
  totalCash: number;
  
  // 주식 평가 정보
  totalStockValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  
  // 계좌 총액
  totalBalance: number;
  
  // 포트폴리오 구성
  totalStockCount: number;
  stockAllocationRate: number;
  cashAllocationRate: number;
  
  // 성과 정보
  dailyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
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
    const stock = stocks.find(s => s.stockSymbol === stockCode);
    return stock?.availableQuantity ?? 0;
  } catch (error) {
    console.error('보유 수량 조회 실패:', error);
    return 0;
  }
};

// PB가 고객의 포트폴리오 요약 조회
export const getClientPortfolioSummary = async (clientId: string): Promise<PortfolioSummary> => {
  console.log("🔍 getClientPortfolioSummary 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/summary`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/summary`);
    console.log("✅ getClientPortfolioSummary 응답:", {
      status: response.status,
      data: response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientPortfolioSummary 실패:", error);
    throw error;
  }
};

// PB가 고객의 포트폴리오 보유 주식 목록 조회
export const getClientPortfolioStocks = async (clientId: string): Promise<PortfolioStock[]> => {
  console.log("🔍 getClientPortfolioStocks 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/stocks`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/stocks`);
    console.log("✅ getClientPortfolioStocks 응답:", {
      status: response.status,
      data: response.data,
      dataLength: response.data ? response.data.length : 0
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientPortfolioStocks 실패:", error);
    throw error;
  }
};

// PB가 고객의 거래 내역 조회
export const getClientTradeHistory = async (clientId: string): Promise<any[]> => {
  console.log("🔍 getClientTradeHistory 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/trades`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/trades`);
    console.log("✅ getClientTradeHistory 응답:", {
      status: response.status,
      data: response.data,
      dataLength: response.data ? response.data.length : 0
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientTradeHistory 실패:", error);
    throw error;
  }
};