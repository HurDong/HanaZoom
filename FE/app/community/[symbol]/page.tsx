"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  LogIn,
  Activity,
  BarChart3,
  Users,
  Clock,
  Star,
  Zap,
  Target,
  Award,
  Plus,
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { OpinionForm } from "@/components/opinion-form";
import { StockInfoBar } from "@/components/stock-info-bar";
import { InstagramFeedItem } from "@/components/instagram-feed-item";
import { CommentSlidePanel } from "@/components/comment-slide-panel";
import { FloatingWriteButton } from "@/components/floating-write-button";
import { WritePostModal } from "@/components/write-post-modal";

import { getStock } from "@/lib/api/stock";
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
  voteOnPost,
  getPostVoteResults,
  getComments,
  createComment,
  likeComment,
  unlikeComment,
  deleteComment,
  updateComment,
  createReply,
} from "@/lib/api/community";
import { useAuthStore } from "@/app/utils/auth";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Stock } from "@/lib/api/stock";
import type { Post, PostSentiment, VoteOption, Comment } from "@/lib/api/community";
import { toast } from "sonner";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";
import { clearPWACache, hardRefresh } from "@/utils/clear-cache";

export default function StockDiscussionPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [stock, setStock] = useState<Stock | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // 댓글 관련 상태
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [comments, setComments] = useState<Map<number, Comment[]>>(new Map());
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set());
  const [showDevTools, setShowDevTools] = useState(false);

  // 실시간 주식 데이터 상태
  const [realtimeData, setRealtimeData] = useState<StockPriceData | null>(null);

  // 무한 스크롤 훅
  const { page, isLoadingMore, loadMore, reset, setLoadingMore } = useInfiniteScroll({
    hasMore,
    isLoading
  });

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);
  }, []);

  // WebSocket 연결 (현재 종목만 구독)
  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: symbol ? [symbol as string] : [],
    onStockUpdate: (data: StockPriceData) => {
      console.log("📊 실시간 데이터 수신:", data);
      setRealtimeData(data);
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        setError(null);
        reset();

        // 주식 정보와 첫 페이지 게시글을 병렬로 가져오기
        const [stockResponse, postsResponse] = await Promise.all([
          getStock(symbol as string),
          getPosts(symbol as string, 0, 10),
        ]);

        setStock(stockResponse);
        
        const validPosts = postsResponse.content?.filter((post) => post && post.id) || [];
        
        // 각 게시글의 투표 결과를 가져오기
        const postsWithVotes = await Promise.all(
          validPosts.map(async (post) => {
            if (post.hasVote && accessToken) {
              try {
                const voteResults = await getPostVoteResults(post.id);
                return {
                  ...post,
                  voteOptions: voteResults.voteOptions,
                  userVote: voteResults.userVote,
                };
              } catch (error) {
                console.error(`Failed to fetch vote results for post ${post.id}:`, error);
                return post;
              }
            }
            return post;
          })
        );

        setPosts(postsWithVotes);
        setHasMore(postsResponse.content?.length === 10);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [symbol, accessToken, reset]);

  // 무한 스크롤을 위한 추가 데이터 로딩
  useEffect(() => {
    const loadMorePosts = async () => {
      if (!symbol || page === 0 || isLoadingMore) return;

      try {
        setLoadingMore(true);
        const postsResponse = await getPosts(symbol as string, page, 10);
        const newPosts = postsResponse.content?.filter((post) => post && post.id) || [];
        
        if (newPosts.length === 0) {
          setHasMore(false);
          return;
        }

        // 각 게시글의 투표 결과를 가져오기
        const postsWithVotes = await Promise.all(
          newPosts.map(async (post) => {
            if (post.hasVote && accessToken) {
              try {
                const voteResults = await getPostVoteResults(post.id);
                return {
                  ...post,
                  voteOptions: voteResults.voteOptions,
                  userVote: voteResults.userVote,
                };
              } catch (error) {
                console.error(`Failed to fetch vote results for post ${post.id}:`, error);
                return post;
              }
            }
            return post;
          })
        );

        setPosts(prev => [...prev, ...postsWithVotes]);
        setHasMore(newPosts.length === 10);
      } catch (error) {
        console.error("Failed to load more posts:", error);
        toast.error("추가 게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoadingMore(false);
      }
    };

    loadMorePosts();
  }, [page, symbol, accessToken, isLoadingMore, setLoadingMore]);

  const handleCreatePost = async (data: {
    content: string;
    sentiment: PostSentiment;
    hasVote?: boolean;
    voteOptions?: VoteOption[];
    voteQuestion?: string;
    imageUrl?: string;
  }) => {
    // 로그인 상태를 더 명확하게 체크
    if (!isClient || !accessToken) {
      toast.error("게시글을 작성하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      console.log("게시글 작성 시작:", { symbol, data });
      const response = await createPost(symbol as string, data);
      console.log("게시글 작성 응답:", response);

      if (response && response.id) {
        console.log("게시글 추가:", response);
        setPosts([response, ...posts]);
      } else {
        console.warn("응답이 유효하지 않음:", response);
      }
      setShowWriteModal(false);
    } catch (error: any) {
      console.error("Failed to create post:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("게시글 작성에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await unlikePost(postId);
        setPosts(
          posts.map((p) =>
            p.id === postId
              ? { ...p, isLiked: false, likeCount: p.likeCount - 1 }
              : p
          )
        );
      } else {
        await likePost(postId);
        setPosts(
          posts.map((p) =>
            p.id === postId
              ? { ...p, isLiked: true, likeCount: p.likeCount + 1 }
              : p
          )
        );
      }
    } catch (error: any) {
      console.error("Failed to like/unlike post:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        router.push("/login");
      }
    }
  };

  const handleShare = async (postId: number) => {
    try {
      await navigator.share({
        title: `${stock?.name} 관련 게시글`,
        text: posts.find((p) => p.id === postId)?.content,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Failed to share:", error);
      // Web Share API가 지원되지 않는 경우 클립보드에 복사
      const post = posts.find((p) => p.id === postId);
      if (post) {
        const shareText = `${stock?.name} 관련 게시글\n\n${post.content}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        alert("게시글 링크가 클립보드에 복사되었습니다.");
      }
    }
  };

  const handleVote = async (postId: number, optionId: string) => {
    if (!isClient || !accessToken) {
      alert("투표하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      // 백엔드 API 호출
      await voteOnPost(postId, optionId);

      // 투표 성공 후 해당 게시글의 투표 결과를 다시 가져오기
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
          if (post.id === postId) {
            try {
              const voteResults = await getPostVoteResults(postId);
              return {
                ...post,
                voteOptions: voteResults.voteOptions,
                userVote: voteResults.userVote,
              };
            } catch (error) {
              console.error("Failed to fetch vote results:", error);
              return post;
            }
          }
          return post;
        })
      );

      setPosts(updatedPosts);
      alert("투표가 완료되었습니다!");
    } catch (error: any) {
      console.error("Failed to vote:", error);

      if (error.response?.status === 403) {
        alert("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        alert("투표 처리에 실패했습니다.");
      }
    }
  };

  // 댓글 관련 핸들러들
  const handleViewComments = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 보려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    setSelectedPostId(postId);
    
    if (!comments.has(postId)) {
      setCommentLoading(prev => new Set(prev).add(postId));
      try {
        const response = await getComments(postId, 0, 20);
        setComments(prev => new Map(prev).set(postId, (response.content || []) as unknown as Comment[]));
      } catch (error) {
        console.error("Failed to load comments:", error);
        toast.error("댓글을 불러오는데 실패했습니다.");
      } finally {
        setCommentLoading(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    }
  };

  const handleCloseComments = () => {
    setSelectedPostId(null);
  };

  const handleCreateComment = async (postId: number, content: string) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 작성하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      const newComment = await createComment(postId, { content });
      
      // 댓글 목록에 추가
      setComments(prev => {
        const newMap = new Map(prev);
        const existingComments = newMap.get(postId) || [];
        newMap.set(postId, [newComment, ...existingComments]);
        return newMap;
      });

      // 게시글의 댓글 수 업데이트
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, commentCount: post.commentCount + 1 }
          : post
      ));

      toast.success("댓글이 작성되었습니다.");
    } catch (error: any) {
      console.error("Failed to create comment:", error);
      
      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("댓글 작성에 실패했습니다.");
      }
    }
  };

  const handleLikeComment = async (commentId: number, postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      const postComments = comments.get(postId) || [];
      const comment = postComments.find(c => c.id === commentId);
      
      if (!comment) return;

      if (comment.isLiked) {
        await unlikeComment(commentId);
        setComments(prev => {
          const newMap = new Map(prev);
          const updatedComments = postComments.map(c =>
            c.id === commentId
              ? { ...c, isLiked: false, likeCount: c.likeCount - 1 }
              : c
          );
          newMap.set(postId, updatedComments);
          return newMap;
        });
      } else {
        await likeComment(commentId);
        setComments(prev => {
          const newMap = new Map(prev);
          const updatedComments = postComments.map(c =>
            c.id === commentId
              ? { ...c, isLiked: true, likeCount: c.likeCount + 1 }
              : c
          );
          newMap.set(postId, updatedComments);
          return newMap;
        });
      }
    } catch (error: any) {
      console.error("Failed to like/unlike comment:", error);
      
      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("좋아요 처리에 실패했습니다.");
      }
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 삭제하려면 로그인이 필요합니다.");
      return;
    }

    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(commentId);
      
      // 댓글 목록에서 제거
      setComments(prev => {
        const newMap = new Map(prev);
        const updatedComments = (newMap.get(postId) || []).filter(c => c.id !== commentId);
        newMap.set(postId, updatedComments);
        return newMap;
      });

      // 게시글의 댓글 수 업데이트
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
          : post
      ));

      toast.success("댓글이 삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete comment:", error);
      
      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("댓글 삭제에 실패했습니다.");
      }
    }
  };

  const filteredPosts =
    posts?.filter((post) => {
      if (!post || !post.id) return false;

      if (activeTab === "all") return true;
      return post.sentiment?.toLowerCase() === activeTab;
    }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              데이터를 불러오는 중...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              주식 정보와 피드를 가져오고 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-red-200 dark:border-red-700 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  오류가 발생했습니다
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

      {/* 상단 얇은 종목 정보 바 */}
      <StockInfoBar
        stock={stock}
        realtimeData={realtimeData}
        wsConnected={wsConnected}
      />

      <main className="pt-20">
        {/* 필터 탭 */}
        <div className="sticky top-20 z-40 backdrop-blur-md" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', borderBottom: '1px solid #3B82F6' }}>
          <div className="container mx-auto px-4 py-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 font-medium font-['Pretendard']"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  전체
                </TabsTrigger>
                <TabsTrigger
                  value="bullish"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 font-medium text-red-600 dark:text-red-400 font-['Pretendard']"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  매수
                </TabsTrigger>
                <TabsTrigger
                  value="bearish"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 font-medium text-blue-600 dark:text-blue-400 font-['Pretendard']"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  매도
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 인스타그램 스타일 피드 */}
        <div className="max-w-2xl mx-auto">
          {filteredPosts.map((post, index) => {
            if (!post || !post.id) return null;

            return (
              <div
                key={post.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <InstagramFeedItem
                  post={post}
                  onLike={() => handleLikePost(post.id)}
                  onComment={() => handleViewComments(post.id)}
                  onShare={() => handleShare(post.id)}
                  onVote={(optionId: string) => handleVote(post.id, optionId)}
                />
              </div>
            );
          })}

          {/* 로딩 인디케이터 */}
          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* 빈 상태 */}
          {filteredPosts.length === 0 && !isLoading && (
            <Card className="bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-700 m-4">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/50 dark:to-green-900/50 rounded-full flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Star className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-['Pretendard']">
                  첫 번째 글을 작성해보세요!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md font-['Pretendard']">
                  {stock?.name}에 대한 투자 의견을 공유하고
                  <br />
                  다른 투자자들과 소통해보세요
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 플로팅 글 작성 버튼 */}
      <FloatingWriteButton
        onClick={() => setShowWriteModal(true)}
        isLoggedIn={isClient && !!accessToken}
      />

      {/* 개발자 도구 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 left-6 z-40">
          <Button
            onClick={() => setShowDevTools(!showDevTools)}
            size="sm"
            variant="outline"
            className="bg-white dark:bg-gray-800 shadow-lg"
          >
            🛠️ Dev
          </Button>
          
          {showDevTools && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[200px]">
              <h3 className="font-semibold text-sm mb-2">개발자 도구</h3>
              <div className="space-y-2">
                <Button
                  onClick={hardRefresh}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  🔄 하드 새로고침
                </Button>
                <Button
                  onClick={async () => {
                    await clearPWACache();
                    toast.success("캐시가 클리어되었습니다!");
                  }}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  🗑️ 캐시 클리어
                </Button>
                <Button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast.success("로컬 스토리지가 클리어되었습니다!");
                  }}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  💾 스토리지 클리어
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 글 작성 모달 */}
      {showWriteModal && isClient && accessToken && (
        <WritePostModal
          isOpen={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* 댓글 슬라이드 패널 */}
      {selectedPostId && (
        <CommentSlidePanel
          isOpen={!!selectedPostId}
          onClose={handleCloseComments}
          postId={selectedPostId}
          comments={comments.get(selectedPostId) || []}
          isLoading={commentLoading.has(selectedPostId)}
          currentUserId={accessToken ? "current-user" : undefined}
          onCreateComment={handleCreateComment}
          onLikeComment={handleLikeComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
}