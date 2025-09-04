"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, MapPin, Star, Users, Calendar as CalendarIcon, MessageSquare, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ko as koDayPicker } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Navbar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { useAuthStore } from "@/app/utils/auth";

interface ConsultationType {
  type: string;
  displayName: string;
  defaultFee: number;
  defaultDurationMinutes: number;
  description: string;
}

interface PbInfo {
  id: string;
  name: string;
  region: string;
  rating: number;
  totalConsultations: number;
  specialties: string[];
  experience: number;
}

export default function PBConsultationPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPb, setSelectedPb] = useState<string>("");
  const [clientMessage, setClientMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [pbList, setPbList] = useState<PbInfo[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
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
    if (selectedDate && selectedPb) {
      // 선택된 날짜와 PB에 대한 가능한 시간 조회
      fetchAvailableTimes();
    }
  }, [selectedDate, selectedPb]);

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
    if (!selectedDate || !selectedPb) {
      setAvailableTimes([]);
      return;
    }

    setIsLoadingTimes(true);
    try {
      // 선택된 날짜와 PB에 대한 가능한 시간 조회
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/consultations/available-times?pbId=${selectedPb}&date=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableTimes(data.data || timeSlots); // 백엔드에서 시간 목록을 받거나 기본 시간 사용
      } else {
        console.error('가능한 시간 조회 실패:', data.message);
        setAvailableTimes(timeSlots); // 에러 시 기본 시간 사용
      }
    } catch (error) {
      console.error('가능한 시간 조회 실패:', error);
      setAvailableTimes(timeSlots); // 네트워크 오류 시 기본 시간 사용
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDate || !selectedTime || !selectedType || !selectedPb || !clientMessage.trim()) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTypeData = consultationTypes.find(type => type.type === selectedType);
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const requestData = {
        pbId: selectedPb,
        consultationType: selectedType,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: selectedTypeData?.defaultDurationMinutes || 60,
        fee: selectedTypeData?.defaultFee || 50000,
        clientMessage: clientMessage.trim()
      };

      if (!accessToken) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
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
        // 폼 초기화
        setSelectedDate(undefined);
        setSelectedTime("");
        setSelectedType("");
        setSelectedPb("");
        setClientMessage("");
      } else {
        setError(data.message || "상담 예약 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error('상담 예약 요청 실패:', error);
      setError("상담 예약 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeData = consultationTypes.find(type => type.type === selectedType);
  const selectedPbData = pbList.find(pb => pb.id === selectedPb);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
          📈
        </div>
        <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
          💰
        </div>
        <div className="floating-symbol absolute top-60 left-1/4 text-green-400 dark:text-green-300 text-lg animate-bounce delay-300">
          🚀
        </div>
        <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
          💎
        </div>
        <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
          📊
        </div>
        <div className="floating-symbol absolute top-32 right-1/3 text-emerald-400 dark:text-emerald-300 text-lg animate-pulse delay-200">
          🎯
        </div>
      </div>

      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <Navbar />
      </div>

      {/* Mouse Follower */}
      <MouseFollower />

      {/* Main Content */}
      <main className="relative z-10 pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              PB 상담 예약
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              전문 PB와 함께하는 맞춤형 투자 상담을 예약하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 상담 예약 폼 */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CalendarIcon className="h-5 w-5" />
                    상담 예약 정보
                  </CardTitle>
                  <CardDescription>
                    원하는 상담 유형과 시간을 선택해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 상담 유형 선택 */}
                    <div className="space-y-2">
                      <Label htmlFor="consultation-type" className="text-sm font-medium">
                        상담 유형 <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue placeholder="상담 유형을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {consultationTypes.map((type) => (
                            <SelectItem key={type.type} value={type.type}>
                              <div className="flex flex-col">
                                <span className="font-medium">{type.displayName}</span>
                                <span className="text-xs text-gray-500">
                                  {type.defaultDurationMinutes}분 • {type.defaultFee.toLocaleString()}원
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTypeData && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTypeData.description}
                        </p>
                      )}
                    </div>

                    {/* PB 선택 */}
                    <div className="space-y-2">
                      <Label htmlFor="pb-select" className="text-sm font-medium">
                        담당 PB <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedPb} onValueChange={setSelectedPb} disabled={isLoadingPbList}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingPbList ? "PB 목록 로딩 중..." : "담당 PB를 선택하세요"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingPbList ? (
                            <SelectItem value="loading" disabled>
                              PB 목록을 불러오는 중...
                            </SelectItem>
                          ) : pbList.length === 0 ? (
                            <SelectItem value="no-pb" disabled>
                              사용 가능한 PB가 없습니다
                            </SelectItem>
                          ) : (
                            pbList.map((pb) => (
                              <SelectItem key={pb.id} value={pb.id}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{pb.name}</span>
                                    <span className="text-xs text-gray-500">{pb.region}</span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-4">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">{pb.rating}</span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 날짜 선택 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        예약 날짜 <span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
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
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            locale={ko}
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* 시간 선택 */}
                    <div className="space-y-2">
                      <Label htmlFor="time-select" className="text-sm font-medium">
                        예약 시간 <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate || !selectedPb || isLoadingTimes}>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !selectedDate || !selectedPb ? "날짜와 PB를 먼저 선택하세요" :
                            isLoadingTimes ? "가능한 시간 조회 중..." : "시간을 선택하세요"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTimes ? (
                            <SelectItem value="loading-times" disabled>
                              가능한 시간을 조회하는 중...
                            </SelectItem>
                          ) : availableTimes.length === 0 ? (
                            <SelectItem value="no-times" disabled>
                              선택한 날짜에 가능한 시간이 없습니다
                            </SelectItem>
                          ) : (
                            availableTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 상담 요청 메시지 */}
                    <div className="space-y-2">
                      <Label htmlFor="client-message" className="text-sm font-medium">
                        상담 요청 내용 <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="client-message"
                        placeholder="상담하고 싶은 내용을 자세히 작성해주세요..."
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
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

                    {/* 제출 버튼 */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? "예약 요청 중..." : "상담 예약 요청"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* 선택된 정보 요약 */}
            <div className="space-y-6">
              {/* 선택된 PB 정보 */}
              {selectedPbData && (
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400">선택된 PB</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedPbData.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPbData.region}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{selectedPbData.rating}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({selectedPbData.totalConsultations}건 상담)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">전문 분야</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPbData.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{selectedPbData.experience}년 경력</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 상담 요약 */}
              {selectedTypeData && selectedDate && selectedTime && (
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400">상담 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">상담 유형</span>
                      <span className="text-sm font-medium">{selectedTypeData.displayName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">예약 일시</span>
                      <span className="text-sm font-medium">
                        {format(selectedDate, "MM/dd", { locale: ko })} {selectedTime}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">상담 시간</span>
                      <span className="text-sm font-medium">{selectedTypeData.defaultDurationMinutes}분</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">상담 수수료</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {selectedTypeData.defaultFee.toLocaleString()}원
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 안내사항 */}
              <Card className="backdrop-blur-sm bg-blue-50/80 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-400 text-sm">안내사항</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-600 dark:text-blue-300 space-y-2">
                  <p>• 상담 예약 후 PB의 승인을 받아야 상담이 확정됩니다.</p>
                  <p>• 상담 1시간 전까지 취소 가능합니다.</p>
                  <p>• 상담 수수료는 상담 완료 후 결제됩니다.</p>
                  <p>• 화상 상담 링크는 상담 시작 전에 안내드립니다.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
