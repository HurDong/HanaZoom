"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Stock } from "@/types/community"
import { TrendingUp, TrendingDown, Scale } from "lucide-react"

interface OpinionFormProps {
  stock: Stock
  onSubmit: (content: string, sentiment: "bullish" | "bearish" | "neutral") => void
}

export function OpinionForm({ stock, onSubmit }: OpinionFormProps) {
  const [content, setContent] = useState("")
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">("neutral")

  const handleSubmit = () => {
    if (!content.trim()) return
    onSubmit(content, sentiment)
    setContent("")
    setSentiment("neutral")
  }

  return (
    <Card className="mb-6 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-green-800 dark:text-green-200">
          {stock.emoji} {stock.name}에 대한 의견 공유하기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={`${stock.name}에 대한 투자 의견을 자유롭게 작성해주세요...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[120px] border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
        />

        <div className="mt-4">
          <RadioGroup
            value={sentiment}
            onValueChange={(value) => setSentiment(value as "bullish" | "bearish" | "neutral")}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="bullish"
                id="bullish"
                className="text-green-600 border-green-600 focus:ring-green-600"
              />
              <Label
                htmlFor="bullish"
                className="flex items-center gap-1 text-green-600 dark:text-green-400 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                매수
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bearish" id="bearish" className="text-red-600 border-red-600 focus:ring-red-600" />
              <Label
                htmlFor="bearish"
                className="flex items-center gap-1 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                매도
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="neutral"
                id="neutral"
                className="text-yellow-600 border-yellow-600 focus:ring-yellow-600"
              />
              <Label
                htmlFor="neutral"
                className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                중립
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          의견 게시하기
        </Button>
      </CardFooter>
    </Card>
  )
}
