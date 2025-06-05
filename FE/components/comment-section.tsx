"use client"

import { useState } from "react"
import type { Comment } from "@/types/community"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface CommentSectionProps {
  opinionId: string
  comments: Comment[]
}

export function CommentSection({ opinionId, comments }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("")
  const [localComments, setLocalComments] = useState<Comment[]>(comments)

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
    } catch (error) {
      return "날짜 정보 없음"
    }
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return

    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      opinionId,
      userId: "current-user",
      userName: "나",
      userAvatar: "/placeholder.svg?height=40&width=40",
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    }

    setLocalComments([...localComments, newComment])
    setCommentText("")
  }

  const handleLike = (commentId: string) => {
    setLocalComments(
      localComments.map((comment) => {
        if (comment.id === commentId) {
          const isLiked = !comment.isLiked
          return {
            ...comment,
            isLiked,
            likes: isLiked ? comment.likes + 1 : comment.likes - 1,
          }
        }
        return comment
      }),
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {localComments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="w-8 h-8 border border-green-200 dark:border-green-700">
              <AvatarImage src={comment.userAvatar || "/placeholder.svg"} alt={comment.userName} />
              <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {comment.userName.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900 dark:text-green-100">{comment.userName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 mt-1 h-6 px-2 ${
                  comment.isLiked ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span className="text-xs">{comment.likes}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Avatar className="w-8 h-8 border border-green-200 dark:border-green-700">
          <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            나
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[60px] border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              댓글 작성
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
