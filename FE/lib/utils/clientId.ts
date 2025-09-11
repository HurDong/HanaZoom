/**
 * 클라이언트 ID 생성 및 관리 유틸리티
 */

/**
 * 고유한 클라이언트 ID를 생성합니다.
 * 브라우저 세션 기반으로 생성되며, 새로고침 시에도 유지됩니다.
 */
export function generateClientId(): string {
  // 서버 사이드에서는 임시 ID 반환
  if (typeof window === "undefined") {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 세션 스토리지에서 기존 클라이언트 ID 확인
  const existingClientId = sessionStorage.getItem("hanazoom_client_id");
  if (existingClientId) {
    return existingClientId;
  }

  // 새로운 클라이언트 ID 생성
  const clientId = `client_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // 세션 스토리지에 저장
  sessionStorage.setItem("hanazoom_client_id", clientId);

  return clientId;
}

/**
 * UUID v4를 생성합니다.
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 입력 문자열을 기반으로 일관된 UUID를 생성합니다.
 * 같은 입력에 대해 항상 같은 UUID를 반환합니다.
 */
export function generateConsistentUUID(input: string): string {
  // 입력 문자열을 해시하여 일관된 UUID 생성
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit 정수로 변환
  }

  // 해시를 기반으로 UUID 형식 생성
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const uuid = `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(
    1,
    4
  )}-8${hex.substring(2, 5)}-${hex.substring(0, 12)}`;

  return uuid;
}

/**
 * 방 기반 공유 클라이언트 ID를 생성합니다.
 * 같은 방에 접속하는 사용자들이 동일한 클라이언트 ID를 사용합니다.
 * SockJS 경로 형식에 맞게 짧은 ID를 생성합니다.
 */
export function generateSharedClientId(
  roomId: string,
  userType: "pb" | "client" = "client"
): string {
  // 서버 사이드에서는 임시 ID 반환
  if (typeof window === "undefined") {
    const shortRoomId = roomId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
    const timestamp = Date.now().toString(36).substring(-4);
    const userPrefix = userType === "pb" ? "p" : "c";
    return `${userPrefix}${shortRoomId}${timestamp}`;
  }

  const key = `hanazoom_shared_client_${roomId}`;
  const existingClientId = sessionStorage.getItem(key);

  // 기존 ID가 너무 길면 무시하고 새로 생성 (SockJS 경로 문제 해결)
  if (existingClientId && existingClientId.length <= 12) {
    return existingClientId;
  }

  // SockJS 경로 형식에 맞게 매우 짧은 클라이언트 ID 생성
  // roomId에서 특수문자 제거하고 4자리로 제한
  const shortRoomId = roomId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
  const timestamp = Date.now().toString(36).substring(-4); // 마지막 4자리
  const userPrefix = userType === "pb" ? "p" : "c";

  const sharedClientId = `${userPrefix}${shortRoomId}${timestamp}`;

  // 세션 스토리지에 저장
  sessionStorage.setItem(key, sharedClientId);

  return sharedClientId;
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
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("hanazoom_client_id");
  }
  return generateClientId();
}

/**
 * 클라이언트 ID가 유효한지 확인합니다.
 */
export function isValidClientId(clientId: string): boolean {
  return clientId && clientId.startsWith("client_") && clientId.length > 20;
}

/**
 * 모든 공유 클라이언트 ID를 초기화합니다.
 * SockJS 경로 문제 해결을 위해 사용합니다.
 */
export function clearAllSharedClientIds(): void {
  if (typeof window === "undefined") return;

  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith("hanazoom_shared_client_")) {
      sessionStorage.removeItem(key);
    }
  });
}
