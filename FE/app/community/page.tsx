"use client";
import { getAccessToken } from "@/app/utils/auth";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockStocks } from "@/data/mock-stocks";

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  emoji?: string;
}

interface UserRegionInfo {
  regionId: number;
  roomName: string;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("stocks");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [userRegion, setUserRegion] = useState<UserRegionInfo | null>(null);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);

  useEffect(() => {
    if (activeTab === "stocks") {
      setFilteredStocks(
        mockStocks.filter((stock) => {
          const matchesSearch =
            stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stock.symbol.includes(searchTerm);
          return matchesSearch;
        })
      );
    }
  }, [searchTerm, activeTab]);

  useEffect(() => {
    const fetchUserRegion = async () => {
      if (activeTab !== "regions") return;

      const token = getAccessToken();
      if (!token) {
        setUserRegion(null);
        return;
      }

      try {
        setIsLoadingRegion(true);
        const response = await fetch(
          "http://localhost:8080/api/v1/chat/region-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserRegion({
            regionId: data.data.regionId,
            roomName: data.data.roomName || `지역 ${data.data.regionId}`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user region:", error);
      } finally {
        setIsLoadingRegion(false);
      }
    };

    fetchUserRegion();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <MouseFollower />
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
            HanaZoom 커뮤니티
          </h1>
          <p className="text-green-700 dark:text-green-300">
            지역별 투자 정보와 종목별 토론방에서 다양한 의견을 나눠보세요!
          </p>
        </div>

        {/* 탭 선택 인터페이스 */}
        <div className="mb-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-green-100 dark:bg-green-900/50">
              <TabsTrigger
                value="stocks"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                종목별 토론
              </TabsTrigger>
              <TabsTrigger
                value="regions"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                <MapPin className="w-4 h-4 mr-2" />
                지역별 채팅
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder={
                activeTab === "stocks"
                  ? "종목명 또는 종목코드 검색..."
                  : "나의 지역 채팅방을 확인하세요"
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
              disabled={activeTab === "regions"}
            />
          </div>
        </div>

        {/* 종목별 토론방 목록 */}
        {activeTab === "stocks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStocks.map((stock) => (
              <Link href={`/community/${stock.symbol}`} key={stock.symbol}>
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {stock.emoji && (
                          <span className="text-2xl">{stock.emoji}</span>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
                            {stock.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stock.symbol}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center px-3 py-1 rounded-full ${
                          stock.change >= 0
                            ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {stock.change >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span className="font-bold">
                          {stock.change >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-bold text-green-800 dark:text-green-200">
                        ₩{stock.price.toLocaleString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        토론방 입장
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* 지역별 채팅방 */}
        {activeTab === "regions" && (
          <div className="space-y-6">
            {isLoadingRegion ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p>지역 정보를 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : userRegion ? (
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <MapPin className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" />
                    <div>
                      <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                        나의 지역 채팅방
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                        {userRegion.roomName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        같은 지역 주민들과 실시간으로 투자 정보를 공유해보세요
                      </p>
                    </div>
                    <Link href={`/community/region/${userRegion.regionId}`}>
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        채팅방 입장하기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    지역 정보를 불러올 수 없습니다.
                  </p>
                  <p className="text-sm text-gray-400">
                    로그인 후 이용해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {((activeTab === "stocks" && filteredStocks.length === 0) ||
          (activeTab === "regions" && !userRegion && !isLoadingRegion)) && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "stocks"
                ? "검색 결과가 없습니다."
                : "지역 정보를 찾을 수 없습니다."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
