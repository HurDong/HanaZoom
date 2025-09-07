"use client";

import { useParams } from "next/navigation";
import { usePbRoomWebRTC } from "@/hooks/usePbRoomWebRTC";
import { useEffect, useRef } from "react";

export default function PbVideoConsultationRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  } = usePbRoomWebRTC({
    roomId,
    onError: (error) => {
      console.error("WebRTC 오류:", error);
      alert("화상상담 연결에 문제가 발생했습니다.");
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
  });

  useEffect(() => {
    if (roomId) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connectWebSocket, disconnect]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">화상상담방</h1>
          <p className="text-sm text-gray-400">방 ID: {roomId}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm">
              {isConnected ? "연결됨" : "연결 중..."}
            </span>
          </div>

          <div className="text-sm text-gray-400">상태: {connectionState}</div>
        </div>
      </div>

      {/* 비디오 영역 */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          {/* 원격 비디오 (큰 화면) */}
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-sm">고객</span>
            </div>
          </div>

          {/* 로컬 비디오 (작은 화면) */}
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-sm">나 (PB)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoEnabled
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {isVideoEnabled ? "📹" : "📹❌"}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioEnabled
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {isAudioEnabled ? "🎤" : "🎤❌"}
          </button>

          <button
            onClick={disconnect}
            className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
