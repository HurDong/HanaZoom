"use client";

import type React from "react";
import Swal from "sweetalert2";

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
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    marketing: false,
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState("");

  const handleSocialSignup = (provider: string) => {
    // OAuth 2.0 회원가입 로직 구현 예정
    console.log(`${provider} 회원가입 시도`);
  };

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, "");

    // 길이에 따라 하이픈 추가
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      const formattedPhone = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedPhone,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 전화번호 형식 검사 (하이픈이 포함된 형식)
    const phoneRegex = /^01(?:0|1|[6-9])-(?:\d{3}|\d{4})-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      showErrorAlert("전화번호 형식이 올바르지 않습니다.\n예시: 010-1234-5678");
      return;
    }

    // 비밀번호 형식 검사
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      showErrorAlert("비밀번호는 8자 이상의 영문자와 숫자 조합이어야 합니다.");
      return;
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      showErrorAlert("비밀번호가 일치하지 않습니다.");
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
        const errorData = await response.json();
        let errorMessage = "회원가입에 실패했습니다.";

        // 서버에서 받은 에러 메시지 처리
        if (errorData.errors && errorData.errors.length > 0) {
          const error = errorData.errors[0];
          if (error.defaultMessage) {
            errorMessage = error.defaultMessage;
          }
        }

        throw new Error(errorMessage);
      }

      // 회원가입 성공 시 성공 알림
      await Swal.fire({
        title: "환영합니다! 🎉",
        text: "회원가입이 완료되었습니다.",
        icon: "success",
        confirmButtonText: "로그인하기",
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

      // 로그인 페이지로 이동
      router.push("/login");
    } catch (error) {
      console.error("회원가입 실패:", error);
      showErrorAlert(
        error instanceof Error ? error.message : "회원가입에 실패했습니다."
      );
    }
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
            하나줌
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
            하나줌 가족이 되어주세요! 🎉
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            우리 동네 주식 정보를 가장 먼저 만나보세요
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 소셜 회원가입 버튼들 */}
          <div className="space-y-4">
            <Button
              onClick={() => handleSocialSignup("kakao")}
              className="w-full h-12 text-lg bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <span className="mr-2">💬</span>
              카카오로 3초 만에 시작하기
            </Button>

            <Button
              onClick={() => handleSocialSignup("google")}
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
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
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
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={handleChange}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              disabled={!agreements.terms || !agreements.privacy}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none"
            >
              하나줌 가족 되기 🎉
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
