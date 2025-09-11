"use client";

import PortfolioDashboard from "@/components/portfolio/PortfolioDashboard";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import NavBar from "../components/Navbar";
import { StockTicker } from "@/components/stock-ticker";

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* 마우스 따라다니는 아이콘들 */}
      <MouseFollower />

      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols (사용자 설정에 따라) */}
      <FloatingEmojiBackground />

      {/* NavBar 컴포넌트 사용 */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      {/* 주식 티커 - 헤더 위에 표시 */}
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      {/* 메인 컨텐츠 */}
      <main className="relative z-10 pt-36">
        <PortfolioDashboard />
      </main>
    </div>
  );
}
