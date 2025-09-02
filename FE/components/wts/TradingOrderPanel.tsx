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
import { getTickSizeKRX, stepByTick } from "@/lib/utils/marketUtils";

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

    // 수수료/세금 상수 (백엔드 로직과 일치)
    const COMMISSION_RATE = 0.00015; // 0.015%
    const COMMISSION_MIN = 15; // KRW
    const TAX_RATE = 0.0023; // 0.23% (SELL만)

    // 유틸: 숫자 파싱/포맷팅
    const toInt = (v: string) => {
      if (!v) return 0;
      const n = Math.floor(Number(v.toString().replace(/[^0-9.-]/g, "")));
      return isFinite(n) ? n : 0;
    };
    const fmt = (n: number) => n.toLocaleString();

    // 현재 가격 결정(시장가면 현재가 사용)
    const effectivePrice = orderMethod === "MARKET" ? toInt(currentPrice || "0") : toInt(price);
    const qty = toInt(quantity);
    const gross = effectivePrice * qty; // 예상 체결금액
    const commission = Math.max(Math.floor(gross * COMMISSION_RATE), gross > 0 ? COMMISSION_MIN : 0);
    const tax = orderType === "SELL" ? Math.floor(gross * TAX_RATE) : 0;
    const netCashChange = orderType === "BUY" ? -(gross + commission) : gross - commission - tax;
    const postCash = (accountBalance?.availableCash ?? 0) + netCashChange;

    // 유효성 판단
    const insufficientCash = orderType === 'BUY' && qty > 0 && postCash < 0;
    const insufficientShares = orderType === 'SELL' && qty > stockQuantity;

    // 매수 가능 수량(수수료 포함 근사치)
    const calcMaxBuyQty = () => {
      const cash = accountBalance?.availableCash ?? 0;
      if (effectivePrice <= 0) return 0;
      const estPerShareCost = Math.ceil(effectivePrice * (1 + COMMISSION_RATE));
      const estQty = Math.floor((cash - COMMISSION_MIN) / estPerShareCost);
      return Math.max(estQty, 0);
    };

    const calcMaxSellQty = () => stockQuantity;
    const maxBuyQty = calcMaxBuyQty();
    const pctQtyBuy = (p: number) => Math.max(Math.floor(maxBuyQty * p), maxBuyQty > 0 ? 1 : 0);
    const pctQtySell = (p: number) => Math.max(Math.floor(stockQuantity * p), stockQuantity > 0 ? 1 : 0);

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

    // 키보드 단축키
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
        if (e.key.toLowerCase() === 'b') setOrderType('BUY');
        if (e.key.toLowerCase() === 's') setOrderType('SELL');
        if (e.key.toLowerCase() === 'l') setOrderMethod('LIMIT');
        if (e.key.toLowerCase() === 'm') setOrderMethod('MARKET');
        if (e.key === 'Enter') handleOrder();
        if (e.key === 'Escape') { setPrice(''); setQuantity(''); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [orderMethod, orderType, price, quantity, currentPrice]);

    // 호가창 가격 클릭 시 주문 패널에 입력
    const handlePriceClick = (clickedPrice: string) => {
      setPrice(clickedPrice);
      setOrderMethod("LIMIT");
    };

    // 호가 스텝퍼/키보드 화살표
    const stepPrice = (delta: number) => {
      const base = orderMethod === 'MARKET' ? toInt(currentPrice || '0') : toInt(price || '0');
      const next = stepByTick(base || 0, delta);
      setPrice(String(next));
      setOrderMethod('LIMIT');
    };
    const onPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepPrice(e.shiftKey ? 5 : e.ctrlKey ? 10 : 1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepPrice(-(e.shiftKey ? 5 : e.ctrlKey ? 10 : 1));
      }
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
        {/* 세그먼트: 매수/매도 */}
        <div className="flex gap-1">
          <Button
            variant={orderType === "BUY" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("BUY")}
            className={`flex-1 ${orderType === 'BUY' ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            매수 (B)
          </Button>
          <Button
            variant={orderType === "SELL" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderType("SELL")}
            className={`flex-1 ${orderType === 'SELL' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            매도 (S)
          </Button>
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400">
          단축키: 매수(B) · 매도(S) · 지정가(L) · 시장가(M) · 주문(Enter) · 초기화(Esc)
        </div>

        {/* 주문유형: 지정가/시장가 */}
        <div className="flex gap-1">
          <Button
            variant={orderMethod === "LIMIT" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("LIMIT")}
            className="flex-1"
          >
            지정가 (L)
          </Button>
          <Button
            variant={orderMethod === "MARKET" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("MARKET")}
            className="flex-1"
          >
            시장가 (M)
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
              onKeyDown={onPriceKeyDown}
            />
            {orderMethod === "MARKET" && currentPrice && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                현재가: {parseInt(currentPrice).toLocaleString()}원
              </div>
            )}
            {orderMethod === "LIMIT" && (
              <div className="flex gap-1 mt-2">
                <Button variant="outline" size="sm" onClick={() => stepPrice(-10)}>−10틱</Button>
                <Button variant="outline" size="sm" onClick={() => stepPrice(-1)}>−1틱</Button>
                <Button variant="outline" size="sm" onClick={() => stepPrice(1)}>+1틱</Button>
                <Button variant="outline" size="sm" onClick={() => stepPrice(10)}>+10틱</Button>
              </div>
            )}
            {orderMethod === "MARKET" && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">시장가는 가격 입력이 필요 없습니다.</div>
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
            <div className="flex gap-2 mt-2">
              {orderType === 'BUY' ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtyBuy(0.1)))}>10%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtyBuy(0.2)))}>20%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtyBuy(0.5)))}>50%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(maxBuyQty))}>최대</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtySell(0.1)))}>10%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtySell(0.2)))}>20%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(pctQtySell(0.5)))}>50%</Button>
                  <Button variant="outline" size="sm" onClick={() => setQuantity(String(stockQuantity))}>최대</Button>
                </>
              )}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {orderType === 'BUY' ? `최대 매수 가능: ${fmt(maxBuyQty)}주` : `보유 수량: ${fmt(stockQuantity)}주`}
            </div>
            {(insufficientCash || insufficientShares) && (
              <div className="text-[11px] text-red-600 mt-1">
                {insufficientCash ? `가용 현금 부족: 최대 ${fmt(maxBuyQty)}주까지 가능합니다.` : `보유 수량 부족: 최대 ${fmt(stockQuantity)}주까지 가능합니다.`}
              </div>
            )}
          </div>

          {/* 실시간 요약 카드 */}
          {((orderMethod === 'MARKET' && currentPrice && quantity) || (orderMethod === 'LIMIT' && price && quantity)) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>예상 체결금액</span>
                <span className="font-semibold">{fmt(gross)}원</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>수수료</span>
                <span>{fmt(commission)}원</span>
              </div>
              {orderType === 'SELL' && (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>세금</span>
                  <span>{fmt(tax)}원</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>사용 후 현금 잔액</span>
                <span className={`font-semibold ${postCash < 0 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>{fmt(Math.max(postCash, 0))}원</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>보유수량 변화</span>
                <span>
                  {orderType === 'BUY' ? `${stockQuantity}주 → ${stockQuantity + qty}주` : `${stockQuantity}주 → ${Math.max(stockQuantity - qty,0)}주`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 주문 실행 버튼 */}
        <Button
          onClick={handleOrder}
          disabled={isSubmitting}
          className={`w-full py-3 text-lg font-bold ${orderType === 'BUY' ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'}`}
          disabled={isSubmitting || insufficientCash || insufficientShares || qty <= 0 || gross <= 0}
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
              <div className="flex justify-between">
                <span>매수 가능 수량</span>
                <span className="font-medium">{orderType === 'BUY' ? fmt(calcMaxBuyQty()) : fmt(calcMaxSellQty())}주</span>
              </div>
              <div className="flex justify-between">
                <span>장 상태</span>
                <span className="font-medium">정규</span>
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
