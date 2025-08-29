"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, setLoginData } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS } from "@/app/config/api";
import Swal from "sweetalert2";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    // 이미 로그인된 사용자는 홈페이지로 리다이렉트 (단, step-up이라면 계속 진행)
    const stateRaw = searchParams.get("state");
    let desiredRedirect: string | null = null;
    let isStepUp = false;
    try {
      if (stateRaw) {
        const parsed = JSON.parse(decodeURIComponent(stateRaw));
        isStepUp = !!parsed?.stepUp;
        desiredRedirect = parsed?.redirect || null;
      }
    } catch {}

    if (accessToken && !isStepUp) {
      router.replace("/");
      return;
    }

    const handleKakaoCallback = async () => {
      // 중복 처리 방지
      if (hasProcessed) {
        return;
      }

      try {
        setHasProcessed(true);
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          throw new Error("카카오 로그인에 실패했습니다.");
        }

        if (!code) {
          throw new Error("인증 코드를 받지 못했습니다.");
        }

        // 백엔드로 카카오 로그인 요청
        const response = await api.post(API_ENDPOINTS.kakaoLogin, {
          code,
          redirectUri: "http://localhost:3000/auth/kakao/callback",
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "카카오 로그인에 실패했습니다."
          );
        }

        const { data } = response.data;

        // 로그인 데이터 저장
        await setLoginData(data.accessToken, data.refreshToken, {
          id: data.id,
          name: data.name,
          email: data.email,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        });

        // step-up 성공 시 최근 검증 시각 기록
        if (isStepUp) {
          try {
            sessionStorage.setItem("recentlyVerifiedAt", Date.now().toString());
          } catch {}
        }

        // 성공 메시지 제거 (모든 경우에 SweetAlert 비활성화)
        // step-up 검증 시에는 아무 알림 없이 바로 리다이렉트

        if (isStepUp && desiredRedirect) {
          router.replace(desiredRedirect);
          return;
        }

        // 위치 정보 유무에 따른 분기 (기존 동작)
        if (!data.address || !data.latitude || !data.longitude) {
          router.replace("/auth/location-setup");
        } else {
          router.replace("/");
        }
      } catch (error: any) {
        console.error("카카오 로그인 에러:", error);

        await Swal.fire({
          title: "로그인 실패 😢",
          text: error.message || "카카오 로그인에 실패했습니다.",
          icon: "error",
          confirmButtonText: "로그인 페이지로 돌아가기",
          confirmButtonColor: "#10b981",
        });

        // 로그인 페이지로 리다이렉트
        router.replace("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, accessToken, router, hasProcessed]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400 text-lg">
            카카오 로그인 처리 중...
          </p>
          <p className="text-green-500 dark:text-green-300 text-sm mt-2">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  return null;
}
