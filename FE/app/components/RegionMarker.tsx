"use client";

import { memo, useMemo, useState } from "react";
import { CustomOverlayMap } from "react-kakao-maps-sdk";
import { Region } from "@/app/map/page";

export interface RegionMarkerProps {
  region: Region;
  onClick: (region: Region) => void;
  isVisible?: boolean;
}

export const RegionMarker = memo(
  ({ region, onClick, isVisible = true }: RegionMarkerProps) => {
    const { name, latitude, longitude, type } = region;
    const [isHovered, setIsHovered] = useState(false);

    // 스타일을 메모이제이션하여 리렌더링 최적화
    const styles = useMemo(() => {
      switch (type) {
        case "CITY":
          return {
            padding: "px-4 py-2",
            fontSize: "text-base font-bold",
            shadow: isHovered ? "shadow-2xl" : "shadow-lg",
            borderColor: isHovered
              ? "border-emerald-300 animate-pulse"
              : "border-emerald-500",
            textColor: "text-emerald-800 dark:text-emerald-100",
            bgColor: "bg-white dark:bg-gray-800",
            zIndex: 30,
          };
        case "DISTRICT":
          return {
            padding: "px-3 py-1.5",
            fontSize: "text-sm font-semibold",
            shadow: isHovered ? "shadow-xl" : "shadow-md",
            borderColor: isHovered
              ? "border-green-300 animate-pulse"
              : "border-green-500",
            textColor: "text-green-800 dark:text-green-100",
            bgColor: "bg-white dark:bg-gray-800",
            zIndex: 20,
          };
        case "NEIGHBORHOOD":
          return {
            padding: "px-2 py-1",
            fontSize: "text-xs font-medium",
            shadow: isHovered ? "shadow-lg" : "shadow",
            borderColor: isHovered
              ? "border-teal-300 animate-pulse"
              : "border-teal-500",
            textColor: "text-teal-800 dark:text-teal-100",
            bgColor: "bg-white dark:bg-gray-800",
            zIndex: 10,
          };
        default: // 혹시 모를 예외 상황 대비
          return {
            padding: "px-2 py-1",
            fontSize: "text-xs font-medium",
            shadow: isHovered ? "shadow-lg" : "shadow",
            borderColor: isHovered
              ? "border-gray-300 animate-pulse"
              : "border-gray-500",
            textColor: "text-gray-800 dark:text-gray-100",
            bgColor: "bg-white dark:bg-gray-800",
            zIndex: 10,
          };
      }
    }, [type, isHovered]);

    return (
      <CustomOverlayMap
        position={{ lat: latitude, lng: longitude }}
        yAnchor={1.4} // 말풍선 꼬리가 마커 위치를 가리키도록 y축 오프셋 조정
        zIndex={styles.zIndex}
      >
        <div
          onClick={() => onClick(region)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`cursor-pointer transform transition-all duration-200 ease-out ${
            isHovered ? "scale-110 z-50" : "scale-100"
          } ${
            isVisible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{
            willChange: "transform, opacity",
            transform: isVisible
              ? isHovered
                ? "translateZ(0) scale(1.1)"
                : "translateZ(0)"
              : "translateZ(0) scale(0.75)",
            opacity: isVisible ? 1 : 0,
            transition: "all 200ms ease-out",
          }}
        >
          <div
            className={`relative ${styles.padding} ${styles.fontSize} ${styles.textColor} ${styles.shadow} ${styles.bgColor} backdrop-blur-sm rounded-lg border-2 ${styles.borderColor}`}
            style={{
              willChange: "transform",
              transform: "translateZ(0)",
            }}
          >
            {name}
            {/* 말풍선 꼬리 부분 */}
            <div
              className={`absolute left-1/2 -bottom-[9px] transform -translate-x-1/2 w-4 h-4 ${styles.bgColor} rotate-45 border-b-2 border-r-2 ${styles.borderColor} z-10`}
            ></div>
          </div>
        </div>
      </CustomOverlayMap>
    );
  }
);

RegionMarker.displayName = "RegionMarker";
