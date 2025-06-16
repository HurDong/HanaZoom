"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Search, MessageSquare } from "lucide-react";
import Link from "next/link";
import { mockStocks } from "@/data/mock-stocks";
import { ThemeToggle } from "@/components/theme-toggle";
import { MouseFollower } from "@/components/mouse-follower";
import NavBar from "@/app/components/Navbar";

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredStocks = mockStocks.filter((stock) => {
    const matchesSearch =
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.includes(searchTerm);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "up") return matchesSearch && stock.change > 0;
    if (activeTab === "down") return matchesSearch && stock.change < 0;

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <MouseFollower />
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
            종목 토론방
          </h1>
          <p className="text-green-700 dark:text-green-300">
            관심 있는 종목에 대한 의견을 나누고 다른 투자자들과 소통해보세요!
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="종목명 또는 종목코드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
            />
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-green-100 dark:bg-green-900/50">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                전체
              </TabsTrigger>
              <TabsTrigger
                value="up"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-green-600 dark:text-green-400"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                상승
              </TabsTrigger>
              <TabsTrigger
                value="down"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-red-600 dark:text-red-400"
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                하락
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map((stock) => (
            <Link key={stock.symbol} href={`/community/${stock.symbol}`}>
              <Card className="h-full border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:border-green-400 dark:hover:border-green-600 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                        {stock.emoji}
                      </span>
                      <div>
                        <h3 className="font-bold text-green-900 dark:text-green-100 text-lg group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                          {stock.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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

        {filteredStocks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
