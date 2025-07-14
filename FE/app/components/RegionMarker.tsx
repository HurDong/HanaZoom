"use client";

import { CustomOverlayMap, MapMarker } from "react-kakao-maps-sdk";
import { Region } from "@/data/mock-regions";
import { motion } from "framer-motion";

interface RegionMarkerProps {
  region: Region;
  onClick: (region: Region) => void;
}

export const RegionMarker = ({ region, onClick }: RegionMarkerProps) => {
  const isCity = region.type === "CITY";
  const isDistrict = region.type === "DISTRICT";

  const size = isCity ? 64 : isDistrict ? 48 : 32;
  const fontSize = isCity ? "text-sm" : isDistrict ? "text-xs" : "text-[10px]";
  const zIndex = isCity ? 30 : isDistrict ? 20 : 10;

  return (
    <CustomOverlayMap
      position={{ lat: region.latitude, lng: region.longitude }}
      yAnchor={1}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex flex-col items-center cursor-pointer"
        onClick={() => onClick(region)}
        style={{ zIndex }}
      >
        <div
          className={`flex items-center justify-center rounded-full border-2 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:shadow-lg dark:bg-gray-900/80 ${
            isCity
              ? "w-16 h-16 border-emerald-500 shadow-emerald-500/30"
              : isDistrict
              ? "w-12 h-12 border-green-500 shadow-green-500/30"
              : "w-8 h-8 border-teal-500 shadow-teal-500/20"
          }`}
        >
          <span
            className={`font-bold text-gray-800 dark:text-gray-200 ${fontSize}`}
          >
            {region.name}
          </span>
        </div>
        <div
          className={`absolute bottom-[-4px] w-2 h-2 transform rotate-45 bg-white dark:bg-gray-900 border-b-2 border-r-2 ${
            isCity
              ? "border-emerald-500"
              : isDistrict
              ? "border-green-500"
              : "border-teal-500"
          }`}
        ></div>
      </motion.div>
    </CustomOverlayMap>
  );
};
