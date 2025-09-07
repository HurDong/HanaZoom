import { useState, useRef, useCallback, useEffect } from "react";
import { Client } from "@stomp/stompjs";

interface UsePbRoomWebRTCProps {
  roomId: string;
  accessToken: string | null;
  userType?: string; // 사용자 타입 추가
  onError?: (error: Error) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export const usePbRoomWebRTC = ({
  roomId,
  accessToken,
  userType = "pb", // 기본값 설정
  onError,
  onRemoteStream,
}: UsePbRoomWebRTCProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("disconnected");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC 설정
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // WebSocket 연결
  const connectWebSocket = useCallback(async () => {
    // 이미 연결된 경우 중복 연결 방지
    if (stompClientRef.current?.connected) {
      console.log("⚠️ 이미 WebSocket에 연결되어 있습니다.");
      return;
    }

    // 연결 중인 경우 중복 연결 방지
    if (connectionState === "connecting") {
      console.log("⚠️ 이미 WebSocket 연결 중입니다.");
      return;
    }

    // 토큰이 없으면 연결하지 않음
    if (!accessToken) {
      console.warn("⚠️ 토큰이 없어서 WebSocket 연결을 건너뜁니다.");
      setConnectionState("offline");
      return;
    }

    console.log(
      "🔑 usePbRoomWebRTC accessToken:",
      accessToken ? "있음" : "없음"
    );

    setConnectionState("connecting");

    try {
      console.log("🔌 WebSocket 연결 시도...");

      // 백엔드 서버 상태 확인
      try {
        const healthCheck = await fetch("http://localhost:8080/api/health");
        if (healthCheck.ok) {
          console.log("✅ 백엔드 서버 연결 성공:", healthCheck.status);
        } else {
          console.warn("⚠️ 백엔드 서버 연결 실패:", healthCheck.status);
          setConnectionState("offline");
          return;
        }
      } catch (healthError) {
        console.warn("⚠️ 백엔드 서버 연결 실패:", healthError);
        setConnectionState("offline");
        return;
      }

      console.log("🔗 WebSocket URL:", "ws://localhost:8080/ws/pb-room");
      console.log("🔑 토큰 상태:", accessToken ? "있음" : "없음");
      console.log("🔍 토큰 값:", accessToken);
      console.log("🔍 토큰 타입:", typeof accessToken);

      const client = new Client({
        brokerURL: "ws://localhost:8080/ws/pb-room",
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        reconnectDelay: 0, // 재연결 비활성화
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("✅ WebSocket 연결 성공");
          setIsConnected(true);
          setConnectionState("connected");

          // WebRTC 시그널링 구독
          client.subscribe(`/topic/pb-room/${roomId}/webrtc`, (message) => {
            const data = JSON.parse(message.body);
            console.log("📥 WebRTC 메시지 수신:", data);

            switch (data.type) {
              case "offer":
                handleOffer(data.offer);
                break;
              case "answer":
                handleAnswer(data.answer);
                break;
              case "ice-candidate":
                handleIceCandidate(data.candidate);
                break;
              case "user-joined":
                handleUserJoined(data);
                break;
            }
          });

          // WebRTC 연결 자동 시작 (한 번만)
          if (!peerConnectionRef.current) {
            setTimeout(() => {
              console.log("🔄 WebRTC 연결 자동 시작...");
              initiateCall();
            }, 1000);
          }
        },
        onStompError: (frame) => {
          console.error("❌ STOMP 오류:", frame);
          console.warn("⚠️ STOMP 연결 실패, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);
          // 오프라인 모드에서도 로컬 비디오 시작
          initiateCall();
        },
        onWebSocketError: (error) => {
          console.error("❌ WebSocket 오류:", error);
          console.warn("⚠️ WebSocket 연결 실패, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);
          // 오프라인 모드에서도 로컬 비디오 시작
          initiateCall();
        },
        onDisconnect: () => {
          console.warn("⚠️ WebSocket 연결 끊김, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);
          // 오프라인 모드에서도 로컬 비디오 시작
          setTimeout(() => {
            initiateCall();
          }, 1000);
        },
      });

      // WebRTC 시그널링 구독은 onConnect 콜백에서 처리

      // onDisconnect는 Client 생성자에서 처리

      // 기존 연결이 있으면 먼저 해제
      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate();
      }

      stompClientRef.current = client;
      client.activate();
    } catch (error) {
      console.warn("⚠️ WebSocket 연결 실패, 오프라인 모드로 전환");
      setConnectionState("offline");
      setIsConnected(false);
      // 오프라인 모드에서도 로컬 비디오 시작
      setTimeout(() => {
        initiateCall();
      }, 1000);
    }
  }, [roomId, onError]); // accessToken 제거 - 함수 내부에서 직접 사용

  // WebRTC 연결 시작
  const initiateCall = useCallback(async () => {
    // 이미 PeerConnection이 있는 경우 중복 생성 방지
    if (peerConnectionRef.current) {
      console.log("⚠️ 이미 WebRTC 연결이 있습니다.");
      return;
    }

    try {
      console.log("🔄 WebRTC 연결 시작...");

      // 미디어 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 오프라인 모드에서는 로컬 비디오만 표시
      if (connectionState === "offline") {
        console.log("📹 오프라인 모드 - 로컬 비디오만 표시");
        return;
      }

      // PeerConnection 생성
      peerConnectionRef.current = new RTCPeerConnection(rtcConfig);

      // 미디어 스트림 추가
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, stream);
      });

      // 원격 스트림 처리
      peerConnectionRef.current.ontrack = (event) => {
        console.log("📹 원격 스트림 수신:", event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          onRemoteStream?.(event.streams[0]);
        }
      };

      // ICE Candidate 처리
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current?.connected) {
          sendIceCandidate(event.candidate);
        }
      };

      // 연결 상태 변경
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state =
          peerConnectionRef.current?.connectionState || "disconnected";
        setConnectionState(state);
        console.log("🔗 WebRTC 연결 상태:", state);

        if (state === "connected") {
          console.log("✅ WebRTC 연결 성공! 비디오 스트림이 활성화되었습니다.");
        }
      };

      // PB만 Offer를 생성하고 전송 (고객은 Answer만 처리)
      if (userType === "pb") {
        console.log("🎯 PB 역할 - Offer 생성 및 전송");
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        console.log("📤 Offer 전송:", offer);
        sendOffer(offer);
      } else {
        console.log("🎯 고객 역할 - Answer 대기 중");

        // 고객이 입장했을 때 PB에게 알림 전송
        if (stompClientRef.current?.connected) {
          console.log("📤 고객 입장 알림 전송");
          stompClientRef.current.publish({
            destination: `/app/webrtc/webrtc/${roomId}/user-joined`,
            body: JSON.stringify({
              userType: "guest",
              userId: "guest-user", // 실제로는 사용자 ID를 사용해야 함
            }),
          });
        }
      }
    } catch (error) {
      console.error("❌ WebRTC 연결 실패:", error);
      onError?.(error as Error);
    }
  }, [onError, userType]); // userType 추가

  // Offer 전송
  const sendOffer = useCallback(
    (offer: RTCSessionDescriptionInit) => {
      if (!stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/webrtc/webrtc/${roomId}/offer`,
        body: JSON.stringify({ offer }),
      });
    },
    [roomId]
  );

  // Answer 전송은 handleOffer에서 직접 처리

  // ICE Candidate 전송
  const sendIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      if (!stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/webrtc/webrtc/${roomId}/ice-candidate`,
        body: JSON.stringify({ candidate }),
      });
    },
    [roomId]
  );

  // Offer 처리
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 Offer 수신:", offer);

        // 고객만 Answer를 생성 (PB는 Offer만 보냄)
        if (userType === "guest") {
          console.log("🎯 고객 역할 - Answer 생성 및 전송");
          await peerConnectionRef.current.setRemoteDescription(offer);

          // 큐에 저장된 ICE Candidate들 처리
          if (peerConnectionRef.current.pendingIceCandidates) {
            console.log("📥 큐에 저장된 ICE Candidate들 처리 중...");
            for (const candidate of peerConnectionRef.current
              .pendingIceCandidates) {
              try {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log("✅ 큐의 ICE Candidate 추가 완료");
              } catch (error) {
                console.error("❌ 큐의 ICE Candidate 추가 실패:", error);
              }
            }
            peerConnectionRef.current.pendingIceCandidates = [];
          }

          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          console.log("📤 Answer 전송:", answer);
          // sendAnswer 직접 호출
          if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
              destination: `/app/webrtc/webrtc/${roomId}/answer`,
              body: JSON.stringify({ answer }),
            });
          }
        } else {
          console.log(
            "🎯 PB 역할 - Offer 수신 무시 (PB는 Offer를 보내는 역할)"
          );
        }
      } catch (error) {
        console.error("❌ Offer 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError, roomId, userType] // userType 추가
  );

  // Answer 처리
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 Answer 수신:", answer);

        // PB만 Answer를 처리 (고객은 Answer를 보냄)
        if (userType === "pb") {
          console.log("🎯 PB 역할 - Answer 처리");
          await peerConnectionRef.current.setRemoteDescription(answer);

          // 큐에 저장된 ICE Candidate들 처리
          if (peerConnectionRef.current.pendingIceCandidates) {
            console.log("📥 큐에 저장된 ICE Candidate들 처리 중...");
            for (const candidate of peerConnectionRef.current
              .pendingIceCandidates) {
              try {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log("✅ 큐의 ICE Candidate 추가 완료");
              } catch (error) {
                console.error("❌ 큐의 ICE Candidate 추가 실패:", error);
              }
            }
            peerConnectionRef.current.pendingIceCandidates = [];
          }
        } else {
          console.log(
            "🎯 고객 역할 - Answer 수신 무시 (고객은 Answer를 보내는 역할)"
          );
        }
      } catch (error) {
        console.error("❌ Answer 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError, userType] // userType 추가
  );

  // ICE Candidate 처리
  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 ICE Candidate 수신:", candidate);

        // remoteDescription이 설정되었는지 확인
        if (!peerConnectionRef.current.remoteDescription) {
          console.log(
            "⚠️ remoteDescription이 없어서 ICE Candidate를 큐에 저장"
          );
          // ICE Candidate를 큐에 저장하고 나중에 처리
          if (!peerConnectionRef.current.pendingIceCandidates) {
            peerConnectionRef.current.pendingIceCandidates = [];
          }
          peerConnectionRef.current.pendingIceCandidates.push(candidate);
          return;
        }

        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log("✅ ICE Candidate 추가 완료");
      } catch (error) {
        console.error("❌ ICE Candidate 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError]
  );

  // 사용자 입장 처리
  const handleUserJoined = useCallback(
    (data: { userType: string; userId: string }) => {
      console.log("👤 사용자 입장:", data);

      // PB가 고객 입장을 감지했을 때 재연결 시도
      if (userType === "pb" && data.userType === "guest") {
        console.log("🔄 고객 입장 감지 - WebRTC 재연결 시도");

        // 기존 연결이 있다면 정리
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }

        // 1초 후 재연결 시도
        setTimeout(() => {
          initiateCall();
        }, 1000);
      }
    },
    [userType, initiateCall]
  );

  // 비디오 토글
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  // 오디오 토글
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  // 연결 종료
  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    // localStream은 ref로 관리하거나 별도로 처리
    setLocalStream((prevStream) => {
      if (prevStream) {
        prevStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
    setIsConnected(false);
    setConnectionState("disconnected");
  }, []); // 의존성 제거

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); // 의존성 제거

  return {
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    localVideoRef,
    remoteVideoRef,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  };
};
