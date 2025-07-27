import api from "@/app/config/api";

export type PostType = "TEXT" | "POLL";
export type PostSentiment = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface Post {
  id: number;
  title: string | null;
  content: string;
  postType: PostType;
  sentiment: PostSentiment;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
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
  postType?: PostType;
  sentiment: PostSentiment;
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
