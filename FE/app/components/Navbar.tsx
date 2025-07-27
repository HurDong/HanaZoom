"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout } from "../utils/auth";
import { MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkLoginStatus = () => {
      const status = isLoggedIn();
      setLoggedIn(status);
    };
    checkLoginStatus();

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("load", checkLoginStatus);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("load", checkLoginStatus);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    router.push("/login");
  };

  if (!mounted) {
    return null;
  }

  return (
    <header
      className={`w-full px-4 lg:px-6 h-16 flex items-center backdrop-blur-sm transition-all duration-300 ${
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
