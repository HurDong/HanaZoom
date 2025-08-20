"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, useAuthStore } from "../utils/auth";
import { MessageSquare, TrendingUp } from "lucide-react";
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-gray-900/90 border-b border-green-200 dark:border-green-800 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-green-800 dark:text-green-200">
          하나줌
        </span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link
          href="/"
          className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
        >
          홈
        </Link>
        <Link
          href="/community"
          className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
        >
          커뮤니티
        </Link>
        <Link
          href="/stocks"
          className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors flex items-center gap-1"
        >
          <TrendingUp className="w-4 h-4" />
          WTS
        </Link>
        {accessToken ? (
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
          >
            로그인
          </Link>
        )}
        <ThemeToggle />
      </nav>
    </header>
  );
}
