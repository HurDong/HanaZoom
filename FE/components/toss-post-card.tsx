"use client";

import { useState } from "react";
import { Heart, MessageSquare, Share2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TossVote } from "./toss-vote";
import { cn } from "@/lib/utils";
import type { Post, VoteOption } from "@/lib/api/community";

interface TossPostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
}

export function TossPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onVote,
}: TossPostCardProps) {
  const [showVote, setShowVote] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "text-green-400";
      case "bearish":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "매수";
      case "bearish":
        return "매도";
      default:
        return "중립";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white mb-4">
      <CardContent className="p-6">
        {/* 작성자 정보 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">
                  {post.author.name}
                </span>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  주주
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white"
          >
            팔로우
          </Button>
        </div>

        {/* 게시글 내용 */}
        <div className="mb-4">
          <p className="text-white text-base leading-relaxed">{post.content}</p>

          {/* 감정 표시 */}
          {post.sentiment && (
            <div className="mt-3">
              <span
                className={cn(
                  "text-sm px-3 py-1 rounded-full border",
                  getSentimentColor(post.sentiment),
                  post.sentiment.toLowerCase() === "bullish" &&
                    "border-green-400 bg-green-400/10",
                  post.sentiment.toLowerCase() === "bearish" &&
                    "border-red-400 bg-red-400/10",
                  post.sentiment.toLowerCase() === "neutral" &&
                    "border-gray-400 bg-gray-400/10"
                )}
              >
                {getSentimentText(post.sentiment)}
              </span>
            </div>
          )}
        </div>

        {/* 투표 섹션 */}
        {post.hasVote && post.voteOptions && post.voteOptions.length > 0 && (
          <div className="mb-4">
            <TossVote
              postId={post.id}
              voteQuestion={post.voteQuestion || "이 종목이 오를까요?"}
              voteOptions={post.voteOptions}
              totalVotes={post.voteOptions.reduce(
                (sum, opt) => sum + opt.voteCount,
                0
              )}
              userVote={post.userVote}
              onVote={onVote}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              isLiked={post.isLiked}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
            />
          </div>
        )}

        {/* 상호작용 버튼들 (투표가 없는 경우) */}
        {(!post.hasVote ||
          !post.voteOptions ||
          post.voteOptions.length === 0) && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center space-x-6">
              <button
                onClick={onLike}
                className={cn(
                  "flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors",
                  post.isLiked && "text-red-400"
                )}
                title={post.isLiked ? "좋아요 취소" : "좋아요"}
              >
                <Heart
                  className={cn("w-5 h-5", post.isLiked && "fill-current")}
                  style={{
                    fill: post.isLiked ? 'currentColor' : 'none',
                    stroke: 'currentColor',
                    strokeWidth: post.isLiked ? 0 : 1.5
                  }}
                />
                <span className="text-sm">{post.likeCount}</span>
              </button>

              <button
                onClick={onComment}
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">{post.commentCount}</span>
              </button>
            </div>

            <button
              onClick={onShare}
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
