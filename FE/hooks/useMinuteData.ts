import { useState, useEffect, useCallback } from 'react';
import { minuteApi, StockMinutePrice, getTimeframeMinuteInterval } from '@/lib/api/minute';

interface UseMinuteDataProps {
  stockSymbol: string;
  timeframe: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMinuteDataReturn {
  data: StockMinutePrice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateData: (newData: StockMinutePrice[]) => void;
}

export const useMinuteData = ({
  stockSymbol,
  timeframe,
  limit = 100,
  autoRefresh = false,
  refreshInterval = 5000
}: UseMinuteDataProps): UseMinuteDataReturn => {
  const [data, setData] = useState<StockMinutePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stockSymbol || !timeframe) return;

    // 분봉이 아닌 경우 데이터를 가져오지 않음
    if (!['1M', '5M', '15M'].includes(timeframe)) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const minuteInterval = getTimeframeMinuteInterval(timeframe);
      const minuteData = await minuteApi.getRecentMinutePrices(stockSymbol, minuteInterval, limit);

      // 시간순으로 정렬 (오래된 것부터 최신 순)
      const sortedData = minuteData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(sortedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분봉 데이터 조회 실패';
      setError(errorMessage);
      console.error('분봉 데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [stockSymbol, timeframe, limit]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateData = useCallback((newData: StockMinutePrice[]) => {
    setData(newData);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // 실시간 데이터 업데이트 (WebSocket 등에서 호출)
  const handleRealtimeUpdate = useCallback((newPrice: StockMinutePrice) => {
    setData(prevData => {
      // 기존 데이터에서 같은 시간의 데이터가 있는지 확인
      const existingIndex = prevData.findIndex(
        item => item.timestamp === newPrice.timestamp
      );

      if (existingIndex >= 0) {
        // 기존 데이터 업데이트
        const updatedData = [...prevData];
        updatedData[existingIndex] = newPrice;
        return updatedData;
      } else {
        // 새로운 데이터 추가 (최신 데이터는 맨 뒤에)
        return [...prevData, newPrice].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
    });
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    updateData,
    handleRealtimeUpdate
  };
};

/**
 * 특정 시간 범위의 분봉 데이터를 조회하는 훅
 */
export const useMinuteDataByTimeRange = (
  stockSymbol: string,
  timeframe: string,
  startTime: string,
  endTime: string
) => {
  const [data, setData] = useState<StockMinutePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stockSymbol || !timeframe || !startTime || !endTime) return;

    // 분봉이 아닌 경우 데이터를 가져오지 않음
    if (!['1M', '5M', '15M'].includes(timeframe)) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const minuteInterval = getTimeframeMinuteInterval(timeframe);
      const minuteData = await minuteApi.getMinutePricesByTimeRange(
        stockSymbol, 
        minuteInterval, 
        startTime, 
        endTime
      );

      // 시간순으로 정렬
      const sortedData = minuteData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(sortedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분봉 데이터 조회 실패';
      setError(errorMessage);
      console.error('분봉 데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [stockSymbol, timeframe, startTime, endTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
};

