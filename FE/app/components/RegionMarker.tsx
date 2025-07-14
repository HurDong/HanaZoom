"use client";

import { MapMarker } from "react-kakao-maps-sdk";
import { motion } from "framer-motion";
import { Region } from "@/app/map/page"; // 수정: 타입을 map 페이지에서 직접 가져옵니다.

export interface RegionMarkerProps {
  region: Region;
  onClick: (region: Region) => void;
}

export const RegionMarker = ({ region, onClick }: RegionMarkerProps) => {
  const { name, latitude, longitude, type } = region;

  const getMarkerStyle = () => {
    switch (type) {
      case "CITY":
        return {
          width: "100px",
          height: "36px",
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          color: "#166534", // green-800
          border: "2px solid #166534",
        };
      case "DISTRICT":
        return {
          width: "80px",
          height: "32px",
          fontSize: "14px",
          fontWeight: "600",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          color: "#15803d", // green-700
          border: "1.5px solid #15803d",
        };
      case "NEIGHBORHOOD":
        return {
          width: "70px",
          height: "28px",
          fontSize: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          color: "#16a34a", // green-600
          border: "1px solid #16a34a",
        };
      default:
        return {};
    }
  };

  const style = getMarkerStyle();

  return (
    <MapMarker
      position={{ lat: latitude, lng: longitude }}
      clickable={true}
      onClick={() => onClick(region)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1, zIndex: 100 }}
        className="flex items-center justify-center rounded-lg shadow-md cursor-pointer backdrop-blur-sm"
        style={style}
      >
        {name}
      </motion.div>
    </MapMarker>
  );
};
