"use client";

import { useEffect, useState } from "react";
import NavBar from "../components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import dynamic from "next/dynamic";

// 행정구역 데이터 타입 정의
interface DistrictData {
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  topStocks: {
    name: string;
    price: string;
    change: string;
  }[];
}

// 임시 데이터 (실제로는 API에서 가져와야 함)
const districtData: { [key: string]: DistrictData } = {
  강남구: {
    name: "강남구",
    center: { lat: 37.517235, lng: 127.047325 },
    topStocks: [
      { name: "삼성전자", price: "70,000", change: "+2.5%" },
      { name: "SK하이닉스", price: "150,000", change: "+1.8%" },
    ],
  },
  서초구: {
    name: "서초구",
    center: { lat: 37.483664, lng: 127.032463 },
    topStocks: [
      { name: "네이버", price: "200,000", change: "+3.2%" },
      { name: "카카오", price: "45,000", change: "-1.5%" },
    ],
  },
};

// 카카오맵 컴포넌트를 동적으로 임포트
const KakaoMap = dynamic(() => import("@/components/KakaoMap"), { ssr: false });

export default function MapPage() {
  const [mapLevel, setMapLevel] = useState(3);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // 지도 레벨에 따른 행정구역 표시 결정
  const getVisibleBoundaries = (level: number) => {
    if (level <= 3) return "시/도";
    if (level <= 6) return "구/군";
    return "동/읍/면";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="relative z-10 pt-36">
        <div className="container px-4 md:px-6 mx-auto">
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-8">
            주식 맛집 지도 🗺️
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-h-[500px]">
            <KakaoMap
              districtData={districtData}
              mapLevel={mapLevel}
              setMapLevel={setMapLevel}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
            />
            <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              현재 표시: {getVisibleBoundaries(mapLevel)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
