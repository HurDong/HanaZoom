import api from "@/app/config/api";

export type PostType = "TEXT" | "POLL";
export type PostSentiment = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface VoteOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Post {
  id: number;
  title: string | null;
  content: string;
  imageUrl?: string;
  postType: PostType;
  sentiment: PostSentiment;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  hasVote?: boolean;
  voteQuestion?: string;
  voteOptions?: VoteOption[];
  userVote?: string; // 사용자가 선택한 투표 옵션 ID
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostRequest {
  title?: string;
  content: string;
  imageUrl?: string;
  postType?: PostType;
  sentiment: PostSentiment;
  hasVote?: boolean;
  voteQuestion?: string;
  voteOptions?: string[];
}

export interface Comment {
  id: number;
  content: string;
  likeCount: number;
  isLiked: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  parentCommentId?: number;
  depth: number;
}

export interface CreateCommentRequest {
  content: string;
}

export interface PostListResponse {
  content: Post[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Posts
export const getPosts = async (
  symbol: string,
  page = 0,
  size = 20
): Promise<PostListResponse> => {
  const response = await api.get(`/community/stocks/${symbol}/posts`, {
    params: { page, size },
  });
  return response.data.data;
};

export const getPost = async (postId: number): Promise<Post> => {
  const response = await api.get(`/community/posts/${postId}`);
  return response.data.data;
};

export const createPost = async (
  symbol: string,
  data: CreatePostRequest
): Promise<Post> => {
  const response = await api.post(`/community/stocks/${symbol}/posts`, {
    ...data,
    postType: data.postType || "TEXT",
  });
  return response.data.data;
};

export const updatePost = async (
  postId: number,
  data: CreatePostRequest
): Promise<Post> => {
  const response = await api.put(`/community/posts/${postId}`, data);
  return response.data.data;
};

export const deletePost = async (postId: number): Promise<void> => {
  await api.delete(`/community/posts/${postId}`);
};

export const likePost = async (postId: number): Promise<void> => {
  await api.post(`/community/posts/${postId}/like`);
};

export const unlikePost = async (postId: number): Promise<void> => {
  await api.delete(`/community/posts/${postId}/like`);
};

// 투표 관련 API
export const voteOnPost = async (
  postId: number,
  optionId: string
): Promise<void> => {
  await api.post(`/community/posts/${postId}/vote`, { optionId });
};

export const getPostVoteResults = async (
  postId: number
): Promise<{
  voteOptions: VoteOption[];
  totalVotes: number;
  userVote?: string;
}> => {
  const response = await api.get(`/community/posts/${postId}/vote-results`);
  return response.data.data;
};

// Comments
export const getComments = async (
  postId: number,
  page = 0,
  size = 20
): Promise<PostListResponse> => {
  const response = await api.get(`/community/posts/${postId}/comments`, {
    params: { page, size },
  });
  return response.data.data;
};

export const createComment = async (
  postId: number,
  data: CreateCommentRequest
): Promise<Comment> => {
  const response = await api.post(`/community/posts/${postId}/comments`, data);
  return response.data.data;
};

export const updateComment = async (
  commentId: number,
  data: CreateCommentRequest
): Promise<Comment> => {
  const response = await api.put(`/community/comments/${commentId}`, data);
  return response.data.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/community/comments/${commentId}`);
};

export const likeComment = async (commentId: number): Promise<void> => {
  await api.post(`/community/comments/${commentId}/like`);
};

export const unlikeComment = async (commentId: number): Promise<void> => {
  await api.delete(`/community/comments/${commentId}/like`);
};

// Replies (대댓글)
export const getReplies = async (commentId: number): Promise<Comment[]> => {
  const response = await api.get(`/community/comments/${commentId}/replies`);
  return response.data.data;
};

export const createReply = async (
  parentCommentId: number,
  data: CreateCommentRequest
): Promise<Comment> => {
  const response = await api.post(
    `/community/comments/${parentCommentId}/replies`,
    data
  );
  return response.data.data;
};

// 지역별 채팅 관련 API
export const getRegionChatInfo = async (): Promise<any> => {
  const response = await api.get("/chat/region-info");
  return response.data.data;
};

export const getRegionChatMessages = async (
  regionCode: string
): Promise<any> => {
  const response = await api.get(`/chat/region/${regionCode}/messages`);
  return response.data.data;
};

export const sendRegionChatMessage = async (
  regionCode: string,
  message: string
): Promise<any> => {
  const response = await api.post(`/chat/region/${regionCode}/messages`, {
    content: message,
  });
  return response.data.data;
};
