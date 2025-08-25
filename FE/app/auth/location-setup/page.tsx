"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, setLoginData } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, CheckCircle } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import api from "@/app/config/api";
import Swal from "sweetalert2";

interface LocationData {
  address: string;
  detailAddress: string;
  zonecode: string;
  latitude: number;
  longitude: number;
}

export default function LocationSetupPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [locationData, setLocationData] = useState<LocationData>({
    address: "",
    detailAddress: "",
    zonecode: "",
    latitude: null,
    longitude: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    // 이미 위치 정보가 있는 사용자는 홈페이지로 리다이렉트 (좌표가 0이 아닌 경우)
    if (
      user.address &&
      user.latitude &&
      user.longitude &&
      user.latitude !== 0 &&
      user.longitude !== 0
    ) {
      router.replace("/");
      return;
    }

    // 다음 우편번호 API 로딩 확인
    const checkApiLoaded = () => {
      if (
        typeof window !== "undefined" &&
        window.daum &&
        window.daum.Postcode
      ) {
        setIsApiLoaded(true);
      } else {
        // API가 로드되지 않았으면 1초 후 다시 확인
        setTimeout(checkApiLoaded, 1000);
      }
    };
    checkApiLoaded();
  }, [accessToken, user, router]);

  const handleAddressSearch = () => {
    // 다음 우편번호 API가 로드되었는지 확인
    if (typeof window !== "undefined" && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          setLocationData((prev) => ({
            ...prev,
            address: data.address,
            zonecode: data.zonecode,
            // 주소 검색 시에는 좌표를 null로 설정 (백엔드에서 자동 변환)
            latitude: null,
            longitude: null,
          }));
        },
      }).open();
    } else {
      Swal.fire({
        title: "주소 검색 준비 중",
        text: "주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        icon: "info",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationData.address || !locationData.zonecode) {
      Swal.fire({
        title: "위치 정보 필요",
        text: "주소를 입력해주세요.",
        icon: "warning",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const requestData = {
        address: locationData.address,
        detailAddress: locationData.detailAddress,
        zonecode: locationData.zonecode,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };

      // 백엔드로 위치 정보 업데이트 요청
      const response = await api.put("/members/location", requestData);

      if (response.data.success) {
        // 백엔드에서 최신 사용자 정보 조회
        try {
          const userResponse = await api.get("/members/me");
          if (userResponse.data.success) {
            const latestUser = userResponse.data.data;

            // 최신 사용자 정보로 로그인 데이터 업데이트
            await setLoginData(
              accessToken,
              user.refreshToken || "",
              latestUser
            );
          } else {
            // 백엔드 조회 실패 시 로컬 데이터 사용
            const updatedUser = {
              ...user,
              address: locationData.address,
              detailAddress: locationData.detailAddress,
              zonecode: locationData.zonecode,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            };
            await setLoginData(
              accessToken,
              user.refreshToken || "",
              updatedUser
            );
          }
        } catch (error) {
          // 에러 발생 시 로컬 데이터 사용
          const updatedUser = {
            ...user,
            address: locationData.address,
            detailAddress: locationData.detailAddress,
            zonecode: locationData.zonecode,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
          await setLoginData(accessToken, user.refreshToken || "", updatedUser);
        }

        await Swal.fire({
          title: "위치 설정 완료! 🎉",
          text: "이제 지역별 채팅방을 이용할 수 있습니다.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        // 지역 채팅방으로 바로 이동 (커뮤니티 페이지)
        router.replace("/community");
      }
    } catch (error: any) {
      console.error("위치 정보 업데이트 실패:", error);
      Swal.fire({
        title: "위치 설정 실패 😢",
        text:
          error.response?.data?.message || "위치 정보를 저장할 수 없습니다.",
        icon: "error",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Swal.fire({
      title: "위치 설정 건너뛰기",
      text: "나중에 설정에서 위치를 변경할 수 있습니다. 계속하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "계속하기",
      cancelButtonText: "취소",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        // 위치 설정을 건너뛰어도 지역 채팅방으로 이동 (위치 정보 없이)
        router.replace("/community");
      }
    });
  };

  if (!accessToken || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <MouseFollower />
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="container mx-auto px-4 py-8 pt-36">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-6">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-4">
              위치 정보 설정
            </h1>
            <p className="text-lg text-green-700 dark:text-green-300">
              {user.name}님, 지역별 채팅방을 이용하기 위해 위치 정보를
              설정해주세요!
            </p>
          </div>

          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-xl text-green-800 dark:text-green-200">
                📍 위치 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 주소 검색 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    주소 *
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={locationData.address}
                      placeholder="주소를 검색해주세요"
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddressSearch}
                      disabled={!isApiLoaded}
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isApiLoaded ? "주소 검색" : "로딩 중..."}
                    </Button>
                  </div>
                </div>

                {/* 상세 주소 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    상세 주소
                  </label>
                  <Input
                    value={locationData.detailAddress}
                    onChange={(e) =>
                      setLocationData((prev) => ({
                        ...prev,
                        detailAddress: e.target.value,
                      }))
                    }
                    placeholder="상세 주소를 입력해주세요 (선택사항)"
                  />
                </div>

                {/* 우편번호 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    우편번호
                  </label>
                  <Input
                    value={locationData.zonecode}
                    placeholder="우편번호"
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                {/* 설명 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium mb-1">위치 정보 설정의 장점:</p>
                      <ul className="space-y-1">
                        <li>• 같은 지역 주민들과 실시간 채팅</li>
                        <li>• 지역별 투자 정보 공유</li>
                        <li>• 지역 특성에 맞는 주식 추천</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !locationData.address}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        설정 중...
                      </div>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        위치 설정 완료
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSkip}
                    variant="outline"
                    className="px-8 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50"
                  >
                    나중에
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
