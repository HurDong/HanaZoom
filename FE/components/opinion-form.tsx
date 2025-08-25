"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Plus,
  Trash2,
  Vote,
} from "lucide-react";
import type { PostSentiment, VoteOption } from "@/lib/api/community";

interface OpinionFormProps {
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    sentiment: PostSentiment;
    hasVote?: boolean;
    voteOptions?: VoteOption[];
    voteQuestion?: string;
  }) => Promise<void>;
}

export function OpinionForm({ onClose, onSubmit }: OpinionFormProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<PostSentiment | null>(null);
  const [hasVote, setHasVote] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState("이 종목이 오를까요?");
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([
    { id: "1", text: "상승한다", voteCount: 0 },
    { id: "2", text: "하락한다", voteCount: 0 },
    { id: "3", text: "보합한다", voteCount: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addVoteOption = () => {
    if (voteOptions.length >= 5) {
      alert("투표 옵션은 최대 5개까지 추가할 수 있습니다.");
      return;
    }
    const newId = (voteOptions.length + 1).toString();
    setVoteOptions([...voteOptions, { id: newId, text: "", voteCount: 0 }]);
  };

  const removeVoteOption = (id: string) => {
    if (voteOptions.length <= 2) return; // 최소 2개 옵션은 유지
    setVoteOptions(voteOptions.filter((option) => option.id !== id));
  };

  const updateVoteOption = (id: string, text: string) => {
    setVoteOptions(
      voteOptions.map((option) =>
        option.id === id ? { ...option, text } : option
      )
    );
  };

  const handleSubmit = async () => {
    if (!content.trim() || !sentiment) return;
    if (
      hasVote &&
      (!voteQuestion.trim() || voteOptions.some((opt) => !opt.text.trim()))
    )
      return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        content,
        sentiment,
        hasVote,
        voteQuestion: hasVote ? voteQuestion : undefined,
        voteOptions: hasVote
          ? voteOptions
              .filter((opt) => opt.text.trim())
              .map((opt) => ({ ...opt, voteCount: 0 }))
          : undefined,
      });
      setContent("");
      setSentiment(null);
      setHasVote(false);
      setVoteQuestion("나의 현금 비중은");
      setVoteOptions([
        { id: "UP", text: "30프로 미만 혹은 없음", voteCount: 0 },
        { id: "DOWN", text: "30프로 이상 혹은 100프로", voteCount: 0 },
      ]);
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

          {/* 투표 기능 토글 */}
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-800/30 dark:to-emerald-800/30 rounded-lg border border-green-200 dark:border-green-600 shadow-sm hover:shadow-md transition-all duration-200">
            {/* 심플한 토글 버튼 */}
            <button
              type="button"
              onClick={() => setHasVote(!hasVote)}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                hasVote ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              {/* 토글 핸들 */}
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 transform ${
                  hasVote ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>

            <Label
              htmlFor="vote-toggle"
              className="flex items-center gap-3 text-sm font-medium text-green-900 dark:text-green-100 cursor-pointer hover:text-green-700 dark:hover:text-green-300 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-green-200 dark:bg-green-700 rounded-full p-1.5">
                <Vote className="w-5 h-5 text-green-700 dark:text-green-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">투표 기능 추가</span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  {hasVote ? "활성화됨" : "클릭하여 활성화"}
                </span>
              </div>
              {hasVote && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full">
                  ON
                </span>
              )}
            </Label>
          </div>

          {/* 투표 설정 */}
          {hasVote && (
            <div className="space-y-4 p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg border-2 border-green-200 dark:border-green-700 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-6 h-6 bg-green-200 dark:bg-green-700 rounded-full p-1">
                  <Vote className="w-4 h-4 text-green-700 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  투표 설정
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="vote-question"
                    className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    투표 질문
                  </Label>
                  <Input
                    id="vote-question"
                    value={voteQuestion}
                    onChange={(e) => setVoteQuestion(e.target.value)}
                    placeholder="투표 질문을 입력하세요..."
                    className="border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-green-600 dark:focus:border-green-400 dark:focus:ring-green-400/20 bg-white dark:bg-green-900/50 text-green-900 dark:text-green-100 placeholder-green-500 dark:placeholder-green-400"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      투표 옵션
                    </Label>
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full">
                      {voteOptions.length}/5
                    </span>
                  </div>
                  <div className="space-y-3">
                    {voteOptions.map((option) => (
                      <div key={option.id} className="flex gap-3">
                        <Input
                          value={option.text}
                          onChange={(e) =>
                            updateVoteOption(option.id, e.target.value)
                          }
                          placeholder={`옵션 ${option.id}`}
                          className="flex-1 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-green-600 dark:focus:border-green-400 dark:focus:ring-green-400/20 bg-white dark:bg-green-900/50 text-green-900 dark:text-green-100 placeholder-green-500 dark:placeholder-green-400"
                        />
                        {voteOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeVoteOption(option.id)}
                            className="text-red-600 hover:text-red-700 border-2 border-red-300 hover:border-red-400 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/50 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVoteOption}
                    disabled={voteOptions.length >= 5}
                    className="w-full border-2 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {voteOptions.length >= 5
                      ? "최대 옵션 수 도달"
                      : "투표 옵션 추가"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !content.trim() ||
                !sentiment ||
                isSubmitting ||
                (hasVote &&
                  (!voteQuestion.trim() ||
                    voteOptions.some((opt) => !opt.text.trim())))
              }
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
