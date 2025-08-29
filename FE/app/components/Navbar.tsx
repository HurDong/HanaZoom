"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, useAuthStore } from "../utils/auth";
import { Bell, Heart, User, Plus, Trash2, Search, X } from "lucide-react";
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

export default function NavBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const { accessToken } = useAuthStore();

  // 관심종목 관련 상태
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);

  // 종목 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    } catch (error) {
      console.error("관심종목 추가 실패:", error);
      alert("관심종목 추가에 실패했습니다.");
    } finally {
      setIsAddingStock(false);
    }
  };

  // 관심종목 제거
  const handleRemoveFromWatchlist = async (stockSymbol: string) => {
    if (!accessToken) return;

    try {
      await removeFromWatchlist(stockSymbol);
      await loadWatchlist(); // 목록 새로고침
    } catch (error) {
      console.error("관심종목 제거 실패:", error);
      alert("관심종목 제거에 실패했습니다.");
    }
  };

  // 관심종목 모달 열기
  const handleWatchlistClick = () => {
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }
    setShowWatchlistModal(true);
    loadWatchlist();
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
    setShowProfileModal(!showProfileModal);
  };

  const handleMyPageClick = () => {
    setShowProfileModal(false);
    router.push("/mypage");
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
                      <div className="flex items-center gap-3">
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
                {/* 프로필 헤더 */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Pretendard']">
                      사용자님
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-['Pretendard']">
                      하나줌 회원
                    </p>
                  </div>
                </div>

                {/* 프로필 정보 */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-['Pretendard']">
                      가입일
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white font-['Pretendard'] font-medium">
                      2024년
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-['Pretendard']">
                      등급
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 font-['Pretendard'] font-medium">
                      일반회원
                    </span>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="space-y-3">
                  <button
                    onClick={handleMyPageClick}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg font-['Pretendard']"
                  >
                    마이페이지로 이동
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg font-['Pretendard']"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              // 로그아웃 상태: 로그인/회원가입 옵션
              <div className="p-6">
                {/* 헤더 */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-['Pretendard'] mb-2">
                    하나줌에 오신 것을 환영합니다!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-['Pretendard'] leading-relaxed">
                    로그인하여 더 많은 기능을 이용해보세요
                  </p>
                </div>

                {/* 로그인/회원가입 버튼들 */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg font-['Pretendard'] flex items-center justify-center"
                  >
                    <span className="mr-2">🚀</span>
                    로그인하기
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg font-['Pretendard'] flex items-center justify-center"
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
            {/* 하나은행 로고 이미지 */}
            <img
              src="/favicon.ico"
              alt="하나은행 로고"
              className="w-8 h-8 object-contain"
            />
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
          </div>
        </nav>

        {/* 우측: 액션 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 아이콘 */}
          <button className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors relative">
            <Bell className="w-5 h-5" />
            {/* 알림 표시기 */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
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
              // 로그인 상태: 프로필 아이콘
              <button
                onClick={handleProfileClick}
                className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <User className="w-4 h-4" />
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
    </header>
  );
}
