"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Reply,
  MoreVertical,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/lib/api/community";
import {
  getComments,
  getReplies,
  createComment,
  createReply,
  likeComment,
  unlikeComment,
} from "@/lib/api/community";

interface CommentSectionProps {
  postId: number;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: number) => void;
  onReply: (parentCommentId: number, content: string) => void;
  currentUserId?: string;
}

function CommentItem({
  comment,
  onLike,
  onReply,
  currentUserId,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
      // 대댓글 목록 새로고침
      if (showReplies) {
        loadReplies();
      }
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const loadReplies = async () => {
    if (comment.depth > 0) return; // 대댓글에는 답글 불가

    setIsLoadingReplies(true);
    try {
      const repliesData = await getReplies(comment.id);
      setReplies(repliesData);
    } catch (error) {
      console.error("Failed to load replies:", error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const isOwner = currentUserId === comment.author.id;

  return (
    <div
      className={`${
        comment.depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""
      }`}
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* 댓글 헤더 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                  {comment.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{comment.author.name}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>수정</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 댓글 내용 */}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {comment.content}
          </p>

          {/* 댓글 액션 버튼들 */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(comment.id)}
              className={`h-8 ${
                comment.isLiked ? "text-red-500" : "text-gray-500"
              }`}
            >
              <Heart
                className={`w-4 h-4 mr-1 ${
                  comment.isLiked ? "fill-current" : ""
                }`}
              />
              {comment.likeCount > 0 && comment.likeCount}
            </Button>

            {comment.depth === 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="h-8 text-gray-500"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  답글
                </Button>

                {replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleReplies}
                    className="h-8 text-gray-500"
                  >
                    {showReplies ? (
                      <ChevronUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1" />
                    )}
                    답글 {replies.length}개
                  </Button>
                )}
              </>
            )}
          </div>

          {/* 답글 작성 폼 */}
          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-4 space-y-3">
              <Textarea
                placeholder="답글을 작성해주세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  답글 달기
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 대댓글 목록 */}
      {showReplies && (
        <div className="mt-2 space-y-2">
          {isLoadingReplies ? (
            <div className="text-center py-4 text-gray-500">
              답글을 불러오는 중...
            </div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({
  postId,
  className = "",
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const response = await getComments(postId);
      setComments(response.content || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await createComment(postId, { content: newComment });
      setComments([comment, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      if (comment.isLiked) {
        await unlikeComment(commentId);
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: false, likeCount: c.likeCount - 1 }
              : c
          )
        );
      } else {
        await likeComment(commentId);
        setComments(
          comments.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: true, likeCount: c.likeCount + 1 }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to like/unlike comment:", error);
    }
  };

  const handleReply = async (parentCommentId: number, content: string) => {
    try {
      await createReply(parentCommentId, { content });
      // 대댓글이 추가된 후에는 해당 댓글의 답글 목록을 새로고침해야 함
      // 현재는 CommentItem 내부에서 처리됨
    } catch (error) {
      console.error("Failed to create reply:", error);
      alert("답글 작성에 실패했습니다.");
    }
  };

  // 최상위 댓글만 필터링
  const topLevelComments = comments.filter((comment) => comment.depth === 0);

  return (
    <div className={className}>
      {/* 댓글 작성 폼 */}
      <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="댓글을 작성해주세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {comments.length}개의 댓글
              </p>
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "작성 중..." : "댓글 작성"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            댓글을 불러오는 중...
          </div>
        ) : topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleLikeComment}
              onReply={handleReply}
            />
          ))
        ) : (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">
                아직 댓글이 없습니다.
                <br />첫 번째 댓글을 작성해보세요!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
