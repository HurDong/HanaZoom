"use client";

import { useState } from "react";
import { Heart, MessageSquare, Trash2, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Comment } from "@/lib/api/community";

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  isLoading: boolean;
  currentUserId?: string;
  onCreateComment: (postId: number, content: string) => void;
  onLikeComment: (commentId: number, postId: number) => void;
  onDeleteComment: (commentId: number, postId: number) => void;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: number;
  currentUserId?: string;
  onLike: (commentId: number, postId: number) => void;
  onDelete: (commentId: number, postId: number) => void;
}

function CommentItem({ comment, postId, currentUserId, onLike, onDelete }: CommentItemProps) {
  const isOwner = currentUserId === comment.author.id;

  return (
    <div className="flex gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {comment.author.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 whitespace-pre-wrap">
          {comment.content}
        </p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(comment.id, postId)}
            className={cn(
              "flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors",
              comment.isLiked && "text-red-500"
            )}
          >
            <Heart className={cn("w-3 h-3", comment.isLiked && "fill-current")} />
            {comment.likeCount}
          </button>
          
          {isOwner && (
            <button
              onClick={() => onDelete(comment.id, postId)}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSectionSimple({
  postId,
  comments,
  isLoading,
  currentUserId,
  onCreateComment,
  onLikeComment,
  onDeleteComment,
  className = "",
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateComment(postId, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      {/* 댓글 작성 폼 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성해주세요..."
            className="flex-1 min-h-[60px] resize-none"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isSubmitting}
            className="self-end bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* 댓글 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <span className="ml-2 text-sm text-gray-500">댓글을 불러오는 중...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-sm">아직 댓글이 없습니다.</p>
            <p className="text-xs">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onLike={onLikeComment}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
