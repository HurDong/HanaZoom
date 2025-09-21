"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Clock,
  Bookmark,
  Navigation,
  Building,
  Train,
  Mail,
  Loader2,
  X,
} from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

// 검색 결과 타입
interface SearchResult {
  id: string;
  name: string;
  type: "region" | "subway" | "building" | "postal";
  latitude: number;
  longitude: number;
  address?: string;
  icon: React.ReactNode;
}

// 최근 검색/즐겨찾기 타입
interface RecentSearch {
  id: string;
  name: string;
  type: "region" | "subway" | "building" | "postal";
  latitude: number;
  longitude: number;
  timestamp: number;
  isFavorite: boolean;
}

interface SearchJumpProps {
  regions: any[];
  onLocationSelect: (lat: number, lng: number) => void;
  onResetMap?: () => void; // 지도 상태 초기화를 위한 추가 콜백
}

export function SearchJump({ regions, onLocationSelect, onResetMap }: SearchJumpProps) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  // 검색 디바운싱을 위한 ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 최근 검색 로드
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error("최근 검색 기록 로드 실패:", error);
      }
    }
  }, []);

  // 최근 검색 저장
  const saveRecentSearch = useCallback((search: Omit<RecentSearch, "timestamp" | "isFavorite">) => {
    const newSearch: RecentSearch = {
      ...search,
      timestamp: Date.now(),
      isFavorite: false,
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.id !== search.id);
      const updated = [newSearch, ...filtered].slice(0, 10); // 최대 10개 유지
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((searchId: string) => {
    setRecentSearches(prev => {
      const updated = prev.map(item => 
        item.id === searchId 
          ? { ...item, isFavorite: !item.isFavorite }
          : item
      );
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 검색 실행
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // 카카오맵 API를 사용한 검색 (실제 구현 시 카카오맵 API 키 필요)
      const results: SearchResult[] = [];

      // 지역 검색 (regions 배열에서 검색)
      const regionMatches = regions.filter(region =>
        region.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);

      regionMatches.forEach(region => {
        results.push({
          id: `region-${region.id}`,
          name: region.name,
          type: "region",
          latitude: region.latitude,
          longitude: region.longitude,
          icon: <MapPin className="w-4 h-4 text-green-600" />
        });
      });

      // 임시 데이터 (실제로는 카카오맵 API 사용)
      const mockResults: SearchResult[] = [
        {
          id: "subway-1",
          name: "강남역",
          type: "subway",
          latitude: 37.498,
          longitude: 127.028,
          address: "서울특별시 강남구 강남대로 396",
          icon: <Train className="w-4 h-4 text-blue-600" />
        },
        {
          id: "building-1",
          name: "강남타워",
          type: "building",
          latitude: 37.498,
          longitude: 127.028,
          address: "서울특별시 강남구 테헤란로 152",
          icon: <Building className="w-4 h-4 text-purple-600" />
        },
        {
          id: "postal-1",
          name: "우편번호 06123",
          type: "postal",
          latitude: 37.498,
          longitude: 127.028,
          address: "서울특별시 강남구",
          icon: <Mail className="w-4 h-4 text-orange-600" />
        }
      ];

      // 검색어가 포함된 결과만 필터링
      const filteredMockResults = mockResults.filter(result =>
        result.name.toLowerCase().includes(query.toLowerCase()) ||
        result.address?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults([...results, ...filteredMockResults]);
    } catch (error) {
      console.error("검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [regions]);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);
    setShowRecentSearches(false);

    // 디바운싱
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // 검색 결과 클릭 핸들러
  const handleSearchResultClick = useCallback((result: SearchResult) => {
    onLocationSelect(result.latitude, result.longitude);
    setSearchQuery(result.name);
    setShowSearchResults(false);
    setShowRecentSearches(false);

    // 최근 검색에 추가
    saveRecentSearch({
      id: result.id,
      name: result.name,
      type: result.type,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  }, [onLocationSelect, saveRecentSearch]);

  // 최근 검색 클릭 핸들러
  const handleRecentSearchClick = useCallback((search: RecentSearch) => {
    onLocationSelect(search.latitude, search.longitude);
    setSearchQuery(search.name);
    setShowSearchResults(false);
    setShowRecentSearches(false);
  }, [onLocationSelect]);

  // 내 위치로 이동 (지도 페이지 새로고침과 동일한 로직)
  const moveToUserLocation = useCallback(() => {
    console.log("📍 내 위치 버튼 클릭됨");
    console.log("📍 사용자 정보:", user);
    console.log("📍 사용자 좌표:", user?.latitude, user?.longitude);
    
    if (!user) {
      console.log("❌ 로그인이 필요합니다.");
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }
    
    if (user?.latitude && user?.longitude) {
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      console.log("📍 지도 이동:", { lat, lng });
      
      // 지도 페이지 새로고침과 동일한 로직 적용 (onResetMap에서 모든 처리)
      console.log("🔄 지도 상태 초기화 (새로고침 효과)");
      if (onResetMap) {
        onResetMap();
      }
    } else {
      console.log("❌ 사용자 위치 정보가 없습니다.");
      // 사용자에게 알림 및 마이페이지로 이동 제안
      if (confirm("저장된 위치 정보가 없습니다. 마이페이지에서 위치를 설정하시겠습니까?")) {
        router.push("/mypage");
      }
    }
  }, [user?.latitude, user?.longitude, onLocationSelect, user, router]);

  // 컴포넌트 언마운트 시 타임아웃 클리어
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[80] w-full max-w-2xl px-4">
      <div className="relative">
        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="읍/면/동·지하철·건물명·우편번호 검색"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              setShowSearchResults(true);
              setShowRecentSearches(true);
            }}
            onBlur={() => {
              // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
              setTimeout(() => {
                setShowSearchResults(false);
                setShowRecentSearches(false);
              }, 200);
            }}
            className="pl-10 pr-20 h-12 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 shadow-lg"
          />
          
          {/* 내 위치 버튼 */}
          <Button
            onClick={moveToUserLocation}
            disabled={!user || !user?.latitude || !user?.longitude}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs ${
              user && user?.latitude && user?.longitude
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Navigation className="w-4 h-4 mr-1" />
            내 위치
          </Button>
        </div>

        {/* 검색 결과 드롭다운 */}
        {showSearchResults && (searchQuery || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-green-200 dark:border-green-700 max-h-80 overflow-y-auto z-50">
            {isSearching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-green-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">검색 중...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                  >
                    {result.icon}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {result.name}
                      </div>
                      {result.address && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {result.address}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 최근 검색/즐겨찾기 드롭다운 */}
        {showRecentSearches && !searchQuery && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-green-200 dark:border-green-700 max-h-80 overflow-y-auto z-50">
            <div className="p-3 border-b border-green-200 dark:border-green-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                최근 검색
              </h3>
            </div>
            <div className="py-2">
              {recentSearches.map((search) => (
                <div
                  key={search.id}
                  className="px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                >
                  <button
                    onClick={() => handleRecentSearchClick(search)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <MapPin className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {search.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {search.type === "region" && "지역"}
                        {search.type === "subway" && "지하철역"}
                        {search.type === "building" && "건물"}
                        {search.type === "postal" && "우편번호"}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFavorite(search.id)}
                    className={`p-1 rounded-full transition-colors ${
                      search.isFavorite
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-400 hover:text-yellow-500"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${search.isFavorite ? "fill-current" : ""}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
