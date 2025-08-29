import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface TradingOrderPanelProps {
  stockCode: string;
  currentPrice: string;
  orderBookData: any;
}

export const TradingOrderPanel = forwardRef<any, TradingOrderPanelProps>(
  ({ stockCode, currentPrice, orderBookData }, ref) => {
    const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [orderMethod, setOrderMethod] = useState<"LIMIT" | "MARKET">("LIMIT");

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
    const handleOrder = () => {
      if (!price || !quantity) {
        alert("가격과 수량을 입력해주세요.");
        return;
      }

      const orderData = {
        stockCode,
        orderType,
        orderMethod,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        totalAmount: parseFloat(price) * parseInt(quantity),
      };

      console.log("주문 실행:", orderData);
      // TODO: 실제 주문 API 호출
      alert(`${orderType === "BUY" ? "매수" : "매도"} 주문이 접수되었습니다.`);
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
              placeholder="주문 가격"
              disabled={orderMethod === "MARKET"}
              type="number"
              min="0"
              step="1"
            />
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
          {price && quantity && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                예상 주문 금액
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {(parseFloat(price) * parseInt(quantity)).toLocaleString()}원
              </div>
            </div>
          )}
        </div>

        {/* 주문 실행 버튼 */}
        <Button
          onClick={handleOrder}
          className={`w-full py-3 text-lg font-bold ${
            orderType === "BUY"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {orderType === "BUY" ? "매수" : "매도"} 주문
        </Button>

        {/* 계좌 정보 (간단 표시) */}
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              계좌 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>보유 현금:</span>
                <span className="font-medium">1,000,000원</span>
              </div>
              <div className="flex justify-between">
                <span>보유 주식:</span>
                <span className="font-medium">100주</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
