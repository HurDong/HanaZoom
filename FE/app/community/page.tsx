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

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-green-200 dark:border-green-800 transition-colors duration-300">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-800 dark:text-green-200">
            하나줌
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="/"
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
          >
            홈
          </Link>
          <Link
            href="/community"
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
          >
            커뮤니티
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
          >
            로그인
          </Link>
          <ThemeToggle />
        </nav>
      </header>

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
              <Card className="h-full border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{stock.emoji}</span>
                      <div>
                        <h3 className="font-bold text-green-900 dark:text-green-100">
                          {stock.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stock.symbol}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center ${
                        stock.change >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
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
                    <span className="text-lg font-bold text-green-800 dark:text-green-200">
                      ₩{stock.price.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
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
