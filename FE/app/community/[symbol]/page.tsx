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
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { OpinionForm } from "@/components/opinion-form";
import { TossPostCard } from "@/components/toss-post-card";
import CommentSectionSimple from "@/components/comment-section-simple";

import TickerStrip from "@/components/TickerStrip";

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
import type { Stock } from "@/lib/api/stock";
import type { Post, PostSentiment, VoteOption, Comment } from "@/lib/api/community";
import { toast } from "sonner";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";

export default function StockDiscussionPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [stock, setStock] = useState<Stock | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  // 댓글 관련 상태
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Map<number, Comment[]>>(new Map());
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set());

  // 실시간 주식 데이터 상태
  const [realtimeData, setRealtimeData] = useState<StockPriceData | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        setError(null);

        // 주식 정보와 게시글 목록을 병렬로 가져오기
        const [stockResponse, postsResponse] = await Promise.all([
          getStock(symbol as string),
          getPosts(symbol as string),
        ]);

        setStock(stockResponse);
        // posts 데이터가 유효한지 확인하고 필터링
        console.log("게시글 목록 응답:", postsResponse);
        const validPosts =
          postsResponse.content?.filter((post) => post && post.id) || [];
        console.log("필터링된 게시글:", validPosts);

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
                console.error(
                  `Failed to fetch vote results for post ${post.id}:`,
                  error
                );
                return post;
              }
            }
            return post;
          })
        );

        setPosts(postsWithVotes);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const handleCreatePost = async (data: {
    content: string;
    sentiment: PostSentiment;
    hasVote?: boolean;
    voteOptions?: VoteOption[];
    voteQuestion?: string;
  }) => {
    // 로그인 상태를 더 명확하게 체크
    if (!isClient || !accessToken) {
      toast.error("게시글을 작성하려면 로그인이 필요합니다.");
      // 현재 페이지 정보를 로그인 페이지로 전달하고 즉시 이동
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
      console.log("응답 타입:", typeof response);
      console.log("응답 구조:", JSON.stringify(response, null, 2));

      // response가 Post 타입이므로 직접 사용
      if (response && response.id) {
        console.log("게시글 추가:", response);
        setPosts([response, ...posts]);
      } else {
        console.warn("응답이 유효하지 않음:", response);
      }
      setShowOpinionForm(false);
    } catch (error: any) {
      console.error("Failed to create post:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        // 현재 페이지 정보를 로그인 페이지로 전달하고 즉시 이동
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
      // 현재 페이지 정보를 로그인 페이지로 전달하고 즉시 이동
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
      // 현재 페이지 정보를 로그인 페이지로 전달하고 즉시 이동
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
        // 현재 페이지 정보를 로그인 페이지로 전달하고 즉시 이동
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
  const handleToggleComments = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 보려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      // 댓글 섹션 닫기
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      // 댓글 섹션 열기 및 댓글 로드
      setExpandedComments(prev => new Set(prev).add(postId));
      
      if (!comments.has(postId)) {
        setCommentLoading(prev => new Set(prev).add(postId));
        try {
          const response = await getComments(postId, 0, 20);
          setComments(prev => new Map(prev).set(postId, response.content || []));
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
    }
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

      // 게시글의 댓글 수 업데이트 (백엔드에서 자동으로 업데이트되지만 UI 반영을 위해)
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

      // 게시글의 댓글 수 업데이트 (백엔드에서 자동으로 업데이트되지만 UI 반영을 위해)
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
      // post가 유효한지 확인
      if (!post || !post.id) return false;

      if (activeTab === "all") return true;
      return post.sentiment?.toLowerCase() === activeTab;
    }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 rounded-full animate-spin"
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
              주식 정보와 토론 내용을 가져오고 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <TickerStrip
          logoUrl={stock?.logoUrl || "/placeholder-logo.svg"}
          name={stock?.name || "종목명"}
          ticker={stock?.symbol || "000000"}
          price={
            realtimeData?.currentPrice
              ? parseInt(realtimeData.currentPrice)
              : stock?.currentPrice || 0
          }
          change={
            realtimeData?.changePrice
              ? parseInt(realtimeData.changePrice)
              : stock?.priceChange || 0
          }
          changeRate={
            realtimeData?.changeRate
              ? parseFloat(realtimeData.changeRate) / 100
              : stock?.priceChangePercent
              ? stock.priceChangePercent / 100
              : 0
          }
          marketState="정규장"
          lastUpdatedSec={
            wsConnected
              ? Math.floor((Date.now() - (lastUpdate || 0)) / 1000)
              : 0
          }
          realtimeOrderable={wsConnected}
        />
      </div>

      <main className="container mx-auto px-4 py-8 pt-40">
        {/* 주식 정보 카드 섹션 */}
        {stock && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* 현재가 카드 */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      현재가
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {realtimeData?.currentPrice
                        ? parseInt(realtimeData.currentPrice).toLocaleString()
                        : stock?.currentPrice?.toLocaleString() || "0"}
                      원
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            {/* 등락률 카드 */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      등락률
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        (realtimeData?.changeRate
                          ? parseFloat(realtimeData.changeRate)
                          : stock?.priceChangePercent || 0) >= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {realtimeData?.changeRate
                        ? `${
                            parseFloat(realtimeData.changeRate) > 0 ? "+" : ""
                          }${parseFloat(realtimeData.changeRate).toFixed(2)}%`
                        : stock?.priceChangePercent
                        ? `${
                            stock.priceChangePercent > 0 ? "+" : ""
                          }${stock.priceChangePercent.toFixed(2)}%`
                        : "0.00%"}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            {/* 거래량 카드 */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      거래량
                    </p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {stock?.volume?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            {/* 커뮤니티 활동 카드 */}
            <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      토론 참여
                    </p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {posts.length}개
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 섹션 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {stock?.name} 토론방
            </h1>
            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              실시간 투자자 의견과 분석을 확인하세요
            </p>
          </div>
        </div>

        {/* 의견 작성 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 shadow-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                전체
              </TabsTrigger>
              <TabsTrigger
                value="bullish"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200 font-medium text-green-600 dark:text-green-400"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                매수
              </TabsTrigger>
              <TabsTrigger
                value="bearish"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md transition-all duration-200 font-medium text-red-600 dark:text-red-400"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                매도
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isClient && accessToken ? (
            <Button
              onClick={() => setShowOpinionForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              의견 작성하기
            </Button>
          ) : (
            <Button
              onClick={() =>
                router.push(
                  `/login?redirect=${encodeURIComponent(
                    window.location.pathname
                  )}`
                )
              }
              className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-300 hover:border-green-400 dark:border-green-600 dark:hover:border-green-500"
            >
              <LogIn className="w-4 h-4 mr-2" />
              로그인하여 의견 작성하기
            </Button>
          )}
        </div>

        {/* 의견 작성 폼 */}
        {showOpinionForm && isClient && accessToken && (
          <OpinionForm
            onClose={() => setShowOpinionForm(false)}
            onSubmit={handleCreatePost}
          />
        )}

        {/* 의견 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => {
            // post가 유효한지 한 번 더 확인
            if (!post || !post.id) return null;

            const isCommentsExpanded = expandedComments.has(post.id);
            const postComments = comments.get(post.id) || [];
            const isLoadingComments = commentLoading.has(post.id);

            return (
              <div
                key={post.id}
                className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TossPostCard
                  post={post}
                  onLike={() => handleLikePost(post.id)}
                  onComment={() => handleToggleComments(post.id)}
                  onShare={() => handleShare(post.id)}
                  onVote={(optionId: string) => handleVote(post.id, optionId)}
                />
                
                {/* 댓글 섹션 */}
                {isCommentsExpanded && (
                  <div className="mt-4">
                    <CommentSectionSimple
                      postId={post.id}
                      comments={postComments}
                      isLoading={isLoadingComments}
                      currentUserId={accessToken ? "current-user" : undefined}
                      onCreateComment={handleCreateComment}
                      onLikeComment={handleLikeComment}
                      onDeleteComment={handleDeleteComment}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredPosts.length === 0 && !isLoading && (
          <Card className="bg-gradient-to-br from-white/90 to-green-50/90 dark:from-gray-900/90 dark:to-green-950/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                첫 번째 의견을 작성해보세요!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
                {stock?.name}에 대한 투자 의견을 공유하고
                <br />
                다른 투자자들과 소통해보세요
              </p>
              {isClient && accessToken ? (
                <Button
                  onClick={() => setShowOpinionForm(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-700 dark:hover:from-green-700 dark:hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  의견 작성하기
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    router.push(
                      `/login?redirect=${encodeURIComponent(
                        window.location.pathname
                      )}`
                    )
                  }
                  className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-600 dark:hover:from-green-600 dark:hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인하여 의견 작성하기
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
