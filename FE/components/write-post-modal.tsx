"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  X as XIcon,
  BarChart3,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PostSentiment, VoteOption } from "@/lib/api/community";

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    sentiment: PostSentiment;
    postType?: "TEXT" | "POLL";
    hasVote?: boolean;
    voteOptions?: string[];
    voteQuestion?: string;
    imageUrl?: string;
  }) => void;
}

export function WritePostModal({
  isOpen,
  onClose,
  onSubmit,
}: WritePostModalProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<PostSentiment>("NEUTRAL");
  const [hasVote, setHasVote] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState("");
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([
    { id: "UP", text: "오를 것 같다 📈", voteCount: 0 },
    { id: "DOWN", text: "내릴 것 같다 📉", voteCount: 0 },
  ]);
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        sentiment,
        postType: hasVote ? "POLL" : "TEXT",
        hasVote,
        voteOptions: hasVote
          ? voteOptions.map((option) => option.text)
          : undefined,
        voteQuestion: hasVote ? voteQuestion : undefined,
        imageUrl: hasImage ? imageUrl : undefined,
      });

      // 폼 리셋
      setContent("");
      setSentiment("NEUTRAL");
      setHasVote(false);
      setHasImage(false);
      setVoteQuestion("");
      setVoteOptions([
        { id: "UP", text: "오를 것 같다 📈", voteCount: 0 },
        { id: "DOWN", text: "내릴 것 같다 📉", voteCount: 0 },
      ]);
      setImageUrl("");
      onClose();
    } catch (error) {
      console.error("Failed to submit post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVoteOption = () => {
    const newId = `OPTION_${voteOptions.length + 1}`;
    setVoteOptions([...voteOptions, { id: newId, text: "", voteCount: 0 }]);
  };

  const removeVoteOption = (id: string) => {
    if (voteOptions.length > 2) {
      setVoteOptions(voteOptions.filter((option) => option.id !== id));
    }
  };

  const updateVoteOption = (id: string, text: string) => {
    setVoteOptions(
      voteOptions.map((option) =>
        option.id === id ? { ...option, text } : option
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              새 글 작성
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 내용 */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {/* 기본 내용 */}
            <div>
              <Label htmlFor="content" className="text-base font-semibold">
                내용
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="무엇을 공유하고 싶으신가요?"
                className="min-h-[120px] mt-3 text-base"
              />
            </div>

            {/* 감정 선택 */}
            <div>
              <Label className="text-base font-semibold">투자 의견</Label>
              <div className="flex space-x-3 mt-3">
                <Button
                  type="button"
                  variant={sentiment === "BULLISH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSentiment("BULLISH")}
                  className={`${
                    sentiment === "BULLISH"
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  매수
                </Button>
                <Button
                  type="button"
                  variant={sentiment === "BEARISH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSentiment("BEARISH")}
                  className={`${
                    sentiment === "BEARISH"
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  매도
                </Button>
                <Button
                  type="button"
                  variant={sentiment === "NEUTRAL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSentiment("NEUTRAL")}
                  className={`${
                    sentiment === "NEUTRAL"
                      ? "bg-gray-500 hover:bg-gray-600 text-white"
                      : "text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
                  }`}
                >
                  중립
                </Button>
              </div>
            </div>

            {/* 추가 옵션들 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                추가 옵션
              </h3>

              {/* 투표 옵션 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="hasVote"
                    checked={hasVote}
                    onCheckedChange={(checked) =>
                      setHasVote(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="hasVote"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-medium">투표 추가</span>
                  </Label>
                </div>

                {hasVote && (
                  <div className="ml-8 space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div>
                      <Label
                        htmlFor="voteQuestion"
                        className="text-sm font-medium"
                      >
                        투표 질문
                      </Label>
                      <Input
                        id="voteQuestion"
                        value={voteQuestion}
                        onChange={(e) => setVoteQuestion(e.target.value)}
                        placeholder="투표 질문을 입력하세요"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">투표 옵션</Label>
                      <div className="space-y-2 mt-2">
                        {voteOptions.map((option) => (
                          <div key={option.id} className="flex space-x-2">
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                updateVoteOption(option.id, e.target.value)
                              }
                              placeholder="투표 옵션을 입력하세요"
                            />
                            {voteOptions.length > 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVoteOption(option.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <XIcon className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addVoteOption}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          옵션 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 이미지 옵션 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="hasImage"
                    checked={hasImage}
                    onCheckedChange={(checked) =>
                      setHasImage(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="hasImage"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    <span className="text-base font-medium">이미지 추가</span>
                  </Label>
                </div>

                {hasImage && (
                  <div className="ml-8 space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                    <div>
                      <Label htmlFor="imageUrl" className="text-sm font-medium">
                        이미지 URL
                      </Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="imageUrl"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="이미지 URL을 입력하세요"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-1" />
                          업로드
                        </Button>
                      </div>
                    </div>

                    {imageUrl && (
                      <div className="mt-3">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {isSubmitting ? "작성 중..." : "게시하기"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
