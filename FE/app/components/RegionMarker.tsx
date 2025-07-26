"use client";

import { CustomOverlayMap } from "react-kakao-maps-sdk";
import { motion } from "framer-motion";
import { Region } from "@/app/map/page";

export interface RegionMarkerProps {
  region: Region;
  onClick: (region: Region) => void;
}

export const RegionMarker = ({ region, onClick }: RegionMarkerProps) => {
  const { name, latitude, longitude, type } = region;

  // 줌 레벨(타입)에 따라 스타일을 동적으로 결정하는 함수
  const getMarkerStyles = () => {
    switch (type) {
      case "CITY":
        return {
          padding: "px-4 py-2",
          fontSize: "text-base font-bold",
          shadow: "shadow-lg",
          borderColor: "border-emerald-500",
          textColor: "text-emerald-800 dark:text-emerald-100",
          zIndex: 30,
        };
      case "DISTRICT":
        return {
          padding: "px-3 py-1.5",
          fontSize: "text-sm font-semibold",
          shadow: "shadow-md",
          borderColor: "border-green-500",
          textColor: "text-green-800 dark:text-green-100",
          zIndex: 20,
        };
      case "NEIGHBORHOOD":
        return {
          padding: "px-2 py-1",
          fontSize: "text-xs font-medium",
          shadow: "shadow",
          borderColor: "border-teal-500",
          textColor: "text-teal-800 dark:text-teal-100",
          zIndex: 10,
        };
      default: // 혹시 모를 예외 상황 대비
        return {
          padding: "px-2 py-1",
          fontSize: "text-xs font-medium",
          shadow: "shadow",
          borderColor: "border-gray-500",
          textColor: "text-gray-800 dark:text-gray-100",
          zIndex: 10,
        };
    }
  };

  const styles = getMarkerStyles();

  return (
    <CustomOverlayMap
      position={{ lat: latitude, lng: longitude }}
      yAnchor={1.4} // 말풍선 꼬리가 마커 위치를 가리키도록 y축 오프셋 조정
      zIndex={styles.zIndex}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1, zIndex: 100 }}
        transition={{
          duration: 0.2,
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        onClick={() => onClick(region)}
        className="cursor-pointer"
      >
        <div
          className={`relative ${styles.padding} ${styles.fontSize} ${styles.textColor} ${styles.shadow} bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border-2 ${styles.borderColor}`}
        >
          {name}
          {/* 말풍선 꼬리 부분 */}
          <div
            className={`absolute left-1/2 -bottom-[9px] transform -translate-x-1/2 w-4 h-4 bg-white/90 dark:bg-gray-800/90 rotate-45 border-b-2 border-r-2 ${styles.borderColor}`}
          ></div>
        </div>
      </motion.div>
    </CustomOverlayMap>
  );
};
