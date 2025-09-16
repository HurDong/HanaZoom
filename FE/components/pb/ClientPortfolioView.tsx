"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BarChart3, 
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  PieChart,
  Activity
} from "lucide-react";
import { 
  getClientPortfolioSummary, 
  getClientPortfolioStocks, 
  getClientTradeHistory,
  PortfolioSummary,
  PortfolioStock
} from "@/lib/api/portfolio";

interface ClientPortfolioViewProps {
  clientId: string;
  clientName: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function ClientPortfolioView({ 
  clientId, 
  clientName, 
  isVisible, 
  onClose 
}: ClientPortfolioViewProps) {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDetails, setShowDetails] = useState(false);

  // 포트폴리오 데이터 로드
  const loadPortfolioData = async () => {
    if (!clientId) {
      setError("고객이 아직 입장하지 않았습니다. 고객이 입장한 후 포트폴리오를 조회할 수 있습니다.");
      return;
    }
    
    console.log("🔍 포트폴리오 데이터 로드 시작:", {
      clientId,
      clientName,
      hasClientId: !!clientId
    });
    
    setLoading(true);
    setError(null);

    try {
      console.log("📡 API 호출 시작...");
      
      const [summary, stocks, trades] = await Promise.all([
        getClientPortfolioSummary(clientId),
        getClientPortfolioStocks(clientId),
        getClientTradeHistory(clientId)
      ]);

      console.log("📊 API 응답 데이터:", {
        summary,
        stocks,
        trades,
        summaryLength: summary ? Object.keys(summary).length : 0,
        stocksLength: stocks ? stocks.length : 0,
        tradesLength: trades ? trades.length : 0
      });

      setPortfolioSummary(summary);
      setPortfolioStocks(stocks);
      setTradeHistory(trades);
    } catch (err) {
      console.error("❌ 고객 포트폴리오 조회 실패:", err);
      console.error("에러 상세:", {
        message: err instanceof Error ? err.message : "알 수 없는 오류",
        stack: err instanceof Error ? err.stack : undefined,
        clientId
      });
      setError(`포트폴리오 정보를 불러올 수 없습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible && clientId) {
      loadPortfolioData();
    }
  }, [isVisible, clientId]);

  if (!isVisible) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return "text-green-600 dark:text-green-400";
    if (amount < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getProfitLossIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-4 h-4" />;
    if (amount < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {clientName}님의 포트폴리오
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                실시간 포트폴리오 현황
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={loadPortfolioData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showDetails ? '간단히' : '상세히'}</span>
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-emerald-700 dark:text-emerald-300">
                  포트폴리오 정보를 불러오는 중...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={loadPortfolioData} variant="outline">
                다시 시도
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="stocks">보유종목</TabsTrigger>
                <TabsTrigger value="trades">거래내역</TabsTrigger>
              </TabsList>

              {/* 포트폴리오 개요 */}
              <TabsContent value="overview" className="space-y-6">
                {portfolioSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 총 자산 */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 자산</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(portfolioSummary.totalBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          포트폴리오 총 가치
                        </p>
                      </CardContent>
                    </Card>

                    {/* 총 손익 */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 손익</CardTitle>
                        <div className={`flex items-center space-x-1 ${getProfitLossColor(portfolioSummary.totalProfitLoss)}`}>
                          {getProfitLossIcon(portfolioSummary.totalProfitLoss)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getProfitLossColor(portfolioSummary.totalProfitLoss)}`}>
                          {formatCurrency(portfolioSummary.totalProfitLoss)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatPercentage(portfolioSummary.totalProfitLossRate)}
                        </p>
                      </CardContent>
                    </Card>

                    {/* 보유 종목 수 */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {portfolioSummary.totalStockCount}개
                        </div>
                        <p className="text-xs text-muted-foreground">
                          현재 보유 중인 종목
                        </p>
                      </CardContent>
                    </Card>

                    {/* 총 현금 */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">총 현금</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(portfolioSummary.totalCash)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          사용 가능한 현금
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* 보유 종목 요약 */}
                {portfolioStocks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>보유 종목 현황</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {portfolioStocks.slice(0, showDetails ? portfolioStocks.length : 5).map((stock, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {stock.stockSymbol?.slice(-2) || '??'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {stock.stockName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {stock.stockSymbol} • {stock.quantity}주
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(stock.currentValue)}
                              </p>
                              <div className={`flex items-center space-x-1 text-sm ${getProfitLossColor(stock.profitLoss)}`}>
                                {getProfitLossIcon(stock.profitLoss)}
                                <span>{formatPercentage(stock.profitLossRate)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!showDetails && portfolioStocks.length > 5 && (
                          <Button
                            onClick={() => setShowDetails(true)}
                            variant="outline"
                            className="w-full"
                          >
                            {portfolioStocks.length - 5}개 더 보기
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 보유 종목 상세 */}
              <TabsContent value="stocks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>보유 종목 상세</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-2">종목명</th>
                            <th className="text-right py-3 px-2">보유수량</th>
                            <th className="text-right py-3 px-2">평균단가</th>
                            <th className="text-right py-3 px-2">현재가</th>
                            <th className="text-right py-3 px-2">평가금액</th>
                            <th className="text-right py-3 px-2">손익</th>
                            <th className="text-right py-3 px-2">수익률</th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioStocks.map((stock, index) => (
                            <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-3 px-2">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {stock.stockName}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {stock.stockSymbol}
                                  </p>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2">
                                {stock.quantity.toLocaleString()}주
                              </td>
                              <td className="text-right py-3 px-2">
                                {formatCurrency(stock.avgPurchasePrice)}
                              </td>
                              <td className="text-right py-3 px-2">
                                {formatCurrency(stock.currentPrice)}
                              </td>
                              <td className="text-right py-3 px-2">
                                {formatCurrency(stock.currentValue)}
                              </td>
                              <td className={`text-right py-3 px-2 ${getProfitLossColor(stock.profitLoss)}`}>
                                {formatCurrency(stock.profitLoss)}
                              </td>
                              <td className={`text-right py-3 px-2 ${getProfitLossColor(stock.profitLoss)}`}>
                                {formatPercentage(stock.profitLossRate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 거래 내역 */}
              <TabsContent value="trades" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>최근 거래 내역</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tradeHistory.length > 0 ? (
                      <div className="space-y-3">
                        {tradeHistory.slice(0, 10).map((trade, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant={trade.tradeType === 'BUY' ? 'default' : 'destructive'}>
                                {trade.tradeType === 'BUY' ? '매수' : '매도'}
                              </Badge>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {trade.stockName || trade.stockSymbol}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {trade.quantity}주 • {formatCurrency(trade.price)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(trade.totalAmount)}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(trade.tradeDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        거래 내역이 없습니다.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
