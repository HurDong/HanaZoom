import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ refreshToken });
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return NextResponse.json(
      { error: "Failed to get refresh token" },
      { status: 500 }
    );
  }
}
