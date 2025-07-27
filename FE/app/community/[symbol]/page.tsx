"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, TrendingDown } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { OpinionForm } from "@/components/opinion-form";
import { OpinionCard } from "@/components/opinion-card";
import { StockInfoCard } from "@/components/stock-info-card";
import { getStock } from "@/lib/api/stock";
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
} from "@/lib/api/community";
import type { Stock } from "@/lib/api/stock";
import type { Post } from "@/lib/api/community";

export default function StockDiscussionPage() {
  const { symbol } = useParams();
  const [activeTab, setActiveTab] = useState("all");
  const [showOpinionForm, setShowOpinionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stock, setStock] = useState<Stock | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

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
        setPosts(postsResponse.data?.content || []);
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
    sentiment: string;
  }) => {
    try {
      const response = await createPost(symbol as string, data);
      setPosts([response.data, ...posts]);
      setShowOpinionForm(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("게시글 작성에 실패했습니다.");
    }
  };

  const handleLikePost = async (postId: number) => {
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
    } catch (error) {
      console.error("Failed to like/unlike post:", error);
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
    }
  };

  const filteredPosts =
    posts?.filter((post) => {
      if (activeTab === "all") return true;
      return post.sentiment.toLowerCase() === activeTab;
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

      <main className="container mx-auto px-4 py-8">
        {/* 주식 정보 카드 */}
        <StockInfoCard stock={stock} className="mb-8" />

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

          <Button
            onClick={() => setShowOpinionForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            의견 작성하기
          </Button>
        </div>

        {/* 의견 작성 폼 */}
        {showOpinionForm && (
          <OpinionForm
            onClose={() => setShowOpinionForm(false)}
            onSubmit={handleCreatePost}
          />
        )}

        {/* 의견 목록 */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <OpinionCard
              key={post.id}
              post={post}
              onLike={() => handleLikePost(post.id)}
              onComment={() => {}}
              onShare={() => handleShare(post.id)}
            />
          ))}
        </div>

        {filteredPosts.length === 0 && !isLoading && (
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-center">
                아직 작성된 의견이 없습니다.
                <br />첫 번째 의견을 작성해보세요!
              </p>
              <Button
                onClick={() => setShowOpinionForm(true)}
                variant="outline"
                className="mt-4"
              >
                의견 작성하기
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
