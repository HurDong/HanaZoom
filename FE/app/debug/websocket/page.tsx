"use client";

import NavBar from "@/app/components/Navbar";
import { WebSocketDebug } from "@/components/WebSocketDebug";

export default function WebSocketDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              웹소켓 연결 디버그
            </h1>
            <p className="text-gray-600">
              실시간 주식 데이터 웹소켓 연결 상태를 확인하고 테스트할 수 있습니다.
            </p>
          </div>
          
          <WebSocketDebug />
        </div>
      </div>
    </div>
  );
}
