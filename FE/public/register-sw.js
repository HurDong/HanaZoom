// Service Worker 등록 스크립트
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      console.log("SW 등록 성공:", registration);

      // 업데이트 확인
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // 새 버전이 설치되었을 때 사용자에게 알림
            if (
              confirm("새로운 버전이 사용 가능합니다. 업데이트하시겠습니까?")
            ) {
              newWorker.postMessage({ action: "skipWaiting" });
              window.location.reload();
            }
          }
        });
      });

      // 활성화된 서비스 워커가 있으면 메시지 리스너 추가
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "CACHE_UPDATED") {
          console.log("캐시가 업데이트되었습니다:", event.data.payload);
        }
      });
    } catch (error) {
      console.error("SW 등록 실패:", error);
    }
  });

  // 오프라인/온라인 상태 감지
  window.addEventListener("online", () => {
    console.log("온라인 상태로 전환");
    // 온라인 상태 알림 등을 여기에 추가할 수 있습니다
  });

  window.addEventListener("offline", () => {
    console.log("오프라인 상태로 전환");
    // 오프라인 상태 알림 등을 여기에 추가할 수 있습니다
  });
} else {
  console.log("이 브라우저는 Service Worker를 지원하지 않습니다.");
}
