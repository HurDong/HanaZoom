"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps";

interface DistrictData {
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  topStocks: {
    name: string;
    price: string;
    change: string;
  }[];
}

interface KakaoMapProps {
  districtData: { [key: string]: DistrictData };
  mapLevel: number;
  setMapLevel: (level: number) => void;
  selectedDistrict: string | null;
  setSelectedDistrict: (district: string | null) => void;
}

export default function KakaoMap({
  districtData,
  mapLevel,
  setMapLevel,
  selectedDistrict,
  setSelectedDistrict,
}: KakaoMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setIsLoaded(true);
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">지도 로딩 중...</p>
      </div>
    );
  }

  return (
    <Map
      center={{ lat: 37.5665, lng: 126.978 }}
      level={mapLevel}
      style={{ width: "100%", height: "500px" }}
      onZoomChanged={(map) => setMapLevel(map.getLevel())}
    >
      {Object.entries(districtData).map(([key, data]) => (
        <MapMarker
          key={key}
          position={data.center}
          onClick={() => setSelectedDistrict(key)}
        >
          {selectedDistrict === key && (
            <div className="p-2 bg-white rounded-lg shadow-lg">
              <h3 className="font-bold text-green-900">{data.name}</h3>
              {data.topStocks.map((stock, index) => (
                <div key={index} className="text-sm">
                  {stock.name}: {stock.price} ({stock.change})
                </div>
              ))}
            </div>
          )}
        </MapMarker>
      ))}
    </Map>
  );
}
