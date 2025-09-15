"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { MouseFollower } from "@/components/mouse-follower";
import { useAuthStore } from "@/app/utils/auth";
import { 
  getOrders, 
  getPendingOrders, 
  cancelOrder, 
  type OrderResponse,
  type OrdersPageResponse 
} from "@/lib/api/order";
import { toast } from "sonner";

export default function OrdersPage() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<OrdersPageResponse | null>(null);
  const [pendingOrders, setPendingOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // 주문 목록 조회
  const fetchOrders = async (page: number = 0) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const result = await getOrders(page, 20);
      setOrders(result);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("주문 목록 조회 실패:", error);
      toast.error("주문 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 미체결 주문 조회
  const fetchPendingOrders = async () => {
    if (!accessToken) return;

    try {
      const result = await getPendingOrders();
      setPendingOrders(result);
    } catch (error: any) {
      console.error("미체결 주문 조회 실패:", error);
      toast.error("미체결 주문을 불러올 수 없습니다.");
    }
  };

  // 주문 취소
  const handleCancelOrder = async (orderId: number) => {
    if (!accessToken) return;

    try {
      await cancelOrder(orderId);
      toast.success("주문이 취소되었습니다.");
      
      // 목록 새로고침
      if (activeTab === "all") {
        fetchOrders(currentPage);
      } else {
        fetchPendingOrders();
      }
    } catch (error: any) {
      console.error("주문 취소 실패:", error);
      toast.error("주문 취소에 실패했습니다.");
    }
  };

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "all") {
        await fetchOrders(currentPage);
      } else {
        await fetchPendingOrders();
      }
      toast.success("주문 목록이 새로고침되었습니다.");
    } catch (error) {
      toast.error("새로고침에 실패했습니다.");
    } finally {
      setRefreshing(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (accessToken) {
      fetchOrders();
      fetchPendingOrders();
    }
  }, [accessToken]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "pending" && accessToken) {
      fetchPendingOrders();
    }
  }, [activeTab, accessToken]);

  // 로그인 상태 확인
  if (!accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <NavBar />
        <div className="fixed top-16 left-0 right-0 z-[60]">
          <StockTicker />
        </div>
        <main className="pt-28 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  로그인이 필요합니다
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  주문 내역을 확인하려면 로그인해주세요.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 주문 상태에 따른 아이콘과 색상
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "PARTIAL_FILLED":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "FILLED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "PARTIAL_FILLED":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "FILLED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  // 주문 카드 컴포넌트
  const OrderCard = ({ order }: { order: OrderResponse }) => (
    <Card className="hover:shadow-md transition-shadow relative z-10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {order.orderType === "BUY" ? (
              <TrendingUp className="w-5 h-5 text-red-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <h3 className="font-semibold text-lg">{order.stockName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{order.stockCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <Badge className={getStatusColor(order.status)}>
              {order.statusMessage}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">주문 방법</p>
            <p className="font-medium">
              {order.orderMethod === "LIMIT" ? "지정가" : "시장가"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">주문 가격</p>
            <p className="font-medium">{order.price.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">주문 수량</p>
            <p className="font-medium">{order.quantity.toLocaleString()}주</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">총 금액</p>
            <p className="font-medium">{order.totalAmount.toLocaleString()}원</p>
          </div>
        </div>

        {order.status === "PARTIAL_FILLED" && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg mb-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-orange-600 dark:text-orange-400">체결 수량</p>
                <p className="font-medium">{order.filledQuantity.toLocaleString()}주</p>
              </div>
              <div>
                <p className="text-orange-600 dark:text-orange-400">체결률</p>
                <p className="font-medium">{order.fillRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(order.orderTime).toLocaleString()}
          </div>
          {(order.status === "PENDING" || order.status === "PARTIAL_FILLED") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelOrder(order.id)}
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              취소
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <MouseFollower />
      
      
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <NavBar />
      
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="pt-28 pb-8 relative z-10">
        <div className="container mx-auto px-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
                주문 내역
              </h1>
              <p className="text-green-600 dark:text-green-400 mt-1">
                나의 주문 현황을 확인하세요
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">새로고침</span>
            </Button>
          </div>

          {/* 탭 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-green-200 dark:border-green-700 shadow-lg">
              <TabsTrigger value="all" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                전체 주문
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                미체결 주문
              </TabsTrigger>
            </TabsList>

            {/* 전체 주문 탭 */}
            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  <span className="ml-2 text-green-600">주문 목록을 불러오는 중...</span>
                </div>
              ) : orders && orders.content.length > 0 ? (
                <div className="space-y-4">
                  {orders.content.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  
                  {/* 페이지네이션 */}
                  {orders.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => fetchOrders(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        이전
                      </Button>
                      <span className="px-4 py-2 text-sm">
                        {currentPage + 1} / {orders.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => fetchOrders(currentPage + 1)}
                        disabled={currentPage === orders.totalPages - 1}
                      >
                        다음
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    주문 내역이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    아직 주문한 내역이 없습니다.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* 미체결 주문 탭 */}
            <TabsContent value="pending" className="mt-6">
              {pendingOrders.length > 0 ? (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                    미체결 주문이 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    모든 주문이 체결되었습니다.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}






