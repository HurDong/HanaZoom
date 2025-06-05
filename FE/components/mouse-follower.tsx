"use client";

import { useEffect, useState, useRef } from "react";

interface StockTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export function MouseFollower() {
  const [trail, setTrail] = useState<StockTrail[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const idCounter = useRef(0);

  useEffect(() => {
    let moveTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      setLastMoveTime(now);
      setIsMoving(true);

      // 마우스 움직임 궤적 생성 (더 부드럽게)
      const newTrail: StockTrail = {
        id: idCounter.current++,
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      };

      setTrail((prev) => [...prev.slice(-8), newTrail]); // 최대 8개의 궤적점

      // 움직임 멈춤 감지
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        setIsMoving(false);
      }, 150);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(moveTimeout);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail((prev) => prev.filter((point) => now - point.timestamp < 800)); // 0.8초 후 사라짐
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* 주식 차트 라인 궤적 */}
      {trail.length > 1 && (
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient
              id="trailGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0)" />
              <stop offset="50%" stopColor="rgba(34, 197, 94, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.6)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={`M ${trail
              .map((point, index) => `${point.x},${point.y}`)
              .join(" L ")}`}
            stroke="url(#trailGradient)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            className="transition-opacity duration-300"
            style={{ opacity: isMoving ? 0.7 : 0.3 }}
          />
        </svg>
      )}

      {/* 궤적 점들 (주식 데이터 포인트처럼) */}
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp;
        const opacity = Math.max(0, 1 - age / 800);
        const scale = 0.3 + opacity * 0.4;

        return (
          <div
            key={point.id}
            className="absolute w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full transition-all duration-100"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              opacity: opacity * 0.6,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${scale * 8}px rgba(34, 197, 94, ${
                opacity * 0.5
              })`,
            }}
          />
        );
      })}

      {/* 메인 커서 (주식 차트 포인터) */}
      {trail.length > 0 && (
        <div
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: trail[trail.length - 1]?.x - 8,
            top: trail[trail.length - 1]?.y - 8,
          }}
        >
          <div className="relative">
            {/* 외부 링 */}
            <div
              className={`w-4 h-4 border-2 border-green-500 dark:border-green-400 rounded-full transition-all duration-300 ${
                isMoving
                  ? "scale-125 border-opacity-80"
                  : "scale-100 border-opacity-40"
              }`}
              style={{
                boxShadow: isMoving
                  ? "0 0 12px rgba(34, 197, 94, 0.4)"
                  : "0 0 6px rgba(34, 197, 94, 0.2)",
              }}
            />
            {/* 내부 점 */}
            <div
              className={`absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                isMoving ? "scale-110" : "scale-90"
              }`}
            />

            {/* 움직일 때만 나타나는 미니 차트 */}
            {isMoving && (
              <div className="absolute -top-8 -left-6 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded px-2 py-1 text-xs font-mono text-green-700 dark:text-green-300 shadow-lg animate-in fade-in duration-200">
                📈 +2.3%
              </div>
            )}
          </div>
        </div>
      )}

      {/* 클릭 효과 */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }

        a,
        button,
        [role="button"],
        input,
        textarea,
        select {
          cursor: none !important;
        }

        a:hover,
        button:hover,
        [role="button"]:hover {
          cursor: none !important;
        }
      `}</style>
    </div>
  );
}
