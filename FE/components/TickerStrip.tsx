"use client";

// TickerStrip.tsx
// 초슬림 가로형 티커 스트립 (React + TS + Tailwind, 단일 파일, 외부 라이브러리 없음)

import React, { useEffect, useMemo, useState } from "react";

export type TickerStripProps = {
  logoUrl: string;
  name: string;
  ticker: string;
  price: number;
  change: number;
  changeRate: number; // 0.0176 → 1.76
  marketState: "정규장" | "장마감" | "시간외";
  lastUpdatedSec: number;
  realtimeOrderable?: boolean; // 기본 true
  className?: string;
};

// ---------------- Utils ----------------
const cn = (...arr: (string | undefined | false)[]) => arr.filter(Boolean).join(" ");

const formatNumber = (n: number) => (isFinite(n) ? n.toLocaleString("ko-KR") : "-");
const formatKRW = (n: number) => `₩ ${formatNumber(Math.round(n))}`;

const changeColor = (chg: number) =>
  chg > 0 ? "text-rose-400" : chg < 0 ? "text-sky-400" : "text-neutral-300";
const changeSymbol = (chg: number) => (chg > 0 ? "▲" : chg < 0 ? "▼" : "■");

const signalColor = (sec: number) => {
  if (sec <= 10) return "text-green-400";
  if (sec <= 30) return "text-amber-400";
  return "text-red-400";
};

// ---------------- Component ----------------
const TickerStrip: React.FC<TickerStripProps> = ({
  logoUrl,
  name,
  ticker,
  price,
  change,
  changeRate,
  marketState,
  lastUpdatedSec,
  realtimeOrderable = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const pct = useMemo(() => (isFinite(changeRate) ? changeRate.toFixed(2) : "-"), [changeRate]);
  const changeAbs = Math.abs(change);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticker);
      setCopied(true);
    } catch {}
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-900/95 backdrop-blur",
        "text-neutral-50 tabular-nums whitespace-nowrap",
        className
      )}
      role="banner"
      aria-label="티커 스트립"
    >
      <div className="mx-auto max-w-screen-2xl px-3 md:px-4 h-14 flex items-center">
        <div className="grid w-full grid-cols-12 gap-2">
          {/* LEFT (4) */}
          <div className="col-span-12 md:col-span-4 flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="로고" className="h-full w-full object-contain" />
              ) : (
                <span className="text-lg">📈</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm md:text-base font-semibold" title={name}>
                {name}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs md:text-sm rounded border border-neutral-700 px-2 py-0.5 hover:bg-neutral-800"
              aria-label={`티커 ${ticker} 복사`}
              title="티커 복사"
            >
              {ticker}
            </button>
          </div>

          {/* CENTER (4) */}
          <div className="col-span-12 md:col-span-4 flex items-center justify-center gap-3">
            <div
              className="text-lg md:text-xl font-extrabold leading-none"
              aria-label={`현재가 ${formatNumber(price)}원, 전일 대비 ${(change >= 0 ? "+" : "-") + formatNumber(changeAbs)}원 (${pct}%)`}
            >
              {formatKRW(price)}
            </div>
            <div className={cn("text-xs md:text-sm leading-none", changeColor(change))}>
              {changeSymbol(change)} {change >= 0 ? "+" : "-"}
              {formatNumber(changeAbs)} ({pct}%)
            </div>
          </div>

          {/* RIGHT (4) */}
          <div className="col-span-12 md:col-span-4 flex items-center justify-end gap-2">
            {/* 신호등 + n초 전 */}
            <span className="text-xs md:text-sm flex items-center gap-1">
              <span className={cn("text-sm", signalColor(lastUpdatedSec))}>●</span>
              <span className="text-neutral-300">{lastUpdatedSec > 0 ? `${lastUpdatedSec}초 전` : "실시간"}</span>
            </span>

            {/* 장상태 */}
            <span className="text-xs md:text-sm rounded border border-neutral-700 px-2 py-0.5 text-neutral-200">
              {marketState}
            </span>

            {/* 실시간 주문 가능 토글 배지 (옵션) */}
            <span
              className={cn(
                "text-xs md:text-sm rounded px-2 py-0.5 border",
                realtimeOrderable
                  ? "border-emerald-600 text-emerald-400"
                  : "border-neutral-700 text-neutral-400"
              )}
              aria-label={`실시간 주문 ${realtimeOrderable ? "가능" : "불가"}`}
            >
              {realtimeOrderable ? "실시간 주문 가능" : "실시간 주문 불가"}
            </span>
          </div>
        </div>
      </div>

      {/* Copy toast */}
      {copied && (
        <div className="fixed left-1/2 top-2 z-[1000] -translate-x-1/2 rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-100 shadow">
          복사됨
        </div>
      )}
    </div>
  );
};

export default TickerStrip;

/* 사용 예시 (렌더링에는 포함되지 않음)
<TickerStrip
  logoUrl="/logos/skhynix.png"
  name="SK하이닉스"
  ticker="000660"
  price={260500}
  change={4500}
  changeRate={0.0176}
  marketState="정규장"
  lastUpdatedSec={8}
  realtimeOrderable
/>
*/


