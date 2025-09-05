"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentClientId, resetClientId } from '@/lib/utils/clientId';
import VideoConsultationRoom from '@/components/pb/VideoConsultationRoom';

export default function WebRTCMultiClientTestPage() {
  const [currentClientId, setCurrentClientId] = useState<string>('');
  const [consultationId, setConsultationId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [pbName, setPbName] = useState<string>('');
  const [clientRegion, setClientRegion] = useState<string>('');
  const [showVideoRoom, setShowVideoRoom] = useState<boolean>(false);

  // 컴포넌트 마운트 시 클라이언트 ID 생성
  useState(() => {
    setCurrentClientId(getCurrentClientId());
  });

  const handleGenerateNewClientId = () => {
    const newClientId = resetClientId();
    setCurrentClientId(newClientId);
    setShowVideoRoom(false);
  };

  const handleStartVideoCall = () => {
    if (!consultationId || !clientName || !pbName) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    setShowVideoRoom(true);
  };

  const handleEndVideoCall = () => {
    setShowVideoRoom(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WebRTC 다중 클라이언트 테스트
          </h1>
          <p className="text-gray-600">
            여러 클라이언트가 동시에 화상채팅을 이용할 수 있는지 테스트합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 설정 패널 */}
          <Card>
            <CardHeader>
              <CardTitle>클라이언트 설정</CardTitle>
              <CardDescription>
                각 클라이언트는 고유한 ID를 가지며, 서로 격리된 세션에서 동작합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientId">현재 클라이언트 ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientId"
                    value={currentClientId}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={handleGenerateNewClientId}
                    variant="outline"
                    size="sm"
                  >
                    새 ID 생성
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  새로고침 시에도 유지되며, 새 ID 생성 시 이전 세션과 완전히 분리됩니다.
                </p>
              </div>

              <div>
                <Label htmlFor="consultationId">상담 ID</Label>
                <Input
                  id="consultationId"
                  value={consultationId}
                  onChange={(e) => setConsultationId(e.target.value)}
                  placeholder="예: 123e4567-e89b-12d3-a456-426614174000"
                />
              </div>

              <div>
                <Label htmlFor="clientName">고객 이름</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </div>

              <div>
                <Label htmlFor="pbName">PB 이름</Label>
                <Input
                  id="pbName"
                  value={pbName}
                  onChange={(e) => setPbName(e.target.value)}
                  placeholder="예: 김PB"
                />
              </div>

              <div>
                <Label htmlFor="clientRegion">고객 지역</Label>
                <Input
                  id="clientRegion"
                  value={clientRegion}
                  onChange={(e) => setClientRegion(e.target.value)}
                  placeholder="예: 강남구"
                />
              </div>

              <Button 
                onClick={handleStartVideoCall}
                className="w-full"
                disabled={showVideoRoom}
              >
                화상채팅 시작
              </Button>

              {showVideoRoom && (
                <Button 
                  onClick={handleEndVideoCall}
                  variant="destructive"
                  className="w-full"
                >
                  화상채팅 종료
                </Button>
              )}
            </CardContent>
          </Card>

          {/* 사용법 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>사용법 안내</CardTitle>
              <CardDescription>
                다중 클라이언트 테스트 방법
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">1. 동일한 상담 ID로 여러 클라이언트 테스트</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 첫 번째 브라우저 탭에서 상담을 시작</li>
                  <li>• 두 번째 브라우저 탭을 열고 "새 ID 생성" 클릭</li>
                  <li>• 동일한 상담 ID로 두 번째 클라이언트 연결</li>
                  <li>• 각 클라이언트가 독립적으로 동작하는지 확인</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">2. 다른 상담 ID로 여러 클라이언트 테스트</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 각 클라이언트마다 다른 상담 ID 사용</li>
                  <li>• 서로 다른 상담 세션에서 독립적으로 동작</li>
                  <li>• 클라이언트 간 간섭 없이 동작하는지 확인</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">3. 클라이언트 ID 확인</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 각 클라이언트는 고유한 ID를 가짐</li>
                  <li>• 브라우저 개발자 도구에서 네트워크 탭 확인</li>
                  <li>• WebSocket 연결 URL에 클라이언트 ID 포함됨</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 화상채팅 룸 */}
        {showVideoRoom && (
          <Card>
            <CardHeader>
              <CardTitle>화상채팅 룸</CardTitle>
              <CardDescription>
                클라이언트 ID: {currentClientId} | 상담 ID: {consultationId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoConsultationRoom
                consultationId={consultationId}
                clientName={clientName}
                clientRegion={clientRegion}
                pbName={pbName}
                clientId={currentClientId}
                onEndConsultation={handleEndVideoCall}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
