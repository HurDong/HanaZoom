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
  Send,
  Smile,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PostMenu } from "@/components/post-menu";
import { EditPostModal } from "@/components/edit-post-modal";
import { InlineEditPost } from "@/components/inline-edit-post";
import type { Post, PostSentiment, VoteOption, Comment } from "@/lib/api/community";

interface InstagramFeedItemProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
  // 댓글 관련 props 추가
  comments?: Comment[];
  isLoadingComments?: boolean;
  currentUserId?: string;
  onCreateComment?: (postId: number, content: string) => void;
  onLikeComment?: (commentId: number, postId: number) => void;
  onDeleteComment?: (commentId: number, postId: number) => void;
  showComments?: boolean;
  onToggleComments?: () => void;
  // 게시글 수정/삭제 관련 props
  onEditPost?: (postId: number, data: {
    content: string;
    imageUrl?: string;
    sentiment?: PostSentiment;
  }) => Promise<void>;
  onDeletePost?: (postId: number) => Promise<void>;
}

export function InstagramFeedItem({
  post,
  onLike,
  onComment,
  onShare,
  onVote,
  comments = [],
  isLoadingComments = false,
  currentUserId,
  onCreateComment,
  onLikeComment,
  onDeleteComment,
  showComments = false,
  onToggleComments,
  onEditPost,
  onDeletePost,
}: InstagramFeedItemProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked === true);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  // 투표 선택/확정 흐름 상태
  const [selectedVoteOption, setSelectedVoteOption] = useState<string | null>(null);
  
  // 댓글 관련 상태
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 게시글 수정/삭제 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // 댓글 관련 핸들러들
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment || !onCreateComment) return;
    
    setIsSubmittingComment(true);
    try {
      await onCreateComment(post.id, newComment.trim());
      setNewComment("");
      // 댓글 작성 후 텍스트에어리어 높이 초기화
      if (commentTextareaRef.current) {
        commentTextareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  };

  const handleCommentClick = () => {
    if (onToggleComments) {
      onToggleComments();
    } else {
      onComment();
    }
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
        
        {/* 게시글 메뉴 */}
        <PostMenu
          postId={post.id}
          authorId={post.author?.id || ""}
          currentUserId={currentUserId}
          onEdit={() => setIsEditing(true)}
          onDelete={() => {
            if (confirm("게시글을 삭제하시겠습니까?")) {
              onDeletePost?.(post.id);
            }
          }}
        />
      </div>

      {/* 본문 - 인스타그램 스타일 */}
      {isEditing ? (
        <div className="px-4 pb-3">
          <InlineEditPost
            post={post}
            onSave={async (postId, data) => {
              if (onEditPost) {
                await onEditPost(postId, data);
                setIsEditing(false);
              }
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap font-['Pretendard'] text-sm">
            {post.content}
          </p>
        </div>
      )}

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
            onError={(e) => {
              console.error("이미지 로드 실패:", { postId: post.id, imageUrl: post.imageUrl });
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
            onLoad={() => {
              console.log("이미지 로드 성공:", { postId: post.id, imageUrl: post.imageUrl });
            }}
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-['Pretendard']">
                  {post.voteQuestion || "어떻게 생각하시나요?"}
                </p>
                {post.userVote && (
                  <span className="text-xs text-blue-600 dark:text-blue-300 font-['Pretendard']">이미 투표함</span>
                )}
              </div>
              <div className="space-y-2">
                {post.voteOptions?.map((option) => {
                  const isVoted = post.userVote === option.id;
                  const percentage =
                    totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
                  const isSelectedBeforeConfirm = !post.userVote && selectedVoteOption === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (post.userVote) return;
                        setSelectedVoteOption((prev) => (prev === option.id ? null : option.id));
                      }}
                      disabled={!!post.userVote}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isVoted
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : post.userVote
                          ? "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          : isSelectedBeforeConfirm
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium font-['Pretendard']">
                          {option.text}
                        </span>
                        <div className="flex items-center space-x-2">
                          {post.userVote ? (
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
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{isSelectedBeforeConfirm ? "선택됨" : "투표 가능"}</span>
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
              {!post.userVote && (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedVoteOption(null)}
                    disabled={!selectedVoteOption}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors font-['Pretendard'] ${
                      selectedVoteOption
                        ? "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    선택 취소
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedVoteOption) return;
                      onVote(selectedVoteOption);
                    }}
                    disabled={!selectedVoteOption}
                    className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors font-['Pretendard'] ${
                      selectedVoteOption
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    완료
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center font-['Pretendard']">
                총 {totalVotes}표
              </p>
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
              onClick={handleCommentClick}
              className={`p-1 transition-colors ${
                showComments 
                  ? "text-blue-500 hover:text-blue-600" 
                  : "text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
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
              onClick={handleCommentClick}
              className={`p-0 h-auto font-['Pretendard'] transition-colors ${
                showComments 
                  ? "text-blue-500 hover:text-blue-600" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              댓글 {post.commentCount}개 {showComments ? "숨기기" : "모두 보기"}
            </Button>
          </div>
        )}
      </div>

      {/* 인스타그램 스타일 댓글 섹션 */}
      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* 댓글 목록 */}
          <div className="px-4 py-3 max-h-80 overflow-y-auto">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-['Pretendard']">
                  아직 댓글이 없습니다
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-['Pretendard']">
                  첫 번째 댓글을 작성해보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarImage src={comment.author?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs font-medium">
                        {comment.author?.name?.charAt(0) || <User className="w-3 h-3" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white font-['Pretendard']">
                          {comment.author?.name || "익명"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap font-['Pretendard'] leading-relaxed">
                        {comment.content}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLikeComment?.(comment.id, post.id)}
                          className={`text-xs h-6 px-2 font-['Pretendard'] transition-colors ${
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
                                onDeleteComment?.(comment.id, post.id);
                              }
                            }}
                            className="text-xs h-6 px-2 text-gray-500 hover:text-red-500 font-['Pretendard']"
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
          </div>

          {/* 댓글 작성 - 인스타그램 스타일 */}
          {currentUserId && onCreateComment && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end space-x-3">
                <Avatar className="w-7 h-7 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs font-medium">
                    <User className="w-3 h-3" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 flex items-end space-x-2">
                  <Textarea
                    ref={commentTextareaRef}
                    value={newComment}
                    onChange={handleTextareaChange}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="댓글 달기..."
                    className="flex-1 min-h-[36px] max-h-24 resize-none border-0 bg-transparent px-0 py-2 text-sm font-['Pretendard'] placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                    style={{ height: '36px' }}
                  />
                  
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="bg-transparent hover:bg-transparent p-0 h-auto text-blue-500 hover:text-blue-600 disabled:text-gray-300 dark:disabled:text-gray-600 font-['Pretendard'] font-semibold text-sm"
                  >
                    {isSubmittingComment ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "게시"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 게시글 수정 모달 */}
      {showEditModal && onEditPost && (
        <EditPostModal
          post={post}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={onEditPost}
        />
      )}
    </div>
  );
}
