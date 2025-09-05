"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  Settings,
  MessageSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface VideoConsultationRoomProps {
  consultationId: string;
  clientName: string;
  clientRegion: string;
  pbName: string;
  onEndConsultation: () => void;
}

export default function VideoConsultationRoom({
  consultationId,
  clientName,
  clientRegion,
  pbName,
  onEndConsultation
}: VideoConsultationRoomProps) {
  console.log("VideoConsultationRoom 렌더링:", { consultationId, clientName, clientRegion, pbName });
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    participants,
    connectionState,
    error,
    mediaMode,
    startConnection,
    endConnection,
    initiateCall,
    requestPermissions,
    checkDeviceStatus,
    setMediaMode
  } = useWebRTC({
    consultationId,
    onConnectionStateChange: (state) => {
      console.log('연결 상태 변경:', state);
    },
    onRemoteStream: (stream) => {
      console.log('원격 스트림 수신:', stream);
    },
    onError: (error) => {
      console.error('WebRTC 오류:', error);
      if (error.includes('권한') || error.includes('접근')) {
        setShowPermissionGuide(true);
      }
    }
  });

  // 컴포넌트 마운트 시 연결 시작
  useEffect(() => {
    startConnection();
  }, [startConnection]);

  // 비디오 토글
  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  // 오디오 토글
  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 상담 종료
  const handleEndConsultation = () => {
    endConnection();
    onEndConsultation();
  };

  // 채팅 메시지 전송
  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      // WebSocket을 통해 메시지 전송
      const messageData = {
        userName: pbName,
        message: newMessage.trim()
      };
      
      // WebRTC 훅에서 메시지 전송 기능을 사용할 수 있도록 확장 필요
      // 임시로 로컬 상태에 추가
      const newChatMessage = {
        id: Date.now().toString(),
        sender: pbName,
        message: newMessage.trim(),
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, newChatMessage]);
      setNewMessage('');
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 연결 상태에 따른 배지 색상
  const getConnectionBadgeColor = (state: string) => {
    switch (state) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 연결 상태 텍스트
  const getConnectionStateText = (state: string) => {
    switch (state) {
      case 'connected':
        return '연결됨';
      case 'connecting':
        return '연결 중';
      case 'disconnected':
        return '연결 끊김';
      default:
        return state;
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* 헤더 */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-green-200 dark:border-green-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-green-900 dark:text-green-100">
                {mediaMode === 'text' ? '텍스트 상담' : 
                 mediaMode === 'audio' ? '음성 상담' : '화상 상담'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {clientName} ({clientRegion})
                </span>
                <Badge className={getConnectionBadgeColor(connectionState)}>
                  {getConnectionStateText(connectionState)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participants.length}명 참여
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              채팅
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 비디오 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 원격 비디오 */}
          <div className="flex-1 relative bg-gray-900 rounded-lg m-4 overflow-hidden">
            {mediaMode === 'text' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">텍스트 채팅 모드</h3>
                  <p className="text-gray-300">카메라/마이크 없이 텍스트로 상담을 진행합니다</p>
                  <Button
                    onClick={async () => {
                      const success = await requestPermissions();
                      if (success) {
                        await startConnection();
                      } else {
                        setShowPermissionGuide(true);
                      }
                    }}
                    size="sm"
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    카메라 권한 요청
                  </Button>
                </div>
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* 원격 비디오 오버레이 */}
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {clientName}
            </div>
            
            {/* 연결 상태 오버레이 */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-lg font-medium">연결 중...</p>
                  <p className="text-sm opacity-75">잠시만 기다려주세요</p>
                </div>
              </div>
            )}
          </div>

          {/* 로컬 비디오 */}
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500">
            {mediaMode === 'text' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-2xl mb-2">📝</div>
                  <p className="text-xs">텍스트 모드</p>
                </div>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            
            {/* 로컬 비디오 오버레이 */}
            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {pbName}
            </div>
            
            {/* 비디오/오디오 상태 표시 */}
            <div className="absolute bottom-2 right-2 flex gap-1">
              {!isVideoEnabled && (
                <div className="bg-red-500 text-white p-1 rounded">
                  <VideoOff className="w-3 h-3" />
                </div>
              )}
              {!isAudioEnabled && (
                <div className="bg-red-500 text-white p-1 rounded">
                  <MicOff className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 채팅 사이드바 */}
        {showChat && (
          <div className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-l border-green-200 dark:border-green-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">채팅</h3>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {chatMessages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {message.sender}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">아직 메시지가 없습니다.</p>
                </div>
              )}
            </div>
            
            {/* 채팅 입력 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={!isConnected}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  전송
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 바 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-4 shadow-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-4">
            {/* 비디오 토글 - 텍스트 모드에서는 비활성화 */}
            {mediaMode !== 'text' && (
              <Button
                variant={isVideoEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleVideo}
                className="rounded-full w-12 h-12"
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
            )}

            {/* 오디오 토글 - 텍스트 모드에서는 비활성화 */}
            {mediaMode !== 'text' && (
              <Button
                variant={isAudioEnabled ? "default" : "destructive"}
                size="sm"
                onClick={toggleAudio}
                className="rounded-full w-12 h-12"
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
            )}

            {/* 텍스트 모드 표시 */}
            {mediaMode === 'text' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">텍스트 채팅 모드</span>
              </div>
            )}

            {/* 통화 시작 */}
            {!isConnected && (
              <Button
                onClick={initiateCall}
                disabled={isConnecting}
                className="rounded-full w-12 h-12 bg-green-600 hover:bg-green-700"
              >
                <Phone className="w-5 h-5" />
              </Button>
            )}

            {/* 상담 종료 */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndConsultation}
              className="rounded-full w-12 h-12"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="font-medium">연결 오류</span>
            </div>
            <p className="text-sm mt-1">{error}</p>
            {error.includes('권한') && (
              <Button
                onClick={() => setShowPermissionGuide(true)}
                className="mt-2 text-xs"
                size="sm"
              >
                권한 설정 가이드 보기
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 권한 가이드 모달 */}
      {showPermissionGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              카메라/마이크 권한 설정
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>화상 상담을 위해 카메라와 마이크 접근 권한이 필요합니다.</p>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-xs font-medium">
                  💡 대안: 장치가 없어도 상담 가능
                </p>
                <ul className="text-green-700 dark:text-green-300 text-xs mt-1 space-y-1">
                  <li>• 텍스트 채팅으로 상담 진행 가능</li>
                  <li>• 음성만으로도 상담 가능 (마이크만 있는 경우)</li>
                  <li>• 화면 공유 기능 활용 가능</li>
                </ul>
              </div>
              
              {error?.includes('찾을 수 없습니다') && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-xs font-medium">
                    ⚠️ 장치 연결 문제 감지
                  </p>
                  <ul className="text-red-700 dark:text-red-300 text-xs mt-1 space-y-1">
                    <li>• 카메라/마이크가 올바르게 연결되어 있는지 확인</li>
                    <li>• 장치 드라이버가 최신인지 확인</li>
                    <li>• 다른 애플리케이션에서 사용 중인지 확인</li>
                    <li>• USB 장치라면 다른 포트로 연결 시도</li>
                  </ul>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="font-medium">권한 허용 방법:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭</li>
                  <li>"카메라"와 "마이크" 권한을 "허용"으로 변경</li>
                  <li>페이지를 새로고침하거나 다시 시도</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-xs font-medium">
                  🔧 장치 문제 해결 방법:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 text-xs mt-1 space-y-1">
                  <li>• Windows: 설정 → 개인정보 → 카메라/마이크</li>
                  <li>• 장치 관리자에서 카메라/마이크 상태 확인</li>
                  <li>• 브라우저를 완전히 종료 후 재시작</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                  💡 팁: 다른 애플리케이션에서 카메라/마이크를 사용 중이라면 종료 후 다시 시도해주세요.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={async () => {
                  const success = await requestPermissions();
                  if (success) {
                    setShowPermissionGuide(false);
                    await startConnection();
                  }
                }}
                className="flex-1"
              >
                권한 재요청
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionGuide(false);
                  // 텍스트 채팅 모드로 강제 진행
                  setMediaMode('text');
                  startConnection();
                }}
                variant="outline"
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                텍스트로 진행
              </Button>
              <Button
                onClick={async () => {
                  const status = await checkDeviceStatus();
                  alert(`장치 상태:\n비디오: ${status.videoCount}개\n오디오: ${status.audioCount}개\n\n비디오 사용 가능: ${status.hasVideo ? '예' : '아니오'}\n오디오 사용 가능: ${status.hasAudio ? '예' : '아니오'}`);
                }}
                variant="outline"
                className="flex-1"
              >
                장치 확인
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionGuide(false);
                  window.location.reload();
                }}
                variant="outline"
                className="flex-1"
              >
                새로고침
              </Button>
              <Button
                onClick={() => setShowPermissionGuide(false)}
                variant="outline"
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
