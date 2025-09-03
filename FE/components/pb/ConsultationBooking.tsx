"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  Star,
  ArrowLeft,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

interface ConsultationBookingProps {
  pbId: string;
  onBookingComplete?: (booking: any) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  type: "video" | "phone" | "chat";
}

interface PBInfo {
  id: string;
  name: string;
  region: string;
  specialties: string[];
  rating: number;
  experience: number;
  availableSlots: TimeSlot[];
}

export default function ConsultationBooking({
  pbId,
  onBookingComplete,
}: ConsultationBookingProps) {
  const [step, setStep] = useState<
    "select-pb" | "select-time" | "client-info" | "confirm"
  >("select-pb");
  const [selectedPB, setSelectedPB] = useState<PBInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<"video" | "phone" | "chat">(
    "video"
  );
  const [clientInfo, setClientInfo] = useState({
    name: "",
    phone: "",
    email: "",
    region: "",
    consultationPurpose: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // 모의 PB 데이터
  const mockPBs: PBInfo[] = [
    {
      id: "1",
      name: "김영희 PB",
      region: "강남구",
      specialties: ["포트폴리오 분석", "리밸런싱", "리스크 관리"],
      rating: 4.8,
      experience: 5,
      availableSlots: [
        { time: "09:00", available: true, type: "video" },
        { time: "10:00", available: true, type: "phone" },
        { time: "11:00", available: false, type: "video" },
        { time: "14:00", available: true, type: "video" },
        { time: "15:00", available: true, type: "chat" },
        { time: "16:00", available: true, type: "phone" },
      ],
    },
    {
      id: "2",
      name: "박민수 PB",
      region: "서초구",
      specialties: ["투자 상담", "자산 배분", "세금 최적화"],
      rating: 4.9,
      experience: 7,
      availableSlots: [
        { time: "09:30", available: true, type: "video" },
        { time: "10:30", available: true, type: "phone" },
        { time: "11:30", available: true, type: "video" },
        { time: "14:30", available: false, type: "video" },
        { time: "15:30", available: true, type: "chat" },
        { time: "16:30", available: true, type: "phone" },
      ],
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "video":
        return "화상 상담";
      case "phone":
        return "전화 상담";
      case "chat":
        return "채팅 상담";
      default:
        return "상담";
    }
  };

  const handlePBSelect = (pb: PBInfo) => {
    setSelectedPB(pb);
    setStep("select-time");
  };

  const handleTimeSelect = (time: string, type: "video" | "phone" | "chat") => {
    setSelectedTime(time);
    setSelectedType(type);
    setStep("client-info");
  };

  const handleClientInfoSubmit = () => {
    if (!clientInfo.name || !clientInfo.phone || !clientInfo.email) {
      Swal.fire({
        title: "필수 정보 누락",
        text: "이름, 전화번호, 이메일을 모두 입력해주세요.",
        icon: "warning",
        confirmButtonText: "확인",
        confirmButtonColor: "#f59e0b",
        customClass: {
          popup: "swal2-popup-custom",
          title: "swal2-title-custom",
        },
      });
      return;
    }
    setStep("confirm");
  };

  const handleBookingConfirm = async () => {
    setLoading(true);

    // 실제로는 API 호출로 예약 처리
    const booking = {
      id: Date.now().toString(),
      pbId: selectedPB?.id,
      pbName: selectedPB?.name,
      date: selectedDate,
      time: selectedTime,
      type: selectedType,
      clientInfo,
      status: "scheduled",
    };

    // 모의 API 호출 지연
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);

    if (onBookingComplete) {
      onBookingComplete(booking);
    }

    // SweetAlert2로 성공 알림 표시
    await Swal.fire({
      title: "상담 예약이 완료되었습니다! 🎉",
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <div style="margin-bottom: 15px;">
            <strong>📋 예약 정보</strong>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #666;">PB:</span> 
            <span style="font-weight: 600; margin-left: 10px;">${
              booking.pbName
            }</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #666;">상담 방식:</span> 
            <span style="font-weight: 600; margin-left: 10px;">${getTypeText(
              booking.type
            )}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #666;">날짜:</span> 
            <span style="font-weight: 600; margin-left: 10px;">${
              booking.date
            }</span>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="color: #666;">시간:</span> 
            <span style="font-weight: 600; margin-left: 10px;">${
              booking.time
            }</span>
          </div>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <div style="font-size: 14px; color: #0369a1;">
              📧 상담 전날 이메일로 상담 링크가 발송됩니다.<br/>
              📱 상담 30분 전 문자 알림을 받으실 수 있습니다.
            </div>
          </div>
        </div>
      `,
      icon: "success",
      confirmButtonText: "확인",
      confirmButtonColor: "#16a34a",
      width: "500px",
      customClass: {
        popup: "swal2-popup-custom",
        title: "swal2-title-custom",
        htmlContainer: "swal2-html-custom",
      },
    });

    // 초기화
    setStep("select-pb");
    setSelectedPB(null);
    setSelectedDate("");
    setSelectedTime("");
    setSelectedType("video");
    setClientInfo({
      name: "",
      phone: "",
      email: "",
      region: "",
      consultationPurpose: "",
      notes: "",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
          PB 상담 예약
        </h1>
        <p className="text-green-700 dark:text-green-300">
          전문 PB와 1:1 맞춤 상담을 예약하세요
        </p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex items-center justify-center space-x-4">
        {["PB 선택", "시간 선택", "정보 입력", "확인"].map(
          (stepName, index) => {
            const stepIndex = [
              "select-pb",
              "select-time",
              "client-info",
              "confirm",
            ].indexOf(step);
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;

            return (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? "bg-green-600 text-white"
                      : isCompleted
                      ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    isActive
                      ? "text-green-600 dark:text-green-400"
                      : isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stepName}
                </span>
                {index < 3 && (
                  <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* 단계별 콘텐츠 */}
      {step === "select-pb" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockPBs.map((pb) => (
            <Card
              key={pb.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-green-200 dark:border-green-800"
              onClick={() => handlePBSelect(pb)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-green-900 dark:text-green-100">
                      {pb.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {pb.region} 전담
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {renderStars(pb.rating)}
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                        {pb.rating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {pb.experience}년 경력
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    전문 분야:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pb.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {step === "select-time" && selectedPB && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("select-pb")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  {selectedPB.name} - 상담 시간 선택
                </CardTitle>
                <p className="text-green-700 dark:text-green-300">
                  원하시는 상담 방식과 시간을 선택해주세요
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  상담 날짜
                </Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  상담 시간 및 방식
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {selectedPB.availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={slot.available ? "outline" : "secondary"}
                      disabled={!slot.available}
                      onClick={() =>
                        slot.available && handleTimeSelect(slot.time, slot.type)
                      }
                      className={`flex items-center gap-2 ${
                        slot.available
                          ? "hover:bg-green-50 hover:border-green-300"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {getTypeIcon(slot.type)}
                      <span>{slot.time}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "client-info" && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("select-time")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  상담 정보 입력
                </CardTitle>
                <p className="text-green-700 dark:text-green-300">
                  상담에 필요한 기본 정보를 입력해주세요
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  이름 *
                </Label>
                <Input
                  id="name"
                  value={clientInfo.name}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, name: e.target.value })
                  }
                  className="mt-1"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  전화번호 *
                </Label>
                <Input
                  id="phone"
                  value={clientInfo.phone}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, phone: e.target.value })
                  }
                  className="mt-1"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  이메일 *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, email: e.target.value })
                  }
                  className="mt-1"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <Label
                  htmlFor="region"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  거주 지역
                </Label>
                <Input
                  id="region"
                  value={clientInfo.region}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, region: e.target.value })
                  }
                  className="mt-1"
                  placeholder="강남구"
                />
              </div>

              <div className="md:col-span-2">
                <Label
                  htmlFor="purpose"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  상담 목적
                </Label>
                <Select
                  value={clientInfo.consultationPurpose}
                  onValueChange={(value) =>
                    setClientInfo({ ...clientInfo, consultationPurpose: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="상담 목적을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio-analysis">
                      포트폴리오 분석
                    </SelectItem>
                    <SelectItem value="rebalancing">리밸런싱 상담</SelectItem>
                    <SelectItem value="risk-management">리스크 관리</SelectItem>
                    <SelectItem value="investment-strategy">
                      투자 전략
                    </SelectItem>
                    <SelectItem value="tax-optimization">
                      세금 최적화
                    </SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  추가 요청사항
                </Label>
                <Textarea
                  id="notes"
                  value={clientInfo.notes}
                  onChange={(e) =>
                    setClientInfo({ ...clientInfo, notes: e.target.value })
                  }
                  className="mt-1"
                  placeholder="상담 시 특별히 다루고 싶은 내용이 있다면 입력해주세요"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleClientInfoSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                다음
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("client-info")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  예약 확인
                </CardTitle>
                <p className="text-green-700 dark:text-green-300">
                  예약 정보를 확인하고 최종 예약을 완료해주세요
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  상담 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      PB:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {selectedPB?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      상담 방식:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {getTypeText(selectedType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      날짜:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {selectedDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      시간:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {selectedTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  고객 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      이름:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {clientInfo.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      전화번호:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {clientInfo.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      이메일:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {clientInfo.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      거주 지역:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {clientInfo.region || "미입력"}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      상담 목적:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {clientInfo.consultationPurpose || "미입력"}
                    </span>
                  </div>
                  {clientInfo.notes && (
                    <div className="md:col-span-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        추가 요청사항:
                      </span>
                      <p className="mt-1 text-gray-900 dark:text-gray-100">
                        {clientInfo.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleBookingConfirm}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "예약 중..." : "예약 완료"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
