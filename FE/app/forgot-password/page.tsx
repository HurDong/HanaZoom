"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StockTicker } from "@/components/stock-ticker";
import { MouseFollower } from "@/components/mouse-follower";
import NavBar from "@/app/components/Navbar";
import Swal from "sweetalert2";

interface ForgotPasswordForm {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState<ForgotPasswordForm>({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const showSuccessAlert = (message: string) => {
    Swal.fire({
      title: "성공!",
      text: message,
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#10b981",
      background: "#ffffff",
      color: "#1f2937",
    });
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
    });
  };

  const startCountdown = () => {
    setCountdown(180); // 3분
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!validateEmail(formData.email)) {
      showErrorAlert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/members/forgot-password/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        showSuccessAlert(
          "인증 코드가 이메일로 발송되었습니다. 콘솔을 확인해주세요."
        );
        setStep("code");
        startCountdown();
      } else {
        const error = await response.json();
        showErrorAlert(error.message || "인증 코드 발송에 실패했습니다.");
      }
    } catch (error) {
      showErrorAlert("인증 코드 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.code || formData.code.length !== 6) {
      showErrorAlert("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setStep("password");
  };

  const handleResetPassword = async () => {
    if (!validatePassword(formData.newPassword)) {
      showErrorAlert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showErrorAlert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/members/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        showSuccessAlert("비밀번호가 성공적으로 재설정되었습니다.");
        router.push("/login");
      } else {
        const error = await response.json();
        showErrorAlert(error.message || "비밀번호 재설정에 실패했습니다.");
      }
    } catch (error) {
      showErrorAlert("비밀번호 재설정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    handleSendCode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <MouseFollower />
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden pt-28">
        {/* 마우스 따라다니는 아이콘들 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
            🔐
          </div>
          <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
            ✉️
          </div>
          <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
            🔒
          </div>
        </div>

        {/* 비밀번호 찾기 카드 */}
        <Card className="w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <Link
              href="/login"
              className="absolute left-4 top-4 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="text-2xl">🔐</span>
            </div>

            <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-200">
              비밀번호 찾기
            </CardTitle>
            <p className="text-green-600 dark:text-green-400 mt-2">
              {step === "email" && "가입한 이메일을 입력해주세요"}
              {step === "code" && "이메일로 발송된 인증 코드를 입력해주세요"}
              {step === "password" && "새로운 비밀번호를 설정해주세요"}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 1단계: 이메일 입력 */}
            {step === "email" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-green-800 dark:text-green-200"
                  >
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  disabled={isLoading || !formData.email}
                  className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "발송 중..." : "인증 코드 발송"}
                </Button>
              </div>
            )}

            {/* 2단계: 인증 코드 입력 */}
            {step === "code" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-green-800 dark:text-green-200"
                  >
                    인증 코드
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="6자리 코드 입력"
                    value={formData.code}
                    onChange={handleChange}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                    required
                  />
                  {countdown > 0 && (
                    <p className="text-sm text-gray-500 text-center">
                      남은 시간: {formatTime(countdown)}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={!formData.code || formData.code.length !== 6}
                    className="flex-1 h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    코드 확인
                  </Button>

                  <Button
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                    variant="outline"
                    className="h-12 px-4 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/50 dark:hover:border-green-500 dark:hover:text-green-300"
                  >
                    재발송
                  </Button>
                </div>
              </div>
            )}

            {/* 3단계: 새 비밀번호 설정 */}
            {step === "password" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="newPassword"
                    className="text-green-800 dark:text-green-200"
                  >
                    새 비밀번호
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="8자 이상 입력"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-green-800 dark:text-green-200"
                  >
                    새 비밀번호 확인
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="비밀번호 재입력"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {formData.confirmPassword && (
                    <div className="flex items-center space-x-2 text-sm">
                      {formData.newPassword === formData.confirmPassword ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">
                            비밀번호가 일치합니다
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-red-300"></div>
                          <span className="text-red-600">
                            비밀번호가 일치하지 않습니다
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleResetPassword}
                  disabled={
                    isLoading ||
                    !formData.newPassword ||
                    !formData.confirmPassword ||
                    formData.newPassword !== formData.confirmPassword
                  }
                  className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "처리 중..." : "비밀번호 재설정"}
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-green-700 dark:text-green-300">
              <Link
                href="/login"
                className="text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                로그인으로 돌아가기
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
    </div>
  );
}
