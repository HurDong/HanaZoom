import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";

// Redis 클라이언트 설정
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "16379", 10),
  password: process.env.REDIS_PASSWORD || "redis1234!",
});

// Redis에서 주식 데이터를 가져오는 함수
async function getRedisStockData() {
  try {
    // Redis에서 "stock:price:"로 시작하는 모든 키를 가져옵니다
    const keys = await redis.keys("stock:price:*");
    if (keys.length === 0) {
      console.warn("Redis에서 'stock:price:*' 패턴의 키를 찾을 수 없습니다.");
      return [];
    }

    // 모든 키에 해당하는 값을 한 번에 가져옵니다
    const values = await redis.mget(keys);

    const stockData = keys
      .map((key, index) => {
        const value = values[index];
        return { key, value: typeof value === "string" ? value : "" };
      })
      .filter((item) => item.value); // 값이 null인 경우 제외

    console.log(
      `Redis에서 ${stockData.length}개의 주식 데이터를 가져왔습니다.`
    );
    return stockData;
  } catch (error) {
    console.error("Redis 데이터 가져오기 실패:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const stocks = await getRedisStockData();

    return NextResponse.json({
      success: true,
      stocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Redis 데이터 가져오기 실패",
      },
      { status: 500 }
    );
  }
}
