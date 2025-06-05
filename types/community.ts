export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  emoji: string
  sector: string
}

export interface Opinion {
  id: string
  stockSymbol: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  sentiment: "bullish" | "bearish" | "neutral"
  createdAt: string
  likes: number
  dislikes: number
  commentCount: number
  isLiked?: boolean
  isDisliked?: boolean
}

export interface Comment {
  id: string
  opinionId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
  likes: number
  isLiked?: boolean
}

export type SortOption = "latest" | "popular" | "controversial"
export type FilterOption = "all" | "bullish" | "bearish" | "neutral"
