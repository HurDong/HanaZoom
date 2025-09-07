"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  User,
  MapPin,
} from "lucide-react";

interface Consultation {
  id: string;
  clientName: string;
  clientRegion: string;
  scheduledTime: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED";
  type:
    | "PORTFOLIO_ANALYSIS"
    | "STOCK_CONSULTATION"
    | "PRODUCT_CONSULTATION"
    | "GENERAL_CONSULTATION";
  duration: number;
  notes?: string;
}

interface ConsultationStatusManagerProps {
  onStatusChange?: (consultationId: string, newStatus: string) => void;
}

export default function ConsultationStatusManager({
  onStatusChange,
}: ConsultationStatusManagerProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([
    {
      id: "consultation-001",
      clientName: "김고객",
      clientRegion: "서울시 강남구",
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2시간 후
      status: "PENDING",
      type: "PORTFOLIO_ANALYSIS",
      duration: 30,
      notes: "포트폴리오 분석 상담 요청",
    },
    {
      id: "consultation-002",
      clientName: "이고객",
      clientRegion: "서울시 서초구",
      scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4시간 후
      status: "APPROVED",
      type: "STOCK_CONSULTATION",
      duration: 45,
      notes: "주식 투자 상담",
    },
    {
      id: "consultation-003",
      clientName: "박고객",
      clientRegion: "서울시 송파구",
      scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
      status: "IN_PROGRESS",
      type: "PRODUCT_CONSULTATION",
      duration: 60,
      notes: "금융상품 상담",
    },
  ]);

  // 상태별 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "CANCELLED":
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 상태별 텍스트 매핑
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "대기 중";
      case "APPROVED":
        return "승인됨";
      case "IN_PROGRESS":
        return "진행 중";
      case "COMPLETED":
        return "완료";
      case "CANCELLED":
        return "취소";
      case "REJECTED":
        return "거절";
      default:
        return "알 수 없음";
    }
  };

  // 상담 유형별 텍스트 매핑
  const getTypeText = (type: string) => {
    switch (type) {
      case "PORTFOLIO_ANALYSIS":
        return "포트폴리오 분석";
      case "STOCK_CONSULTATION":
        return "주식 상담";
      case "PRODUCT_CONSULTATION":
        return "상품 상담";
      case "GENERAL_CONSULTATION":
        return "일반 상담";
      default:
        return "상담";
    }
  };

  // 상태 변경 함수
  const changeStatus = (consultationId: string, newStatus: string) => {
    setConsultations((prev) =>
      prev.map((consultation) =>
        consultation.id === consultationId
          ? { ...consultation, status: newStatus as any }
          : consultation
      )
    );

    if (onStatusChange) {
      onStatusChange(consultationId, newStatus);
    }
  };

  // 새 상담 생성
  const createNewConsultation = () => {
    const newConsultation: Consultation = {
      id: `consultation-${Date.now()}`,
      clientName: `고객${Math.floor(Math.random() * 100)}`,
      clientRegion: "서울시 강남구",
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 내일
      status: "PENDING",
      type: "GENERAL_CONSULTATION",
      duration: 30,
      notes: "새로운 상담 요청",
    };

    setConsultations((prev) => [...prev, newConsultation]);
  };

  // 상담 삭제
  const deleteConsultation = (consultationId: string) => {
    setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
          상담 상태 관리
        </h2>
        <Button
          onClick={createNewConsultation}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          새 상담 생성
        </Button>
      </div>

      <div className="grid gap-4">
        {consultations.map((consultation) => (
          <Card
            key={consultation.id}
            className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {consultation.clientName}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {consultation.clientRegion}
                  </div>
                </div>
                <Badge className={getStatusColor(consultation.status)}>
                  {getStatusText(consultation.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    예약 시간:{" "}
                    {new Date(consultation.scheduledTime).toLocaleString(
                      "ko-KR"
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>
                    상담 유형: {getTypeText(consultation.type)} (
                    {consultation.duration}분)
                  </span>
                </div>

                {consultation.notes && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {consultation.notes}
                  </div>
                )}

                {/* 상태 변경 버튼들 */}
                <div className="flex gap-2 flex-wrap">
                  {consultation.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          changeStatus(consultation.id, "APPROVED")
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          changeStatus(consultation.id, "REJECTED")
                        }
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        거절
                      </Button>
                    </>
                  )}

                  {consultation.status === "APPROVED" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        changeStatus(consultation.id, "IN_PROGRESS")
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      상담 시작
                    </Button>
                  )}

                  {consultation.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(consultation.id, "COMPLETED")}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      상담 완료
                    </Button>
                  )}

                  {(consultation.status === "PENDING" ||
                    consultation.status === "APPROVED") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus(consultation.id, "CANCELLED")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteConsultation(consultation.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {consultations.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>등록된 상담이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

