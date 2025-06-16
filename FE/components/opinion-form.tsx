"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Stock } from "@/types/community";
import { TrendingUp, TrendingDown, Scale, Minus } from "lucide-react";

interface OpinionFormProps {
  stock: Stock;
  onSubmit: (
    content: string,
    sentiment: "bullish" | "bearish" | "neutral"
  ) => void;
}

export function OpinionForm({ stock, onSubmit }: OpinionFormProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">(
    "neutral"
  );

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content, sentiment);
    setContent("");
    setSentiment("neutral");
  };

  return (
    <Card className="mb-8 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{stock.emoji}</span>
          <div>
            <h3 className="font-bold text-green-900 dark:text-green-100">
              {stock.name}에 대한 의견 작성
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              투자 의견을 자유롭게 작성해주세요
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={sentiment === "bullish" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "bullish"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50"
              }`}
              onClick={() => setSentiment("bullish")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              매수 의견
            </Button>
            <Button
              type="button"
              variant={sentiment === "bearish" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "bearish"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
              }`}
              onClick={() => setSentiment("bearish")}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              매도 의견
            </Button>
            <Button
              type="button"
              variant={sentiment === "neutral" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "neutral"
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              }`}
              onClick={() => setSentiment("neutral")}
            >
              <Minus className="w-4 h-4 mr-2" />
              중립 의견
            </Button>
          </div>
          <Textarea
            placeholder="투자 의견을 작성해주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!content.trim() || !sentiment}
              className={`${
                sentiment === "bullish"
                  ? "bg-green-600 hover:bg-green-700"
                  : sentiment === "bearish"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white`}
            >
              의견 작성하기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
