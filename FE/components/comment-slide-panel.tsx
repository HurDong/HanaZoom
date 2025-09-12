"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Send, 
  Heart, 
  User,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Comment } from "@/lib/api/community";

interface CommentSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  comments: Comment[];
  isLoading: boolean;
  currentUserId?: string;
  onCreateComment: (postId: number, content: string) => void;
  onLikeComment: (commentId: number, postId: number) => void;
  onDeleteComment: (commentId: number, postId: number) => void;
}

export function CommentSlidePanel({
  isOpen,
  onClose,
  postId,
  comments,
  isLoading,
  currentUserId,
  onCreateComment,
  onLikeComment,
  onDeleteComment
}: CommentSlidePanelProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    return commentDate.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            댓글 {comments.length}개
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 댓글 목록 */}
        <ScrollArea className="h-96 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">아직 댓글이 없습니다</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">첫 번째 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.author?.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs">
                      {comment.author?.nickname?.charAt(0) || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author?.nickname || "익명"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLikeComment(comment.id, postId)}
                        className={`text-xs h-6 px-2 ${
                          comment.isLiked 
                            ? "text-red-500 hover:text-red-600" 
                            : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                        {comment.likeCount || 0}
                      </Button>
                      
                      {currentUserId && comment.author?.id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("댓글을 삭제하시겠습니까?")) {
                              onDeleteComment(comment.id, postId);
                            }
                          }}
                          className="text-xs h-6 px-2 text-gray-500 hover:text-red-500"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 댓글 작성 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성하세요..."
              className="flex-1 min-h-[40px] max-h-24 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}