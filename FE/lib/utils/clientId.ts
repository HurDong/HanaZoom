/**
 * 클라이언트 ID 생성 및 관리 유틸리티
 */

/**
 * 고유한 클라이언트 ID를 생성합니다.
 * 브라우저 세션 기반으로 생성되며, 새로고침 시에도 유지됩니다.
 */
export function generateClientId(): string {
  // 세션 스토리지에서 기존 클라이언트 ID 확인
  const existingClientId = sessionStorage.getItem('hanazoom_client_id');
  if (existingClientId) {
    return existingClientId;
  }

  // 새로운 클라이언트 ID 생성
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 세션 스토리지에 저장
  sessionStorage.setItem('hanazoom_client_id', clientId);
  
  return clientId;
}

/**
 * 현재 클라이언트 ID를 가져옵니다.
 * 없으면 새로 생성합니다.
 */
export function getCurrentClientId(): string {
  return generateClientId();
}

/**
 * 클라이언트 ID를 초기화합니다.
 * 새로운 클라이언트 ID가 생성됩니다.
 */
export function resetClientId(): string {
  sessionStorage.removeItem('hanazoom_client_id');
  return generateClientId();
}

/**
 * 클라이언트 ID가 유효한지 확인합니다.
 */
export function isValidClientId(clientId: string): boolean {
  return clientId && clientId.startsWith('client_') && clientId.length > 20;
}
