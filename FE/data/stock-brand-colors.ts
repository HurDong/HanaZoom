// 주식 종목별 브랜드 색상 매핑 데이터베이스
export interface StockBrandColor {
  primary: string;
  secondary: string;
  gradient: string;
  name: string;
}

export const stockBrandColors: { [key: string]: StockBrandColor } = {
  // 하나은행 (Hana Bank)
  "086790": {
    primary: "#00B04F",
    secondary: "#009639",
    gradient: "linear-gradient(135deg, #00B04F 0%, #009639 100%)",
    name: "하나은행",
  },

  // 삼성전자
  "005930": {
    primary: "#1428A0",
    secondary: "#1E40AF",
    gradient: "linear-gradient(135deg, #1428A0 0%, #1E40AF 100%)",
    name: "삼성전자",
  },

  // LG에너지솔루션
  "373220": {
    primary: "#A50034",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #A50034 0%, #DC2626 100%)",
    name: "LG에너지솔루션",
  },

  // SK하이닉스
  "000660": {
    primary: "#FF6900",
    secondary: "#EA580C",
    gradient: "linear-gradient(135deg, #FF6900 0%, #EA580C 100%)",
    name: "SK하이닉스",
  },

  // 네이버
  "035420": {
    primary: "#03C75A",
    secondary: "#059669",
    gradient: "linear-gradient(135deg, #03C75A 0%, #059669 100%)",
    name: "네이버",
  },

  // 카카오
  "035720": {
    primary: "#FEE500",
    secondary: "#F59E0B",
    gradient: "linear-gradient(135deg, #FEE500 0%, #F59E0B 100%)",
    name: "카카오",
  },

  // 현대자동차
  "005380": {
    primary: "#002C5F",
    secondary: "#1E40AF",
    gradient: "linear-gradient(135deg, #002C5F 0%, #1E40AF 100%)",
    name: "현대자동차",
  },

  // 기아
  "000270": {
    primary: "#05141F",
    secondary: "#1F2937",
    gradient: "linear-gradient(135deg, #05141F 0%, #1F2937 100%)",
    name: "기아",
  },

  // POSCO홀딩스
  "005490": {
    primary: "#DC2626",
    secondary: "#B91C1C",
    gradient: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
    name: "POSCO홀딩스",
  },

  // LG화학
  "051910": {
    primary: "#7C3AED",
    secondary: "#6D28D9",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
    name: "LG화학",
  },

  // 셀트리온
  "068270": {
    primary: "#059669",
    secondary: "#047857",
    gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    name: "셀트리온",
  },

  // NAVER
  "035420": {
    primary: "#03C75A",
    secondary: "#059669",
    gradient: "linear-gradient(135deg, #03C75A 0%, #059669 100%)",
    name: "네이버",
  },

  // 삼성바이오로직스
  "207940": {
    primary: "#7C3AED",
    secondary: "#6D28D9",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
    name: "삼성바이오로직스",
  },

  // 기아
  "000270": {
    primary: "#05141F",
    secondary: "#1F2937",
    gradient: "linear-gradient(135deg, #05141F 0%, #1F2937 100%)",
    name: "기아",
  },

  // SK텔레콤
  "017670": {
    primary: "#EA580C",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    name: "SK텔레콤",
  },

  // LG전자
  "066570": {
    primary: "#A50034",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #A50034 0%, #DC2626 100%)",
    name: "LG전자",
  },

  // 삼성물산
  "028260": {
    primary: "#1428A0",
    secondary: "#1E40AF",
    gradient: "linear-gradient(135deg, #1428A0 0%, #1E40AF 100%)",
    name: "삼성물산",
  },

  // SK이노베이션
  "096770": {
    primary: "#EA580C",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    name: "SK이노베이션",
  },

  // 한미반도체
  "042700": {
    primary: "#7C3AED",
    secondary: "#6D28D9",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
    name: "한미반도체",
  },

  // CJ ENM
  "035760": {
    primary: "#EC4899",
    secondary: "#DB2777",
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    name: "CJ ENM",
  },

  // 카카오뱅크
  "323410": {
    primary: "#FEE500",
    secondary: "#F59E0B",
    gradient: "linear-gradient(135deg, #FEE500 0%, #F59E0B 100%)",
    name: "카카오뱅크",
  },

  // 토스
  "251270": {
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    name: "토스",
  },
};

// 기본 색상 (하나은행 브랜드 색상)
export const defaultStockColor: StockBrandColor = {
  primary: "#00B04F",
  secondary: "#009639",
  gradient: "linear-gradient(135deg, #00B04F 0%, #009639 100%)",
  name: "기본",
};

// 주식 코드로 브랜드 색상 가져오기
export function getStockBrandColor(stockCode: string): StockBrandColor {
  return stockBrandColors[stockCode] || defaultStockColor;
}

// 업종별 기본 색상 매핑
export const sectorDefaultColors: { [key: string]: StockBrandColor } = {
  "IT/전자": {
    primary: "#1428A0",
    secondary: "#1E40AF",
    gradient: "linear-gradient(135deg, #1428A0 0%, #1E40AF 100%)",
    name: "IT/전자",
  },
  금융: {
    primary: "#00B04F",
    secondary: "#009639",
    gradient: "linear-gradient(135deg, #00B04F 0%, #009639 100%)",
    name: "금융",
  },
  자동차: {
    primary: "#002C5F",
    secondary: "#1E40AF",
    gradient: "linear-gradient(135deg, #002C5F 0%, #1E40AF 100%)",
    name: "자동차",
  },
  화학: {
    primary: "#7C3AED",
    secondary: "#6D28D9",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
    name: "화학",
  },
  바이오: {
    primary: "#059669",
    secondary: "#047857",
    gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    name: "바이오",
  },
  에너지: {
    primary: "#EA580C",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    name: "에너지",
  },
  통신: {
    primary: "#EA580C",
    secondary: "#DC2626",
    gradient: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    name: "통신",
  },
  미디어: {
    primary: "#EC4899",
    secondary: "#DB2777",
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    name: "미디어",
  },
};

// 업종으로 브랜드 색상 가져오기
export function getSectorBrandColor(sector: string): StockBrandColor {
  return sectorDefaultColors[sector] || defaultStockColor;
}
