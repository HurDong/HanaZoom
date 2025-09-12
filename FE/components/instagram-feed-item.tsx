"use client";

import { useState, useRef } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Clock,
  User,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Post, PostSentiment, VoteOption } from "@/lib/api/community";

interface InstagramFeedItemProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
}

export function InstagramFeedItem({
  post,
  onLike,
  onComment,
  onShare,
  onVote
}: InstagramFeedItemProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // 더블탭 감지
      if (!isLiked) {
        handleLike();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    }
    setLastTap(now);
  };

  const getSentimentColor = (sentiment: PostSentiment) => {
    switch (sentiment) {
      case "bullish":
        return "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "bearish":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
    }
  };

  const getSentimentIcon = (sentiment: PostSentiment) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-3 h-3" />;
      case "bearish":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return postDate.toLocaleDateString();
  };

  return (
    <article className="bg-white dark:bg-gray-900 border-b border-emerald-200 dark:border-emerald-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author?.profileImageUrl} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold">
              {post.author?.nickname?.charAt(0) || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {post.author?.nickname || "익명"}
              </span>
              {post.sentiment && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getSentimentColor(post.sentiment)}`}
                >
                  {getSentimentIcon(post.sentiment)}
                  <span className="ml-1">
                    {post.sentiment === "bullish" ? "매수" : "매도"}
                  </span>
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-2">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* 본문 */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* 이미지 */}
      {post.imageUrl && (
        <div 
          ref={imageRef}
          className="relative cursor-pointer select-none"
          onDoubleClick={handleDoubleTap}
        >
          <img 
            src={post.imageUrl} 
            alt="Post image"
            className="w-full h-auto max-h-96 object-cover"
          />
          {/* 더블탭 하트 애니메이션 */}
          {showHeartAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-ping">
                <Heart className="w-16 h-16 text-red-500 fill-current" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 투표 섹션 */}
      {post.hasVote && post.voteOptions && post.voteOptions.length > 0 && (
        <div className="px-4 py-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-3 font-['Pretendard']">
            {post.voteQuestion || "어떻게 생각하시나요?"}
          </p>
          <div className="space-y-2">
            {post.voteOptions.map((option) => {
              const isVoted = post.userVote === option.id;
              const totalVotes = post.voteOptions?.reduce((sum, opt) => sum + opt.voteCount, 0) || 0;
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              
              return (
                <button
                  key={option.id}
                  onClick={() => onVote(option.id)}
                  disabled={isVoted}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    isVoted
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-emerald-200 dark:border-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {option.text.includes("오를") ? "📈" : "📉"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white font-['Pretendard']">
                        {option.text}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 font-['Pretendard']">
                        {option.voteCount}표
                      </div>
                      <div className="text-xs text-emerald-500 dark:text-emerald-400 font-['Pretendard']">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {totalVotes > 0 && (
                    <div className="mt-2 w-full bg-emerald-200 dark:bg-emerald-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-2 transition-colors ${
                isLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="p-2 text-gray-500 hover:text-emerald-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* 좋아요 수 */}
        {likeCount > 0 && (
          <div className="mt-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white font-['Pretendard']">
              좋아요 {likeCount.toLocaleString()}개
            </span>
          </div>
        )}

        {/* 댓글 수 */}
        {post.commentCount > 0 && (
          <div className="mt-1">
            <button 
              onClick={onComment}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-['Pretendard']"
            >
              댓글 {post.commentCount.toLocaleString()}개 모두 보기
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
