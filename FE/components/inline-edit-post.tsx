"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, TrendingUp, TrendingDown, X, Check, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToLocal } from "@/lib/api/upload";
import { toast } from "sonner";
import type { Post, PostSentiment } from "@/lib/api/community";

interface InlineEditPostProps {
  post: Post;
  onSave: (
    postId: number,
    data: {
      content: string;
      imageUrl?: string;
      sentiment?: PostSentiment;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

const sentimentOptions = [
  { value: "BULLISH", label: "매수", icon: TrendingUp, color: "bg-red-500 hover:bg-red-600 text-white" },
  { value: "BEARISH", label: "매도", icon: TrendingDown, color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "NEUTRAL", label: "중립", icon: null, color: "bg-gray-500 hover:bg-gray-600 text-white" },
] as const;

export function InlineEditPost({ post, onSave, onCancel }: InlineEditPostProps) {
  const [content, setContent] = useState(post.content || "");
  const [imageUrl, setImageUrl] = useState(post.imageUrl || "");
  const [sentiment, setSentiment] = useState<PostSentiment>(post.sentiment || "NEUTRAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(post.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(post.content || "");
    setImageUrl(post.imageUrl || "");
    setSentiment(post.sentiment || "NEUTRAL");
    setImagePreview(post.imageUrl || "");
  }, [post]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (500KB 제한)
    if (file.size > 500 * 1024) {
      toast.error('파일 크기는 500KB를 초과할 수 없습니다.');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {
      // 임시로 로컬 스토리지에 저장 (개발용)
      const imageUrl = await uploadImageToLocal(file);
      setImageUrl(imageUrl);
      setImagePreview(imageUrl);
      toast.success('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }

    console.log("인라인 편집 - 저장 데이터:", {
      postId: post.id,
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      sentiment,
    });

    setIsLoading(true);
    try {
      await onSave(post.id, {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        sentiment,
      });
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("게시글 수정에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          게시글 수정
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="h-8 px-3"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || !content.trim()}
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 내용 */}
      <div className="space-y-2">
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

      {/* 이미지 업로드 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900 dark:text-white">
          이미지 (선택사항)
        </Label>
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-9 px-3"
            >
              <FileImage className="h-4 w-4 mr-1" />
              {isUploading ? "업로드 중..." : "파일 선택"}
            </Button>
            {imagePreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="h-9 px-3 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                제거
              </Button>
            )}
          </div>
          {selectedFile && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              선택된 파일: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
            </p>
          )}
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          )}
          {/* URL 입력 옵션 (백업) */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Label htmlFor="imageUrl" className="text-xs text-gray-600 dark:text-gray-400">
              또는 이미지 URL 직접 입력
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="이미지 URL을 입력하세요"
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      {/* 투자의견 선택 */}
      <div className="space-y-2">
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

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">수정 중...</span>
        </div>
      )}
    </div>
  );
}
