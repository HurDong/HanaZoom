"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, TrendingDown, LogIn } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { OpinionForm } from "@/components/opinion-form";
import { TossPostCard } from "@/components/toss-post-card";

import TickerStrip from "@/components/TickerStrip";

import { getStock } from "@/lib/api/stock";
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
  voteOnPost,
  getPostVoteResults,
} from "@/lib/api/community";
import { useAuthStore } from "@/app/utils/auth";
import type { Stock } from "@/lib/api/stock";
import type { Post, PostSentiment, VoteOption } from "@/lib/api/community";
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

  const filteredPosts =
    posts?.filter((post) => {
      // post가 유효한지 확인
      if (!post || !post.id) return false;

      if (activeTab === "all") return true;
      return post.sentiment?.toLowerCase() === activeTab;
    }) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
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
              : stock?.priceChangePercent ? stock.priceChangePercent / 100 : 0
          }
          marketState="정규장"
          lastUpdatedSec={wsConnected ? Math.floor((Date.now() - (lastUpdate || 0)) / 1000) : 0}
          realtimeOrderable={wsConnected}
        />
      </div>

      <main className="container mx-auto px-4 py-8 pt-40">


        {/* 의견 작성 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="bg-green-100 dark:bg-green-900/50">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
              >
                전체
              </TabsTrigger>
              <TabsTrigger
                value="bullish"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-green-600"
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                매수
              </TabsTrigger>
              <TabsTrigger
                value="bearish"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 text-red-600"
              >
                <TrendingDown className="w-4 h-4 mr-1" />
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
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            // post가 유효한지 한 번 더 확인
            if (!post || !post.id) return null;

            return (
              <TossPostCard
                key={post.id}
                post={post}
                onLike={() => handleLikePost(post.id)}
                onComment={() => {}}
                onShare={() => handleShare(post.id)}
                onVote={(optionId: string) => handleVote(post.id, optionId)}
              />
            );
          })}
        </div>

        {filteredPosts.length === 0 && !isLoading && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">
                아직 작성된 의견이 없습니다.
                <br />첫 번째 의견을 작성해보세요!
              </p>
              {isClient && accessToken ? (
                <Button
                  onClick={() => setShowOpinionForm(true)}
                  variant="outline"
                  className="mt-4 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/50 dark:hover:border-green-500 dark:hover:text-green-300 transition-all duration-300"
                >
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
                  variant="outline"
                  className="mt-4 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/50 dark:hover:border-green-500 dark:hover:text-green-300 transition-all duration-300"
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
