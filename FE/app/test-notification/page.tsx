"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function TestNotificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  // 테스트 알림 생성
  const createTestNotification = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/test/notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setTestResult(JSON.stringify(result, null, 2));
        toast.success("테스트 알림이 생성되었습니다!");
      } else {
        setTestResult(JSON.stringify(result, null, 2));
        toast.error("테스트 알림 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("테스트 알림 생성 실패:", error);
      setTestResult(`에러 발생: ${error}`);
      toast.error("테스트 알림 생성 중 에러가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 헬스 체크
  const checkHealth = async () => {
    setIsLoading(true);
    setTestResult("");

    try {
      const response = await fetch("http://localhost:8080/api/test/health");
      const result = await response.json();

      if (response.ok) {
        setTestResult(JSON.stringify(result, null, 2));
        toast.success("서버가 정상 작동 중입니다!");
      } else {
        setTestResult(JSON.stringify(result, null, 2));
        toast.error("서버 상태 확인에 실패했습니다");
      }
    } catch (error) {
      console.error("헬스 체크 실패:", error);
      setTestResult(`에러 발생: ${error}`);
      toast.error("서버 연결에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          알림 시스템 테스트 페이지
        </h1>

        <div className="space-y-6">
          {/* 헬스 체크 */}
          <Card>
            <CardHeader>
              <CardTitle>서버 상태 확인</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={checkHealth}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "확인 중..." : "서버 상태 확인"}
              </Button>
            </CardContent>
          </Card>

          {/* 테스트 알림 생성 */}
          <Card>
            <CardHeader>
              <CardTitle>테스트 알림 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={createTestNotification}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "생성 중..." : "테스트 알림 생성"}
              </Button>
            </CardContent>
          </Card>

          {/* 결과 표시 */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle>테스트 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
                  {testResult}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 사용법 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>사용법</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                1. 먼저 "서버 상태 확인"을 클릭하여 백엔드가 정상 작동하는지
                확인하세요.
              </p>
              <p>2. "테스트 알림 생성"을 클릭하여 샘플 알림을 생성하세요.</p>
              <p>
                3. 생성된 알림은 Navbar의 알림 아이콘에서 확인할 수 있습니다.
              </p>
              <p>4. 백엔드 서버가 실행 중이어야 합니다 (localhost:8080).</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
