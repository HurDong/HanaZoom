"use client";

import { MoreHorizontal, Edit, Trash2, Flag, Copy, Bookmark, Share2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PostMenuProps {
  postId: number;
  authorId: string;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onCopyLink?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onViewStats?: () => void;
}

export function PostMenu({
  postId,
  authorId,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onCopyLink,
  onBookmark,
  onShare,
  onViewStats,
}: PostMenuProps) {
  const isOwner = currentUserId && authorId === currentUserId;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/community/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("링크가 복사되었습니다");
    onCopyLink?.();
  };

  const handleBookmark = () => {
    toast.success("북마크에 추가되었습니다");
    onBookmark?.();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "게시글 공유",
        url: `${window.location.origin}/community/${postId}`,
      });
    } else {
      handleCopyLink();
    }
    onShare?.();
  };

  const handleViewStats = () => {
    toast.info("통계 기능은 준비 중입니다");
    onViewStats?.();
  };

  const handleReport = () => {
    toast.success("신고가 접수되었습니다");
    onReport?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48"
        sideOffset={5}
      >
        {/* 소유자 전용 메뉴 */}
        {isOwner && (
          <>
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* 공통 메뉴 */}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          링크 복사
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
          <Bookmark className="mr-2 h-4 w-4" />
          북마크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="mr-2 h-4 w-4" />
          공유하기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewStats} className="cursor-pointer">
          <BarChart3 className="mr-2 h-4 w-4" />
          통계 보기
        </DropdownMenuItem>

        {/* 비소유자 전용 메뉴 */}
        {!isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleReport} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Flag className="mr-2 h-4 w-4" />
              신고
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
