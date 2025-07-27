"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  likeCount: number;
  isLiked?: boolean;
}

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // TODO: API 연동 - 댓글 목록 가져오기
    // fetchComments(postId);
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      // TODO: API 연동 - 댓글 작성
      // await createComment(postId, newComment);
      setNewComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      // TODO: API 연동 - 댓글 좋아요
      // await likeComment(commentId);
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="댓글을 작성해주세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white self-end"
        >
          {isSubmitting ? "작성 중..." : "작성"}
        </Button>
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
          >
            <Avatar>
              <AvatarImage src={comment.author.avatar} />
              <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-green-900 dark:text-green-100">
                  {comment.author.name}
                </span>
                <time className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </time>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {comment.content}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment.id)}
                className={`${
                  comment.isLiked
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                } hover:text-green-700 dark:hover:text-green-300`}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {comment.likeCount}
              </Button>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            아직 작성된 댓글이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
