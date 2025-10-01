// MongoDB 사용자 생성 스크립트
// Docker Compose의 MONGO_INITDB_ROOT_USERNAME은 root 사용자만 생성하므로
// 애플리케이션용 일반 사용자를 별도로 생성해야 합니다.

print("🔧 MongoDB 사용자 생성 시작...");

// hanazoom_chat 데이터베이스로 전환
db = db.getSiblingDB("hanazoom_chat");

// 애플리케이션용 사용자 생성
db.createUser({
  user: "hanazoom_mongo",
  pwd: "mongo1234!",
  roles: [
    {
      role: "readWrite",
      db: "hanazoom_chat",
    },
  ],
});

print("✅ hanazoom_mongo 사용자 생성 완료");

// 컬렉션 생성 (선택사항 - 첫 메시지 저장 시 자동 생성됨)
db.createCollection("region_chat_messages");

print("✅ region_chat_messages 컬렉션 생성 완료");
print("✅ MongoDB 초기화 완료!");
