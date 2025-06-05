"use client"

import { useState } from "react"
import type { Opinion, Comment } from "@/types/community"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { CommentSection } from "./comment-section"

interface OpinionCardProps {
  opinion: Opinion
  comments: Comment[]
}

export function OpinionCard({ opinion, comments }: OpinionCardProps) {
  const [isLiked, setIsLiked] = useState(opinion.isLiked || false)
  const [isDisliked, setIsDisliked] = useState(opinion.isDisliked || false)
  const [likes, setLikes] = useState(opinion.likes)
  const [dislikes, setDislikes] = useState(opinion.dislikes)
  const [showComments, setShowComments] = useState(false)

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false)
      setLikes(likes - 1)
    } else {
      setIsLiked(true)
      setLikes(likes + 1)
      if (isDisliked) {
        setIsDisliked(false)
        setDislikes(dislikes - 1)
      }
    }
  }

  const handleDislike = () => {
    if (isDisliked) {
      setIsDisliked(false)
      setDislikes(dislikes - 1)
    } else {
      setIsDisliked(true)
      setDislikes(dislikes + 1)
      if (isLiked) {
        setIsLiked(false)
        setLikes(likes - 1)
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
    } catch (error) {
      return "날짜 정보 없음"
    }
  }

  const sentimentColor = {
    bullish: "text-green-600 dark:text-green-400",
    bearish: "text-red-600 dark:text-red-400",
    neutral: "text-yellow-600 dark:text-yellow-400",
  }

  const sentimentBg = {
    bullish: "bg-green-100 dark:bg-green-900/30",
    bearish: "bg-red-100 dark:bg-red-900/30",
    neutral: "bg-yellow-100 dark:bg-yellow-900/30",
  }

  const sentimentText = {
    bullish: "매수",
    bearish: "매도",
    neutral: "중립",
  }

  const sentimentEmoji = {
    bullish: "📈",
    bearish: "📉",
    neutral: "⚖️",
  }

  return (
    <Card className="mb-4 border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-md transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10 border-2 border-green-200 dark:border-green-700">
            <AvatarImage src={opinion.userAvatar || "/placeholder.svg"} alt={opinion.userName} />
            <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {opinion.userName.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-900 dark:text-green-100">{opinion.userName}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${sentimentBg[opinion.sentiment]} ${
                    sentimentColor[opinion.sentiment]
                  }`}
                >
                  {sentimentEmoji[opinion.sentiment]} {sentimentText[opinion.sentiment]}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(opinion.createdAt)}</span>
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{opinion.content}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-1 ${
                isLiked ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`flex items-center gap-1 ${
                isDisliked ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{dislikes}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{opinion.commentCount}</span>
            {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {showComments && (
          <>
            <Separator className="my-3 bg-green-100 dark:bg-green-800" />
            <CommentSection opinionId={opinion.id} comments={comments} />
          </>
        )}
      </CardFooter>
    </Card>
  )
}
