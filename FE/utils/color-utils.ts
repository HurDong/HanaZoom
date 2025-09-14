import {
  getStockBrandColor,
  getSectorBrandColor,
  defaultStockColor,
} from "@/data/stock-brand-colors";

/**
 * 주식 종목 코드로 브랜드 색상 정보를 가져오는 함수
 */
export function getBrandColorByStock(stockCode: string, stockName?: string) {
  const brandColor = getStockBrandColor(stockCode);

  // 로그를 통해 색상 적용 확인
  console.log(`🎨 주식 브랜드 색상 적용:`, {
    stockCode,
    stockName,
    primary: brandColor.primary,
    secondary: brandColor.secondary,
    brandName: brandColor.name,
  });

  return brandColor;
}

/**
 * 업종으로 브랜드 색상 정보를 가져오는 함수
 */
export function getBrandColorBySector(sector: string) {
  const brandColor = getSectorBrandColor(sector);

  console.log(`🎨 업종 브랜드 색상 적용:`, {
    sector,
    primary: brandColor.primary,
    secondary: brandColor.secondary,
    brandName: brandColor.name,
  });

  return brandColor;
}

/**
 * CSS 스타일 객체 생성 함수
 */
export function createBrandStyle(brandColor: any) {
  return {
    background: brandColor.gradient,
    color: "#FFFFFF",
    borderColor: brandColor.primary,
  };
}

/**
 * Tailwind CSS 클래스 생성 함수
 */
export function createBrandClasses(
  brandColor: any,
  additionalClasses: string = ""
) {
  return `text-white shadow-lg ${additionalClasses}`;
}

/**
 * 인라인 스타일로 브랜드 색상 적용
 */
export function applyBrandStyle(brandColor: any, element: HTMLElement) {
  element.style.background = brandColor.gradient;
  element.style.color = "#FFFFFF";
}

/**
 * 동적 색상 테마 생성
 */
export function createColorTheme(brandColor: any) {
  return {
    primary: brandColor.primary,
    secondary: brandColor.secondary,
    gradient: brandColor.gradient,
    text: "#FFFFFF",
    textSecondary: "#E5E7EB",
    border: brandColor.primary,
    hover: `${brandColor.primary}CC`, // 80% 투명도
    active: `${brandColor.secondary}DD`, // 87% 투명도
  };
}

/**
 * 색상 대비 확인 (접근성)
 */
export function getContrastRatio(color1: string, color2: string): number {
  // 간단한 대비 계산 (실제로는 더 복잡한 계산이 필요)
  const hex1 = color1.replace("#", "");
  const hex2 = color2.replace("#", "");

  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);

  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);

  const luminance1 = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
  const luminance2 = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;

  const brightest = Math.max(luminance1, luminance2);
  const darkest = Math.min(luminance1, luminance2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * 접근성을 고려한 텍스트 색상 결정
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const contrastWithWhite = getContrastRatio(backgroundColor, "#FFFFFF");
  const contrastWithBlack = getContrastRatio(backgroundColor, "#000000");

  return contrastWithWhite > contrastWithBlack ? "#FFFFFF" : "#000000";
}
