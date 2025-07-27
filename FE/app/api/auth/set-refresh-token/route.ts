import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    // refreshToken을 httpOnly 쿠키로 설정
    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting refresh token:", error);
    return NextResponse.json(
      { error: "Failed to set refresh token" },
      { status: 500 }
    );
  }
}
