"use client";

import { useState } from "react";
import type { Opinion, Comment } from "@/types/community";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { CommentSection } from "./comment-section";
import { Input } from "@/components/ui/input";

interface OpinionCardProps {
  opinion: Opinion;
  comments: Comment[];
}

export function OpinionCard({ opinion, comments }: OpinionCardProps) {
  const [isLiked, setIsLiked] = useState(opinion.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(opinion.isDisliked || false);
  const [likes, setLikes] = useState(opinion.likes);
  const [dislikes, setDislikes] = useState(opinion.dislikes);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes(likes - 1);
    } else {
      setIsLiked(true);
      setLikes(likes + 1);
      if (isDisliked) {
        setIsDisliked(false);
        setDislikes(dislikes - 1);
      }
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false);
      setDislikes(dislikes - 1);
    } else {
      setIsDisliked(true);
      setDislikes(dislikes + 1);
      if (isLiked) {
        setIsLiked(false);
        setLikes(likes - 1);
      }
    }
  };

  const handleAddComment = () => {
    // Handle adding a new comment
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch (error) {
      return "날짜 정보 없음";
    }
  };

  const sentimentColor = {
    bullish: "text-green-600 dark:text-green-400",
    bearish: "text-red-600 dark:text-red-400",
    neutral: "text-yellow-600 dark:text-yellow-400",
  };

  const sentimentBg = {
    bullish: "bg-green-100 dark:bg-green-900/30",
    bearish: "bg-red-100 dark:bg-red-900/30",
    neutral: "bg-yellow-100 dark:bg-yellow-900/30",
  };

  const sentimentText = {
    bullish: "매수",
    bearish: "매도",
    neutral: "중립",
  };

  const sentimentEmoji = {
    bullish: "📈",
    bearish: "📉",
    neutral: "⚖️",
  };

  return (
    <Card className="border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-green-200 dark:border-green-800">
              <AvatarImage src={opinion.userAvatar} alt={opinion.userName} />
              <AvatarFallback>{opinion.userName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-green-900 dark:text-green-100">
                {opinion.userName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(opinion.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center px-3 py-1 rounded-full ${
              opinion.sentiment === "bullish"
                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                : opinion.sentiment === "bearish"
                ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                : "bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400"
            }`}
          >
            {opinion.sentiment === "bullish" ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : opinion.sentiment === "bearish" ? (
              <TrendingDown className="w-4 h-4 mr-1" />
            ) : (
              <Minus className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm font-medium">
              {opinion.sentiment === "bullish"
                ? "매수"
                : opinion.sentiment === "bearish"
                ? "매도"
                : "중립"}
            </span>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {opinion.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${
                opinion.sentiment === "bullish"
                  ? "text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                  : opinion.sentiment === "bearish"
                  ? "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{opinion.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{opinion.dislikes}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{opinion.commentCount}개의 댓글</span>
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="댓글을 작성해주세요..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentContent.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                작성
              </Button>
            </div>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-green-100 dark:border-green-800"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={comment.userAvatar}
                      alt={comment.userName}
                    />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-green-900 dark:text-green-100">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
