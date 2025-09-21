"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquare,
  ThumbsUp,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { CommentSection } from "./comment-section";

interface Post {
  id: number;
  content: string;
  sentiment: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

interface OpinionCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

export function OpinionCard({
  post,
  onLike,
  onComment,
  onShare,
}: OpinionCardProps) {
  const [showComments, setShowComments] = useState(false);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return "text-green-600 dark:text-green-400";
      case "BEARISH":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return <TrendingUp className="w-4 h-4" />;
      case "BEARISH":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return "매수";
      case "BEARISH":
        return "매도";
      default:
        return "중립";
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-green-900 dark:text-green-100">
              {post.author.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <time>
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </time>
              <span>•</span>
              <span
                className={`flex items-center gap-1 ${getSentimentColor(
                  post.sentiment
                )}`}
              >
                {getSentimentIcon(post.sentiment)}
                {getSentimentText(post.sentiment)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {post.content}
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`${
              post.isLiked
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
            } hover:text-green-700 dark:hover:text-green-300 cursor-pointer`}
            title={post.isLiked ? "좋아요 취소" : "좋아요"}
          >
            <ThumbsUp 
              className="w-4 h-4 mr-1" 
              style={{
                fill: post.isLiked ? 'currentColor' : 'none',
                stroke: 'currentColor',
                strokeWidth: post.isLiked ? 0 : 1.5
              }}
            />
            {post.likeCount}
            {post.isLiked && " (좋아요함)"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {post.commentCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-1" />
            공유
          </Button>
        </div>
        {showComments && (
          <div className="mt-4">
            <CommentSection postId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
