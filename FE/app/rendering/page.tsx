"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { MouseFollower } from "@/components/mouse-follower";
import Swal from "sweetalert2";

export default function RenderingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      Swal.fire({
        title: "앗!",
        text: "검색어를 입력해주세요.",
        icon: "error",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
        background: "#ffffff",
        color: "#1f2937",
        customClass: {
          popup: "dark:bg-gray-900 dark:text-white",
          title: "dark:text-white",
          htmlContainer: "dark:text-gray-300",
          confirmButton: "dark:bg-green-600 dark:hover:bg-green-700",
        },
      });
      return;
    }

    try {
      // 검색 로직 구현 예정
      console.log("검색어:", searchQuery);
    } catch (error) {
      console.error("검색 실패:", error);
      setError("검색 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
          하나줌
        </h1>
        <p className="text-green-600 dark:text-green-400 mb-8">
          데이터를 불러오는 중입니다...
        </p>
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 마우스 따라다니는 아이콘들 */}
      <MouseFollower />

      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          🚀
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💎
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          📊
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          💰
        </div>
        <div className="floating-symbol absolute top-60 left-1/4 text-green-400 dark:text-green-300 text-lg animate-bounce delay-300">
          📈
        </div>
      </div>

      {/* 헤더 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-800 dark:text-green-200">
            하나줌
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* 검색 카드 */}
      <Card className="w-full max-w-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
              주식 정보 검색
            </h1>
            <p className="text-green-600 dark:text-green-400 mt-2">
              원하는 주식 정보를 검색해보세요
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="search"
                className="text-green-800 dark:text-green-200 text-lg"
              >
                검색어
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-green-500" />
                <Input
                  id="search"
                  type="text"
                  placeholder="주식 종목명 또는 코드를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              검색하기 🔍
            </Button>
          </form>
        </CardContent>
      </Card>

      <style jsx>{`
        .floating-symbol {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}
