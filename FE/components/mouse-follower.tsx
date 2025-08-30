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
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let moveTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      setLastMoveTime(now);
      setIsMoving(true);

      const newTrail: StockTrail = {
        id: idCounter.current++,
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      };

      setTrail((prev) => [...prev.slice(-8), newTrail]);

      // 메인 커서 위치 직접 업데이트
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - 8}px, ${
          e.clientY - 8
        }px)`;
      }

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
      setTrail((previousTrail) => {
        const filtered = previousTrail.filter(
          (point) => now - point.timestamp < 800
        );
        // 상태가 변경되지 않았다면 동일 참조를 반환하여 불필요한 렌더 방지
        if (filtered.length === previousTrail.length) {
          return previousTrail;
        }
        return filtered;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999999]">
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

      {/* 궤적 점들 */}
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

      {/* 메인 커서 */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none"
        style={{
          transform: `translate(${trail[trail.length - 1]?.x - 8}px, ${
            trail[trail.length - 1]?.y - 8
          }px)`,
          willChange: "transform",
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
        </div>
      </div>

      {/* 클릭 효과 */}
      <style jsx global>{`
        /* 기본 페이지에서만 커서 숨기기 */
        body > *:not(.swal2-container):not(.swal2-shown) * {
          cursor: none !important;
        }

        /* 모달이나 로그인 창에서는 커서 표시 */
        .swal2-container *,
        .swal2-shown *,
        .swal2-popup * {
          cursor: auto !important;
        }

        /* 입력 필드에서는 기본 커서 표시 */
        input,
        textarea,
        select {
          cursor: text !important;
        }

        /* 버튼과 링크에서는 포인터 커서 표시 */
        button,
        [role="button"],
        a,
        .cursor-pointer {
          cursor: pointer !important;
        }

        /* SweetAlert2 다크모드 스타일 개선 */
        .dark .swal2-popup {
          background: #1a1a1a !important;
          color: #ffffff !important;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;
        }

        .dark .swal2-title {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        .dark .swal2-html-container {
          color: #e5e5e5 !important;
        }

        .dark .swal2-confirm {
          background: #22c55e !important;
          color: white !important;
          font-weight: 500 !important;
        }

        .dark .swal2-cancel {
          background: #374151 !important;
          color: #e5e5e5 !important;
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
}
