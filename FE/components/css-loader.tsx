"use client";

import { useEffect, useState } from "react";

export default function CSSLoader() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // CSS 로딩 완료 확인
    const checkCSSLoaded = () => {
      const testElement = document.createElement('div');
      testElement.className = 'bg-background text-foreground';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const isBackgroundLoaded = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
      
      document.body.removeChild(testElement);
      
      if (isBackgroundLoaded) {
        setIsLoaded(true);
      } else {
        setTimeout(checkCSSLoaded, 100);
      }
    };

    checkCSSLoaded();
  }, []);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>지도를 준비하고 있습니다...</p>
          <p className="text-sm text-gray-300 mt-2">마커를 로딩 중입니다</p>
        </div>
      </div>
    );
  }

  return null;
}
