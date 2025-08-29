import api from '@/app/config/api';

export interface StockMinutePrice {
  id: number;
  stockSymbol: string;
  minuteInterval: 'ONE_MINUTE' | 'FIVE_MINUTES' | 'FIFTEEN_MINUTES';
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  priceChange: string;
  priceChangePercent: string;
  vwap?: string;
  tickCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MinuteInterval {
  ONE_MINUTE: 'ONE_MINUTE';
  FIVE_MINUTES: 'FIVE_MINUTES';
  FIFTEEN_MINUTES: 'FIFTEEN_MINUTES';
}

export const minuteApi = {
  /**
   * 특정 종목의 특정 분봉 간격 데이터 조회 (최근 N개)
   */
  getRecentMinutePrices: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    limit: number = 100
  ): Promise<StockMinutePrice[]> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}`,
      {
        params: { limit }
      }
    );
    return response.data;
  },

  /**
   * 특정 종목의 특정 분봉 간격 데이터 조회 (시간 범위 지정)
   */
  getMinutePricesByTimeRange: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    startTime: string,
    endTime: string
  ): Promise<StockMinutePrice[]> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/range`,
      {
        params: { startTime, endTime }
      }
    );
    return response.data;
  },

  /**
   * 특정 종목의 특정 분봉 간격 데이터 개수 조회
   */
  getMinutePriceCount: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval']
  ): Promise<number> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/count`
    );
    return response.data;
  },

  /**
   * 오래된 분봉 데이터 정리
   */
  cleanupOldMinutePrices: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    cutoffTime: string
  ): Promise<void> => {
    await api.delete(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/cleanup`,
      {
        params: { cutoffTime }
      }
    );
  },

  /**
   * 특정 종목의 모든 분봉 데이터 삭제
   */
  deleteAllMinutePrices: async (stockSymbol: string): Promise<void> => {
    await api.delete(`/api/stock-minute-prices/${stockSymbol}`);
  }
};

/**
 * 분봉 간격을 사용자 친화적인 텍스트로 변환
 */
export const getMinuteIntervalLabel = (interval: StockMinutePrice['minuteInterval']): string => {
  switch (interval) {
    case 'ONE_MINUTE':
      return '1분';
    case 'FIVE_MINUTES':
      return '5분';
    case 'FIFTEEN_MINUTES':
      return '15분';
    default:
      return interval;
  }
};

/**
 * 분봉 간격을 프론트엔드 타임프레임 코드로 변환
 */
export const getMinuteIntervalTimeframe = (interval: StockMinutePrice['minuteInterval']): string => {
  switch (interval) {
    case 'ONE_MINUTE':
      return '1M';
    case 'FIVE_MINUTES':
      return '5M';
    case 'FIFTEEN_MINUTES':
      return '15M';
    default:
      return '5M';
  }
};

/**
 * 프론트엔드 타임프레임 코드를 분봉 간격으로 변환
 */
export const getTimeframeMinuteInterval = (timeframe: string): StockMinutePrice['minuteInterval'] => {
  switch (timeframe) {
    case '1M':
      return 'ONE_MINUTE';
    case '5M':
      return 'FIVE_MINUTES';
    case '15M':
      return 'FIFTEEN_MINUTES';
    default:
      return 'FIVE_MINUTES';
  }
};
