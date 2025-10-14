"use client";

import { memo, useMemo, useState } from "react";
import { CustomOverlayMap } from "react-kakao-maps-sdk";
import { Region } from "@/app/map/page";
import {
  Building2,
  MapPin,
  Home,
  TrendingUp,
  Users,
  Zap,
  Star,
  Crown,
  Flame,
  Award
} from "lucide-react";

export interface RegionMarkerProps {
  region: Region;
  onClick: (region: Region) => void;
  isVisible?: boolean;
  isSelected?: boolean; // 선택된 상태 추가
}

export const RegionMarker = memo(
  ({ region, onClick, isVisible = true, isSelected = false }: RegionMarkerProps) => {
    const { name, latitude, longitude, type } = region;
    const [isHovered, setIsHovered] = useState(false);

    // 지역 타입별 아이콘 매핑
    const getRegionIcon = (regionType: string) => {
      switch (regionType) {
        case "CITY":
          return <Building2 className="w-4 h-4" />;
        case "DISTRICT":
          return <MapPin className="w-4 h-4" />;
        case "NEIGHBORHOOD":
          return <Home className="w-3 h-3" />;
        default:
          return <MapPin className="w-3 h-3" />;
      }
    };

    // 스타일을 메모이제이션하여 리렌더링 최적화
    const styles = useMemo(() => {
      const baseScale = isHovered ? "scale-110" : isSelected ? "scale-115" : "scale-100";
      const baseShadow = isSelected
        ? "shadow-2xl shadow-emerald-500/60"
        : isHovered
        ? "shadow-xl"
        : "shadow-lg";

      // 지역 타입별 색상 설정
      const colorSchemes = {
        CITY: {
          primary: isSelected ? "#059669" : "#10b981",
          border: isSelected ? "border-emerald-400 border-3" : isHovered ? "border-emerald-300 animate-pulse" : "border-emerald-500 border-2",
          bg: isSelected ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:via-emerald-800/50 dark:to-emerald-900/50" : "bg-white dark:bg-gray-800",
          text: isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-emerald-800 dark:text-emerald-100",
          icon: isSelected ? "text-emerald-600" : "text-emerald-500",
        },
        DISTRICT: {
          primary: isSelected ? "#047857" : "#059669",
          border: isSelected ? "border-green-400 border-3" : isHovered ? "border-green-300 animate-pulse" : "border-green-500 border-2",
          bg: isSelected ? "bg-gradient-to-br from-green-50 via-green-100 to-green-50 dark:from-green-900/50 dark:via-green-800/50 dark:to-green-900/50" : "bg-white dark:bg-gray-800",
          text: isSelected ? "text-green-900 dark:text-green-100" : "text-green-800 dark:text-green-100",
          icon: isSelected ? "text-green-600" : "text-green-500",
        },
        NEIGHBORHOOD: {
          primary: isSelected ? "#0d9488" : "#0d9488",
          border: isSelected ? "border-teal-400 border-3" : isHovered ? "border-teal-300 animate-pulse" : "border-teal-500 border-2",
          bg: isSelected ? "bg-gradient-to-br from-teal-50 via-teal-100 to-teal-50 dark:from-teal-900/50 dark:via-teal-800/50 dark:to-teal-900/50" : "bg-white dark:bg-gray-800",
          text: isSelected ? "text-teal-900 dark:text-teal-100" : "text-teal-800 dark:text-teal-100",
          icon: isSelected ? "text-teal-600" : "text-teal-500",
        }
      };

      const colors = colorSchemes[type] || colorSchemes.CITY;

      switch (type) {
        case "CITY":
          return {
            padding: isSelected ? "px-8 py-4" : "px-6 py-3",
            fontSize: isSelected ? "text-xl font-bold" : "text-lg font-bold",
            shadow: `${baseShadow} ${isSelected ? "ring-8 ring-emerald-300/40" : ""}`,
            borderColor: colors.border,
            bgColor: colors.bg,
            textColor: colors.text,
            zIndex: isSelected ? 50 : 30,
            iconColor: colors.icon,
            scale: baseScale,
            primaryColor: colors.primary,
          };
        case "DISTRICT":
          return {
            padding: isSelected ? "px-7 py-3.5" : "px-5 py-2.5",
            fontSize: isSelected ? "text-lg font-semibold" : "text-base font-semibold",
            shadow: `${baseShadow} ${isSelected ? "ring-6 ring-green-300/40" : ""}`,
            borderColor: colors.border,
            bgColor: colors.bg,
            textColor: colors.text,
            zIndex: isSelected ? 40 : 20,
            iconColor: colors.icon,
            scale: baseScale,
            primaryColor: colors.primary,
          };
        case "NEIGHBORHOOD":
          return {
            padding: isSelected ? "px-6 py-3" : "px-4 py-2",
            fontSize: isSelected ? "text-base font-medium" : "text-sm font-medium",
            shadow: `${baseShadow} ${isSelected ? "ring-4 ring-teal-300/40" : ""}`,
            borderColor: colors.border,
            bgColor: colors.bg,
            textColor: colors.text,
            zIndex: isSelected ? 35 : 10,
            iconColor: colors.icon,
            scale: baseScale,
            primaryColor: colors.primary,
          };
        default:
          return {
            padding: isSelected ? "px-6 py-3" : "px-4 py-2",
            fontSize: isSelected ? "text-base font-medium" : "text-sm font-medium",
            shadow: `${baseShadow} ${isSelected ? "ring-4 ring-gray-300/40" : ""}`,
            borderColor: isSelected
              ? "border-gray-400 border-3"
              : isHovered
              ? "border-gray-300 animate-pulse"
              : "border-gray-500 border-2",
            bgColor: isSelected
              ? "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50"
              : "bg-white dark:bg-gray-800",
            textColor: isSelected
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-800 dark:text-gray-100",
            zIndex: isSelected ? 35 : 10,
            iconColor: isSelected ? "text-gray-600" : "text-gray-500",
            scale: baseScale,
            primaryColor: "#6b7280",
          };
      }
    }, [type, isHovered, isSelected]);

    return (
      <CustomOverlayMap
        position={{ lat: latitude, lng: longitude }}
        yAnchor={1.5} // 말풍선 꼬리가 마커 위치를 가리키도록 y축 오프셋 조정 (크기 증가로 조정)
        zIndex={styles.zIndex}
      >
        <div
          onClick={() => onClick(region)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`cursor-pointer transform transition-all duration-300 ease-out ${styles.scale} ${
            isVisible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{
            willChange: "transform, opacity",
            transform: isVisible
              ? `translateZ(0) ${isHovered ? "scale(1.1)" : isSelected ? "scale(1.05)" : "scale(1)"}`
              : "translateZ(0) scale(0.75)",
            opacity: isVisible ? 1 : 0,
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            // 클릭 영역을 더 크게 만들기 위해 마커 자체를 크게 설정
            minWidth: isSelected ? "140px" : "120px",
            minHeight: isSelected ? "60px" : "50px",
          }}
        >
          {/* 마커 본체와 꼬다리 컨테이너 */}
          <div className="relative">
            {/* 마커 본체 */}
            <div
              className={`relative ${styles.padding} ${styles.fontSize} ${styles.textColor} ${styles.shadow} ${styles.bgColor} backdrop-blur-md rounded-lg border-2 ${styles.borderColor} overflow-hidden`}
              style={{
                willChange: "transform",
                transform: "translateZ(0)",
                minWidth: "max-content", // 내용에 따라 크기 조정
              }}
            >
              {/* 선택된 상태일 때 상단 강조 바 추가 */}
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(to right, ${styles.primaryColor}, ${styles.primaryColor}dd)`
                  }}
                ></div>
              )}

              {/* 마커 내용 영역 */}
              <div className="flex items-center gap-2">
                {/* 지역 타입별 아이콘 */}
                <div className={`${styles.iconColor} flex-shrink-0`}>
                  {getRegionIcon(type)}
                </div>

                {/* 지역명 */}
                <span className="whitespace-nowrap">{name}</span>

                {/* 선택된 상태일 때 추가 아이콘 */}
                {isSelected && (
                  <div
                    className="flex-shrink-0 animate-pulse"
                    style={{ color: styles.primaryColor }}
                  >
                    <TrendingUp className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* 선택된 상태 애니메이션 효과 */}
              {isSelected && (
                <div className="absolute inset-0 rounded-lg">
                  <div
                    className="absolute inset-0 rounded-lg animate-pulse"
                    style={{
                      background: `linear-gradient(to right, ${styles.primaryColor}30, ${styles.primaryColor}20)`
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-emerald-300/20 to-transparent rounded-lg animate-ping"></div>
                </div>
              )}

              {/* 호버 효과용 추가 그림자 */}
              {isHovered && !isSelected && (
                <div
                  className="absolute inset-0 rounded-lg animate-pulse"
                  style={{
                    backgroundColor: `${styles.primaryColor}20`,
                  }}
                ></div>
              )}
            </div>

            {/* 마커 꼬다리 부분 */}
            <div
              className="absolute left-1/2 -bottom-[10px] transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: `12px solid ${styles.primaryColor}`,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))",
              }}
            ></div>

            {/* 마커 꼬다리 테두리 */}
            <div
              className="absolute left-1/2 -bottom-[10px] transform -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "11px solid transparent",
                borderRight: "11px solid transparent",
                borderTop: `13px solid ${styles.borderColor.split(' ')[1] || styles.primaryColor}`,
                marginLeft: "-1px",
              }}
            ></div>
          </div>
        </div>
      </CustomOverlayMap>
    );
  }
);

RegionMarker.displayName = "RegionMarker";
