"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Users,
  Sparkles,
  BarChart3,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { MouseFollower } from "@/components/mouse-follower";
import { LoadingAnimation } from "@/components/loading-animation";
import { StockMapPreview } from "@/components/stock-map-preview";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useState, useEffect, useRef } from "react";
import { EnhancedHeader } from "@/components/enhanced-header";

// 인라인 StockTicker 컴포넌트
function StockTicker() {
  const [stocks, setStocks] = useState([
    {
      symbol: "005930",
      name: "삼성전자",
      price: 71500,
      change: 2.3,
      emoji: "📱",
    },
    {
      symbol: "035420",
      name: "NAVER",
      price: 185000,
      change: -1.2,
      emoji: "🔍",
    },
    {
      symbol: "035720",
      name: "카카오",
      price: 52300,
      change: 4.1,
      emoji: "💬",
    },
    {
      symbol: "000660",
      name: "SK하이닉스",
      price: 128000,
      change: 1.8,
      emoji: "💾",
    },
    {
      symbol: "051910",
      name: "LG화학",
      price: 425000,
      change: -0.5,
      emoji: "🧪",
    },
    {
      symbol: "006400",
      name: "삼성SDI",
      price: 387000,
      change: 3.2,
      emoji: "🔋",
    },
    {
      symbol: "207940",
      name: "삼성바이오로직스",
      price: 789000,
      change: 0.9,
      emoji: "🧬",
    },
    {
      symbol: "068270",
      name: "셀트리온",
      price: 178500,
      change: -2.1,
      emoji: "💊",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks((prevStocks) =>
        prevStocks.map((stock) => ({
          ...stock,
          price: stock.price + (Math.random() - 0.5) * 1000,
          change: (Math.random() - 0.5) * 6,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-3 overflow-hidden relative shadow-lg">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
          }}
        ></div>
      </div>

      {/* 상단 그라데이션 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

      {/* 티커 내용 */}
      <div className="relative flex whitespace-nowrap hover:[animation-play-state:paused]">
        <div className="animate-marquee flex">
          {stocks.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              className="flex items-center space-x-3 mx-6 flex-shrink-0"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-all duration-300">
                <span className="text-lg hover:scale-110 transition-transform duration-300">
                  {stock.emoji}
                </span>
                <span className="font-semibold text-sm">{stock.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-green-100 font-mono text-sm">
                  ₩{stock.price.toLocaleString()}
                </span>
                <div className="flex items-center space-x-1">
                  {stock.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-300" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-300" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stock.change >= 0 ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 구분선 */}
              <div className="w-px h-4 bg-white/20"></div>
            </div>
          ))}
        </div>
        <div className="animate-marquee flex" aria-hidden="true">
          {stocks.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}-duplicate`}
              className="flex items-center space-x-3 mx-6 flex-shrink-0"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/20 transition-all duration-300">
                <span className="text-lg hover:scale-110 transition-transform duration-300">
                  {stock.emoji}
                </span>
                <span className="font-semibold text-sm">{stock.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-green-100 font-mono text-sm">
                  ₩{stock.price.toLocaleString()}
                </span>
                <div className="flex items-center space-x-1">
                  {stock.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-300" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-300" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stock.change >= 0 ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* 구분선 */}
              <div className="w-px h-4 bg-white/20"></div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 그라데이션 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
}

export default function StockMapLanding() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 실제 앱에서는 데이터 로딩이 완료되면 setIsLoading(false) 호출
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); // 4초 후 로딩 완료

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return <LoadingAnimation onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* 마우스 따라다니는 아이콘들 */}
      {/* <MouseFollower /> */}

      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📈
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💰
        </div>
        <div className="floating-symbol absolute top-60 left-1/4 text-green-400 dark:text-green-300 text-lg animate-bounce delay-300">
          🚀
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          💎
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          📊
        </div>
        <div className="floating-symbol absolute top-32 right-1/3 text-emerald-400 dark:text-emerald-300 text-lg animate-pulse delay-200">
          🎯
        </div>
      </div>

      {/* Enhanced Header */}
      <EnhancedHeader scrolled={scrolled} />

      {/* 주식 티커 - 헤더 위에 표시 */}
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-36">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-green-300/20 dark:bg-green-700/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-emerald-300/20 dark:bg-emerald-700/10 rounded-full blur-3xl"></div>
          </div>

          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex flex-col items-center lg:items-start space-y-8 text-center lg:text-left lg:w-1/2">
                <AnimateOnScroll animation="fade-up" className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/50 px-4 py-2 rounded-full border border-green-200 dark:border-green-700 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      우리 동네 핫한 주식 찾기
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-green-900 dark:text-green-100">
                    주식{" "}
                    <span className="text-emerald-600 dark:text-emerald-400 relative">
                      맛집
                      <svg
                        className="absolute -bottom-2 left-0 w-full"
                        height="6"
                        viewBox="0 0 100 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0 6C20 -2 40 12 60 6C80 0 100 12 100 6V12H0V6Z"
                          className="fill-emerald-400/30 dark:fill-emerald-600/30"
                        />
                      </svg>
                    </span>{" "}
                    지도
                  </h1>
                  <p className="mx-auto lg:mx-0 max-w-[700px] text-green-700 dark:text-green-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    우리 동네에서 가장 인기 있는 주식 종목을 한눈에!
                    <br />
                    지역별 투자 트렌드를 귀여운 지도로 확인해보세요 🗺️✨
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link href="/community">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 dark:from-green-600 dark:to-emerald-500 dark:hover:from-green-700 dark:hover:to-emerald-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl dark:shadow-green-900/30 transition-all duration-300 transform hover:scale-105"
                      >
                        커뮤니티 둘러보기 💬
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 px-8 py-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                      onClick={scrollToFeatures}
                    >
                      사용법 보기 📖
                    </Button>
                  </div>
                </AnimateOnScroll>
              </div>

              <div className="lg:w-1/2">
                <AnimateOnScroll animation="fade-left" delay={300}>
                  <div className="relative">
                    {/* 지도 미리보기 */}
                    <StockMapPreview />

                    {/* 장식 요소들 */}
                    <div className="absolute -top-6 -left-6 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      <span className="text-xl">📊</span>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <span className="text-lg">💰</span>
                    </div>
                    <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 text-green-600 dark:text-green-400 animate-pulse">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </AnimateOnScroll>
              </div>
            </div>

            {/* 스크롤 다운 버튼 */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <button
                onClick={scrollToFeatures}
                className="flex flex-col items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
              >
                <span className="text-sm mb-1">더 알아보기</span>
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-colors duration-300"
        >
          <div className="container px-4 md:px-6 mx-auto">
            <AnimateOnScroll
              animation="fade-up"
              className="flex flex-col items-center space-y-4 text-center mb-12"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-900 dark:text-green-100">
                특별한 기능들 ✨
              </h2>
              <p className="max-w-[900px] text-green-700 dark:text-green-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                우리 동네 주식 트렌드를 재미있고 직관적으로 확인해보세요!
              </p>
            </AnimateOnScroll>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <AnimateOnScroll animation="fade-up" delay={100}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      지역별 인기 종목
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      시 → 구 → 동 단위로 확대하며 각 지역의 핫한 주식을
                      확인하세요! 🔍
                    </p>
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-1 w-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={200}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      실시간 트렌드
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      실시간으로 업데이트되는 지역별 주식 인기도를 한눈에! 📊
                    </p>
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={300}>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700 hover:shadow-lg dark:hover:shadow-green-900/20 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-300 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      커뮤니티 기반
                    </h3>
                    <p className="text-green-700 dark:text-green-300">
                      실제 투자자들의 관심도를 바탕으로 한 진짜 데이터! 👥
                    </p>
                    <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[30%] -right-[5%] w-[20%] h-[40%] bg-green-300/10 dark:bg-green-700/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[20%] -left-[5%] w-[25%] h-[30%] bg-emerald-300/10 dark:bg-emerald-700/5 rounded-full blur-3xl"></div>
          </div>

          <div className="container px-4 md:px-6 mx-auto">
            <AnimateOnScroll
              animation="fade-up"
              className="flex flex-col items-center space-y-4 text-center mb-12"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-900 dark:text-green-100">
                이렇게 사용해요! 🎯
              </h2>
            </AnimateOnScroll>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {/* 연결선 */}
              <div className="absolute top-24 left-1/2 right-0 h-0.5 bg-gradient-to-r from-green-300 to-emerald-300 dark:from-green-700 dark:to-emerald-700 hidden md:block"></div>
              <div className="absolute top-24 left-0 right-1/2 h-0.5 bg-gradient-to-r from-emerald-300 to-green-300 dark:from-emerald-700 dark:to-green-700 hidden md:block"></div>

              <AnimateOnScroll animation="fade-up" delay={100}>
                <div className="flex flex-col items-center space-y-4 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 z-10 hover:scale-110 transition-transform duration-300">
                    1️⃣
                  </div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    지역 선택
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    관심 있는 지역을 클릭하여 선택하세요
                  </p>

                  {/* 애니메이션 요소 */}
                  <div className="mt-4 relative w-full max-w-[200px] h-[100px] bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-md overflow-hidden border border-green-200 dark:border-green-800">
                    <div className="absolute inset-0 p-2">
                      <div className="w-full h-full bg-green-50 dark:bg-green-950 rounded overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-green-500 dark:bg-green-400 rounded-full animate-ping opacity-70"></div>
                        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-green-600 dark:bg-green-500 rounded-full"></div>
                        <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer animate-pulse">
                      <MapPin className="w-8 h-8 text-green-600 dark:text-green-400 drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="flex flex-col items-center space-y-4 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 dark:from-emerald-500 dark:to-green-400 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 z-10 hover:scale-110 transition-transform duration-300">
                    2️⃣
                  </div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    확대/축소
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    지도를 확대하며 더 세부적인 지역 정보를 확인
                  </p>

                  {/* 애니메이션 요소 */}
                  <div className="mt-4 relative w-full max-w-[200px] h-[100px] bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-md overflow-hidden border border-green-200 dark:border-green-800">
                    <div className="absolute inset-0 p-2">
                      <div className="w-full h-full bg-green-50 dark:bg-green-950 rounded overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-dashed border-green-500 dark:border-green-400 rounded-lg animate-[ping_2s_ease-in-out_infinite]"></div>
                          <div className="absolute w-8 h-8 border-2 border-green-600 dark:border-green-500 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 font-bold text-lg">
                      🔍
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={500}>
                <div className="flex flex-col items-center space-y-4 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-300 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 z-10 hover:scale-110 transition-transform duration-300">
                    3️⃣
                  </div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    인기 종목 확인
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    해당 지역의 핫한 주식 종목들을 확인하세요
                  </p>

                  {/* 애니메이션 요소 */}
                  <div className="mt-4 relative w-full max-w-[200px] h-[100px] bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-md overflow-hidden border border-green-200 dark:border-green-800">
                    <div className="absolute inset-0 p-2">
                      <div className="w-full h-full bg-green-50 dark:bg-green-950 rounded overflow-hidden flex flex-col justify-center items-center gap-2">
                        <div className="flex items-center w-full px-2">
                          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                          <div className="h-1 flex-1 bg-green-200 dark:bg-green-800 rounded-full ml-1 overflow-hidden">
                            <div className="h-full w-3/4 bg-green-500 dark:bg-green-400 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center w-full px-2">
                          <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
                          <div className="h-1 flex-1 bg-green-200 dark:bg-green-800 rounded-full ml-1 overflow-hidden">
                            <div className="h-full w-1/2 bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center w-full px-2">
                          <div className="w-2 h-2 bg-green-400 dark:bg-green-300 rounded-full"></div>
                          <div className="h-1 flex-1 bg-green-200 dark:bg-green-800 rounded-full ml-1 overflow-hidden">
                            <div className="h-full w-1/3 bg-green-400 dark:bg-green-300 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90"></div>
                    <div className="absolute top-2 right-2 text-green-600 dark:text-green-400 font-bold text-xs">
                      📊
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-500 relative overflow-hidden">
          {/* 배경 효과 */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=600')] bg-cover opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 dark:from-green-400/10 dark:to-emerald-400/10"></div>
          </div>

          {/* 장식 요소들 */}
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-3xl"></div>

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <AnimateOnScroll
              animation="zoom-in"
              className="flex flex-col items-center space-y-4 text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                지금 바로 시작해보세요! 🚀
              </h2>
              <p className="max-w-[600px] text-green-100 dark:text-green-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                우리 동네 주식 맛집을 찾아 떠나는 여행, 지금 시작하세요!
              </p>
              <div className="pt-4">
                <Link href="/community">
                  <Button
                    size="lg"
                    className="bg-white text-green-600 hover:bg-green-50 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-gray-800 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                  >
                    <span>주식 토론방 참여하기</span>
                    <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                      💬✨
                    </span>
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            {/* 부유하는 요소들 */}
            <div className="absolute top-1/4 left-1/4 text-white/30 text-4xl animate-float">
              📊
            </div>
            <div className="absolute bottom-1/3 right-1/4 text-white/20 text-3xl animate-float delay-300">
              📈
            </div>
            <div className="absolute top-2/3 right-1/3 text-white/20 text-3xl animate-float delay-700">
              💰
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors duration-300">
        <p className="text-xs text-green-600 dark:text-green-400">
          © 2024 주식맛집. 모든 권리 보유. Made with 💚
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="#"
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            개인정보처리방침
          </Link>
        </nav>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
