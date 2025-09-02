import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { createOrder, type OrderRequest } from "@/lib/api/order";
import { useAuthStore } from "@/app/utils/auth";
import { toast } from "sonner";
import { getAccountBalance, getStockQuantity, type AccountBalance } from "@/lib/api/portfolio";

interface TradingOrderPanelProps {
  stockCode: string;
  currentPrice: string;
  orderBookData: any;
}

export const TradingOrderPanel = forwardRef<any, TradingOrderPanelProps>(
  ({ stockCode, currentPrice, orderBookData }, ref) => {
    const { accessToken } = useAuthStore();
    const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [orderMethod, setOrderMethod] = useState<"LIMIT" | "MARKET">("LIMIT");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastOrderResult, setLastOrderResult] = useState<{
      success: boolean;
      message: string;
      orderId?: number;
    } | null>(null);
    
    // 계좌 정보 상태
    const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
    const [stockQuantity, setStockQuantity] = useState<number>(0);
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);

    // 계좌 정보 로드
    const loadAccountInfo = async () => {
      if (!accessToken) return;
      
      setIsLoadingAccount(true);
      try {
        const [balance, quantity] = await Promise.all([
          getAccountBalance(),
          getStockQuantity(stockCode)
        ]);
        setAccountBalance(balance);
        setStockQuantity(quantity);
      } catch (error) {
        console.error('계좌 정보 로드 실패:', error);
        toast.error('계좌 정보를 불러올 수 없습니다.');
      } finally {
        setIsLoadingAccount(false);
      }
    };

    // 컴포넌트 마운트 시 계좌 정보 로드
    useEffect(() => {
      loadAccountInfo();
    }, [accessToken, stockCode]);

    // ref를 통해 외부에서 호출할 수 있는 메서드들
    useImperativeHandle(ref, () => ({
      setPrice: (newPrice: string) => {
        setPrice(newPrice);
        setOrderMethod("LIMIT"); // 가격이 설정되면 지정가로 변경
      },
    }));

    // 현재가 기준 빠른 주문
    const handleQuickOrder = (type: "BUY" | "SELL") => {
      if (!currentPrice) {
        alert("현재가 정보가 없습니다.");
        return;
      }
      setOrderType(type);
      setPrice(currentPrice);
      setOrderMethod("MARKET");
    };

    // 호가창 가격 클릭 시 주문 패널에 입력
    const handlePriceClick = (clickedPrice: string) => {
      setPrice(clickedPrice);
      setOrderMethod("LIMIT");
    };

    // 주문 실행
    const handleOrder = async () => {
      if (!accessToken) {
        toast.error("주문을 하려면 로그인이 필요합니다.");
        return;
      }

      if (!quantity) {
        toast.error("수량을 입력해주세요.");
        return;
      }

      if (orderMethod === "LIMIT" && (!price || parseFloat(price) <= 0)) {
        toast.error("지정가 주문에서는 가격을 입력해주세요.");
        return;
      }

      if (parseInt(quantity) <= 0) {
        toast.error("수량은 1 이상이어야 합니다.");
        return;
      }

      setIsSubmitting(true);
      setLastOrderResult(null);

      try {
        const orderRequest: OrderRequest = {
          stockCode,
          orderType,
          orderMethod,
          price: orderMethod === "MARKET" ? parseFloat(currentPrice || "0") : parseFloat(price),
          quantity: parseInt(quantity),
        };

        const result = await createOrder(orderRequest);
        
        setLastOrderResult({
          success: true,
          message: `${orderType === "BUY" ? "매수" : "매도"} 주문이 성공적으로 접수되었습니다.`,
          orderId: result.id,
        });

        toast.success(`${orderType === "BUY" ? "매수" : "매도"} 주문이 접수되었습니다. (주문번호: ${result.id})`);
        
        // 주문 성공 후 입력 필드 초기화
        setPrice("");
        setQuantity("");
        
        // 계좌 정보 새로고침
        loadAccountInfo();
        
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "주문 처리 중 오류가 발생했습니다.";
        
        setLastOrderResult({
          success: false,
          message: errorMessage,
        });

        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        {/* 빠른 주문 버튼 */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleQuickOrder("BUY")}
            disabled={!currentPrice}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            시장가 매수
          </Button>
          <Button
            onClick={() => handleQuickOrder("SELL")}
            disabled={!currentPrice}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            시장가 매도
          </Button>
        </div>

        {/* 주문 타입 선택 */}
        <div className="flex gap-1">
          <Button
            variant={orderType === "BUY" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("BUY")}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            매수
          </Button>
          <Button
            variant={orderType === "SELL" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("SELL")}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            매도
          </Button>
        </div>

        {/* 주문 방법 선택 */}
        <div className="flex gap-1">
          <Button
            variant={orderMethod === "LIMIT" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("LIMIT")}
            className="flex-1"
          >
            지정가
          </Button>
          <Button
            variant={orderMethod === "MARKET" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("MARKET")}
            className="flex-1"
          >
            시장가
          </Button>
        </div>

        {/* 주문 정보 입력 */}
        <div className="space-y-3">
          <div>
            <Label>가격</Label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={orderMethod === "MARKET" ? "시장가" : "주문 가격"}
              disabled={orderMethod === "MARKET"}
              type="number"
              min="0"
              step="1"
            />
            {orderMethod === "MARKET" && currentPrice && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                현재가: {parseInt(currentPrice).toLocaleString()}원
              </div>
            )}
          </div>

          <div>
            <Label>수량</Label>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="주문 수량"
              type="number"
              min="1"
              step="1"
            />
          </div>

          {/* 예상 금액 표시 */}
          {((price && quantity) || (orderMethod === "MARKET" && currentPrice && quantity)) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                예상 주문 금액
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {(() => {
                  const orderPrice = orderMethod === "MARKET" ? parseFloat(currentPrice || "0") : parseFloat(price || "0");
                  const orderQuantity = parseInt(quantity || "0");
                  return (orderPrice * orderQuantity).toLocaleString();
                })()}원
              </div>
            </div>
          )}
        </div>

        {/* 주문 실행 버튼 */}
        <Button
          onClick={handleOrder}
          disabled={isSubmitting}
          className={`w-full py-3 text-lg font-bold ${
            orderType === "BUY"
              ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              주문 처리 중...
            </>
          ) : (
            `${orderType === "BUY" ? "매수" : "매도"} 주문`
          )}
        </Button>

        {/* 주문 결과 표시 */}
        {lastOrderResult && (
          <div className={`p-3 rounded-lg border ${
            lastOrderResult.success 
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" 
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {lastOrderResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                lastOrderResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              }`}>
                {lastOrderResult.message}
              </span>
            </div>
            {lastOrderResult.orderId && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                주문번호: {lastOrderResult.orderId}
              </div>
            )}
          </div>
        )}

        {/* 계좌 정보 (실제 데이터) */}
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              계좌 정보
              {isLoadingAccount && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>보유 현금:</span>
                <span className="font-medium">
                  {accountBalance ? 
                    `${accountBalance.availableCash.toLocaleString()}원` : 
                    isLoadingAccount ? '로딩 중...' : '조회 실패'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>보유 주식:</span>
                <span className="font-medium">
                  {isLoadingAccount ? '로딩 중...' : `${stockQuantity}주`}
                </span>
              </div>
              {accountBalance && (
                <div className="flex justify-between">
                  <span>총 자산:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {accountBalance.totalBalance.toLocaleString()}원
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
