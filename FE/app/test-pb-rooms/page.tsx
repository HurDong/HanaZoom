"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Users,
  Copy,
  RefreshCw,
  Crown,
  Lock,
  Unlock,
} from "lucide-react";

export default function TestPbRoomsPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myRoom, setMyRoom] = useState<any>(null);

  // 테스트용 폼 상태
  const [createForm, setCreateForm] = useState({
    roomName: "테스트 PB 상담실",
    roomDescription: "테스트용 상담실입니다",
    isPrivate: false,
    roomPassword: "",
  });

  const [joinForm, setJoinForm] = useState({
    inviteCode: "",
    roomPassword: "",
  });

  // 테스트 결과 추가
  const addTestResult = (
    testName: string,
    success: boolean,
    message: string,
    data?: any
  ) => {
    setTestResults((prev) => [
      ...prev,
      {
        id: Date.now(),
        testName,
        success,
        message,
        data,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // 1. 방 생성 테스트
  const testCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pb-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMyRoom(data.data);
        addTestResult(
          "방 생성",
          true,
          "방이 성공적으로 생성되었습니다",
          data.data
        );
      } else {
        addTestResult(
          "방 생성",
          false,
          `실패: ${data.message || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      addTestResult("방 생성", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. 내 방 조회 테스트
  const testGetMyRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pb-rooms/my-room", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMyRoom(data.data);
        addTestResult(
          "내 방 조회",
          true,
          "방 정보를 성공적으로 조회했습니다",
          data.data
        );
      } else {
        addTestResult(
          "내 방 조회",
          false,
          `실패: ${data.message || "방이 없습니다"}`
        );
      }
    } catch (error) {
      addTestResult("내 방 조회", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. 초대 코드 재생성 테스트
  const testRegenerateInviteCode = async () => {
    if (!myRoom) {
      addTestResult("초대 코드 재생성", false, "방이 없습니다");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/pb-rooms/${myRoom.roomId}/regenerate-invite-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setMyRoom({ ...myRoom, inviteCode: data.data });
        addTestResult(
          "초대 코드 재생성",
          true,
          "초대 코드가 성공적으로 재생성되었습니다",
          data.data
        );
      } else {
        addTestResult(
          "초대 코드 재생성",
          false,
          `실패: ${data.message || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      addTestResult("초대 코드 재생성", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. 방 정보 업데이트 테스트
  const testUpdateRoom = async () => {
    if (!myRoom) {
      addTestResult("방 정보 업데이트", false, "방이 없습니다");
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        roomName: "업데이트된 테스트 방",
        roomDescription: "방 정보가 업데이트되었습니다",
        isPrivate: true,
        roomPassword: "test123",
      };

      const response = await fetch(`/api/pb-rooms/${myRoom.roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMyRoom(data.data);
        addTestResult(
          "방 정보 업데이트",
          true,
          "방 정보가 성공적으로 업데이트되었습니다",
          data.data
        );
      } else {
        addTestResult(
          "방 정보 업데이트",
          false,
          `실패: ${data.message || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      addTestResult("방 정보 업데이트", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. 방 참여 테스트 (시뮬레이션)
  const testJoinRoom = async () => {
    if (!myRoom) {
      addTestResult("방 참여", false, "방이 없습니다");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pb-rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: myRoom.inviteCode,
          roomPassword: joinForm.roomPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult(
          "방 참여",
          true,
          "방에 성공적으로 참여했습니다",
          data.data
        );
      } else {
        addTestResult(
          "방 참여",
          false,
          `실패: ${data.message || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      addTestResult("방 참여", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. 활성 방 목록 조회 테스트
  const testGetActiveRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pb-rooms/active", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult(
          "활성 방 목록 조회",
          true,
          `활성 방 ${data.data.length}개를 조회했습니다`,
          data.data
        );
      } else {
        addTestResult(
          "활성 방 목록 조회",
          false,
          `실패: ${data.message || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      addTestResult("활성 방 목록 조회", false, `네트워크 오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // 모든 테스트 실행
  const runAllTests = async () => {
    setTestResults([]);
    await testCreateRoom();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testGetMyRoom();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testRegenerateInviteCode();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testUpdateRoom();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testGetActiveRooms();
  };

  // 테스트 결과 초기화
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-900 dark:text-green-100 mb-4">
            PB 개별방 시스템 테스트
          </h1>
          <p className="text-green-700 dark:text-green-300">
            백엔드 API와 프론트엔드 기능을 테스트합니다
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 테스트 컨트롤 */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100">
                테스트 컨트롤
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={runAllTests}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {loading ? "테스트 중..." : "전체 테스트 실행"}
                </Button>
                <Button onClick={clearResults} variant="outline">
                  결과 초기화
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={testCreateRoom}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  방 생성 테스트
                </Button>
                <Button
                  onClick={testGetMyRoom}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  내 방 조회 테스트
                </Button>
                <Button
                  onClick={testRegenerateInviteCode}
                  disabled={loading || !myRoom}
                  variant="outline"
                  className="w-full"
                >
                  초대 코드 재생성 테스트
                </Button>
                <Button
                  onClick={testUpdateRoom}
                  disabled={loading || !myRoom}
                  variant="outline"
                  className="w-full"
                >
                  방 정보 업데이트 테스트
                </Button>
                <Button
                  onClick={testGetActiveRooms}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  활성 방 목록 조회 테스트
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 현재 방 정보 */}
          {myRoom && (
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  현재 방 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">방 이름</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {myRoom.roomName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">초대 코드</Label>
                  <div className="flex gap-2">
                    <Input
                      value={myRoom.inviteCode}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(myRoom.inviteCode);
                        alert("초대 코드가 복사되었습니다!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={
                      myRoom.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {myRoom.isActive ? "활성" : "비활성"}
                  </Badge>
                  <Badge
                    className={
                      myRoom.isPrivate
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                  >
                    {myRoom.isPrivate ? (
                      <Lock className="w-3 h-3 mr-1" />
                    ) : (
                      <Unlock className="w-3 h-3 mr-1" />
                    )}
                    {myRoom.isPrivate ? "비공개" : "공개"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    참여자 ({myRoom.currentParticipants}/
                    {myRoom.maxParticipants})
                  </Label>
                  <div className="mt-1">
                    {myRoom.participants?.map((participant: any) => (
                      <div
                        key={participant.participantId}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{participant.memberName}</span>
                        {participant.role === "HOST" && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 테스트 결과 */}
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">
              테스트 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                테스트를 실행해주세요
              </p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded-lg border ${
                      result.success
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            result.success ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="font-medium">{result.testName}</span>
                        <span className="text-sm text-gray-500">
                          ({result.timestamp})
                        </span>
                      </div>
                      <Badge
                        className={
                          result.success
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {result.success ? "성공" : "실패"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {result.message}
                    </p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-500 cursor-pointer">
                          상세 데이터 보기
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

