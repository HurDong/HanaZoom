"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  MoreHorizontal,
  Clock,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Post, PostSentiment, VoteOption } from "@/lib/api/community";

interface TossFeedCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
  onViewComments: () => void;
}

export function TossFeedCard({
  post,
  onLike,
  onComment,
  onShare,
  onVote,
  onViewComments
}: TossFeedCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
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
        return <TrendingUp className="w-4 h-4" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4" />;
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
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author?.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white font-semibold">
                {post.author?.nickname?.charAt(0) || <User className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {post.author?.nickname || "익명"}
                </p>
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
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* 본문 */}
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* 투표 섹션 */}
        {post.hasVote && post.voteOptions && post.voteOptions.length > 0 && (
          <div className="px-4 pb-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {option.text.includes("오를") ? "📈" : "📉"}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {option.text}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {option.voteCount}표
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      {totalVotes > 0 && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                isLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onViewComments}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.commentCount || 0}</span>
            </Button>

            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{post.viewCount || 0}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
