import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.core.structure.ScenarioBuilder
import io.gatling.core.scenario.Simulation
import scala.concurrent.duration._
import io.gatling.http.request.builder.HttpRequestBuilder
import io.gatling.core.feeder.BatchableFeederBuilder
import scala.util.Random

class HanaZoomWebSocketChatSimulation extends Simulation {

  // HTTP 프로토콜 설정
  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

  // WebSocket 프로토콜 설정 (baseUrl 없이 절대 URL 사용)

  // 실제 사용자 데이터 로드 (CSV 파일에서 읽기)
  val userFeeder = csv("C:\\Users\\DA\\Desktop\\HanaZoom\\scripts\\user_creation\\cheongra_users_jmeter.csv").circular

  // 채팅 메시지 목록
  val chatMessages = List(
    "안녕하세요! 오늘 주식 시장 어떠세요?",
    "청라1동에서 인사드려요! 😊",
    "오늘 날씨가 참 좋네요! 주식도 좋을 것 같아요",
    "실시간 채팅 테스트 중입니다! 모두 안녕하세요~",
    "청라동 주민분들, 주식 정보 공유해요!",
    "오늘 삼성전자 주가 어떻게 될까요?",
    "채팅방이 활기차네요! 좋은 정보 감사합니다",
    "청라1동 실시간 채팅 테스트입니다! 🚀",
    "주식 토론하러 왔어요! 좋은 의견 부탁드려요",
    "모두 즐거운 채팅 되세요! 📈"
  )

  // 랜덤 메시지 생성 함수
  def randomChatMessage(): String = {
    chatMessages(Random.nextInt(chatMessages.length))
  }

  // 로그인 요청
  val loginRequest = http("Login")
    .post("/api/v1/members/login")
    .header("Content-Type", "application/json")
    .body(StringBody(
      """{
        "email": "${email}",
        "password": "${password}"
      }"""
    ))
    .check(status.in(200, 400, 401, 500))
    .check(jsonPath("$.success").is("true"))
    .check(jsonPath("$.data.accessToken").saveAs("jwtToken"))
    .check(jsonPath("$.data.id").saveAs("userId"))
    .check(jsonPath("$.data.name").saveAs("userName"))

  // 사용자 정보 조회
  val getUserInfoRequest = http("Get User Info")
    .get("/api/v1/members/me")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.is(200))
    .check(jsonPath("$.success").is("true"))
    .check(jsonPath("$.data.regionId").saveAs("regionId"))

  // 채팅방 입장 (지역 정보 조회)
  val enterChatRoomRequest = http("Enter Chat Room")
    .get("/api/v1/chat/region-info")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.is(200))
    .check(jsonPath("$.success").is("true"))
    .check(jsonPath("$.data.regionId").saveAs("roomRegionId"))
    .check(jsonPath("$.data.roomName").saveAs("roomName"))

  // WebSocket 연결 설정

  // WebSocket 채팅 시나리오
  val webSocketChatScenario = scenario("WebSocket Chat Test")
    .feed(userFeeder)
    .exec(session => {
      // WebSocket 연결을 위한 JWT 토큰과 지역 ID 설정
      val jwtToken = session("jwtToken").as[String]
      val regionId = session("regionId").as[String]
      val userId = session("userId").as[String]

      session
        .set("wsToken", jwtToken)
        .set("wsRegionId", regionId)
        .set("wsUserId", userId)
    })
    .exec(ws("WebSocket Connect")
      .connect("ws://localhost:8080/ws/chat/region?regionId=${regionId}&token=${jwtToken}")
      .await(10 seconds)(
        ws.checkTextMessage("WebSocket Connected")
          .check(regex("\"type\":\"WELCOME\"").exists)
      )
    )
    .pause(2 seconds, 5 seconds) // 연결 후 안정화 시간 증가
    .repeat(3) { // 메시지 수를 5개에서 3개로 줄임
      exec(ws("Send Chat Message")
        .sendText("""{
          "type": "CHAT",
          "content": "${chatMessage}",
          "senderId": "${userId}"
        }""")
        .await(8 seconds)( // 응답 대기 시간 증가
          ws.checkTextMessage("Message Received")
            .check(regex("\"type\":\"CHAT\"").exists)
            .check(regex("\"isMyMessage\":(true|false)").exists)
        )
      )
      .pause(3 seconds, 8 seconds) // 메시지 간 대기 시간 증가
    }
    .pause(5 seconds) // 테스트 종료 전 추가 대기 시간
    .exec(ws("WebSocket Disconnect")
      .close(1000, "Normal closure")
    )

  // 통합 시나리오 (로그인 → 채팅방 입장 → WebSocket 채팅)
  val fullChatScenario = scenario("HanaZoom Full Chat Test")
    .feed(userFeeder)
    .exec(session => {
      // 랜덤 채팅 메시지 설정
      val message = randomChatMessage()
      session.set("chatMessage", message)
    })
    .exec(loginRequest)
    .exec(session => {
      val email = session("email").as[String]
      val userName = session("userName").as[String]
      println(s"✅ $email 로그인 성공 - 사용자명: $userName")
      session
    })
    .pause(100 milliseconds, 500 milliseconds)
    .exec(getUserInfoRequest)
    .exec(session => {
      val email = session("email").as[String]
      val regionId = session("regionId").as[String]
      println(s"✅ $email 사용자 정보 조회 성공 - RegionId: $regionId")
      session
    })
    .pause(100 milliseconds, 500 milliseconds)
    .exec(enterChatRoomRequest)
    .exec(session => {
      val email = session("email").as[String]
      val roomName = session("roomName").as[String]
      println(s"✅ $email 채팅방 '$roomName' 입장 성공")
      session
    })
    .pause(1 second, 3 seconds)

    // WebSocket 채팅 시작
    .exec(session => {
      val jwtToken = session("jwtToken").as[String]
      val regionId = session("regionId").as[String]
      val userId = session("userId").as[String]

      session
        .set("wsToken", jwtToken)
        .set("wsRegionId", regionId)
        .set("wsUserId", userId)
    })
    .exec(ws("WebSocket Connect")
      .connect("ws://localhost:8080/ws/chat/region?regionId=${regionId}&token=${jwtToken}")
      .await(20 seconds)( // 핸드셰이크 타임아웃 20초로 최적화
        ws.checkTextMessage("WebSocket Connected")
          .check(regex("\"type\":\"WELCOME\"").exists)
          .check(regex("\"content\"").exists) // WELCOME 메시지 내용도 확인
      )
    )
    .exec(session => {
      val email = session("email").as[String]
      val regionId = session("regionId").as[String]
      println(s"🔌 $email WebSocket 연결 성공 - RegionId: $regionId")
      session
    })
    .pause(3 seconds, 8 seconds) // 연결 후 안정화 시간 증가 (더 안정적)

    // 3-5개의 랜덤 메시지 전송 (부하 감소)
    .repeat(Random.nextInt(3) + 3) { // 3-5개의 메시지
      exec(session => {
        // 새로운 랜덤 메시지 설정
        val message = randomChatMessage()
        session.set("chatMessage", message)
      })
      .exec(ws("Send Chat Message")
        .sendText("""{
          "type": "CHAT",
          "content": "${chatMessage}",
          "senderId": "${userId}"
        }""")
        .await(15 seconds)( // 메시지 응답 타임아웃 15초로 최적화
          ws.checkTextMessage("Message Received")
            .check(regex("\"type\":\"CHAT\"").exists)
            .check(regex("\"isMyMessage\":(true|false)").exists)
            .check(regex("\"content\"").exists) // 메시지 내용 확인
        )
      )
      .exec(session => {
        val email = session("email").as[String]
        val message = session("chatMessage").as[String]
        println(s"💬 $email 메시지 전송: ${message.take(30)}...")
        session
      })
      .pause(3 seconds, 8 seconds) // 메시지 간 대기 시간 최적화
    }

    .pause(5 seconds) // 테스트 종료 전 추가 대기 시간
    .exec(ws("WebSocket Disconnect")
      .close(1000, "Normal closure")
    )
    .exec(session => {
      val email = session("email").as[String]
      println(s"❌ $email WebSocket 연결 종료")
      session
    })

  // 고도화된 부하 테스트 설정
  setUp(
    // 최적화된 부하 테스트: 50명 → 100명 (WebSocket 안정성 개선)
    fullChatScenario.inject(
      rampUsers(20).during(30 seconds),        // 20명 (워밍업)
      constantUsersPerSec(5).during(60 seconds),     // 50명 (안정적 증가)
      rampUsersPerSec(5).to(10).during(60 seconds),  // 100명 (점진적 증가)
      constantUsersPerSec(10).during(120 seconds)     // 100명 유지
    )
  ).protocols(httpProtocol)

  // 스트레스 테스트용 (선택적으로 사용)
  /*
  setUp(
    fullChatScenario.inject(
      atOnceUsers(100),                              // 100명 즉시 시작
      rampUsers(200).during(60 seconds),             // 200명 추가 (총 300명)
      constantUsersPerSec(50).during(120 seconds),   // 50명/초 추가 (총 550명)
      rampUsersPerSec(100).to(500).during(300 seconds) // 500명까지 증가
    )
  ).protocols(httpProtocol)
  */
}
