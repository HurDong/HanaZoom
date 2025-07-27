"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { PostSentiment } from "@/lib/api/community";

interface OpinionFormProps {
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    sentiment: PostSentiment;
  }) => Promise<void>;
}

export function OpinionForm({ onClose, onSubmit }: OpinionFormProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<PostSentiment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !sentiment) return;

    try {
      setIsSubmitting(true);
      await onSubmit({ content, sentiment });
      setContent("");
      setSentiment(null);
    } catch (error) {
      console.error("Failed to submit opinion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold text-green-900 dark:text-green-100">
          의견 작성하기
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            placeholder="이 종목에 대한 의견을 자유롭게 작성해주세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant={sentiment === "BULLISH" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "BULLISH"
                  ? "bg-green-600 hover:bg-green-700"
                  : "text-green-600 hover:text-green-700"
              }`}
              onClick={() => setSentiment("BULLISH")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              매수
            </Button>
            <Button
              type="button"
              variant={sentiment === "NEUTRAL" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "NEUTRAL"
                  ? "bg-gray-600 hover:bg-gray-700"
                  : "text-gray-600 hover:text-gray-700"
              }`}
              onClick={() => setSentiment("NEUTRAL")}
            >
              <Minus className="w-4 h-4 mr-2" />
              중립
            </Button>
            <Button
              type="button"
              variant={sentiment === "BEARISH" ? "default" : "outline"}
              className={`flex-1 ${
                sentiment === "BEARISH"
                  ? "bg-red-600 hover:bg-red-700"
                  : "text-red-600 hover:text-red-700"
              }`}
              onClick={() => setSentiment("BEARISH")}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              매도
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || !sentiment || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "작성 중..." : "작성 완료"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
