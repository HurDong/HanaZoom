"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { API_ENDPOINTS } from "../config/api";

export default function ConnectionTest() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const testConnection = async () => {
    try {
      setStatus("loading");
      const response = await fetch(API_ENDPOINTS.health);
      if (response.ok) {
        setStatus("success");
        setMessage("백엔드 서버와 연결되었습니다!");
      } else {
        throw new Error("서버 응답이 올바르지 않습니다.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        "백엔드 서버와 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요."
      );
    }
  };

  return (
    <div className="p-4">
      <Button onClick={testConnection} disabled={status === "loading"}>
        {status === "loading" ? "연결 테스트 중..." : "백엔드 연결 테스트"}
      </Button>

      {status !== "idle" && (
        <Alert className="mt-4">
          <p>{message}</p>
        </Alert>
      )}
    </div>
  );
}
