"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, useAuthStore } from "../utils/auth";
import {
  Bell,
  Heart,
  User,
  Plus,
  Trash2,
  Search,
  X,
  Users,
  BarChart3,
  Video,
  Calendar,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  WatchlistItem,
} from "@/lib/api/watchlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/app/config/api";
import { toast } from "sonner";
import NotificationDropdown from "@/components/NotificationDropdown";
import { getUnreadCount } from "@/lib/api/notification";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function NavBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const { accessToken } = useAuthStore();
  const { getPortfolioSummary } = usePortfolio();

  // 관심종목 관련 상태
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);

  // 종목 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 알림 관련 상태
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // PB 관련 상태
  const [isPb, setIsPb] = useState(false);
  const [pbInfo, setPbInfo] = useState<any>(null);

  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState<{
    createdAt: string;
    lastLoginAt: string;
    totalBalance: number;
    stockAllocationRate: number;
    cashAllocationRate: number;
  } | null>(null);

  // 로고 로드 상태
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadNotificationCount();
      loadPbInfo();
      loadUserInfo();
      loadPortfolioInfo();
    }
  }, [accessToken]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 관심종목 데이터 로드
  const loadWatchlist = async () => {
    if (!accessToken) return;

    setIsLoadingWatchlist(true);
    try {
      const data = await getMyWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error("관심종목 로드 실패:", error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  // 알림 개수 로드
  const loadNotificationCount = async () => {
    if (!accessToken) return;

    try {
      const count = await getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error("알림 개수 로드 실패:", error);
      // 에러가 발생해도 알림 개수를 0으로 설정하여 UI가 깨지지 않도록 함
      setNotificationCount(0);
    }
  };

  // PB 정보 로드
  const loadPbInfo = async () => {
    if (!accessToken) return;

    try {
      const response = await api.get("/members/me");
      console.log("🔍 PB 정보 API 응답:", response.data);

      if (response.data && response.data.success) {
        const memberData = response.data.data;
        console.log("🔍 회원 데이터:", memberData);
        console.log("🔍 isPb 값:", memberData.isPb);
        console.log("🔍 pbStatus 값:", memberData.pbStatus);
        console.log("🔍 pbRating 값:", memberData.pbRating);
        console.log(
          "🔍 pbTotalConsultations 값:",
          memberData.pbTotalConsultations
        );

        // 임시: 강제로 PB 설정 (테스트용)
        const forcePb = memberData.email === "pb@pb.com";
        setIsPb(forcePb || memberData.isPb || false);

        if (forcePb || memberData.isPb) {
          console.log("✅ PB로 인식됨, PB 정보 설정 중...");
          setPbInfo({
            rating: memberData.pbRating || 0.0,
            totalConsultations: memberData.pbTotalConsultations || 0,
            region: memberData.pbRegion || "미지정",
            specialties: memberData.pbSpecialties || "[]",
            status: memberData.pbStatus || "INACTIVE",
          });
          console.log("✅ PB 정보 설정 완료");
        } else {
          console.log("❌ PB가 아닌 사용자로 인식됨");
        }
      }
    } catch (error) {
      console.error("❌ PB 정보 로드 실패:", error);
      setIsPb(false);
      setPbInfo(null);
    }
  };

  // 사용자 정보 로드 (가입일, 최근 접속일)
  const loadUserInfo = async () => {
    if (!accessToken) return;

    try {
      const response = await api.get("/members/me");
      if (response.data && response.data.success) {
        const memberData = response.data.data;
        setUserInfo({
          createdAt: memberData.createdAt || new Date().toISOString(),
          lastLoginAt: memberData.lastLoginAt || new Date().toISOString(),
          totalBalance: 0, // 포트폴리오에서 가져올 예정
          stockAllocationRate: 0,
          cashAllocationRate: 0,
        });
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    }
  };

  // 포트폴리오 정보 로드
  const loadPortfolioInfo = async () => {
    if (!accessToken) return;

    try {
      const portfolioData = await getPortfolioSummary();
      if (portfolioData) {
        console.log("🔍 Navbar 포트폴리오 데이터:", portfolioData);
        setUserInfo(prev => prev ? {
          ...prev,
          totalBalance: portfolioData.totalBalance || 0,
          stockAllocationRate: portfolioData.stockAllocationRate || 0,
          cashAllocationRate: portfolioData.cashAllocationRate || 0,
        } : null);
      } else {
        console.log("포트폴리오 계좌가 없습니다. 기본값으로 설정합니다.");
        // 포트폴리오가 없어도 기본값으로 설정
        setUserInfo(prev => prev ? {
          ...prev,
          totalBalance: 0,
          stockAllocationRate: 0,
          cashAllocationRate: 100,
        } : null);
      }
    } catch (error) {
      console.error("포트폴리오 정보 로드 실패:", error);
      // 포트폴리오가 없어도 기본값으로 설정
      setUserInfo(prev => prev ? {
        ...prev,
        totalBalance: 0,
        stockAllocationRate: 0,
        cashAllocationRate: 100,
      } : null);
    }
  };

  // 종목 검색
  const searchStocks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(
        `/stocks/search?query=${encodeURIComponent(query)}`
      );
      if (response.data && response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("종목 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchStocks(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 관심종목 추가
  const handleAddToWatchlist = async (stockSymbol: string) => {
    if (!accessToken) return;

    setIsAddingStock(true);
    try {
      await addToWatchlist({ stockSymbol });
      setSearchQuery("");
      setShowSearchResults(false);
      await loadWatchlist(); // 목록 새로고침

      // 검색 결과에서 해당 종목의 이름 찾기
      const stock = searchResults.find((s) => s.symbol === stockSymbol);
      const stockName = stock?.name || stockSymbol;
      const josa = getKoreanJosa(stockName);

      toast.success(`${stockName}${josa} 관심종목에 추가되었습니다.`);
    } catch (error) {
      console.error("관심종목 추가 실패:", error);
      toast.error("관심종목 추가에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAddingStock(false);
    }
  };

  // 한국어 조사 결정 함수
  const getKoreanJosa = (word: string) => {
    if (!word) return "가";

    // 마지막 글자의 유니코드
    const lastChar = word.charAt(word.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);

    // 한글 범위: 44032 ~ 55203
    if (lastCharCode >= 44032 && lastCharCode <= 55203) {
      // 한글 유니코드에서 받침 계산
      const hangulCode = lastCharCode - 44032;
      const finalConsonant = hangulCode % 28;

      // 받침이 있으면 (0이 아니면) "이", 없으면 "가"
      return finalConsonant === 0 ? "가" : "이";
    }

    // 한글이 아닌 경우 기본값
    return "가";
  };

  // 관심종목 제거
  const handleRemoveFromWatchlist = async (stockSymbol: string) => {
    if (!accessToken) return;

    try {
      await removeFromWatchlist(stockSymbol);
      await loadWatchlist(); // 목록 새로고침

      // 관심종목 목록에서 해당 종목의 이름 찾기
      const stock = watchlist.find((w) => w.stockSymbol === stockSymbol);
      const stockName = stock?.stockName || stockSymbol;
      const josa = getKoreanJosa(stockName);

      toast.success(`${stockName}이(가) 관심종목에서 제거되었습니다.`);
    } catch (error) {
      console.error("관심종목 제거 실패:", error);
      toast.error("관심종목 제거에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 관심종목 모달 열기/닫기 (토글)
  const handleWatchlistClick = () => {
    if (!accessToken) {
      toast.error("관심종목을 관리하려면 로그인이 필요합니다.");
      return;
    }

    if (showWatchlistModal) {
      // 이미 열려있으면 닫기
      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
    } else {
      // 닫혀있으면 열기 (프로필 모달은 닫기)
      setShowProfileModal(false);
      setShowWatchlistModal(true);
      loadWatchlist();
    }
  };

  const handleLogout = async () => {
    // 먼저 말풍선을 닫고
    setShowProfileModal(false);
    setShowWatchlistModal(false);
    // 그 다음 로그아웃 처리
    await logout();
    router.push("/login");
  };

  const handleProfileClick = () => {
    if (showProfileModal) {
      // 이미 열려있으면 닫기
      setShowProfileModal(false);
    } else {
      // 닫혀있으면 열기 (관심종목 모달은 닫기)
      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
      setShowProfileModal(true);
    }
  };

  const handleMyPageClick = () => {
    setShowProfileModal(false);
    // 마이페이지 접근 시 검증 페이지로 이동
    const redirect = encodeURIComponent("/mypage");
    router.push(`/auth/verify?redirect=${redirect}`);
  };

  // 알림 모달 열기/닫기
  const handleNotificationClick = () => {
    if (!accessToken) {
      toast.error("알림을 보려면 로그인이 필요합니다.");
      return;
    }

    if (showNotificationModal) {
      setShowNotificationModal(false);
    } else {
      // 다른 모달들은 닫기
      setShowProfileModal(false);
      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
      setShowNotificationModal(true);
    }
  };

  if (!mounted) {
    return null;
  }

  // 관심종목 말풍선 렌더링 함수
  const renderWatchlistModal = () => {
    if (!showWatchlistModal) return null;

    const modalContent = (
      <>
        {/* 배경 오버레이 - 바깥 클릭 시 닫기 */}
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowWatchlistModal(false)}
        />

        {/* 관심종목 말풍선 내용 */}
        <div
          className="fixed z-[100]"
          style={{
            top: "4rem", // Navbar 높이만큼 아래
            right: "1rem",
          }}
        >
          <div className="w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* 말풍선 화살표 */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white/95 dark:bg-gray-900/95 border-l border-t border-gray-200/50 dark:border-gray-700/50 transform rotate-45"></div>

            <div className="p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Pretendard'] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  관심종목
                </h3>
                <button
                  onClick={() => setShowWatchlistModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 새 종목 추가 - 종목이름 검색 */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="종목이름 또는 종목코드 검색 (예: 삼성전자, 005930)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 검색 결과 드롭다운 */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {searchResults.map((stock) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          onClick={() => handleAddToWatchlist(stock.symbol)}
                        >
                          <div className="flex items-center gap-3">
                            {stock.logoUrl ? (
                              <img
                                src={stock.logoUrl}
                                alt={stock.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  📈
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {stock.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {stock.symbol}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            {stock.currentPrice && (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {parseInt(stock.currentPrice).toLocaleString()}
                                원
                              </p>
                            )}
                            {stock.changeRate && (
                              <p
                                className={`text-xs ${
                                  parseFloat(stock.changeRate) > 0
                                    ? "text-red-500"
                                    : parseFloat(stock.changeRate) < 0
                                    ? "text-blue-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {parseFloat(stock.changeRate) > 0 ? "+" : ""}
                                {stock.changeRate}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                        <span className="text-sm text-gray-500">
                          검색 중...
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    종목이름이나 종목코드로 검색하세요
                  </p>
                </div>
              </div>

              {/* 관심종목 목록 */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {isLoadingWatchlist ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      로딩 중...
                    </p>
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      관심종목이 없습니다
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      위에서 종목을 검색하여 추가해보세요
                    </p>
                  </div>
                ) : (
                  watchlist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          router.push(`/stocks/${item.stockSymbol}`);
                          setShowWatchlistModal(false);
                        }}
                      >
                        {item.stockLogoUrl ? (
                          <img
                            src={item.stockLogoUrl}
                            alt={item.stockName}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">📈</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {item.stockName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.stockSymbol}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.currentPrice && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.currentPrice.toLocaleString()}원
                            </p>
                            {item.priceChange && (
                              <p
                                className={`text-xs ${
                                  item.priceChange > 0
                                    ? "text-red-500"
                                    : item.priceChange < 0
                                    ? "text-blue-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {item.priceChange > 0 ? "+" : ""}
                                {item.priceChange.toLocaleString()}
                                {item.priceChangePercent &&
                                  ` (${item.priceChangePercent.toFixed(2)}%)`}
                              </p>
                            )}
                          </div>
                        )}

                        <Button
                          onClick={() =>
                            handleRemoveFromWatchlist(item.stockSymbol)
                          }
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 푸터 */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  총 {watchlist.length}개 종목
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    // Portal을 사용하여 body에 직접 렌더링
    return createPortal(modalContent, document.body);
  };

  // 말풍선 렌더링 함수
  const renderProfileModal = () => {
    if (!showProfileModal) return null;

    const modalContent = (
      <>
        {/* 배경 오버레이 - 바깥 클릭 시 닫기 */}
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setShowProfileModal(false)}
        />

        {/* 말풍선 내용 */}
        <div
          className="fixed z-[100]"
          style={{
            top: "4rem", // Navbar 높이만큼 아래
            right: "1rem",
          }}
        >
          <div className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* 말풍선 화살표 */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white/95 dark:bg-gray-900/95 border-l border-t border-gray-200/50 dark:border-gray-700/50 transform rotate-45"></div>

            {accessToken ? (
              // 로그인 상태: 프로필 정보
              <div className="p-6">
                {/* 프로필 헤더 - 계층화된 정보 */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                        isPb
                          ? "bg-gradient-to-br from-purple-500 to-purple-700"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                      }`}
                    >
                      {isPb ? (
                        <Users className="w-7 h-7 text-white" />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                    </div>
                    {/* 하나금융 그룹 뱃지 오버레이 */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs text-white font-bold">H</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-['Pretendard']">
                        {isPb ? "PB님" : "사용자님"}
                      </h3>
                      {/* 회원 등급 뱃지 */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          isPb
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        }`}
                      >
                        {isPb ? "PB" : "일반회원"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-['Pretendard']">
                      {isPb ? "하나줌 PB" : "하나줌 회원"}
                    </p>
                  </div>
                </div>

                {/* PB 전용 정보 섹션 */}
                {isPb && pbInfo && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">👨‍💼</span>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-['Pretendard']">
                        PB 현황
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                          평점
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-['Pretendard'] font-semibold">
                          ⭐ {pbInfo.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                          상담수
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-['Pretendard'] font-semibold">
                          {pbInfo.totalConsultations}건
                        </span>
                      </div>
                      <div className="flex justify-between items-center col-span-2">
                        <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                          담당지역
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-['Pretendard'] font-semibold">
                          {pbInfo.region}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 보조 정보 - 작은 글씨로 Secondary color */}
                <div className="space-y-2 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-['Pretendard']">
                      가입일
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-['Pretendard'] font-medium">
                      {userInfo?.createdAt 
                        ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : '2024년 3월'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-['Pretendard']">
                      최근 접속
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-['Pretendard'] font-medium">
                      {userInfo?.lastLoginAt 
                        ? new Date(userInfo.lastLoginAt).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }) + ' (PC)'
                        : '2025-08-31 (PC)'
                      }
                    </span>
                  </div>
                </div>

                {/* 자산 현황 섹션 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📊</span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-['Pretendard']">
                      내 자산 현황
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                        총자산
                      </span>
                      <span className="text-gray-900 dark:text-white font-['Pretendard'] font-semibold">
                        {userInfo?.totalBalance && userInfo.totalBalance > 0
                          ? `${(userInfo.totalBalance / 10000).toLocaleString()}만원`
                          : '계좌 없음'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                        주식
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-['Pretendard'] font-medium">
                        {userInfo?.stockAllocationRate 
                          ? `${userInfo.stockAllocationRate.toFixed(0)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-['Pretendard']">
                        현금
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-['Pretendard'] font-medium">
                        {userInfo?.cashAllocationRate 
                          ? `${userInfo.cashAllocationRate.toFixed(0)}%`
                          : '100%'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 - PB/일반회원 구분 */}
                <div className="space-y-2 mb-4">
                  {console.log("🔍 UI 렌더링 - isPb 값:", isPb)}
                  {isPb ? (
                    // PB 전용 버튼들
                    <>
                      <Link
                        href="/pb-admin"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        PB 대시보드
                      </Link>
                      <Link
                        href="/portfolio"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        포트폴리오 조회
                      </Link>
                      <button
                        onClick={handleMyPageClick}
                        className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm"
                      >
                        마이페이지로 이동
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                    </>
                  ) : (
                    // 일반회원 버튼들
                    <>
                      <button
                        onClick={handleMyPageClick}
                        className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm"
                      >
                        마이페이지로 이동
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                      <Link
                        href="/portfolio"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <span className="mr-2">💼</span>
                        포트폴리오 보기
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <span className="mr-2">📋</span>
                        주문 내역
                      </Link>
                      <div className="flex gap-2">
                        <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-lg transition-all duration-200 font-['Pretendard'] text-xs">
                          알림설정
                        </button>
                        <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-lg transition-all duration-200 font-['Pretendard'] text-xs">
                          고객센터
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 로그아웃 버튼 - 진한 회색으로 톤다운 */}
                <button
                  onClick={handleLogout}
                  className="w-full border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              // 로그아웃 상태: 로그인/회원가입 옵션
              <div className="p-6">
                {/* 헤더 */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto mb-4 flex items-center justify-center shadow-lg relative">
                    <User className="w-8 h-8 text-white" />
                    {/* 하나금융 그룹 뱃지 오버레이 */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs text-white font-bold">H</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Pretendard'] mb-2">
                    하나줌에 오신 것을 환영합니다!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-['Pretendard'] leading-relaxed">
                    로그인하여 더 많은 기능을 이용해보세요
                  </p>
                </div>

                {/* 로그인/회원가입 버튼들 - 라인 스타일로 변경 */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] flex items-center justify-center"
                  >
                    <span className="mr-2">🚀</span>
                    로그인하기
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full border-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] flex items-center justify-center"
                  >
                    <span className="mr-2">✨</span>
                    회원가입하기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );

    // Portal을 사용하여 body에 직접 렌더링
    return createPortal(modalContent, document.body);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* 상단 연분홍색 선 */}
      <div className="w-full h-0.5 bg-pink-200"></div>

      <div
        className={`px-4 lg:px-6 h-16 flex items-center justify-between backdrop-blur-sm transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 shadow-lg"
            : "bg-white/95 dark:bg-gray-900/95"
        }`}
      >
        {/* 왼쪽: 로고 및 브랜드명 */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative">
            {/* 하나줌 로고 - PWA 아이콘 사용 또는 폴백 로고 */}
            {!logoError ? (
              <img
                src="/icon-192.png"
                alt="하나줌 로고"
                className="w-8 h-8 object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                H
              </div>
            )}
          </div>
          <span className="text-xl font-bold text-green-600 font-['Noto Sans KR']">
            하나줌
          </span>
        </Link>

        {/* 중앙: 네비게이션 링크들 */}
        <nav className="flex-1 flex justify-center">
          <div className="flex gap-20 lg:gap-24 xl:gap-28 items-center">
            <Link
              href="/"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              홈
            </Link>
            <Link
              href="/map"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              지도
            </Link>
            <Link
              href="/community"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              커뮤니티
            </Link>
            <Link
              href="/stocks"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              WTS
            </Link>
            {accessToken && (
              <Link
                href="/portfolio"
                className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
              >
                포트폴리오
              </Link>
            )}
          </div>
        </nav>

        {/* 우측: 액션 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 아이콘 */}
          <button
            onClick={handleNotificationClick}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {/* 읽지 않은 알림 개수 표시기 */}
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              </div>
            )}
          </button>

          {/* 관심 종목 아이콘 */}
          <button
            onClick={handleWatchlistClick}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors relative"
          >
            <Heart className="w-5 h-5" />
            {/* 관심종목 개수 표시기 */}
            {watchlist.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {watchlist.length}
                </span>
              </div>
            )}
          </button>

          {/* 프로필/로그인 아이콘 */}
          <div className="relative">
            {accessToken ? (
              // 로그인 상태: 프로필 아이콘 (PB/일반회원 구분)
              <button
                onClick={handleProfileClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isPb
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800"
                    : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800"
                }`}
              >
                {isPb ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
            ) : (
              // 로그아웃 상태: 로그인 아이콘 (클릭 가능)
              <button
                onClick={handleProfileClick}
                className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 테마 토글 */}
          <div className="flex items-center gap-3 ml-4">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Portal을 사용한 말풍선 렌더링 */}
      {renderProfileModal()}
      {renderWatchlistModal()}

      {/* 알림 드롭다운 */}
      <NotificationDropdown
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onNotificationUpdate={(newCount) => setNotificationCount(newCount)}
      />
    </header>
  );
}
