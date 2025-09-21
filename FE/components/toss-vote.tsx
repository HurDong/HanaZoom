"use client";

import { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VoteOption } from "@/lib/api/community";

interface TossVoteProps {
  postId: number;
  voteQuestion: string;
  voteOptions: VoteOption[];
  totalVotes: number;
  userVote?: string;
  onVote: (optionId: string) => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
}

export function TossVote({
  postId,
  voteQuestion,
  voteOptions,
  totalVotes,
  userVote,
  onVote,
  onLike,
  onComment,
  onShare,
  isLiked,
  likeCount,
  commentCount,
}: TossVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    userVote || null
  );
  const [hasVoted, setHasVoted] = useState(!!userVote);

  useEffect(() => {
    setSelectedOption(userVote || null);
    setHasVoted(!!userVote);
  }, [userVote]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    setSelectedOption(optionId);
    setHasVoted(true);
    onVote(optionId);
  };

  const getOptionStyle = (optionId: string) => {
    if (!hasVoted) {
      return "bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500";
    }

    if (selectedOption === optionId) {
      return "bg-blue-600 border-blue-500 text-white";
    }

    return "bg-gray-800 border-gray-600 opacity-60";
  };

  const getPercentage = (option: VoteOption) => {
    if (totalVotes === 0) return 0;
    return Math.round((option.voteCount / totalVotes) * 100);
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white">
      <CardContent className="p-6">
        {/* 투표 질문 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">{voteQuestion}</h3>
        </div>

        {/* 투표 옵션 */}
        <div className="space-y-3 mb-6">
          {voteOptions.map((option) => (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  "disabled:cursor-not-allowed",
                  getOptionStyle(option.id)
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-semibold">
                      {getPercentage(option)}%
                    </span>
                  )}
                </div>

                {/* 투표 진행률 바 */}
                {hasVoted && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getPercentage(option)}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* 투표 참여자 수 */}
        <div className="text-center mb-6">
          <p className="text-gray-300 text-sm">{totalVotes}명이 참여했어요</p>
        </div>

        {/* 상호작용 버튼들 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-6">
            <button
              onClick={onLike}
              className={cn(
                "flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors",
                isLiked && "text-red-400"
              )}
              title={isLiked ? "좋아요 취소" : "좋아요"}
            >
              <Heart 
                className={cn("w-5 h-5", isLiked && "fill-current")}
                style={{
                  fill: isLiked ? 'currentColor' : 'none',
                  stroke: 'currentColor',
                  strokeWidth: isLiked ? 0 : 1.5
                }}
              />
              <span className="text-sm">{likeCount}</span>
            </button>

            <button
              onClick={onComment}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">{commentCount}</span>
            </button>
          </div>

          <button
            onClick={onShare}
            className="text-gray-400 hover:text-green-400 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
