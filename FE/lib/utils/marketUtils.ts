/**
 * 장시간 관련 유틸리티 함수들
 */

export interface MarketStatus {
  isMarketOpen: boolean;
  isAfterMarketClose: boolean;
  marketStatus: string;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
}

/**
 * 현재 시간이 장시간인지 확인
 * 한국 주식시장: 평일 09:00 ~ 15:30
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  
  // 주말 체크
  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // 일요일(0) 또는 토요일(6)
    return false;
  }
  
  // 시간 체크 (09:00 ~ 15:30)
  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60; // 09:00
  const marketCloseMinutes = 15 * 60 + 30; // 15:30
  
  return currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes;
}

/**
 * 장종료 후인지 확인
 */
export function isAfterMarketClose(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  
  // 주말 체크
  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  
  // 시간 체크 (15:30 이후)
  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketCloseMinutes = 15 * 60 + 30; // 15:30
  
  return currentMinutes >= marketCloseMinutes;
}

/**
 * 장 시작 전인지 확인
 */
export function isBeforeMarketOpen(): boolean {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
  
  // 주말 체크
  const dayOfWeek = koreaTime.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  
  // 시간 체크 (09:00 이전)
  const hours = koreaTime.getHours();
  const minutes = koreaTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  const marketOpenMinutes = 9 * 60; // 09:00
  
  return currentMinutes < marketOpenMinutes;
}

/**
 * 시장 상태 정보 반환
 */
export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  const isOpen = isMarketOpen();
  const isAfterClose = isAfterMarketClose();
  const isBeforeOpen = isBeforeMarketOpen();
  
  let marketStatus = '';
  let nextOpenTime: Date | undefined;
  let nextCloseTime: Date | undefined;
  
  if (isOpen) {
    marketStatus = '장중';
    // 다음 장 종료 시간 계산
    const todayClose = new Date(koreaTime);
    todayClose.setHours(15, 30, 0, 0);
    nextCloseTime = todayClose;
  } else if (isAfterClose) {
    marketStatus = '장종료';
    // 다음 장 시작 시간 계산
    const tomorrow = new Date(koreaTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // 주말인 경우 다음 월요일로
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    
    nextOpenTime = tomorrow;
  } else if (isBeforeOpen) {
    marketStatus = '장시작전';
    // 오늘 장 시작 시간 계산
    const todayOpen = new Date(koreaTime);
    todayOpen.setHours(9, 0, 0, 0);
    nextOpenTime = todayOpen;
  }
  
  return {
    isMarketOpen: isOpen,
    isAfterMarketClose: isAfterClose,
    marketStatus,
    nextOpenTime,
    nextCloseTime,
  };
}

/**
 * 다음 장 시작까지 남은 시간 (분 단위)
 */
export function getMinutesToNextMarketOpen(): number {
  const status = getMarketStatus();
  if (status.nextOpenTime) {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const diffMs = status.nextOpenTime.getTime() - koreaTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }
  return 0;
}

/**
 * 장 종료까지 남은 시간 (분 단위)
 */
export function getMinutesToMarketClose(): number {
  const status = getMarketStatus();
  if (status.nextCloseTime) {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const diffMs = status.nextCloseTime.getTime() - koreaTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }
  return 0;
}

/**
 * KRX 호가단위(틱) 계산 (보통주 기준)
 * 참고 규칙(일반):
 * < 1,000: 1원
 * 1,000 ~ 4,990: 5원
 * 5,000 ~ 9,990: 10원
 * 10,000 ~ 49,950: 50원
 * 50,000 ~ 99,900: 100원
 * 100,000 ~ 499,500: 500원
 * 500,000 ~ 999,000: 1,000원
 * 1,000,000 이상: 2,000원
 */
export function getTickSizeKRX(price: number): number {
  if (!isFinite(price) || price <= 0) return 1;
  if (price < 1000) return 1;
  if (price < 5000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  if (price < 1000000) return 1000;
  return 2000;
}

/**
 * 가격을 호가단위에 맞춰 증감
 */
export function stepByTick(price: number, steps: number): number {
  const tick = getTickSizeKRX(price);
  const next = price + steps * tick;
  const aligned = Math.max(Math.round(next / tick) * tick, 0);
  return aligned;
}