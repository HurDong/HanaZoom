import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Stock } from "@/types/community"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StockInfoCardProps {
  stock: Stock
}

export function StockInfoCard({ stock }: StockInfoCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num)
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000000) {
      return `${(marketCap / 1000000000000).toFixed(2)}조원`
    } else if (marketCap >= 100000000) {
      return `${(marketCap / 100000000).toFixed(2)}억원`
    }
    return formatNumber(marketCap) + "원"
  }

  return (
    <Card className="mb-6 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-2xl text-green-800 dark:text-green-200">
          <span className="text-3xl">{stock.emoji}</span>
          {stock.name} <span className="text-sm text-gray-500 dark:text-gray-400">{stock.symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">현재가</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-200">₩{formatNumber(stock.price)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">전일대비</p>
            <div
              className={`flex items-center text-lg font-bold ${
                stock.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {stock.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {stock.change >= 0 ? "+" : ""}
              {formatNumber(stock.change)} ({stock.changePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">거래량</p>
            <p className="text-lg font-medium text-green-800 dark:text-green-200">{formatNumber(stock.volume)}주</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">시가총액</p>
            <p className="text-lg font-medium text-green-800 dark:text-green-200">{formatMarketCap(stock.marketCap)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
