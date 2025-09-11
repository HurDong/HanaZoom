"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Copy,
  Settings,
  UserX,
  RefreshCw,
  Video,
  Lock,
  Unlock,
  Share2,
  Crown,
} from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";

interface PbRoom {
  roomId: string;
  pbId: string;
  pbName: string;
  roomName: string;
  roomDescription: string;
  inviteCode: string;
  isActive: boolean;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean;
  lastActivityAt: string;
  createdAt: string;
  participants: Participant[];
}

interface Participant {
  participantId: string;
  memberId: string;
  memberName: string;
  role: "HOST" | "GUEST";
  joinedAt: string;
  isActive: boolean;
}

interface PbRoomManagerProps {
  onStartVideoCall?: (roomId: string) => void;
}

export default function PbRoomManager({
  onStartVideoCall,
}: PbRoomManagerProps) {
  const { accessToken } = useAuthStore();
  const [myRoom, setMyRoom] = useState<PbRoom | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // 방 생성 폼 상태
  const [createForm, setCreateForm] = useState({
    roomName: "",
    roomDescription: "",
    isPrivate: false,
    roomPassword: "",
  });

  // 방 업데이트 폼 상태
  const [updateForm, setUpdateForm] = useState({
    roomName: "",
    roomDescription: "",
    isPrivate: false,
    roomPassword: "",
  });

  // 방 참여 폼 상태
  const [joinForm, setJoinForm] = useState({
    inviteCode: "",
    roomPassword: "",
  });

  // 내 방 조회
  const fetchMyRoom = async () => {
    try {
      const response = await fetch("/api/pb-rooms/my-room", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMyRoom(data.data);
        }
      }
    } catch (error) {
      console.error("내 방 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 방 생성
  const createRoom = async () => {
    try {
      setIsCreatingRoom(true);
      const response = await fetch("/api/pb-rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMyRoom(data.data);
          setShowCreateDialog(false);
          setCreateForm({
            roomName: "",
            roomDescription: "",
            isPrivate: false,
            roomPassword: "",
          });
        }
      }
    } catch (error) {
      console.error("방 생성 실패:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // 방 정보 업데이트
  const updateRoom = async () => {
    if (!myRoom) return;

    try {
      setIsUpdatingRoom(true);
      const response = await fetch(`/api/pb-rooms/${myRoom.roomId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMyRoom(data.data);
          setShowUpdateDialog(false);
        }
      }
    } catch (error) {
      console.error("방 정보 업데이트 실패:", error);
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  // 초대 코드 재생성
  const regenerateInviteCode = async () => {
    if (!myRoom) return;

    try {
      const response = await fetch(
        `/api/pb-rooms/${myRoom.roomId}/regenerate-invite-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMyRoom({ ...myRoom, inviteCode: data.data });
        }
      }
    } catch (error) {
      console.error("초대 코드 재생성 실패:", error);
    }
  };

  // 참여자 강퇴
  const kickParticipant = async (participantId: string) => {
    if (!myRoom) return;

    try {
      const response = await fetch(`/api/pb-rooms/${myRoom.roomId}/kick`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          reason: "방장에 의한 강퇴",
        }),
      });

      if (response.ok) {
        // 방 정보 새로고침
        fetchMyRoom();
      }
    } catch (error) {
      console.error("참여자 강퇴 실패:", error);
    }
  };

  // 초대 코드 복사
  const copyInviteCode = () => {
    if (myRoom) {
      navigator.clipboard.writeText(myRoom.inviteCode);
      alert("초대 코드가 복사되었습니다!");
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchMyRoom();
  }, []);

  // 업데이트 폼 초기화
  useEffect(() => {
    if (myRoom) {
      setUpdateForm({
        roomName: myRoom.roomName,
        roomDescription: myRoom.roomDescription,
        isPrivate: myRoom.isPrivate,
        roomPassword: "",
      });
    }
  }, [myRoom]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
          PB 개별방 관리
        </h2>
        {!myRoom && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Video className="w-4 h-4 mr-2" />방 생성
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 방 생성</DialogTitle>
                <DialogDescription>
                  고객과의 화상상담을 위한 개별방을 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">방 이름</Label>
                  <Input
                    id="roomName"
                    value={createForm.roomName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, roomName: e.target.value })
                    }
                    placeholder="예: 김영희 PB 상담실"
                  />
                </div>
                <div>
                  <Label htmlFor="roomDescription">방 설명</Label>
                  <Textarea
                    id="roomDescription"
                    value={createForm.roomDescription}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        roomDescription: e.target.value,
                      })
                    }
                    placeholder="방에 대한 간단한 설명을 입력하세요"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPrivate"
                    checked={createForm.isPrivate}
                    onCheckedChange={(checked) =>
                      setCreateForm({ ...createForm, isPrivate: checked })
                    }
                  />
                  <Label htmlFor="isPrivate">비공개 방</Label>
                </div>
                {createForm.isPrivate && (
                  <div>
                    <Label htmlFor="roomPassword">방 비밀번호</Label>
                    <Input
                      id="roomPassword"
                      type="password"
                      value={createForm.roomPassword}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          roomPassword: e.target.value,
                        })
                      }
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={createRoom}
                  disabled={isCreatingRoom || !createForm.roomName}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCreatingRoom ? "생성 중..." : "방 생성"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {myRoom ? (
        <div className="space-y-4">
          {/* 방 정보 카드 */}
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    {myRoom.roomName}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {myRoom.roomDescription}
                  </p>
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 초대 코드 */}
                <div>
                  <Label className="text-sm font-medium">초대 코드</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={myRoom.inviteCode}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyInviteCode}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={regenerateInviteCode}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 참여자 정보 */}
                <div>
                  <Label className="text-sm font-medium">
                    참여자 ({myRoom.currentParticipants}/
                    {myRoom.maxParticipants})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {myRoom.participants.map((participant) => (
                      <div
                        key={participant.participantId}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {participant.memberName}
                          </span>
                          {participant.role === "HOST" && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        {participant.role === "GUEST" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <UserX className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>참여자 강퇴</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {participant.memberName}님을 방에서
                                  강퇴하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    kickParticipant(participant.participantId)
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  강퇴
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2">
                  <Dialog
                    open={showUpdateDialog}
                    onOpenChange={setShowUpdateDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />방 설정
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>방 설정 수정</DialogTitle>
                        <DialogDescription>
                          방 정보를 수정할 수 있습니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="updateRoomName">방 이름</Label>
                          <Input
                            id="updateRoomName"
                            value={updateForm.roomName}
                            onChange={(e) =>
                              setUpdateForm({
                                ...updateForm,
                                roomName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="updateRoomDescription">방 설명</Label>
                          <Textarea
                            id="updateRoomDescription"
                            value={updateForm.roomDescription}
                            onChange={(e) =>
                              setUpdateForm({
                                ...updateForm,
                                roomDescription: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="updateIsPrivate"
                            checked={updateForm.isPrivate}
                            onCheckedChange={(checked) =>
                              setUpdateForm({
                                ...updateForm,
                                isPrivate: checked,
                              })
                            }
                          />
                          <Label htmlFor="updateIsPrivate">비공개 방</Label>
                        </div>
                        {updateForm.isPrivate && (
                          <div>
                            <Label htmlFor="updateRoomPassword">
                              방 비밀번호
                            </Label>
                            <Input
                              id="updateRoomPassword"
                              type="password"
                              value={updateForm.roomPassword}
                              onChange={(e) =>
                                setUpdateForm({
                                  ...updateForm,
                                  roomPassword: e.target.value,
                                })
                              }
                              placeholder="새 비밀번호를 입력하세요"
                            />
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowUpdateDialog(false)}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={updateRoom}
                          disabled={isUpdatingRoom}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isUpdatingRoom ? "수정 중..." : "수정"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {onStartVideoCall && (
                    <Button
                      onClick={() => onStartVideoCall(myRoom.roomId)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      화상상담 시작
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800">
          <CardContent className="text-center py-8">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              아직 생성된 방이 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              고객과의 화상상담을 위한 개별방을 생성해보세요.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Video className="w-4 h-4 mr-2" />첫 방 생성하기
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

