"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsultationCalendar from "./ConsultationCalendar";
import {
  Users,
  Calendar,
  MessageSquare,
  Video,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  MapPin,
  BarChart3,
} from "lucide-react";

interface PBConsultationDashboardProps {
  pbId: string;
  onStartConsultation?: (consultation: any) => void;
}

interface Consultation {
  id: string;
  clientName: string;
  clientRegion: string;
  scheduledTime: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  type: "video" | "phone" | "chat";
  duration: number;
  rating?: number;
  notes?: string;
}

interface Client {
  id: string;
  name: string;
  region: string;
  totalAssets: number;
  riskLevel: string;
  lastConsultation: string;
  nextScheduled: string;
  portfolioScore: number;
}

export default function PBConsultationDashboard({
  pbId,
  onStartConsultation,
}: PBConsultationDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제로는 API 호출로 데이터를 가져와야 함
    loadMockData();
  }, [pbId]);

  const loadMockData = () => {
    setLoading(true);

    // 모의 상담 데이터 (더 많은 데이터로 캘린더 테스트)
    const today = new Date();
    const mockConsultations: Consultation[] = [
      {
        id: "1",
        clientName: "김철수",
        clientRegion: "강남구",
        scheduledTime: new Date(
          today.getTime() + 24 * 60 * 60 * 1000
        ).toISOString(), // 내일
        status: "scheduled",
        type: "video",
        duration: 60,
      },
      {
        id: "2",
        clientName: "이영희",
        clientRegion: "서초구",
        scheduledTime: new Date(
          today.getTime() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // 모레
        status: "scheduled",
        type: "phone",
        duration: 30,
      },
      {
        id: "3",
        clientName: "박민수",
        clientRegion: "송파구",
        scheduledTime: new Date(
          today.getTime() - 24 * 60 * 60 * 1000
        ).toISOString(), // 어제
        status: "completed",
        type: "video",
        duration: 45,
        rating: 5,
        notes: "포트폴리오 리밸런싱 상담 완료",
      },
      {
        id: "today-1",
        clientName: "오늘상담1",
        clientRegion: "강남구",
        scheduledTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          14,
          0,
          0
        ).toISOString(), // 오늘 오후 2시
        status: "scheduled",
        type: "video",
        duration: 60,
        notes: "오늘 오후 2시 화상 상담",
      },
      {
        id: "today-2",
        clientName: "오늘상담2",
        clientRegion: "서초구",
        scheduledTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          16,
          30,
          0
        ).toISOString(), // 오늘 오후 4시 30분
        status: "scheduled",
        type: "phone",
        duration: 30,
        notes: "오늘 오후 4시 30분 전화 상담",
      },
      {
        id: "4",
        clientName: "최지영",
        clientRegion: "마포구",
        scheduledTime: new Date(
          today.getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // 3일 후
        status: "scheduled",
        type: "chat",
        duration: 20,
      },
      {
        id: "5",
        clientName: "정수현",
        clientRegion: "영등포구",
        scheduledTime: new Date(
          today.getTime() + 4 * 24 * 60 * 60 * 1000
        ).toISOString(), // 4일 후
        status: "scheduled",
        type: "video",
        duration: 90,
      },
      {
        id: "6",
        clientName: "한미영",
        clientRegion: "강동구",
        scheduledTime: new Date(
          today.getTime() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(), // 5일 후
        status: "scheduled",
        type: "phone",
        duration: 40,
      },
      {
        id: "7",
        clientName: "윤태호",
        clientRegion: "노원구",
        scheduledTime: new Date(
          today.getTime() + 6 * 24 * 60 * 60 * 1000
        ).toISOString(), // 6일 후
        status: "scheduled",
        type: "video",
        duration: 60,
      },
      {
        id: "8",
        clientName: "김서연",
        clientRegion: "은평구",
        scheduledTime: new Date(
          today.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7일 후
        status: "scheduled",
        type: "chat",
        duration: 25,
      },
    ];

    // 모의 고객 데이터
    const mockClients: Client[] = [
      {
        id: "1",
        name: "김철수",
        region: "강남구",
        totalAssets: 50000000,
        riskLevel: "보통",
        lastConsultation: "2024-01-10",
        nextScheduled: "2024-01-15",
        portfolioScore: 75,
      },
      {
        id: "2",
        name: "이영희",
        region: "서초구",
        totalAssets: 30000000,
        riskLevel: "낮음",
        lastConsultation: "2024-01-08",
        nextScheduled: "2024-01-15",
        portfolioScore: 85,
      },
      {
        id: "3",
        name: "박민수",
        region: "송파구",
        totalAssets: 80000000,
        riskLevel: "높음",
        lastConsultation: "2024-01-14",
        nextScheduled: "2024-01-20",
        portfolioScore: 65,
      },
    ];

    setConsultations(mockConsultations);
    setClients(mockClients);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "in-progress":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "completed":
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
      case "cancelled":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "예정";
      case "in-progress":
        return "진행중";
      case "completed":
        return "완료";
      case "cancelled":
        return "취소";
      default:
        return "알 수 없음";
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            PB 대시보드 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4 relative z-10">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-green-300/20 dark:bg-green-700/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-emerald-300/20 dark:bg-emerald-700/10 rounded-full blur-3xl"></div>
      </div>

      {/* 헤더 */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-green-900 dark:text-green-100">
            PB 상담 대시보드
          </h1>
          <p className="text-green-700 dark:text-green-300 mt-2 text-lg">
            고객 상담 및 포트폴리오 관리
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              const nextConsultation = consultations.find(
                (c) => c.status === "scheduled"
              );
              if (nextConsultation && onStartConsultation) {
                onStartConsultation(nextConsultation);
              }
            }}
          >
            <Video className="w-4 h-4 mr-2" />
            화상 상담 시작
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium uppercase tracking-wide">
                  오늘 예정 상담
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {consultations.filter((c) => c.status === "scheduled").length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">건</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                <Calendar className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium uppercase tracking-wide">
                  총 고객 수
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {clients.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">명</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium uppercase tracking-wide">
                  평균 만족도
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {consultations.filter((c) => c.rating).length > 0
                    ? (
                        consultations
                          .filter((c) => c.rating)
                          .reduce((sum, c) => sum + (c.rating || 0), 0) /
                        consultations.filter((c) => c.rating).length
                      ).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  / 5.0
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                <Star className="h-10 w-10 text-yellow-600 dark:text-yellow-400 fill-current" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium uppercase tracking-wide">
                  관리 자산 총액
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {(
                    clients.reduce(
                      (sum, client) => sum + client.totalAssets,
                      0
                    ) / 100000000
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">억원</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <TrendingUp className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 탭 */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 relative z-10"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            개요
          </TabsTrigger>
          <TabsTrigger
            value="consultations"
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            상담 관리
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            상담 일정
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            고객 관리
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 오늘의 상담 일정 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  오늘의 상담 일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultations
                    .filter((c) => c.status === "scheduled")
                    .map((consultation) => (
                      <div
                        key={consultation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getTypeIcon(consultation.type)}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {consultation.clientName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {consultation.clientRegion} •{" "}
                              {consultation.duration}분
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(
                              consultation.scheduledTime
                            ).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <Badge
                            className={getStatusColor(consultation.status)}
                          >
                            {getStatusText(consultation.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* 고객 포트폴리오 현황 */}
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  지역별 고객 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.region} • {client.riskLevel} 위험도
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {(client.totalAssets / 100000000).toFixed(1)}억원
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          포트폴리오 점수: {client.portfolioScore}점
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <ConsultationCalendar
            consultations={consultations}
            onEventClick={(event) => {
              console.log("상담 이벤트 클릭:", event);
              // 상담 상세 정보 모달이나 페이지로 이동
            }}
          />
        </TabsContent>

        <TabsContent value="consultations" className="space-y-4">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-green-900 dark:text-green-100">
                상담 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getTypeIcon(consultation.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {consultation.clientName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {consultation.clientRegion} • {consultation.duration}
                          분
                        </div>
                        {consultation.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {consultation.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date(
                            consultation.scheduledTime
                          ).toLocaleDateString("ko-KR")}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(
                            consultation.scheduledTime
                          ).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {consultation.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {consultation.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(consultation.status)}>
                        {getStatusText(consultation.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-green-900 dark:text-green-100">
                고객 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-lg">
                          {client.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {client.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {client.region} • {client.riskLevel} 위험도
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          마지막 상담:{" "}
                          {new Date(client.lastConsultation).toLocaleDateString(
                            "ko-KR"
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {(client.totalAssets / 100000000).toFixed(1)}억원
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        포트폴리오 점수: {client.portfolioScore}점
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        다음 상담:{" "}
                        {new Date(client.nextScheduled).toLocaleDateString(
                          "ko-KR"
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  상담 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      이번 달 상담 수
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {
                        consultations.filter((c) => c.status === "completed")
                          .length
                      }
                      건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      평균 상담 시간
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {consultations.length > 0
                        ? (
                            consultations.reduce(
                              (sum, c) => sum + c.duration,
                              0
                            ) / consultations.length
                          ).toFixed(0)
                        : 0}
                      분
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      고객 만족도
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {consultations.filter((c) => c.rating).length > 0
                        ? (
                            consultations
                              .filter((c) => c.rating)
                              .reduce((sum, c) => sum + (c.rating || 0), 0) /
                            consultations.filter((c) => c.rating).length
                          ).toFixed(1)
                        : "0.0"}
                      /5.0
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  고객 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      총 관리 자산
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {(
                        clients.reduce(
                          (sum, client) => sum + client.totalAssets,
                          0
                        ) / 100000000
                      ).toFixed(1)}
                      억원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      평균 포트폴리오 점수
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {clients.length > 0
                        ? (
                            clients.reduce(
                              (sum, client) => sum + client.portfolioScore,
                              0
                            ) / clients.length
                          ).toFixed(0)
                        : 0}
                      점
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      고위험 고객
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {clients.filter((c) => c.riskLevel === "높음").length}명
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
