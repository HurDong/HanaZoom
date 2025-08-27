import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// This route exchanges the httpOnly refresh token cookie for a new access token
export async function GET() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found" },
        { status: 404 }
      );
    }

    // Call backend to refresh tokens
    const backendBaseUrl =
      process.env.BACKEND_BASE_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${backendBaseUrl}/members/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      // Do NOT forward credentials here; this is a server-to-server call
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend refresh failed: ${text || res.statusText}` },
        { status: 401 }
      );
    }

    const json = await res.json();
    // Backend returns ApiResponse<T>
    const success = json?.success;
    const data = json?.data;

    if (!success || !data?.accessToken) {
      return NextResponse.json(
        { error: "Invalid refresh response" },
        { status: 401 }
      );
    }

    // Optionally update refresh token if backend rotated it
    if (data.refreshToken) {
      const mutCookieStore = await cookies();
      mutCookieStore.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return NextResponse.json({ accessToken: data.accessToken });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return NextResponse.json(
      { error: "Failed to refresh access token" },
      { status: 500 }
    );
  }
}
