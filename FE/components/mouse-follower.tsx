"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface StockTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export function MouseFollower() {
  const { settings, isInitialized } = useUserSettingsStore();
  const [trail, setTrail] = useState<StockTrail[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [isOverClickable, setIsOverClickable] = useState(false);
  const idCounter = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 커서 숨기기
  const hideCursor = useCallback(() => {
    document.body.style.cursor = "none";
    document.body.classList.add("custom-cursor-enabled");
  }, []);

  // 커서 복원
  const showCursor = useCallback(() => {
    document.body.style.cursor = "auto";
    document.body.classList.remove("custom-cursor-enabled");
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();

    // 이전 RAF 취소
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // 상태 업데이트를 배치로 처리
    rafIdRef.current = requestAnimationFrame(() => {
      setLastMoveTime(now);
      setIsMoving(true);

      const newTrail: StockTrail = {
        id: idCounter.current++,
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      };

      setTrail((prev) => [...prev.slice(-8), newTrail]);
    });

    // 메인 커서 위치 직접 업데이트 (DOM 조작은 즉시)
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${e.clientX - 8}px, ${
        e.clientY - 8
      }px)`;
    }

    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 150);
  }, []);

  // 클릭 가능한 요소 감지
  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 입력 필드에서는 기본 커서 표시
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.contentEditable === "true")
      ) {
        document.body.style.cursor = "auto";
        setIsOverClickable(false);
      } else {
        document.body.style.cursor = "none";

        // 클릭 가능한 요소인지 확인
        const isClickable =
          target &&
          (target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.getAttribute("role") === "button" ||
            target.classList.contains("cursor-pointer") ||
            target.onclick !== null ||
            target.getAttribute("onclick") !== null);

        setIsOverClickable(isClickable);
      }
    },
    []
  );

  useEffect(() => {
    // 설정에 따라 커서 표시/숨김 전환
    if (settings.customCursorEnabled) {
      hideCursor();
    } else {
      showCursor();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      // 컴포넌트 언마운트 시 항상 기본 커서로 복원
      showCursor();
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, [handleMouseMove, handleMouseOver, hideCursor, showCursor, settings.customCursorEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail((previousTrail) => {
        // 빈 배열이면 필터링하지 않음
        if (previousTrail.length === 0) {
          return previousTrail;
        }

        const filtered = previousTrail.filter(
          (point) => now - point.timestamp < 800
        );

        // 상태가 변경되지 않았다면 동일 참조를 반환하여 불필요한 렌더 방지
        if (filtered.length === previousTrail.length) {
          return previousTrail;
        }
        return filtered;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // 디버깅: 설정 상태 확인 (환경 변수/전역 플래그로 제어)
  const debugCursor =
    process.env.NEXT_PUBLIC_DEBUG_CURSOR === 'true' ||
    (typeof window !== 'undefined' && (window as any).__DEBUG_CURSOR === true);

  if (debugCursor) {
    console.debug('🖱️ MouseFollower 상태:', {
      isInitialized,
      customCursorEnabled: settings.customCursorEnabled,
      settings: settings
    });
  }

  // 사용자 설정에 따라 커스텀 커서가 비활성화된 경우 컴포넌트를 렌더링하지 않음
  if (!isInitialized || !settings.customCursorEnabled) {
    if (debugCursor) {
      console.debug('🖱️ MouseFollower 비활성화:', { isInitialized, customCursorEnabled: settings.customCursorEnabled });
    }
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483647 }}>
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
          {/* 일반 커서 (원형) - 모든 상태에서 동일 */}
          <>
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
          </>
        </div>
      </div>

      {/* 커스텀 커서 스타일 */}
      <style jsx global>{`
        /* 전체 페이지에서 기본 커서 숨기기 (커스텀 커서가 활성화된 경우에만) */
        body.custom-cursor-enabled * {
          cursor: none !important;
        }

        /* 입력 필드에서만 커서 표시 */
        body.custom-cursor-enabled input,
        body.custom-cursor-enabled textarea,
        body.custom-cursor-enabled select,
        body.custom-cursor-enabled [contenteditable="true"] {
          cursor: text !important;
        }

        /* 클릭 가능한 요소에서는 커서 숨김 (커스텀 커서 사용) */
        body.custom-cursor-enabled button,
        body.custom-cursor-enabled [role="button"],
        body.custom-cursor-enabled a,
        body.custom-cursor-enabled .cursor-pointer,
        body.custom-cursor-enabled [onclick] {
          cursor: none !important;
        }

        /* 드래그 가능한 요소 */
        [draggable="true"] {
          cursor: grab !important;
        }

        [draggable="true"]:active {
          cursor: grabbing !important;
        }

        /* 리사이즈 가능한 요소 */
        .resize {
          cursor: nw-resize !important;
        }

        /* 모달이나 팝업에서는 기본 커서 표시 */
        .swal2-container *,
        .swal2-shown *,
        .swal2-popup *,
        .modal *,
        .popup * {
          cursor: auto !important;
        }

        /* 커스텀 커서가 비활성화된 경우 기본 커서 강제 표시 */
        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        body:not(.custom-cursor-enabled) button,
        body:not(.custom-cursor-enabled) [role="button"],
        body:not(.custom-cursor-enabled) a,
        body:not(.custom-cursor-enabled) .cursor-pointer {
          cursor: pointer !important;
        }

        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select {
          cursor: text !important;
        }

        /* 차트나 SVG 요소에서도 기본 커서 표시 */
        body:not(.custom-cursor-enabled) svg,
        body:not(.custom-cursor-enabled) canvas,
        body:not(.custom-cursor-enabled) [data-chart],
        body:not(.custom-cursor-enabled) .chart-container {
          cursor: auto !important;
        }

        /* pointer-events-none 요소들도 커서 표시 */
        body:not(.custom-cursor-enabled) [class*="pointer-events-none"],
        body:not(.custom-cursor-enabled) .pointer-events-none {
          cursor: auto !important;
        }

        /* 배경 패턴이나 floating 요소들 */
        body:not(.custom-cursor-enabled) [class*="absolute"],
        body:not(.custom-cursor-enabled) [class*="fixed"],
        body:not(.custom-cursor-enabled) [class*="bg-gradient"],
        body:not(.custom-cursor-enabled) [class*="opacity-10"],
        body:not(.custom-cursor-enabled) [class*="opacity-5"] {
          cursor: auto !important;
        }

        /* 모든 요소에 기본 커서 강제 적용 (최우선) */
        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        /* 클릭 가능한 요소는 pointer로 (최우선) */
        body:not(.custom-cursor-enabled) button,
        body:not(.custom-cursor-enabled) [role="button"],
        body:not(.custom-cursor-enabled) a,
        body:not(.custom-cursor-enabled) .cursor-pointer,
        body:not(.custom-cursor-enabled) [onclick] {
          cursor: pointer !important;
        }

        /* 입력 요소는 text로 (최우선) */
        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select,
        body:not(.custom-cursor-enabled) [contenteditable="true"] {
          cursor: text !important;
        }

        /* 특정 페이지의 문제 요소들 강제 커서 표시 */
        body:not(.custom-cursor-enabled) [class*="bg-gradient"],
        body:not(.custom-cursor-enabled) [class*="absolute inset-0"],
        body:not(.custom-cursor-enabled) [class*="fixed inset-0"],
        body:not(.custom-cursor-enabled) [class*="z-"],
        body:not(.custom-cursor-enabled) [class*="opacity-"],
        body:not(.custom-cursor-enabled) [class*="backdrop-blur"] {
          cursor: auto !important;
        }

        /* 모든 요소에 최종 강제 적용 */
        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        /* 클릭 가능한 요소만 pointer로 덮어쓰기 */
        body:not(.custom-cursor-enabled) button,
        body:not(.custom-cursor-enabled) [role="button"],
        body:not(.custom-cursor-enabled) a,
        body:not(.custom-cursor-enabled) .cursor-pointer,
        body:not(.custom-cursor-enabled) [onclick],
        body:not(.custom-cursor-enabled) [href] {
          cursor: pointer !important;
        }

        /* 입력 요소만 text로 덮어쓰기 */
        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select,
        body:not(.custom-cursor-enabled) [contenteditable="true"] {
          cursor: text !important;
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
