import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // refreshToken 쿠키 제거 - Next.js 15에서는 await 필요
    const cookieStore = await cookies();
    cookieStore.delete("refreshToken");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing refresh token:", error);
    return NextResponse.json(
      { error: "Failed to remove refresh token" },
      { status: 500 }
    );
  }
}
