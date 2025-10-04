"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  emoji: string;
  score?: number;
  matchType?: string;
  sector?: string;
}

interface StockMentionProps {
  query: string;
  onSelect: (stock: Stock) => void;
  onClose: () => void;
}

export default function StockMention({
  query,
  onSelect,
  onClose,
}: StockMentionProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const scrollToSelected = useCallback(() => {
    if (selectedItemRef.current && scrollAreaRef.current) {
      const container = scrollAreaRef.current;
      const selectedItem = selectedItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      // 선택된 아이템이 컨테이너 밖에 있는지 확인
      if (itemRect.top < containerRect.top) {
        // 위쪽으로 스크롤
        selectedItem.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (itemRect.bottom > containerRect.bottom) {
        // 아래쪽으로 스크롤
        selectedItem.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, []);

  const searchStocks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setStocks([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/stocks/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        const results = (data.data || []).map((stock: any) => ({
          ...stock,
          emoji: getStockEmoji(stock.sector),
        }));
        setStocks(results);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("주식 검색 실패:", error);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 섹터에 따라 이모지 할당
  const getStockEmoji = (sector?: string): string => {
    if (!sector) return "📊";
    if (sector.includes("전기") || sector.includes("전자")) return "⚡";
    if (sector.includes("자동차")) return "🚗";
    if (sector.includes("금융")) return "💰";
    if (sector.includes("제약") || sector.includes("바이오")) return "💊";
    if (sector.includes("화학")) return "🧪";
    if (sector.includes("통신")) return "📱";
    if (sector.includes("건설")) return "🏗️";
    if (sector.includes("유통")) return "🛒";
    if (sector.includes("엔터")) return "🎬";
    return "📊";
  };

  // 매칭 타입에 따른 배지 정보
  const getMatchTypeBadge = (matchType?: string) => {
    if (!matchType) return null;

    if (matchType === "SYMBOL_EXACT" || matchType === "NAME_EXACT") {
      return {
        label: "정확",
        variant: "default" as const,
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    if (matchType.includes("FUZZY")) {
      return {
        label: "유사",
        variant: "secondary" as const,
        icon: <Sparkles className="w-3 h-3" />,
      };
    }
    if (matchType === "NAME_CONTAINS") {
      return { label: "포함", variant: "outline" as const, icon: null };
    }
    return null;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStocks(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchStocks]);

  // 선택된 인덱스가 변경될 때 스크롤 조정
  useEffect(() => {
    if (stocks.length > 0) {
      scrollToSelected();
    }
  }, [selectedIndex, stocks.length, scrollToSelected]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stocks.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % stocks.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + stocks.length) % stocks.length
          );
          break;
        case "Enter":
          e.preventDefault();
          if (stocks[selectedIndex]) {
            onSelect(stocks[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [stocks, selectedIndex, onSelect, onClose]);

  if (stocks.length === 0 && !loading) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-background border rounded-lg shadow-lg z-50"
    >
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Search className="w-4 h-4" />
            <span>주식 검색</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Sparkles className="w-3 h-3 text-yellow-500" />
            <span className="text-muted-foreground">오타 허용</span>
          </div>
        </div>
      </div>

      <ScrollArea className="max-h-60" ref={scrollAreaRef}>
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            검색 중...
          </div>
        ) : (
          <div className="p-1">
            {stocks.map((stock, index) => {
              const matchBadge = getMatchTypeBadge(stock.matchType);
              return (
                <button
                  key={stock.symbol}
                  onClick={() => onSelect(stock)}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  className={`w-full flex items-center space-x-3 p-2 rounded text-left hover:bg-muted/50 transition-colors cursor-pointer ${
                    index === selectedIndex ? "bg-muted" : ""
                  }`}
                >
                  <span className="text-lg">{stock.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium truncate">{stock.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {stock.symbol}
                      </span>
                      {matchBadge && (
                        <Badge
                          variant={matchBadge.variant}
                          className="text-[10px] px-1 py-0 h-4 flex items-center gap-1"
                        >
                          {matchBadge.icon}
                          {matchBadge.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      {stock.sector && (
                        <span className="text-muted-foreground/70">
                          {stock.sector}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {stock.price}
                      </span>
                      <span
                        className={
                          stock.change?.startsWith("-")
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {stock.change}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>↑↓ 방향키로 선택, Enter로 선택</span>
          <span>ESC로 닫기</span>
        </div>
      </div>
    </div>
  );
}
