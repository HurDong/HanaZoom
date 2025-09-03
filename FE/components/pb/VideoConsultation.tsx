"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  Share,
  Users,
  Clock,
  MapPin,
  BarChart3,
  FileText,
  Download,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface VideoConsultationProps {
  consultationId: string;
  clientName: string;
  clientRegion: string;
  pbName: string;
  onEndConsultation: () => void;
}

interface ChatMessage {
  id: string;
  sender: "pb" | "client";
  message: string;
  timestamp: Date;
}

interface ConsultationNote {
  id: string;
  content: string;
  timestamp: Date;
  type: "general" | "recommendation" | "action";
}

export default function VideoConsultation({
  consultationId,
  clientName,
  clientRegion,
  pbName,
  onEndConsultation,
}: VideoConsultationProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "portfolio">(
    "chat"
  );
  const [consultationTime, setConsultationTime] = useState(0);
  const [isConsultationActive, setIsConsultationActive] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 상담 시간 타이머
    const timer = setInterval(() => {
      if (isConsultationActive) {
        setConsultationTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isConsultationActive]);

  useEffect(() => {
    // 채팅 스크롤을 맨 아래로
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender: "pb",
        message: newMessage.trim(),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: ConsultationNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        timestamp: new Date(),
        type: "general",
      };
      setNotes((prev) => [...prev, note]);
      setNewNote("");
    }
  };

  const handleEndConsultation = () => {
    setIsConsultationActive(false);
    onEndConsultation();
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div
      className={`${
        isFullscreen ? "fixed inset-0 z-50 bg-black" : "h-screen"
      } flex flex-col`}
    >
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                상담 진행 중
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              {formatTime(consultationTime)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {clientName}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {clientRegion}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 메인 비디오 영역 */}
        <div
          className={`${
            isFullscreen ? "flex-1" : "flex-1 max-w-3xl"
          } flex flex-col`}
        >
          {/* 비디오 화면 */}
          <div className="flex-1 bg-gray-900 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-16 h-16 text-gray-400" />
                </div>
                <div className="text-xl font-semibold">{clientName}</div>
                <div className="text-gray-400">{clientRegion}</div>
              </div>
            </div>

            {/* PB 비디오 (작은 화면) */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg border-2 border-white">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-semibold text-lg">
                      {pbName.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{pbName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="bg-white dark:bg-gray-900 p-4 flex items-center justify-center gap-4">
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsVideoOn(!isVideoOn)}
              className="rounded-full w-12 h-12"
            >
              {isVideoOn ? (
                <Video className="w-5 h-5" />
              ) : (
                <VideoOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant={isMicOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsMicOn(!isMicOn)}
              className="rounded-full w-12 h-12"
            >
              {isMicOn ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-12 h-12"
            >
              <Share className="w-5 h-5" />
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndConsultation}
              className="rounded-full w-12 h-12"
            >
              <Phone className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 사이드바 */}
        {!isFullscreen && (
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            {/* 탭 헤더 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === "chat"
                    ? "text-green-600 border-b-2 border-green-600 dark:text-green-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline mr-2" />
                채팅
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === "notes"
                    ? "text-green-600 border-b-2 border-green-600 dark:text-green-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                메모
              </button>
              <button
                onClick={() => setActiveTab("portfolio")}
                className={`flex-1 p-3 text-sm font-medium ${
                  activeTab === "portfolio"
                    ? "text-green-600 border-b-2 border-green-600 dark:text-green-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                포트폴리오
              </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 flex flex-col">
              {activeTab === "chat" && (
                <>
                  {/* 채팅 메시지 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "pb"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs p-3 rounded-lg ${
                            message.sender === "pb"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          <div className="text-sm">{message.message}</div>
                          <div
                            className={`text-xs mt-1 ${
                              message.sender === "pb"
                                ? "text-green-100"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {message.timestamp.toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* 채팅 입력 */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleSendMessage)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 min-h-[40px] max-h-20 resize-none"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendMessage}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        전송
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "notes" && (
                <>
                  {/* 메모 목록 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {note.content}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {note.timestamp.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 메모 입력 */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleAddNote)}
                        placeholder="상담 메모를 입력하세요..."
                        className="min-h-[60px] resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddNote}
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        메모 추가
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "portfolio" && (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        포트폴리오 분석
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        고객의 포트폴리오를 실시간으로 분석하고
                        <br />
                        상담에 활용할 수 있습니다.
                      </p>
                      <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                        포트폴리오 열기
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
