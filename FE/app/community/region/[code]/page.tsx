"use client";
import { getAccessToken } from "@/app/utils/auth";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import RegionChat from "@/components/chat/RegionChat";

interface RegionInfo {
  regionId: number;
  name: string;
  stats: {
    todayPostCount: number;
    todayCommentCount: number;
    todayTotalViews: number;
  };
  trendingStocks: Array<{
    symbol: string;
    name: string;
    regionalRanking: number;
    popularityScore: number;
    trendScore: number;
  }>;
}

export default function RegionDiscussionPage() {
  const { code } = useParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);

  useEffect(() => {
    const fetchRegionInfo = async () => {
      if (!code) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = getAccessToken();
        if (!token) {
          setError("로그인이 필요합니다.");
          return;
        }

        // 사용자의 지역 정보 가져오기
        const response = await fetch(
          "http://localhost:8080/api/v1/chat/region-info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("지역 정보를 가져오는데 실패했습니다.");
        }

        const chatData = await response.json();
        const regionId = chatData.data.regionId;

        // 지역 통계 정보 가져오기
        const statsResponse = await fetch(
          `http://localhost:8080/api/v1/regions/${regionId}/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!statsResponse.ok) {
          throw new Error("지역 통계 정보를 가져오는데 실패했습니다.");
        }

        const statsData = await statsResponse.json();
        setRegionInfo(statsData.data);
      } catch (error) {
        console.error("Failed to fetch region info:", error);
        // 에러 시 임시 데이터 사용
        setRegionInfo({
          regionId: parseInt(code as string) || 880,
          name: "신대방2동",
          stats: {
            todayPostCount: 25,
            todayCommentCount: 50,
            todayTotalViews: 1000,
          },
          trendingStocks: [
            {
              symbol: "005930",
              name: "삼성전자",
              regionalRanking: 1,
              popularityScore: 95.5,
              trendScore: 10,
            },
            {
              symbol: "035720",
              name: "카카오",
              regionalRanking: 2,
              popularityScore: 92.0,
              trendScore: 8,
            },
            {
              symbol: "035420",
              name: "NAVER",
              regionalRanking: 3,
              popularityScore: 88.5,
              trendScore: 7,
            },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegionInfo();
  }, [code]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
        <NavBar />
        <main className="container mx-auto px-4 pt-20 pb-8">
          <div className="text-center">
            <p>지역 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
        <NavBar />
        <main className="container mx-auto px-4 pt-20 pb-8">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      <NavBar />

      <main className="container mx-auto px-4 pt-20 pb-8">
        {/* 지역 정보 헤더 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">
                {regionInfo?.name} 투자 커뮤니티
              </h1>
              <p className="text-green-700 dark:text-green-300 mt-2">
                지역 주민들과 실시간으로 투자 정보를 공유해보세요
              </p>
            </div>
            <MapPin className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* 탭 선택 */}
        <div className="mb-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-green-100 dark:bg-green-900/50">
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                실시간 채팅
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                투자 정보
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 채팅 탭 */}
        {activeTab === "chat" && regionInfo && (
          <div className="space-y-6">
            <RegionChat
              regionId={regionInfo.regionId}
              regionName={regionInfo.name}
            />

            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">채팅 안내</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• 같은 지역 주민들과 실시간으로 소통할 수 있습니다</li>
                  <li>• 투자 정보와 지역 소식을 공유해보세요</li>
                  <li>• 건전한 대화 문화를 만들어가요</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 투자 정보 탭 */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">지역 투자 정보</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  곧 지역별 맞춤 투자 정보를 제공할 예정입니다.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
