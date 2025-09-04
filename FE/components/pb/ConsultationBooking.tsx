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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar as CalendarIcon,
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
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/app/utils/auth";
import Swal from "sweetalert2";

interface ConsultationBookingProps {
  pbId: string;
  onBookingComplete?: (booking: any) => void;
}

interface ConsultationType {
  type: string;
  displayName: string;
  defaultFee: number;
  defaultDurationMinutes: number;
  description: string;
}

interface PBInfo {
  id: string;
  name: string;
  region: string;
  rating: number;
  totalConsultations: number;
  specialties: string[];
  experience: number;
}

export default function ConsultationBooking({
  pbId,
  onBookingComplete,
}: ConsultationBookingProps) {
  const { accessToken } = useAuthStore();
  const [step, setStep] = useState<
    "select-type" | "select-pb" | "select-time" | "client-info" | "confirm"
  >("select-type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPB, setSelectedPB] = useState<PBInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientMessage, setClientMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [pbList, setPbList] = useState<PBInfo[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [timeSlotsStatus, setTimeSlotsStatus] = useState<Record<string, boolean>>({});
  const [isLoadingPbList, setIsLoadingPbList] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  // 시간 옵션 생성
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  useEffect(() => {
    // 상담 유형 목록 로드
    fetchConsultationTypes();
    // PB 목록 로드
    fetchPbList();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedPB) {
      // 선택된 날짜와 PB에 대한 가능한 시간 조회
      fetchAvailableTimes();
    }
  }, [selectedDate, selectedPB]);

  const fetchConsultationTypes = async () => {
    try {
      const response = await fetch('/api/consultations/types', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setConsultationTypes(data.data);
      }
    } catch (error) {
      console.error('상담 유형 로드 실패:', error);
    }
  };

  const fetchPbList = async () => {
    setIsLoadingPbList(true);
    try {
      const response = await fetch('/api/pb/list', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        // 백엔드 응답을 프론트엔드 인터페이스에 맞게 변환
        const pbList: PbInfo[] = data.data.content.map((pb: any) => ({
          id: pb.id,
          name: pb.name,
          region: pb.region || pb.regionName,
          rating: pb.rating || 0,
          totalConsultations: pb.totalConsultations || 0,
          specialties: pb.specialties || [],
          experience: pb.experienceYears || 0
        }));
        setPbList(pbList);
      } else {
        console.error('PB 목록 로드 실패:', data.message);
        setError('PB 목록을 불러오는데 실패했습니다.');
        setPbList([]);
      }
    } catch (error) {
      console.error('PB 목록 로드 실패:', error);
      setError('PB 목록을 불러오는데 실패했습니다.');
      setPbList([]);
    } finally {
      setIsLoadingPbList(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!selectedDate || !selectedPB) {
      setAvailableTimes([]);
      setTimeSlotsStatus({});
      return;
    }

    setIsLoadingTimes(true);
    try {
      // 선택된 날짜와 PB에 대한 시간 슬롯 상태 조회 (로컬 시간 기준)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('시간 슬롯 조회 요청:', { 
        pbId: selectedPB.id, 
        pbName: selectedPB.name,
        date: dateStr,
        selectedDate: selectedDate.toISOString(),
        selectedDateLocal: selectedDate.toLocaleDateString(),
        selectedDateUTC: selectedDate.toUTCString()
      });
      
      const response = await fetch(`/api/consultations/time-slots?pbId=${selectedPB.id}&date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        const slotsStatus = data.data || {};
        setTimeSlotsStatus(slotsStatus);
        
        // 디버깅을 위한 로그
        console.log('시간 슬롯 상태:', slotsStatus);
        const unavailableTimes = Object.entries(slotsStatus).filter(([_, isAvailable]) => !isAvailable);
        console.log('예약 불가능한 시간:', unavailableTimes);
        console.log('12:00 시간 상태:', slotsStatus['12:00']);
        
        // 예약 가능한 시간만 추출
        const availableTimesList = Object.entries(slotsStatus)
          .filter(([_, isAvailable]) => isAvailable)
          .map(([time, _]) => time);
        setAvailableTimes(availableTimesList);
      } else {
        console.error('시간 슬롯 상태 조회 실패:', data.message);
        // 에러 시 모든 시간을 예약 가능한 것으로 설정
        const allAvailable = timeSlots.reduce((acc, time) => {
          acc[time] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setTimeSlotsStatus(allAvailable);
        setAvailableTimes(timeSlots);
      }
    } catch (error) {
      console.error('시간 슬롯 상태 조회 실패:', error);
      // 네트워크 오류 시 모든 시간을 예약 가능한 것으로 설정
      const allAvailable = timeSlots.reduce((acc, time) => {
        acc[time] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTimeSlotsStatus(allAvailable);
      setAvailableTimes(timeSlots);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setStep("select-pb");
  };

  const handlePBSelect = (pb: PBInfo) => {
    setSelectedPB(pb);
    setStep("select-time");
  };

  const handleTimeSelect = (time: string) => {
    // 예약 가능한 시간인지 확인
    const isAvailable = timeSlotsStatus[time];
    if (!isAvailable) {
      setError("이미 예약된 시간입니다. 다른 시간을 선택해주세요.");
      return;
    }
    
    setSelectedTime(time);
    setStep("client-info");
    
    // 시간 선택 후 가능한 시간 목록을 다시 로드하여 최신 상태 확인
    if (selectedDate && selectedPB) {
      setTimeout(() => {
        fetchAvailableTimes();
      }, 1000); // 1초 후에 다시 로드
    }
  };

  const handleClientInfoSubmit = async () => {
    if (!clientMessage.trim()) {
      setError("상담 요청 내용을 입력해주세요.");
      return;
    }
    
    // 예약 확인 전에 선택한 시간이 여전히 가능한지 확인
    if (selectedDate && selectedPB && selectedTime) {
      try {
        // 로컬 시간 기준으로 날짜 생성
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const response = await fetch(`/api/consultations/available-times?pbId=${selectedPB.id}&date=${dateStr}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
      });
        const data = await response.json();
        
        if (data.success && data.data) {
          const availableTimes = data.data;
          if (!availableTimes.includes(selectedTime)) {
            setError("선택하신 시간이 더 이상 예약 가능하지 않습니다. 다른 시간을 선택해주세요.");
            setStep("select-time");
      return;
    }
        }
      } catch (error) {
        console.error('시간 확인 실패:', error);
        // 시간 확인 실패해도 계속 진행 (네트워크 오류 등)
      }
    }
    
    setStep("confirm");
  };

  const handleBookingConfirm = async () => {
    setLoading(true);
    setError("");

    if (!selectedDate || !selectedTime || !selectedType || !selectedPB || !clientMessage.trim()) {
      setError("모든 필수 항목을 입력해주세요.");
      setLoading(false);
      return;
    }

    try {
      const selectedTypeData = consultationTypes.find(type => type.type === selectedType);
      
      // 로컬 시간 기준으로 예약 시간 생성
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      console.log('시간 설정 디버깅:', {
        selectedTime,
        hours,
        minutes,
        scheduledAt: scheduledAt.toISOString(),
        scheduledAtLocal: scheduledAt.toLocaleString(),
        scheduledAtHours: scheduledAt.getHours()
      });
      
      // 로컬 시간을 ISO 문자열로 변환 (시간대 정보 포함)
      const localISOTime = scheduledAt.getFullYear() + '-' +
        String(scheduledAt.getMonth() + 1).padStart(2, '0') + '-' +
        String(scheduledAt.getDate()).padStart(2, '0') + 'T' +
        String(scheduledAt.getHours()).padStart(2, '0') + ':' +
        String(scheduledAt.getMinutes()).padStart(2, '0') + ':00';

      const requestData = {
        pbId: selectedPB.id,
        consultationType: selectedType,
        scheduledAt: localISOTime,
        durationMinutes: selectedTypeData?.defaultDurationMinutes || 60,
        fee: selectedTypeData?.defaultFee || 50000,
        clientMessage: clientMessage.trim()
      };

      if (!accessToken) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("상담 예약이 성공적으로 요청되었습니다. PB의 승인을 기다려주세요.");

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
                <span style="font-weight: 600; margin-left: 10px;">${selectedPB.name}</span>
          </div>
          <div style="margin-bottom: 8px;">
                <span style="color: #666;">상담 유형:</span> 
                <span style="font-weight: 600; margin-left: 10px;">${selectedTypeData?.displayName}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="color: #666;">날짜:</span> 
                <span style="font-weight: 600; margin-left: 10px;">${format(selectedDate, "yyyy-MM-dd", { locale: ko })}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="color: #666;">시간:</span> 
                <span style="font-weight: 600; margin-left: 10px;">${selectedTime}</span>
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

        if (onBookingComplete) {
          onBookingComplete(data.data);
        }

        // 폼 초기화
        setStep("select-type");
        setSelectedType("");
    setSelectedPB(null);
        setSelectedDate(undefined);
    setSelectedTime("");
        setClientMessage("");
      } else {
        // 시간 충돌 오류인 경우 특별 처리
        if (data.message && data.message.includes("이미 예약된 상담")) {
          setError("선택하신 시간에 이미 예약된 상담이 있습니다. 다른 시간을 선택해주세요.");
          // 시간 목록을 다시 로드하여 최신 상태 반영
          if (selectedDate && selectedPB) {
            fetchAvailableTimes();
          }
        } else {
          setError(data.message || "상담 예약 요청에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error('상담 예약 요청 실패:', error);
      setError("상담 예약 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
        {["상담 유형", "PB 선택", "시간 선택", "정보 입력", "확인"].map(
          (stepName, index) => {
            const stepIndex = [
              "select-type",
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
      {step === "select-type" && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg text-green-900 dark:text-green-100">
              상담 유형 선택
            </CardTitle>
            <p className="text-green-700 dark:text-green-300">
              원하는 상담 유형을 선택해주세요
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultationTypes.map((type) => (
                <Card
                  key={type.type}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-green-200 dark:border-green-800"
                  onClick={() => handleTypeSelect(type.type)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900 dark:text-green-100">
                      {type.displayName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{type.defaultDurationMinutes}분</span>
                      <span>•</span>
                      <span>{type.defaultFee.toLocaleString()}원</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {type.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "select-pb" && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("select-type")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  담당 PB 선택
                </CardTitle>
                <p className="text-green-700 dark:text-green-300">
                  상담을 받고 싶은 PB를 선택해주세요
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPbList ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">PB 목록을 불러오는 중...</span>
              </div>
            ) : pbList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">사용 가능한 PB가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pbList.map((pb) => (
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          총 {pb.totalConsultations}건 상담 완료
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
            )}
          </CardContent>
        </Card>
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
                  원하시는 날짜와 시간을 선택해주세요
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
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: ko }) : "날짜를 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setIsCalendarOpen(false); // 날짜 선택 시 캘린더 닫기
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={ko}
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  상담 시간
                </Label>
                
                {/* 시간 상태 범례 */}
                <div className="flex items-center gap-4 mt-2 mb-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">선택됨</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">예약 가능</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">예약 불가</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                  {isLoadingTimes ? (
                    <div className="col-span-full text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">시간 조회 중...</span>
                    </div>
                  ) : Object.keys(timeSlotsStatus).length === 0 ? (
                    <div className="col-span-full text-center py-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-center justify-center mb-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <span className="text-yellow-800 dark:text-yellow-200 font-medium">예약 가능한 시간이 없습니다</span>
                        </div>
                        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                          선택한 날짜에는 이미 모든 시간이 예약되어 있습니다.<br/>
                          다른 날짜를 선택해주세요.
                        </p>
                      </div>
                    </div>
                  ) : (
                    timeSlots.map((time) => {
                      const isAvailable = timeSlotsStatus[time] || false;
                      const isSelected = selectedTime === time;
                      
                      return (
                    <Button
                          key={time}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => isAvailable && handleTimeSelect(time)}
                          disabled={!isAvailable}
                          className={`${
                            isSelected 
                              ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md" 
                              : isAvailable
                              ? "hover:bg-green-50 hover:border-green-300 cursor-pointer bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                              : "bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 border-red-200 dark:border-red-800 cursor-not-allowed opacity-60"
                          } transition-all duration-200`}
                          title={!isAvailable ? "이미 예약된 시간입니다" : ""}
                        >
                          {time}
                    </Button>
                      );
                    })
                  )}
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
                  상담 요청 내용
                </CardTitle>
                <p className="text-green-700 dark:text-green-300">
                  상담하고 싶은 내용을 자세히 작성해주세요
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="client-message"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  상담 요청 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="client-message"
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  placeholder="상담하고 싶은 내용을 자세히 작성해주세요..."
                  rows={6}
                  className="mt-1 resize-none"
                />
            </div>

              {/* 에러 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
              <Button
                onClick={handleClientInfoSubmit}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                다음
              </Button>
              </div>
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
                      상담 유형:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {consultationTypes.find(type => type.type === selectedType)?.displayName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      날짜:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {selectedDate ? format(selectedDate, "yyyy-MM-dd", { locale: ko }) : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      시간:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {selectedTime}
                    </span>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 dark:text-green-400">
                        예약 가능한 시간으로 확인됨
                    </span>
                  </div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      상담 시간:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {consultationTypes.find(type => type.type === selectedType)?.defaultDurationMinutes}분
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      상담 수수료:
                    </span>
                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                      {consultationTypes.find(type => type.type === selectedType)?.defaultFee.toLocaleString()}원
                    </span>
                  </div>
                  </div>
                  </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  상담 요청 내용
                </h3>
                <div className="text-sm">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {clientMessage}
                      </p>
                    </div>
              </div>

              {/* 에러/성공 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                  </AlertDescription>
                </Alert>
              )}
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
