"use client";

import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
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
  onVote,
}: InstagramFeedItemProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked === true);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // post.isLiked 값이 변경될 때마다 로컬 상태 동기화
  useEffect(() => {
    const newIsLiked = post.isLiked === true;
    const newLikeCount = post.likeCount || 0;
    
    // 상태가 실제로 다른 경우에만 업데이트
    if (isLiked !== newIsLiked || likeCount !== newLikeCount) {
      console.log(`🔄 Post ${post.id} 상태 동기화:`, {
        isLiked: `${isLiked} → ${newIsLiked}`,
        likeCount: `${likeCount} → ${newLikeCount}`,
        postIsLiked: post.isLiked
      });
      setIsLiked(newIsLiked);
      setLikeCount(newLikeCount);
    }
  }, [post.isLiked, post.likeCount, post.id]);

  const handleLike = () => {
    console.log(`💖 Post ${post.id} 좋아요 클릭:`, {
      postId: post.id,
      현재상태: isLiked,
      변경될상태: !isLiked,
      현재좋아요수: likeCount,
      변경될좋아요수: isLiked ? likeCount - 1 : likeCount + 1
    });
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
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
      case "BULLISH":
        return "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
      case "BEARISH":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
    }
  };

  const getSentimentIcon = (sentiment: PostSentiment) => {
    switch (sentiment) {
      case "BULLISH":
        return <TrendingUp className="w-3 h-3" />;
      case "BEARISH":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - postDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return postDate.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
      {/* 헤더 - 인스타그램 스타일 */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={post.author.avatar}
              alt={post.author.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-green-500 text-white text-xs font-medium">
              {post.author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white text-sm font-['Pretendard']">
                {post.author.name}
              </span>
              <Badge
                className={`text-xs px-2 py-1 ${getSentimentColor(
                  post.sentiment
                )} font-['Pretendard']`}
              >
                <div className="flex items-center space-x-1">
                  {getSentimentIcon(post.sentiment)}
                  <span>
                    {post.sentiment === "BULLISH"
                      ? "매수"
                      : post.sentiment === "BEARISH"
                      ? "매도"
                      : "중립"}
                  </span>
                </div>
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span className="font-['Pretendard']">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
          <MoreHorizontal className="w-4 h-4 text-gray-900 dark:text-gray-100" />
        </Button>
      </div>

      {/* 본문 - 인스타그램 스타일 */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap font-['Pretendard'] text-sm">
          {post.content}
        </p>
      </div>

      {/* 이미지 - 인스타그램 스타일 */}
      {post.imageUrl && (
        <div
          ref={imageRef}
          className="relative cursor-pointer select-none"
          onDoubleClick={handleDoubleTap}
        >
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full h-auto object-cover"
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
      {(() => {
        const shouldShowVote =
          (post.hasVote || post.postType === "POLL") &&
          post.voteOptions &&
          post.voteOptions.length > 0;


        if (!shouldShowVote) {
          return null;
        }

        const totalVotes = post.voteOptions?.reduce(
          (sum, opt) => sum + opt.voteCount,
          0
        ) || 0;

        return (
          <div className="px-4 pb-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 font-['Pretendard']">
                {post.voteQuestion || "어떻게 생각하시나요?"}
              </p>
              <div className="space-y-2">
                {post.voteOptions?.map((option) => {
                  const isVoted = post.userVote === option.id;
                  const percentage =
                    totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;

                  return (
                    <button
                      key={option.id}
                      onClick={() => onVote(option.id)}
                      disabled={!!post.userVote}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isVoted
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : post.userVote
                          ? "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium font-['Pretendard']">
                          {option.text}
                        </span>
                        <div className="flex items-center space-x-2">
                          {post.userVote && (
                            <>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {option.voteCount}표
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({percentage.toFixed(1)}%)
                              </span>
                              {isVoted && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {post.userVote && totalVotes > 0 && (
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {post.userVote && totalVotes > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center font-['Pretendard']">
                  총 {totalVotes}표
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* 액션 버튼들 - 인스타그램 스타일 */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`p-1 transition-all duration-200 ${
                isLiked
                  ? "text-red-500 hover:text-red-600 scale-110"
                  : "text-gray-900 dark:text-gray-100 hover:text-red-500 hover:scale-105"
              }`}
              title={isLiked ? "좋아요 취소" : "좋아요"}
            >
              <Heart 
                className={`w-6 h-6 transition-all duration-200 ${
                  isLiked ? "fill-current drop-shadow-sm" : "hover:scale-110"
                }`} 
                style={{
                  fill: isLiked ? 'currentColor' : 'none',
                  stroke: isLiked ? 'currentColor' : 'currentColor',
                  strokeWidth: isLiked ? 0 : 1.5
                }}
              />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="p-1 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="p-1 text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* 좋아요 수 */}
        {likeCount > 0 && (
          <div className="mb-2">
            <span className={`font-semibold text-sm font-['Pretendard'] transition-colors duration-200 ${
              isLiked 
                ? "text-red-600 dark:text-red-400" 
                : "text-gray-900 dark:text-gray-100"
            }`}>
              좋아요 {likeCount.toLocaleString()}개
            </span>
          </div>
        )}

        {/* 댓글 수 */}
        {post.commentCount > 0 && (
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="p-0 h-auto text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-['Pretendard']"
            >
              댓글 {post.commentCount}개 모두 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
