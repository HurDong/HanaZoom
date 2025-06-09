"use client";

import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  onComplete: () => void;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "주식 데이터 수집 중...",
    "지역별 트렌드 분석 중...",
    "맛집 정보 준비 중...",
    "지도 그리는 중...",
    "완료! 🎉",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stepIndex = Math.floor((progress / 100) * (steps.length - 1));
    setCurrentStep(stepIndex);
  }, [progress, steps.length]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center z-50 transition-all duration-500">
      <div className="text-center space-y-8">
        {/* 로고 */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-2xl">🗺️</span>
          </div>
          <span className="text-2xl font-bold text-green-800 dark:text-green-200">
            하나줌
          </span>
        </div>

        {/* 차트 그리기 애니메이션 */}
        <div className="relative w-80 h-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-auto">
          <div className="absolute inset-6">
            {/* Y축 */}
            <div className="absolute left-0 top-0 w-px h-full bg-gray-300 dark:bg-gray-600"></div>
            {/* X축 */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300 dark:bg-gray-600"></div>

            {/* 차트 라인 */}
            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 0 120 Q 60 80 120 100 T 240 60 T 320 40"
                stroke="url(#gradient)"
                strokeWidth="3"
                fill="none"
                className="animate-draw"
                strokeDasharray="400"
                strokeDashoffset="400"
                style={{
                  animation: `drawLine 3s ease-in-out infinite`,
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            {/* 데이터 포인트들 */}
            {[20, 40, 60, 80].map((x, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 bg-green-500 rounded-full transition-all duration-500 ${
                  progress > (i + 1) * 20
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-0"
                }`}
                style={{
                  left: `${x}%`,
                  top: `${60 - i * 10}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <div className="absolute -top-8 -left-4 text-xs text-green-600 dark:text-green-400 font-semibold">
                  {["📱", "💬", "🔍", "💾"][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="w-80 mx-auto">
          <div className="flex justify-between text-sm text-green-700 dark:text-green-300 mb-2">
            <span>{steps[currentStep]}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 떠다니는 아이콘들 */}
        <div className="relative h-16">
          {["💰", "📈", "💎", "🚀", "📊"].map((emoji, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-2xl opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "2s",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes drawLine {
          0% {
            stroke-dashoffset: 400;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }
      `}</style>
    </div>
  );
}
