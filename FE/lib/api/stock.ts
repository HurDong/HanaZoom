import api, { API_ENDPOINTS } from "@/app/config/api";

export interface Stock {
  symbol: string;
  name: string;
  market: string;
  sector: string;
  logoUrl: string;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  volume: number | null;
  marketCap: number | null;
}

// Elasticsearch 검색 결과 타입
export interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: string;
  priceChangePercent: string;
  logoUrl: string;
  score: number;
  matchType: string;
  highlightedName?: string;
  // 프론트엔드 호환성 필드
  stockCode: string;
  stockName: string;
  price: string;
  change: string;
  changeRate: string;
}

// WTS 관련 타입 정의
export interface StockPriceData {
  stockCode: string;
  stockName: string;
  currentPrice: string;
  changePrice: string;
  changeRate: string;
  changeSign: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  marketCap: string;
  previousClose: string;
  updatedTime: string;
  changeStatus: string;
  positiveChange: boolean;
  negativeChange: boolean;
  // 장 운영 상태 관련 필드
  isMarketOpen: boolean;
  isAfterMarketClose: boolean;
  marketStatus: string;
  // 호가창 데이터 필드들 (웹소켓 실시간 데이터)
  askOrders?: OrderBookItem[];
  bidOrders?: OrderBookItem[];
  totalAskQuantity?: string;
  totalBidQuantity?: string;
  imbalanceRatio?: number;
  spread?: number;
  buyDominant?: boolean;
  sellDominant?: boolean;
}

export interface OrderBookItem {
  price: string;
  quantity: string;
  rank: number;
  priceAsLong: number;
  quantityAsLong: number;
}

export interface OrderBookData {
  stockCode: string;
  stockName: string;
  currentPrice: string;
  updatedTime: string;
  askOrders: OrderBookItem[];
  bidOrders: OrderBookItem[];
  totalAskQuantity: string;
  totalBidQuantity: string;
  imbalanceRatio: number;
  spread: number;
  sellDominant: boolean;
  buyDominant: boolean;
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

// Elasticsearch 기반 주식 검색 (오타 허용 + 형태소 분석)
export const searchStocks = async (
  query: string
): Promise<{ success: boolean; data: StockSearchResult[] }> => {
  const response = await api.get("/stocks/search", {
    params: { query },
  });
  return response.data;
};

// 자동완성 제안
export const suggestStocks = async (
  prefix: string
): Promise<{ success: boolean; data: string[] }> => {
  const response = await api.get("/stocks/suggest", {
    params: { prefix },
  });
  return response.data;
};

// 섹터별 검색
export const searchStocksBySector = async (
  keyword: string,
  sector: string
): Promise<{ success: boolean; data: StockSearchResult[] }> => {
  const response = await api.get("/stocks/search/sector", {
    params: { keyword, sector },
  });
  return response.data;
};

// Elasticsearch 수동 동기화 (관리자용)
export const syncStocksToElasticsearch = async (): Promise<{
  success: boolean;
  data: string;
}> => {
  const response = await api.post("/stocks/sync");
  return response.data;
};

export const getTopStocksByRegion = async (regionId: number) => {
  const response = await api.get(`/regions/${regionId}/top-stocks`);
  return response.data;
};

// 지역×종목 인기도 상세(전일 기준, 뉴스 조각은 현재 숨김)
export interface PopularityDetailsResponse {
  regionId: number;
  symbol: string;
  date: string;
  score: number; // 0~100 스케일 (최종 점수)
  tradeTrend: number; // 0~100 스케일
  community: number; // 0~100 스케일
  momentum: number; // 0~100 스케일
  newsImpact: number; // 0~100 스케일 (현재 0)
  weightTradeTrend: number;
  weightCommunity: number;
  weightMomentum: number;
  weightNews: number;
  postCount: number;
  commentCount: number;
  voteCount: number;
  viewCount: number;
}

export const getPopularityDetails = async (
  regionId: number,
  symbol: string,
  date: string = "latest"
): Promise<PopularityDetailsResponse> => {
  try {
    const res = await api.get<{
      success: boolean;
      data: PopularityDetailsResponse;
    }>(`/regions/${regionId}/stocks/${symbol}/popularity`, {
      params: { date },
    });

    return res.data.data;
  } catch (error) {
    console.error(`❌ [API] getPopularityDetails 에러:`, error);
    throw error;
  }
};

// WTS 관련 API 함수들
export const getStockRealTimePrice = async (
  stockCode: string
): Promise<StockPriceData> => {
  const response = await api.get<{ success: boolean; data: StockPriceData }>(
    `${API_ENDPOINTS.stockRealtime}/${stockCode}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "실시간 가격 조회에 실패했습니다."
    );
  }

  return response.data.data;
};

export const getStockOrderBook = async (
  stockCode: string
): Promise<OrderBookData> => {
  const response = await api.get<{ success: boolean; data: OrderBookData }>(
    `${API_ENDPOINTS.stockOrderbook}/${stockCode}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "호가창 정보 조회에 실패했습니다."
    );
  }

  return response.data.data;
};

// 여러 종목의 실시간 정보를 한번에 가져오는 함수 (나중에 배치 API 구현 시 사용)
export const getMultipleStockPrices = async (
  stockCodes: string[]
): Promise<StockPriceData[]> => {
  const promises = stockCodes.map((code) => getStockRealTimePrice(code));
  const results = await Promise.allSettled(promises);

  return results
    .filter(
      (result): result is PromiseFulfilledResult<StockPriceData> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
};

// 종목 코드 유효성 검증 함수
export const validateStockCode = (stockCode: string): boolean => {
  // 한국 주식 종목코드는 6자리 숫자
  return /^\d{6}$/.test(stockCode);
};

// 종목 검색 함수 (기존 것을 WTS용으로 확장)
export const searchStocksWTS = async (query: string) => {
  const response = await api.get(API_ENDPOINTS.stockSearch, {
    params: { query },
  });
  return response.data;
};
