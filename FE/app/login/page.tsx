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
import { StockTicker } from "@/components/stock-ticker";
import { useState, useEffect } from "react";
import { setLoginData, useAuthStore } from "../utils/auth";
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "@/app/components/Navbar";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";

export default function LoginPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  // 이미 로그인된 사용자는 홈페이지로 리다이렉트
  useEffect(() => {
    if (accessToken) {
      router.replace("/");
    }
  }, [accessToken, router]);

  // 페이지 로드 시 이전에 입력했던 이메일 복원 (로그인 상태 유지와 관계없이)
  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");

    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));

      // 로그인 상태 유지 설정도 복원
      const savedKeepLoggedIn = localStorage.getItem("keepLoggedIn");
      if (savedKeepLoggedIn === "true") {
        setKeepLoggedIn(true);
      }
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showErrorAlert = (message: string) => {
    Swal.fire({
      title: "앗!",
      text: message,
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "kakao") {
      // 카카오 OAuth 인증 URL로 리다이렉트
      const kakaoClientId =
        process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ||
        "f50a1c0f8638ca30ef8c170a6ff8412b";
      const redirectUri = encodeURIComponent(
        process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
          "http://localhost:3000/auth/kakao/callback"
      );
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile_nickname`;

      // 디버깅을 위한 로그
      console.log("카카오 OAuth URL:", kakaoAuthUrl);
      console.log("Client ID:", kakaoClientId);
      console.log("Redirect URI:", "http://localhost:3000/auth/kakao/callback");

      window.location.href = kakaoAuthUrl;
    } else {
      console.log(`${provider} 로그인 시도`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 유효성 검사
    if (!validateEmail(formData.email)) {
      showErrorAlert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    // 비밀번호 유효성 검사
    if (!formData.password.trim()) {
      showErrorAlert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await api.post<
        ApiResponse<{
          id: string;
          name: string;
          email: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          accessToken: string;
          refreshToken: string;
        }>
      >(API_ENDPOINTS.login, formData);

      if (!response.data.success) {
        throw new Error(response.data.message || "로그인에 실패했습니다.");
      }

      const { data } = response.data;

      await setLoginData(data.accessToken, data.refreshToken, {
        id: data.id,
        name: data.name,
        email: data.email,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
      });

      // 🎯 이메일은 항상 저장 (사용자 편의를 위해)
      localStorage.setItem("loginEmail", formData.email);

      // 로그인 상태 유지 설정만 체크박스 상태에 따라 저장
      if (keepLoggedIn) {
        localStorage.setItem("keepLoggedIn", "true");
      } else {
        localStorage.removeItem("keepLoggedIn");
      }

      // 로그인 성공 후 redirect 파라미터가 있으면 해당 페이지로, 없으면 메인화면으로 이동
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");

      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else {
        router.push("/");
      }
    } catch (error: any) {
      showErrorAlert(
        error.response?.data?.message ||
          error.message ||
          "로그인에 실패했습니다."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <MouseFollower />
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center p-4 relative overflow-hidden pt-28">
        {/* 마우스 따라다니는 아이콘들 */}
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

        {/* 로그인 카드 */}
        <Card className="w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-2xl my-8">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-200">
                하나줌에 오신 걸 환영해요! 👋
              </h1>
              <p className="text-green-600 dark:text-green-400 mt-2">
                우리 동네 핫한 주식 정보를 확인하러 가볼까요?
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-green-800 dark:text-green-200 text-lg"
                >
                  이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-green-500" />
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-12 text-lg border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                    formNoValidate
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-green-800 dark:text-green-200 text-lg"
                >
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-green-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12 text-lg border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-green-500 hover:text-green-700 dark:hover:text-green-300 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <input
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
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
                className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                하나줌 입장하기 🚀
              </Button>

              <div className="text-center text-sm text-green-700 dark:text-green-300">
                계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                  회원가입하기 ✨
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-4 text-gray-500">
                    또는
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("kakao")}
                  className="w-full h-12 text-lg bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                >
                  <span className="mr-2">💬</span>
                  카카오로 3초 만에 시작하기
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  className="w-full h-12 text-lg bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 시작하기
                </Button>
              </div>
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
    </div>
  );
}
