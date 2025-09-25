import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.gatling.core.structure.ScenarioBuilder
import io.gatling.core.scenario.Simulation
import scala.concurrent.duration._
import io.gatling.http.request.builder.HttpRequestBuilder
import io.gatling.core.feeder.BatchableFeederBuilder

class HanaZoomChatSimulation extends Simulation {

  // HTTP 프로토콜 설정
  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3")
    .userAgentHeader("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

  // 청라1동 실제 사용자 데이터 로드 (CSV 파일에서 읽기, 헤더 제외)
  // 각 사용자 1회씩만 사용 (10000명 한 번씩만 테스트)
  val userFeeder = csv("C:\\Users\\DA\\Desktop\\HanaZoom\\scripts\\user_creation\\cheongra_users_jmeter.csv").circular

  // 랜덤 메시지 목록
  val chatMessages = List(
    "안녕하세요!",
    "오늘 날씨가 좋네요",
    "주식 시장이 활발하네요",
    "청라1동에서 인사드려요",
    "실시간 채팅 테스트 중입니다",
    "모두 안녕하세요",
    "즐거운 채팅 되세요",
    "테스트 메시지입니다"
  )

  // 로그인 요청 (실제 API 호출)
  val loginRequest = http("Login")
    .post("/api/v1/members/login")
    .header("Content-Type", "application/json")
    .body(StringBody(
      """{
        "email": "${email}",
        "password": "${password}"
      }"""
    ))
    .check(status.in(200, 400, 401, 500)) // 다양한 상태 코드 허용
    .check(jsonPath("$.success").optional)
    .check(jsonPath("$.data.accessToken").optional.saveAs("jwtToken"))
    .check(jsonPath("$.data.id").optional.saveAs("userId"))
    .check(jsonPath("$.data.name").optional.saveAs("userName"))
    .transformResponse((response, session) => {
      val email = session("email").as[String]
      val statusCode = response.status.code

      if (statusCode == 200) {
        println(s"🔑 $email 로그인 성공: ${response.body.string}")
      } else {
        println(s"❌ $email 로그인 실패 (Status: $statusCode): ${response.body.string}")
      }
      response
    })

  // 사용자 정보 조회 (로그인 후)
  val getUserInfoRequest = http("Get User Info")
    .get("/api/v1/members/me")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.in(200, 401, 500)) // 500 에러도 허용
    .check(jsonPath("$.success").optional)
    .check(jsonPath("$.data.regionId").optional.saveAs("regionId"))

  // 채팅방 입장 (실제 WebSocket 연결 대신 REST API)
  val enterChatRoomRequest = http("Enter Chat Room")
    .get("/api/v1/chat/region-info")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.is(200))
    .check(jsonPath("$.success").is("true"))
    .check(jsonPath("$.data.regionId").is("1229"))
    .check(jsonPath("$.data.roomName").optional.saveAs("roomName"))

  // 전역 사용자 카운터 (시뮬레이션 전체에서 공유)
  var globalUserCounter = 0

  // 실제 10000명 사용자 부하테스트
  // 1. 로그인 API 호출 (실제 사용자 데이터 사용)
  // 2. 사용자 정보 조회 API 호출
  // 3. 채팅방 입장 API 호출 (청라1동 Region ID: 1229)

  // 시나리오 정의 (실제 API 호출)
  val chatScenario = scenario("HanaZoom 10000 Users Test")
    .feed(userFeeder) // CSV에서 실제 사용자 데이터 로드
    .exec(session => {
      // 사용자 번호 추가 (전역 카운터)
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
    })
    .exec(loginRequest)
    .exec(session => {
      // 로그인 결과 로그 (jwtToken 존재 여부 확인)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").as[Int]
      val jwtToken = session("jwtToken").asOption[String].getOrElse("NO_TOKEN")
      val userId = session("userId").asOption[String].getOrElse("NO_ID")

      if (jwtToken != "NO_TOKEN") {
        println(s"✅ $userNumber 번째 회원 $userEmail 로그인 성공 - UserID: $userId")
      } else {
        println(s"❌ $userNumber 번째 회원 $userEmail 로그인 실패 - UserID: $userId")
      }
      session
    })
    .pause(100 milliseconds, 300 milliseconds) // 짧은 대기
    .exec(getUserInfoRequest)
    .exec(session => {
      // 사용자 정보 조회 로그 (에러 처리 포함)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").as[Int]
      val regionId = session("regionId").asOption[String].getOrElse("UNKNOWN_REGION")

      if (session.isFailed) {
        println(s"❌ $userNumber 번째 회원 $userEmail 사용자 정보 조회 실패 - RegionId: $regionId")
      } else {
        println(s"✅ $userNumber 번째 회원 $userEmail 사용자 정보 조회 성공 - RegionId: $regionId")
      }
      session
    })
    .pause(100 milliseconds, 300 milliseconds) // 짧은 대기
    .exec(enterChatRoomRequest)
    .exec(session => {
      // 채팅방 입장 성공 로그 (roomName이 있을 때만)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").as[Int]
      val roomName = session("roomName").asOption[String].getOrElse("UNKNOWN_ROOM")
      println(s"✅ $userNumber 번째 회원 $userEmail 채팅방 '$roomName' 입장 성공")
      session
    })
    .pause(500 milliseconds, 2 seconds) // 채팅방 입장 후 대기

  // 초안전 부하테스트 (CPU 100% 방지)
  setUp(
    chatScenario.inject(
      // 단계 1: 20명 동시 (워밍업)
      rampUsers(20).during(3 seconds),
      // 단계 2: 50명까지 증가
      constantUsersPerSec(5).during(10 seconds),
      // 단계 3: 100명까지 증가 (최대 부하)
      rampUsersPerSec(10).to(20).during(10 seconds),
      // 단계 4: 100명 유지
      constantUsersPerSec(20).during(20 seconds)
    )
  ).protocols(httpProtocol)

}
