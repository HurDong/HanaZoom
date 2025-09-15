"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Post, PostSentiment } from "@/lib/api/community";

interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postId: number, data: {
    content: string;
    imageUrl?: string;
    sentiment?: PostSentiment;
  }) => Promise<void>;
}

const sentimentOptions = [
  { value: "BULLISH", label: "매수", icon: TrendingUp, color: "bg-red-500 hover:bg-red-600 text-white" },
  { value: "BEARISH", label: "매도", icon: TrendingDown, color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "NEUTRAL", label: "중립", icon: null, color: "bg-gray-500 hover:bg-gray-600 text-white" },
] as const;

export function EditPostModal({ post, isOpen, onClose, onSave }: EditPostModalProps) {
  const [content, setContent] = useState(post.content || "");
  const [imageUrl, setImageUrl] = useState(post.imageUrl || "");
  const [sentiment, setSentiment] = useState<PostSentiment>(post.sentiment || "NEUTRAL");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(post.content || "");
      setImageUrl(post.imageUrl || "");
      setSentiment(post.sentiment || "NEUTRAL");
    }
  }, [isOpen, post]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      await onSave(post.id, {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        sentiment,
      });
      toast.success("게시글이 수정되었습니다");
      onClose();
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("게시글 수정에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col z-[10000]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            게시글 수정
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 스크롤 가능한 내용 영역 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* 내용 */}
            <div className="space-y-1">
              <Label htmlFor="content" className="text-sm font-medium text-gray-900 dark:text-white">
                내용 *
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="게시글 내용을 입력하세요..."
                className="min-h-[100px] resize-none text-sm"
              />
            </div>

            {/* 이미지 URL */}
            <div className="space-y-1">
              <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-900 dark:text-white">
                이미지 URL (선택사항)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="이미지 URL을 입력하세요"
                  className="flex-1 h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 투자의견 선택 */}
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">투자 의견</Label>
              <div className="flex space-x-3">
                {sentimentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = sentiment === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment(option.value as PostSentiment)}
                      className={`${
                        isSelected
                          ? option.color
                          : option.value === "BULLISH"
                          ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                          : option.value === "BEARISH"
                          ? "text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                          : "text-gray-600 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 mr-2" />}
                      <span>{option.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 고정 푸터 */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 px-4 text-sm font-medium"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !content.trim()}
            className="h-8 px-4 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? "수정 중..." : "수정하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
