"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MouseFollower } from "@/components/mouse-follower";
import { useState } from "react";
import { setTokens } from "../utils/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSocialLogin = (provider: string) => {
    // OAuth 2.0 로직 구현 예정
    console.log(`${provider} 로그인 시도`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/members/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      console.log("로그인 성공, 토큰 저장 시도:", data.token);

      // 토큰 저장
      setTokens(data.token, "dummy-refresh-token");

      // 토큰이 제대로 저장되었는지 확인
      const savedToken = localStorage.getItem("accessToken");
      console.log("저장된 토큰 확인:", savedToken);

      // 약간의 지연 후 리다이렉트
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error) {
      console.error("로그인 실패:", error);
      alert(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 마우스 따라다니는 아이콘들 */}
      <MouseFollower />

      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📈
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💰
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          💎
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          📊
        </div>
      </div>

      {/* 헤더 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-green-800 dark:text-green-200">
            주식맛집
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* 로그인 카드 */}
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">🗺️</span>
          </div>
          <CardTitle className="text-2xl font-bold text-green-900 dark:text-green-100">
            주식맛집에 오신 걸 환영해요! 👋
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            우리 동네 핫한 주식 정보를 확인하러 가볼까요?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin("kakao")}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">💬</span>
              카카오로 3초 만에 시작하기
            </Button>

            <Button
              onClick={() => handleSocialLogin("naver")}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🔍</span>
              네이버로 시작하기
            </Button>

            <Button
              onClick={() => handleSocialLogin("google")}
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🌐</span>
              Google로 시작하기
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-green-200 dark:bg-green-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-gray-900 px-3 text-sm text-green-600 dark:text-green-400">
                또는 이메일로 로그인
              </span>
            </div>
          </div>

          {/* 일반 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-green-800 dark:text-green-200"
              >
                이메일
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-green-800 dark:text-green-200"
              >
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-green-500 hover:text-green-700 dark:hover:text-green-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                <input
                  type="checkbox"
                  className="rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span>로그인 상태 유지</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-green-600 dark:text-green-400 hover:underline"
              >
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              주식맛집 입장하기 🚀
            </Button>
          </form>

          <div className="text-center text-sm text-green-700 dark:text-green-300">
            아직 계정이 없으신가요?{" "}
            <Link
              href="/signup"
              className="text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              회원가입하기 ✨
            </Link>
          </div>
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
