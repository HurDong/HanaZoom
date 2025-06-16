declare module "react-kakao-maps" {
  import { ComponentType, ReactNode } from "react";

  interface MapProps {
    center: {
      lat: number;
      lng: number;
    };
    level?: number;
    style?: React.CSSProperties;
    onZoomChanged?: (map: any) => void;
    children?: ReactNode;
  }

  interface MapMarkerProps {
    position: {
      lat: number;
      lng: number;
    };
    onClick?: () => void;
    children?: ReactNode;
  }

  interface PolygonProps {
    path: Array<{
      lat: number;
      lng: number;
    }>;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    fillColor?: string;
    fillOpacity?: number;
  }

  export const Map: ComponentType<MapProps>;
  export const MapMarker: ComponentType<MapMarkerProps>;
  export const Polygon: ComponentType<PolygonProps>;
}
