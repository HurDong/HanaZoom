"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Loader2 } from "lucide-react";
import { getPopularityDetails, type PopularityDetailsResponse } from "@/lib/api/stock";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

type Props = {
  regionId: number;
  symbol: string;
  name?: string;
  onLoaded?: (d: PopularityDetailsResponse | null) => void;
};

// 전역 캐시를 위한 Map
const dataCache = new Map<string, { data: PopularityDetailsResponse | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

function PopularityDonutBase({ regionId, symbol, name, onLoaded }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PopularityDetailsResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const keyRef = useRef<string>("");
  const mountedRef = useRef<boolean>(true);
  const onLoadedRef = useRef(onLoaded);
  
  // onLoaded 콜백을 ref로 안정화
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  useEffect(() => {
    if (!regionId || !symbol) return;
    
    mountedRef.current = true;
    const key = `${regionId}:${symbol}`;
    
    // 캐시에서 데이터 확인
    const cached = dataCache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      onLoadedRef.current?.(cached.data);
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    // 이미 같은 키로 요청 중이라면 재요청하지 않음
    if (keyRef.current === key) {
      return () => {
        mountedRef.current = false;
      };
    }

    keyRef.current = key;
    setLoading(true);
    
    if (abortRef.current) {
      abortRef.current.abort();
    }
    
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    getPopularityDetails(regionId, symbol, "latest")
      .then((d) => {
        // 캐시에 저장
        dataCache.set(key, { data: d, timestamp: now });
        
        setData(d);
        setLoading(false);
        onLoadedRef.current?.(d);
      })
      .catch((err) => {
        // 실패한 경우도 캐시에 저장 (짧은 시간 동안 재요청 방지)
        dataCache.set(key, { data: null, timestamp: now });
        
        setData(null);
        setLoading(false);
        onLoadedRef.current?.(null);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        keyRef.current = ""; // 요청 완료 후 키 초기화
      });

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [regionId, symbol]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
      </div>
    );
  }
  
  if (!data) {
    return <div className="text-sm text-gray-500">데이터 없음</div>;
  }

  // 뉴스는 숨김
  const items = [
    { key: "Trade", label: "거래추세", value: Number(data.tradeTrend) || 0, weight: Number(data.weightTradeTrend) || 0, color: "#059669" },
    { key: "Comm", label: "커뮤니티", value: Number(data.community) || 0, weight: Number(data.weightCommunity) || 0, color: "#dc2626" },
    { key: "Mom", label: "모멘텀", value: Number(data.momentum) || 0, weight: Number(data.weightMomentum) || 0, color: "#7c3aed" },
  ];
  
  const weighted = items.map((i) => ({ ...i, wv: (i.value || 0) * (i.weight || 0) }));
  const sum = weighted.reduce((a, b) => a + b.wv, 0) || 1;
  const chartData = weighted.map((i) => ({ name: i.label, value: i.wv, percent: Math.round((i.wv / sum) * 1000) / 10, fill: i.color }));

  return (
    <div className="space-y-4">
      {/* 종목명과 인기도 점수 */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {name || symbol}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          인기도 점수: {data.score?.toFixed(1) || 0}
        </p>
      </div>

      {/* 도넛차트 */}
      <ChartContainer
        config={{
          거래추세: { label: "거래추세", color: "#059669" },
          커뮤니티: { label: "커뮤니티", color: "#dc2626" },
          모멘텀: { label: "모멘텀", color: "#7c3aed" },
        }}
        className="h-56"
      >
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Pie>
          <ChartTooltip
            content={<ChartTooltipContent formatter={(v, name) => (<span>{name}: {Math.round((Number(v)/sum)*1000)/10}%</span>)} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export const PopularityDonut = memo(PopularityDonutBase);

export default PopularityDonut;