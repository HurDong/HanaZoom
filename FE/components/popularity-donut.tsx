"use client";

import { useEffect, useRef, useState, memo } from "react";
import { Loader2 } from "lucide-react";
import { getPopularityDetails, type PopularityDetailsResponse } from "@/lib/api/stock";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

type Props = {
  regionId: number;
  symbol: string;
  onLoaded?: (d: PopularityDetailsResponse | null) => void;
};

function PopularityDonutBase({ regionId, symbol, onLoaded }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PopularityDetailsResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const keyRef = useRef<string>("");
  const doneRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const key = `${regionId}:${symbol}`;
    if (keyRef.current === key && doneRef.current) {
      setLoading(false);
      return () => {};
    }

    keyRef.current = key;
    doneRef.current = false;
    setLoading(true);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    getPopularityDetails(regionId, symbol, "latest")
      .then((d) => {
        if (!mounted || controller.signal.aborted) return;
        setData(d);
        onLoaded?.(d);
        doneRef.current = true;
      })
      .catch(() => {
        if (!mounted || controller.signal.aborted) return;
        setData(null);
        onLoaded?.(null);
        doneRef.current = true;
      })
      .finally(() => {
        if (!mounted) return;
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      mounted = false;
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
    { key: "Trade", label: "거래추세", value: data.tradeTrend, weight: data.weightTradeTrend, color: "#059669" },
    { key: "Comm", label: "커뮤니티", value: data.community, weight: data.weightCommunity, color: "#10b981" },
    { key: "Mom", label: "모멘텀", value: data.momentum, weight: data.weightMomentum, color: "#34d399" },
  ];
  const weighted = items.map((i) => ({ ...i, wv: (i.value || 0) * (i.weight || 0) }));
  const sum = weighted.reduce((a, b) => a + b.wv, 0) || 1;
  const chartData = weighted.map((i) => ({ name: i.label, value: i.wv, percent: Math.round((i.wv / sum) * 1000) / 10, fill: i.color }));

  return (
    <ChartContainer
      config={{
        거래추세: { label: "거래추세", color: "#059669" },
        커뮤니티: { label: "커뮤니티", color: "#10b981" },
        모멘텀: { label: "모멘텀", color: "#34d399" },
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
  );
}

export const PopularityDonut = memo(PopularityDonutBase);

export default PopularityDonut;


