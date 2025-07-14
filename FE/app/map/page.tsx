"use client";

import { useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import NavBar from "../components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { BarChart, Search, Layers, TrendingUp } from "lucide-react";

export default function StockMapPage() {
  const [level, setLevel] = useState(7); // 지도 레벨

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-32 md:pt-36">
        <div className="container mx-auto px-4 py-4 h-[calc(100vh-9rem)] flex gap-4">
          {/* Left Panel */}
          <Card className="w-1/4 hidden md:flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <BarChart className="w-6 h-6" />
                <span>지역별 주식 정보</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="지역 또는 종목 검색..."
                    className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                  <Layers className="w-5 h-5" />
                  <span>지도 레벨</span>
                </label>
                <Slider
                  defaultValue={[level]}
                  max={14}
                  min={1}
                  step={1}
                  onValueChange={(value) => setLevel(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>광역</span>
                  <span>상세</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="font-bold text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
                  <TrendingUp className="w-5 h-5" />
                  <span>현재 지역 인기 종목</span>
                </h4>
                {/* Mock Data */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/30">
                    <span>삼성전자</span>
                    <span className="font-bold text-blue-600">82,000원</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/30">
                    <span>SK하이닉스</span>
                    <span className="font-bold text-red-600">180,000원</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/30">
                    <span>카카오</span>
                    <span className="font-bold text-green-600">55,000원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Area */}
          <div className="w-full md:w-3/4 h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white/50 dark:border-gray-800/50">
            <Map
              center={{
                lat: 37.566826,
                lng: 126.9786567,
              }}
              style={{ width: "100%", height: "100%" }}
              level={level}
            >
              <MapMarker
                position={{
                  lat: 37.566826,
                  lng: 126.9786567,
                }}
              >
                <div style={{ color: "#000" }}>서울시청</div>
              </MapMarker>
            </Map>
          </div>
        </div>
      </main>
    </div>
  );
}
