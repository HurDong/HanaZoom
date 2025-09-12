"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Image as ImageIcon, 
  TrendingUp, 
  TrendingDown,
  Plus,
  X as XIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PostSentiment, VoteOption } from "@/lib/api/community";

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    sentiment: PostSentiment;
    hasVote?: boolean;
    voteOptions?: VoteOption[];
    voteQuestion?: string;
    imageUrl?: string;
  }) => void;
}

export function WritePostModal({ isOpen, onClose, onSubmit }: WritePostModalProps) {
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<PostSentiment>("neutral");
  const [hasVote, setHasVote] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState("");
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([
    { id: "1", text: "오를 것 같다 📈", voteCount: 0 },
    { id: "2", text: "내릴 것 같다 📉", voteCount: 0 }
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
        hasVote,
        voteOptions: hasVote ? voteOptions : undefined,
        voteQuestion: hasVote ? voteQuestion : undefined,
        imageUrl: imageUrl || undefined
      });
      
      // 폼 리셋
      setContent("");
      setSentiment("neutral");
      setHasVote(false);
      setVoteQuestion("");
      setVoteOptions([
        { id: "1", text: "오를 것 같다 📈", voteCount: 0 },
        { id: "2", text: "내릴 것 같다 📉", voteCount: 0 }
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
    const newId = (voteOptions.length + 1).toString();
    setVoteOptions([...voteOptions, { id: newId, text: "", voteCount: 0 }]);
  };

  const removeVoteOption = (id: string) => {
    if (voteOptions.length > 2) {
      setVoteOptions(voteOptions.filter(option => option.id !== id));
    }
  };

  const updateVoteOption = (id: string, text: string) => {
    setVoteOptions(voteOptions.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900">
        <CardContent className="p-0">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">텍스트</TabsTrigger>
                <TabsTrigger value="image">이미지</TabsTrigger>
                <TabsTrigger value="vote">투표</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="무엇을 공유하고 싶으신가요?"
                    className="min-h-[120px] mt-2"
                  />
                </div>
                
                <div>
                  <Label>감정</Label>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      type="button"
                      variant={sentiment === "bullish" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("bullish")}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <TrendingUp className="w-4 h-4 mr-1" />
                      매수
                    </Button>
                    <Button
                      type="button"
                      variant={sentiment === "bearish" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("bearish")}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <TrendingDown className="w-4 h-4 mr-1" />
                      매도
                    </Button>
                    <Button
                      type="button"
                      variant={sentiment === "neutral" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSentiment("neutral")}
                    >
                      중립
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="imageUrl">이미지 URL</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="이미지 URL을 입력하세요"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      업로드
                    </Button>
                  </div>
                </div>
                
                {imageUrl && (
                  <div className="mt-4">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vote" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="voteQuestion">투표 질문</Label>
                  <Input
                    id="voteQuestion"
                    value={voteQuestion}
                    onChange={(e) => setVoteQuestion(e.target.value)}
                    placeholder="투표 질문을 입력하세요"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>투표 옵션</Label>
                  <div className="space-y-2 mt-2">
                    {voteOptions.map((option) => (
                      <div key={option.id} className="flex space-x-2">
                        <Input
                          value={option.text}
                          onChange={(e) => updateVoteOption(option.id, e.target.value)}
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hasVote"
                    checked={hasVote}
                    onChange={(e) => setHasVote(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="hasVote">투표 기능 활성화</Label>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
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
