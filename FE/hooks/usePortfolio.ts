import { useState } from "react";
import { getAccessToken } from "@/app/utils/auth";
import {
  Account,
  AccountBalance,
  PortfolioStock,
  TradeHistory,
  PortfolioSummary,
  TradeResult,
  SettlementSchedule,
} from "@/types/portfolio";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const usePortfolio = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const retryApiCall = async <T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 2,
    delay: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (err) {
        if (attempt === maxRetries) {
          throw err;
        }
        // 재시도 전 잠시 대기
        await new Promise((resolve) =>
          setTimeout(resolve, delay * (attempt + 1))
        );
      }
    }
    return null;
  };

  // 포트폴리오 요약 조회
  const getPortfolioSummary = async (): Promise<PortfolioSummary | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/summary`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `포트폴리오 요약 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 포트폴리오 주식 목록 조회
  const getPortfolioStocks = async (): Promise<PortfolioStock[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/stocks`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `포트폴리오 주식 목록 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 거래 내역 조회
  const getTradeHistory = async (): Promise<TradeHistory[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/trades`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `거래 내역 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 거래 결과 조회
  const getTradeResult = async (): Promise<TradeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/portfolio/trade-result`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `거래 결과 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 정산 일정 조회
  const getSettlementSchedule =
    async (): Promise<SettlementSchedule | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await retryApiCall(async () => {
          const token = getAccessToken();
          if (!token) {
            throw new Error("인증 토큰이 없습니다.");
          }

          const response = await fetch(
            `${API_BASE_URL}/api/portfolio/settlement-schedule`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error(
              `정산 일정 조회에 실패했습니다. (${response.status})`
            );
          }

          const data = await response.json();
          return data;
        });

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    };

  // 계좌 정보 조회
  const getAccountInfo = async (): Promise<Account | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/account`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `계좌 정보 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 계좌 잔고 조회
  const getAccountBalance = async (): Promise<AccountBalance | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/portfolio/account/balance`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            `계좌 잔고 조회에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 주식 매수
  const buyStock = async (
    stockCode: string,
    quantity: number,
    price: number
  ): Promise<TradeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/buy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ stockCode, quantity, price }),
        });

        if (!response.ok) {
          throw new Error(`주식 매수에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 주식 매도
  const sellStock = async (
    stockCode: string,
    quantity: number,
    price: number
  ): Promise<TradeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(`${API_BASE_URL}/api/portfolio/sell`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ stockCode, quantity, price }),
        });

        if (!response.ok) {
          throw new Error(`주식 매도에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 주식 조회
  const getStockInfo = async (
    stockCode: string
  ): Promise<PortfolioStock | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/portfolio/stock/${stockCode}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`주식 조회에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        return data;
      });

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 주식 검색
  const searchStocks = async (keyword: string): Promise<PortfolioStock[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await retryApiCall(async () => {
        const token = getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/portfolio/search-stocks?keyword=${keyword}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`주식 검색에 실패했습니다. (${response.status})`);
        }

        const data = await response.json();
        return data;
      });

      return result || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    getPortfolioSummary,
    getPortfolioStocks,
    getTradeHistory,
    getTradeResult,
    getSettlementSchedule,
    getAccountInfo,
    getAccountBalance,
    buyStock,
    sellStock,
    getStockInfo,
    searchStocks,
  };
};
