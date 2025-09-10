"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/utils/auth";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";
import { 
  getUserSettings, 
  updateUserSettings, 
  updateTheme, 
  updateCustomCursor, 
  updateEmojiAnimation 
} from "@/lib/api/userSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Palette, 
  MousePointer, 
  Sparkles, 
  Bell, 
  Map, 
  BarChart3, 
  RefreshCw, 
  Layout,
  Save,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { 
    settings, 
    isLoading, 
    error, 
    isInitialized,
    loadSettings,
    updateSettings,
    updateTheme: updateThemeStore,
    updateCustomCursor: updateCustomCursorStore,
    updateEmojiAnimation: updateEmojiAnimationStore,
    resetToDefaults,
    setLoading,
    setError,
    setInitialized
  } = useUserSettingsStore();

  const [isSaving, setIsSaving] = useState(false);

  // 로그인 확인
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  // 설정 로드
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user || isInitialized) return;
      
      try {
        setLoading(true);
        setError(null);
        const userSettings = await getUserSettings();
        loadSettings(userSettings);
        console.log('✅ 사용자 설정 로드 완료:', userSettings);
      } catch (error: any) {
        console.error('❌ 사용자 설정 로드 실패:', error);
        setError(error.message);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user, isInitialized, loadSettings, setLoading, setError]);

  // 테마 변경 핸들러
  const handleThemeChange = async (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    try {
      setIsSaving(true);
      await updateTheme(theme);
      updateThemeStore(theme);
      toast.success('테마가 변경되었습니다.');
    } catch (error: any) {
      console.error('❌ 테마 변경 실패:', error);
      toast.error('테마 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 커스텀 커서 변경 핸들러
  const handleCustomCursorChange = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      await updateCustomCursor(enabled);
      updateCustomCursorStore(enabled);
      toast.success('마우스 커서 설정이 변경되었습니다.');
    } catch (error: any) {
      console.error('❌ 커스텀 커서 변경 실패:', error);
      toast.error('마우스 커서 설정 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 이모지 애니메이션 변경 핸들러
  const handleEmojiAnimationChange = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      await updateEmojiAnimation(enabled);
      updateEmojiAnimationStore(enabled);
      toast.success('이모지 애니메이션 설정이 변경되었습니다.');
    } catch (error: any) {
      console.error('❌ 이모지 애니메이션 변경 실패:', error);
      toast.error('이모지 애니메이션 설정 변경에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 설정 초기화 핸들러
  const handleResetToDefaults = () => {
    resetToDefaults();
    toast.success('설정이 기본값으로 초기화되었습니다.');
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <div className="fixed top-16 left-0 right-0 z-[60]">
          <StockTicker />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      {/* 마우스 커서 (설정에 따라 표시) */}
      {settings.customCursorEnabled && <MouseFollower />}

      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      {/* Floating Stock Symbols (설정에 따라 표시) */}
      {settings.emojiAnimationEnabled && (
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
      )}

      {/* NavBar */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      {/* Stock Ticker */}
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 pt-36 pb-8 px-4 max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            <Settings className="inline-block mr-3 h-10 w-10 text-green-500" />
            사용자 설정
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            개인화된 웹 경험을 위한 설정을 관리하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 설정 카드들 */}
        <div className="space-y-6">
          {/* 테마 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-green-500" />
                테마 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme-select">테마 선택</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    앱의 색상 테마를 선택하세요
                  </p>
                </div>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'LIGHT' | 'DARK' | 'SYSTEM') => handleThemeChange(value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIGHT">라이트</SelectItem>
                    <SelectItem value="DARK">다크</SelectItem>
                    <SelectItem value="SYSTEM">시스템</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs">
                현재: {settings.theme === 'LIGHT' ? '라이트' : settings.theme === 'DARK' ? '다크' : '시스템 (자동)'}
              </Badge>
            </CardContent>
          </Card>

          {/* UI 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-green-500" />
                UI 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 커스텀 커서 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="custom-cursor" className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    커스텀 마우스 커서
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    주식 관련 커스텀 마우스 커서를 사용합니다
                  </p>
                </div>
                <Switch
                  id="custom-cursor"
                  checked={settings.customCursorEnabled}
                  onCheckedChange={handleCustomCursorChange}
                  disabled={isSaving}
                />
              </div>

              <Separator />

              {/* 이모지 애니메이션 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emoji-animation" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    이모지 애니메이션
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    페이지에 떠다니는 이모지 애니메이션을 표시합니다
                  </p>
                </div>
                <Switch
                  id="emoji-animation"
                  checked={settings.emojiAnimationEnabled}
                  onCheckedChange={handleEmojiAnimationChange}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* 알림 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-500" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notifications">푸시 알림</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    중요한 주식 정보나 업데이트에 대한 알림을 받습니다
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotificationsEnabled}
                  onCheckedChange={(enabled) => updateSettings({ pushNotificationsEnabled: enabled })}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* 지도 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-green-500" />
                지도 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="map-zoom">기본 줌 레벨</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    지도가 처음 로드될 때의 줌 레벨입니다
                  </p>
                </div>
                <Select 
                  value={settings.defaultMapZoom.toString()} 
                  onValueChange={(value) => updateSettings({ defaultMapZoom: parseInt(value) })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 (광역)</SelectItem>
                    <SelectItem value="7">7 (시/도)</SelectItem>
                    <SelectItem value="8">8 (시/군/구)</SelectItem>
                    <SelectItem value="9">9 (동/면)</SelectItem>
                    <SelectItem value="10">10 (상세)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 차트 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                차트 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="chart-theme">차트 테마</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    차트의 색상 테마를 선택하세요
                  </p>
                </div>
                <Select 
                  value={settings.chartTheme} 
                  onValueChange={(value: 'GREEN' | 'BLUE' | 'PURPLE' | 'ORANGE') => 
                    updateSettings({ chartTheme: value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GREEN">녹색</SelectItem>
                    <SelectItem value="BLUE">파란색</SelectItem>
                    <SelectItem value="PURPLE">보라색</SelectItem>
                    <SelectItem value="ORANGE">주황색</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 실시간 업데이트 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-500" />
                실시간 업데이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh">자동 새로고침 간격</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    주식 데이터가 자동으로 업데이트되는 간격입니다
                  </p>
                </div>
                <Select 
                  value={settings.autoRefreshInterval.toString()} 
                  onValueChange={(value) => updateSettings({ autoRefreshInterval: parseInt(value) })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1분</SelectItem>
                    <SelectItem value="300">5분</SelectItem>
                    <SelectItem value="600">10분</SelectItem>
                    <SelectItem value="1800">30분</SelectItem>
                    <SelectItem value="0">비활성화</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 액션 버튼들 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleResetToDefaults}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4" />
                  기본값으로 초기화
                </Button>
                <Button
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  완료
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
