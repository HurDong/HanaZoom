import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockPriceInfo } from "./StockPriceInfo";
import { OrderBookDisplay } from "./OrderBookDisplay";
import { TradingOrderPanel } from "./TradingOrderPanel";

type TabType = "price" | "orderbook" | "order";

interface TradingTabsProps {
  stockCode: string;
  stockData: any;
  orderBookData: any;
  isWebSocketConnected: boolean;
  onRefresh: () => void;
}

export function TradingTabs({
  stockCode,
  stockData,
  orderBookData,
  isWebSocketConnected,
  onRefresh,
}: TradingTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("price");
  const orderPanelRef = useRef<{ setPrice: (price: string) => void }>(null);

  const tabs = [
    { id: "price", label: "현재가", icon: "📊" },
    { id: "orderbook", label: "호가창", icon: "📈" },
    { id: "order", label: "주문", icon: "💼" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "price":
        return (
          <div className="h-[620px] lg:h-[720px] xl:h-[820px] 2xl:h-[920px]">
            {stockData ? (
              <StockPriceInfo stockData={stockData} className="h-full" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                  <p className="text-sm mt-4">실시간 데이터 대기 중...</p>
                </div>
              </div>
            )}
          </div>
        );

      case "orderbook":
        return (
          <div className="h-[620px] lg:h-[720px] xl:h-[820px] 2xl:h-[920px]">
            <OrderBookDisplay
              orderBookData={orderBookData}
              realtimeData={stockData}
              isWebSocketConnected={isWebSocketConnected}
              onRefresh={onRefresh}
              onPriceClick={(price) => {
                // 호가창 가격 클릭 시 주문 탭으로 이동하고 가격 설정
                setActiveTab("order");
                // 주문 패널에 가격 전달 (ref를 통해)
                if (orderPanelRef.current) {
                  orderPanelRef.current.setPrice(price);
                }
              }}
              className="h-full"
            />
          </div>
        );

      case "order":
        return (
          <div className="h-[620px] lg:h-[720px] xl:h-[820px] 2xl:h-[920px]">
            <TradingOrderPanel
              ref={orderPanelRef}
              stockCode={stockCode}
              currentPrice={stockData?.currentPrice}
              orderBookData={orderBookData}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="h-[700px] lg:h-[800px] xl:h-[900px] 2xl:h-[1000px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg">
      {/* 탭 헤더 */}
      <CardHeader className="pb-3">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 transition-all duration-200 ${
                activeTab === tab.id
                  ? tab.id === "order"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      {/* 탭 컨텐츠 */}
      <CardContent className="p-4 h-[620px] lg:h-[720px] xl:h-[820px] 2xl:h-[1120px] overflow-hidden">
        {renderTabContent()}
      </CardContent>
    </Card>
  );
}
