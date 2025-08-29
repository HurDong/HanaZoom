"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, useAuthStore } from "../utils/auth";
import { Plus, Minus, Globe, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* 상단 연분홍색 선 */}
      <div className="w-full h-0.5 bg-pink-200"></div>

      <div
        className={`px-4 lg:px-6 h-16 flex items-center justify-between backdrop-blur-sm transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 shadow-lg"
            : "bg-white/95 dark:bg-gray-900/95"
        }`}
      >
        {/* 왼쪽: 로고 및 브랜드명 */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">ㅎ</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <span className="text-xl font-bold text-green-600 font-['Pretendard']">
            하나줌
          </span>
        </Link>

        {/* 중앙: 네비게이션 링크들 */}
        <nav className="flex-1 flex justify-center">
          <div className="flex gap-16 lg:gap-20 xl:gap-24 items-center">
            <Link
              href="/"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              홈
            </Link>
            <Link
              href="/map"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              지도
            </Link>
            <Link
              href="/community"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              커뮤니티
            </Link>
            <Link
              href="/stocks"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              WTS
            </Link>
            {accessToken && (
              <Link
                href="/mypage"
                className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
              >
                마이페이지
              </Link>
            )}
          </div>
        </nav>

        {/* 우측: 액션 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 우측 아이콘들 */}
          <div className="flex items-center gap-3">
            <button className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors border border-gray-300 dark:border-gray-600 rounded">
              <span className="text-xs font-bold">H</span>
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* 로그인/로그아웃 및 테마 토글 */}
          <div className="flex items-center gap-3 ml-4">
            {accessToken ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer font-['Pretendard']"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
              >
                로그인
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
