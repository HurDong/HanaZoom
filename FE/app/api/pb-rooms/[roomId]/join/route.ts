import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const { roomId } = params;
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    const response = await fetch(`${backendUrl}/api/pb-rooms/${roomId}/join`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.error || data.message || "방 참여에 실패했습니다" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("방 참여 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
