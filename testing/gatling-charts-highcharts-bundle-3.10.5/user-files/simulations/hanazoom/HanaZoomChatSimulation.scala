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
  // 각 사용자 1회씩만 사용 (100명 한 번씩만 테스트)
  val userFeeder = csv("cheongra_users.csv").queue

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

  // 로그인 요청 (올바른 엔드포인트 사용)
  val loginRequest = http("Login")
    .post("/api/v1/members/login")
    .header("Content-Type", "application/json")
    .body(StringBody(
      """{
        "email": "${email}",
        "password": "${password}"
      }"""
    ))
    .check(status.is(200))
    .check(jsonPath("$.data.accessToken").saveAs("jwtToken"))
    .check(bodyString.saveAs("loginResponse")) // 응답 전체 저장

  // 지역 정보 조회 요청
  val regionInfoRequest = http("Get Region Info")
    .get("/api/v1/chat/region-info")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.is(200))
    .check(bodyString.saveAs("regionResponse")) // 응답 전체 저장

  // 전역 사용자 카운터 (시뮬레이션 전체에서 공유)
  var globalUserCounter = 0

  // 실제 존재하는 API만 테스트 (채팅 API는 WebSocket 전용이므로 제외)
  // 로그인과 지역 정보 조회만으로 부하테스트 진행

  // 시나리오 정의 (실제 API만 사용)
  val chatScenario = scenario("HanaZoom Login & Region Test")
    .feed(userFeeder) // CSV에서 사용자 데이터 로드 (각 사용자 1회씩)
    .exec(session => {
      // 사용자 번호 추가 (전역 카운터)
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
    })
    .exec(loginRequest)
    .exec(session => {
      // 간단한 로그: 로그인 성공
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").as[Int]
      println(s"$userNumber 번째 회원 $userEmail 로그인 성공")
      session
    })
    .pause(500 milliseconds, 1 second) // 로그인 후 짧게 대기
    .exec(regionInfoRequest)
    .exec(session => {
      // 간단한 로그: 지역 정보 조회 성공
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").as[Int]
      println(s"$userNumber 번째 회원 $userEmail 지역 정보 조회 성공")
      session
    })
    .pause(500 milliseconds, 1 second) // 지역 정보 조회 후 짧게 대기

  // 100명 동시 부하 테스트 (실제 서버 용량 테스트)
  setUp(
    chatScenario.inject(
      // 100명을 즉시 동시 실행 (고부하 테스트)
      atOnceUsers(100)  // 한 번에 100명 동시 실행
    )
  ).protocols(httpProtocol)

  // 단계별 부하 테스트 (서버 안정성 확인) - 주석 처리됨
  /*
  setUp(
    chatScenario.inject(
      // 20명/초로 5초간 (총 100명)
      constantUsersPerSec(20).during(5 seconds)
    )
  ).protocols(httpProtocol)
  */

  // 더 작은 부하로 장기 테스트 - 주석 처리됨
  /*
  setUp(
    chatScenario.inject(
      constantUsersPerSec(2).during(1800 seconds)  // 2명/초로 30분간 지속
    )
  ).protocols(httpProtocol)
  */
}
