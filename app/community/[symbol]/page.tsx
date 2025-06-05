"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { mockStocks, mockOpinions, mockComments } from "@/data/mock-stocks"
import type { Opinion, SortOption, FilterOption } from "@/types/community"
import { ThemeToggle } from "@/components/theme-toggle"
import { MouseFollower } from "@/components/mouse-follower"
import { StockInfoCard } from "@/components/stock-info-card"
import { OpinionForm } from "@/components/opinion-form"
import { OpinionCard } from "@/components/opinion-card"

export default function StockDiscussionPage() {
  const params = useParams()
  const symbol = params.symbol as string

  const [stock, setStock] = useState(mockStocks.find((s) => s.symbol === symbol))
  const [opinions, setOpinions] = useState<Opinion[]>(mockOpinions[symbol] || [])
  const [sortOption, setSortOption] = useState<SortOption>("latest")
  const [filterOption, setFilterOption] = useState<FilterOption>("all")

  useEffect(() => {
    // 실제 구현에서는 API 호출로 대체
    setStock(mockStocks.find((s) => s.symbol === symbol))
    setOpinions(mockOpinions[symbol] || [])
  }, [symbol])

  const handleAddOpinion = (content: string, sentiment: "bullish" | "bearish" | "neutral") => {
    const newOpinion: Opinion = {
      id: `new-${Date.now()}`,
      stockSymbol: symbol,
      userId: "current-user",
      userName: "나",
      userAvatar: "/placeholder.svg?height=40&width=40",
      content,
      sentiment,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      commentCount: 0,
    }

    setOpinions([newOpinion, ...opinions])
  }

  const sortedAndFilteredOpinions = [...opinions]
    .filter((opinion) => {
      if (filterOption === "all") return true
      return opinion.sentiment === filterOption
    })
    .sort((a, b) => {
      if (sortOption === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortOption === "popular") {
        return b.likes - a.likes
      } else {
        // controversial
        return b.likes + b.dislikes - (a.likes + a.dislikes)
      }
    })

  if (!stock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-green-800 dark:text-green-200 mb-4">존재하지 않는 종목입니다.</p>
          <Link href="/community">
            <Button className="bg-green-600 hover:bg-green-700 text-white">커뮤니티로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <MouseFollower />

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-green-200 dark:border-green-800 transition-colors duration-300">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-800 dark:text-green-200">주식맛집 커뮤니티</span>
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
        <div className="mb-6">
          <Link href="/community" className="flex items-center text-green-700 dark:text-green-300 hover:underline mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            종목 토론방 목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
            {stock.emoji} {stock.name} 토론방
          </h1>
          <p className="text-green-700 dark:text-green-300">
            {stock.name}에 대한 투자 의견을 자유롭게 나누는 공간입니다.
          </p>
        </div>

        <StockInfoCard stock={stock} />

        <OpinionForm stock={stock} onSubmit={handleAddOpinion} />

        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
            투자자 의견 <span className="text-green-600 dark:text-green-400">{sortedAndFilteredOpinions.length}</span>
          </h2>
          <div className="flex gap-2">
            <Select value={filterOption} onValueChange={(value) => setFilterOption(value as FilterOption)}>
              <SelectTrigger className="w-[120px] border-green-200 dark:border-green-700">
                <SelectValue placeholder="필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 보기</SelectItem>
                <SelectItem value="bullish">매수 의견</SelectItem>
                <SelectItem value="bearish">매도 의견</SelectItem>
                <SelectItem value="neutral">중립 의견</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-[120px] border-green-200 dark:border-green-700">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="controversial">논쟁순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sortedAndFilteredOpinions.length > 0 ? (
          sortedAndFilteredOpinions.map((opinion) => (
            <OpinionCard key={opinion.id} opinion={opinion} comments={mockComments[opinion.id] || []} />
          ))
        ) : (
          <div className="text-center py-12 bg-white/50 dark:bg-gray-900/50 rounded-lg backdrop-blur-sm">
            <p className="text-gray-500 dark:text-gray-400">아직 작성된 의견이 없습니다. 첫 의견을 작성해보세요!</p>
          </div>
        )}
      </main>
    </div>
  )
}
