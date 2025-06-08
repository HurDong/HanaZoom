"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, removeTokens } from "../utils/auth";
import { MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function NavBar() {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkLoginStatus = () => {
      const status = isLoggedIn();
      setLoggedIn(status);
    };
    checkLoginStatus();

    window.addEventListener("load", checkLoginStatus);
    return () => {
      window.removeEventListener("load", checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    removeTokens();
    setLoggedIn(false);
    window.location.href = "/";
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-b border-green-200 dark:border-green-800 transition-colors duration-300">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-green-800 dark:text-green-200">
          주식맛집 커뮤니티
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
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
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
