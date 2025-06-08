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
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MouseFollower } from "@/components/mouse-follower";
import { useState } from "react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleSocialSignup = (provider: string) => {
    // OAuth 2.0 회원가입 로직 구현 예정
    console.log(`${provider} 회원가입 시도`);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 전화번호 형식 검사
    const phoneRegex = /^01(?:0|1|[6-9])-(?:\d{3}|\d{4})-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }

    // 비밀번호 형식 검사
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      alert("비밀번호는 8자 이상의 영문자와 숫자 조합이어야 합니다.");
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/members/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          termsAgreed: agreements.terms,
          privacyAgreed: agreements.privacy,
          marketingAgreed: agreements.marketing,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // 회원가입 성공 시 로그인 페이지로 이동
      window.location.href = "/login";
    } catch (error) {
      console.error("회원가입 실패:", error);
      alert(
        error instanceof Error ? error.message : "회원가입에 실패했습니다."
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAgreementChange = (field: string, checked: boolean) => {
    setAgreements((prev) => ({ ...prev, [field]: checked }));
  };

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
            주식맛집
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* 회원가입 카드 */}
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-2xl my-8">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">✨</span>
          </div>
          <CardTitle className="text-2xl font-bold text-green-900 dark:text-green-100">
            주식맛집 가족이 되어주세요! 🎉
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            우리 동네 주식 정보를 가장 먼저 만나보세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 소셜 회원가입 버튼들 */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialSignup("kakao")}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">💬</span>
              카카오로 간편 가입
            </Button>

            <Button
              onClick={() => handleSocialSignup("naver")}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🔍</span>
              네이버로 간편 가입
            </Button>

            <Button
              onClick={() => handleSocialSignup("google")}
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">🌐</span>
              Google로 간편 가입
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-green-200 dark:bg-green-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-gray-900 px-3 text-sm text-green-600 dark:text-green-400">
                또는 이메일로 가입
              </span>
            </div>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-green-800 dark:text-green-200"
              >
                이름
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-green-800 dark:text-green-200"
              >
                휴대폰 번호
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
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
                  placeholder="8자 이상 입력하세요"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
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

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-green-800 dark:text-green-200"
              >
                비밀번호 확인
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-green-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pl-10 pr-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-green-500 hover:text-green-700 dark:hover:text-green-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreements.terms}
                  onCheckedChange={(checked) =>
                    handleAgreementChange("terms", checked as boolean)
                  }
                  className="border-green-300 text-green-600 focus:ring-green-500"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-green-700 dark:text-green-300"
                >
                  <span className="text-red-500">*</span> 이용약관에 동의합니다{" "}
                  <Link
                    href="/terms"
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    (보기)
                  </Link>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={agreements.privacy}
                  onCheckedChange={(checked) =>
                    handleAgreementChange("privacy", checked as boolean)
                  }
                  className="border-green-300 text-green-600 focus:ring-green-500"
                />
                <Label
                  htmlFor="privacy"
                  className="text-sm text-green-700 dark:text-green-300"
                >
                  <span className="text-red-500">*</span> 개인정보처리방침에
                  동의합니다{" "}
                  <Link
                    href="/privacy"
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    (보기)
                  </Link>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={agreements.marketing}
                  onCheckedChange={(checked) =>
                    handleAgreementChange("marketing", checked as boolean)
                  }
                  className="border-green-300 text-green-600 focus:ring-green-500"
                />
                <Label
                  htmlFor="marketing"
                  className="text-sm text-green-700 dark:text-green-300"
                >
                  마케팅 정보 수신에 동의합니다 (선택)
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!agreements.terms || !agreements.privacy}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              주식맛집 가족 되기 🎉
            </Button>
          </form>

          <div className="text-center text-sm text-green-700 dark:text-green-300">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              로그인하기 🚀
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
