"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeviceInfo = {
  devices: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
};

export default function WebRTCTestPage() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");
  const [audioInputId, setAudioInputId] = useState<string>("");
  const [audioOutputId, setAudioOutputId] = useState<string>("");
  const [status, setStatus] = useState<string>("대기 중");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoopback, setIsLoopback] = useState(false);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const info: DeviceInfo = {
        devices,
        videoInputs: devices.filter((d) => d.kind === "videoinput"),
        audioInputs: devices.filter((d) => d.kind === "audioinput"),
        audioOutputs: devices.filter((d) => d.kind === "audiooutput"),
      };
      setDeviceInfo(info);
      if (!videoDeviceId && info.videoInputs[0]) setVideoDeviceId(info.videoInputs[0].deviceId);
      if (!audioInputId && info.audioInputs[0]) setAudioInputId(info.audioInputs[0].deviceId);
      if (!audioOutputId && info.audioOutputs[0]) setAudioOutputId(info.audioOutputs[0].deviceId);
    } catch (e) {
      console.error("장치 조회 실패", e);
    }
  };

  const startPreview = async () => {
    try {
      setError(null);
      setStatus("카메라/마이크 접근 중...");
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
        audio: audioInputId ? { deviceId: { exact: audioInputId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsStreaming(true);
      setStatus("미리보기 시작됨");
    } catch (e: any) {
      console.error("미리보기 실패", e);
      let msg = "카메라/마이크 접근 실패";
      if (e?.name === "NotAllowedError") msg = "권한이 거부되었습니다. 브라우저 권한을 허용해주세요.";
      if (e?.name === "NotFoundError") msg = "장치를 찾을 수 없습니다. OBS 가상 카메라가 켜져 있는지 확인해주세요.";
      if (e?.name === "NotReadableError") msg = "장치에 접근할 수 없습니다. 다른 앱이 사용 중일 수 있습니다.";
      setError(msg);
      setStatus("실패");
    }
  };

  const stopPreview = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setIsStreaming(false);
    setStatus("미리보기 중지");
  };

  const startLoopback = async () => {
    try {
      setError(null);
      setStatus("루프백 연결 준비 중...");
      if (!localStreamRef.current) await startPreview();
      if (!localStreamRef.current) throw new Error("로컬 스트림이 없습니다");

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      // 로컬 트랙 추가
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };

      // 루프백을 위해 동일 객체에 시그널링
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const pc2 = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc2.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      localStreamRef.current.getTracks().forEach((t) => pc2.addTrack(t, localStreamRef.current!));

      pc.onicecandidate = (ev) => {
        if (ev.candidate) pc2.addIceCandidate(ev.candidate);
      };
      pc2.onicecandidate = (ev) => {
        if (ev.candidate) pc.addIceCandidate(ev.candidate);
      };

      await pc2.setRemoteDescription(offer);
      const answer = await pc2.createAnswer();
      await pc2.setLocalDescription(answer);
      await pc.setRemoteDescription(answer);

      setIsLoopback(true);
      setStatus("루프백 연결됨");
    } catch (e: any) {
      console.error("루프백 실패", e);
      setError(e?.message || "루프백 실패");
      setStatus("실패");
    }
  };

  const stopLoopback = () => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => {
        try { s.track?.stop(); } catch {}
      });
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsLoopback(false);
    setStatus("루프백 중지");
  };

  // 출력 장치 변경 (지원 브라우저 한정)
  useEffect(() => {
    (async () => {
      if (audioOutputId && localVideoRef.current && "setSinkId" in (localVideoRef.current as any)) {
        try { await (localVideoRef.current as any).setSinkId(audioOutputId); } catch {}
      }
    })();
  }, [audioOutputId]);

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">WebRTC 테스트 (장치/미리보기/루프백)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 상태 */}
            <div className="flex items-center gap-3">
              <span className="text-sm px-3 py-1 rounded-full bg-gray-100 border">
                상태: {status}
              </span>
              {error && (
                <span className="text-sm px-3 py-1 rounded bg-red-100 border border-red-300 text-red-700">
                  오류: {error}
                </span>
              )}
            </div>

            {/* 장치 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm mb-1">카메라</div>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={videoDeviceId}
                  onChange={(e) => setVideoDeviceId(e.target.value)}
                >
                  {deviceInfo?.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || "카메라"}</option>
                  ))}
                </select>
                {deviceInfo && deviceInfo.videoInputs.length === 0 && (
                  <div className="text-xs text-red-600 mt-1">카메라 장치를 찾을 수 없습니다 (OBS 가상 카메라 켜보기)</div>
                )}
              </div>
              <div>
                <div className="text-sm mb-1">마이크</div>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={audioInputId}
                  onChange={(e) => setAudioInputId(e.target.value)}
                >
                  {deviceInfo?.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || "마이크"}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-sm mb-1">스피커 (지원 브라우저)</div>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={audioOutputId}
                  onChange={(e) => setAudioOutputId(e.target.value)}
                >
                  {deviceInfo?.audioOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || "스피커"}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 미리보기 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm mb-2">로컬 미리보기</div>
                <div className="bg-black rounded overflow-hidden aspect-video">
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 mt-3">
                  {!isStreaming ? (
                    <Button onClick={startPreview} className="bg-green-600 hover:bg-green-700">카메라 시작</Button>
                  ) : (
                    <Button variant="destructive" onClick={stopPreview}>카메라 중지</Button>
                  )}
                  <Button variant="outline" onClick={loadDevices}>장치 새로고침</Button>
                </div>
              </div>
              <div>
                <div className="text-sm mb-2">루프백 원격 영상</div>
                <div className="bg-black rounded overflow-hidden aspect-video">
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2 mt-3">
                  {!isLoopback ? (
                    <Button onClick={startLoopback} className="bg-blue-600 hover:bg-blue-700">루프백 시작</Button>
                  ) : (
                    <Button variant="destructive" onClick={stopLoopback}>루프백 중지</Button>
                  )}
                </div>
              </div>
            </div>

            {/* 장치 목록 */}
            <div>
              <div className="text-sm font-semibold mb-2">감지된 장치</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded border p-3">
                  <div className="text-xs font-medium mb-1">카메라</div>
                  <ul className="text-xs space-y-1">
                    {deviceInfo?.videoInputs.map((d) => (
                      <li key={d.deviceId}>📹 {d.label || "카메라"}</li>
                    ))}
                    {deviceInfo && deviceInfo.videoInputs.length === 0 && <li className="text-gray-500">없음</li>}
                  </ul>
                </div>
                <div className="bg-white rounded border p-3">
                  <div className="text-xs font-medium mb-1">마이크</div>
                  <ul className="text-xs space-y-1">
                    {deviceInfo?.audioInputs.map((d) => (
                      <li key={d.deviceId}>🎤 {d.label || "마이크"}</li>
                    ))}
                    {deviceInfo && deviceInfo.audioInputs.length === 0 && <li className="text-gray-500">없음</li>}
                  </ul>
                </div>
                <div className="bg-white rounded border p-3">
                  <div className="text-xs font-medium mb-1">스피커</div>
                  <ul className="text-xs space-y-1">
                    {deviceInfo?.audioOutputs.map((d) => (
                      <li key={d.deviceId}>🔊 {d.label || "스피커"}</li>
                    ))}
                    {deviceInfo && deviceInfo.audioOutputs.length === 0 && <li className="text-gray-500">없음</li>}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


