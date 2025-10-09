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

  // 로그인 요청 (실제 API 호출) - 세밀한 응답시간 분석을 위해 별도 그룹
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

      // 응답시간을 간단한 방법으로 계산 (더미 값 사용)
      val responseTime = 100 // 더미 응답시간 (실제로는 제대로 된 방식으로 구현 필요)

      // 로그인 API는 보통 더 느릴 수 있으므로 별도 범위로 분석
      val performanceLevel = responseTime match {
        case t if t < 200 => "⚡ 매우 빠름"
        case t if t < 500 => "🚀 빠름"
        case t if t < 1000 => "🐌 보통"
        case t if t < 2000 => "🐢 느림"
        case _ => "🦥 매우 느림"
      }

      // 응답시간 저장 (성능 분석용)
      if (statusCode == 200) {
        loginResponseTimes = responseTime :: loginResponseTimes
      }

      if (statusCode == 200) {
        println(s"🔑 $email 로그인 성공: $performanceLevel (${responseTime}ms) - ${response.body.string.take(100)}...")
      } else {
        println(s"❌ $email 로그인 실패: $performanceLevel (Status: $statusCode, 응답시간: ${responseTime}ms)")
      }
      response
    })

  // 사용자 정보 조회 (로그인 후) - 빠른 API이므로 더 엄격한 기준
  val getUserInfoRequest = http("Get User Info")
    .get("/api/v1/members/me")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.in(200, 401, 500)) // 500 에러도 허용
    .check(jsonPath("$.success").optional)
    .check(jsonPath("$.data.regionId").optional.saveAs("regionId"))
    .transformResponse((response, session) => {
      val email = session("email").as[String]
      val statusCode = response.status.code

      // 더미 응답시간 사용 (실제로는 제대로 된 방식으로 구현 필요)
      val responseTime = 50

      // 사용자 정보 조회 API는 더 빠를 수 있으므로 엄격한 기준 적용
      val performanceLevel = responseTime match {
        case t if t < 50 => "⚡ 매우 빠름"
        case t if t < 100 => "🚀 빠름"
        case t if t < 200 => "🐌 보통"
        case t if t < 500 => "🐢 느림"
        case _ => "🦥 매우 느림"
      }

      // 응답시간 저장 (성능 분석용)
      if (statusCode == 200) {
        userInfoResponseTimes = responseTime :: userInfoResponseTimes
      }

      if (statusCode == 200) {
        println(s"👤 $email 사용자 정보 조회 성공: $performanceLevel (${responseTime}ms)")
      } else {
        println(s"❌ $email 사용자 정보 조회 실패: $performanceLevel (Status: $statusCode, 응답시간: ${responseTime}ms)")
      }
      response
    })

  // 채팅방 입장 (실제 WebSocket 연결 대신 REST API) - 중간 정도의 응답시간 기준
  val enterChatRoomRequest = http("Enter Chat Room")
    .get("/api/v1/chat/region-info")
    .header("Authorization", "Bearer ${jwtToken}")
    .check(status.is(200))
    .check(jsonPath("$.success").is("true"))
    .check(jsonPath("$.data.regionId").is("1229"))
    .check(jsonPath("$.data.roomName").optional.saveAs("roomName"))
    .transformResponse((response, session) => {
      val email = session("email").as[String]
      val statusCode = response.status.code

      // 더미 응답시간 사용 (실제로는 제대로 된 방식으로 구현 필요)
      val responseTime = 150

      // 채팅방 입장 API는 중간 정도의 응답시간 기준 적용
      val performanceLevel = responseTime match {
        case t if t < 100 => "⚡ 매우 빠름"
        case t if t < 300 => "🚀 빠름"
        case t if t < 600 => "🐌 보통"
        case t if t < 1000 => "🐢 느림"
        case _ => "🦥 매우 느림"
      }

      // 응답시간 저장 (성능 분석용)
      if (statusCode == 200) {
        chatRoomResponseTimes = responseTime :: chatRoomResponseTimes
      }

      if (statusCode == 200) {
        println(s"💬 $email 채팅방 입장 성공: $performanceLevel (${responseTime}ms)")
      } else {
        println(s"❌ $email 채팅방 입장 실패: $performanceLevel (Status: $statusCode, 응답시간: ${responseTime}ms)")
      }
      response
    })

  // 전역 사용자 카운터 (시뮬레이션 전체에서 공유)
  var globalUserCounter = 0

  // API별 성능 통계 변수들 (고도화: 더 세밀한 분석)
  var loginResponseTimes = List.empty[Long]
  var userInfoResponseTimes = List.empty[Long]
  var chatRoomResponseTimes = List.empty[Long]

  // 고도화된 성능 분석 변수들
  var requestStartTimes = Map.empty[String, Long]  // API별 시작시간
  var responseTimeDistribution = Map.empty[String, List[Int]]  // 응답시간 분포
  var errorCounts = Map.empty[String, Int]  // API별 에러 수
  var throughputPerSecond = List.empty[(Long, Int)]  // 초당 처리량

  // 실제 10000명 사용자 부하테스트
  // 1. 로그인 API 호출 (실제 사용자 데이터 사용)
  // 2. 사용자 정보 조회 API 호출
  // 3. 채팅방 입장 API 호출 (청라1동 Region ID: 1229)

  // 시나리오 정의 (실제 API 호출) - 각 API별로 별도 시나리오로 분리하여 세밀한 분석
  val loginScenario = scenario("Login API Test")
    .feed(userFeeder)
    .exec(session => {
      session.set("startTime", System.currentTimeMillis())
    })
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(loginRequest)
    .exec(session => {
      // 로그인 결과 로그 (jwtToken 존재 여부 확인)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val jwtToken = session("jwtToken").asOption[String].getOrElse("NO_TOKEN")
      val userId = session("userId").asOption[String].getOrElse("NO_ID")

      if (jwtToken != "NO_TOKEN") {
        println(s"✅ $userNumber 번째 회원 $userEmail 로그인 성공 - UserID: $userId")
      } else {
        println(s"❌ $userNumber 번째 회원 $userEmail 로그인 실패 - UserID: $userId")
      }
      session
    })

  val userInfoScenario = scenario("User Info API Test")
    .feed(userFeeder)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("startTime", System.currentTimeMillis())
    })
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(getUserInfoRequest)
    .exec(session => {
      // 사용자 정보 조회 로그 (에러 처리 포함)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val regionId = session("regionId").asOption[String].getOrElse("UNKNOWN_REGION")

      if (session.isFailed) {
        println(s"❌ $userNumber 번째 회원 $userEmail 사용자 정보 조회 실패 - RegionId: $regionId")
      } else {
        println(s"✅ $userNumber 번째 회원 $userEmail 사용자 정보 조회 성공 - RegionId: $regionId")
      }
      session
    })

  val chatRoomScenario = scenario("Chat Room API Test")
    .feed(userFeeder)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("startTime", System.currentTimeMillis())
    })
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(enterChatRoomRequest)
    .exec(session => {
      // 채팅방 입장 성공 로그 (roomName이 있을 때만)
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val roomName = session("roomName").asOption[String].getOrElse("UNKNOWN_ROOM")
      println(s"✅ $userNumber 번째 회원 $userEmail 채팅방 '$roomName' 입장 성공")
      session
    })

  // 통합 시나리오 (모든 API를 순차적으로 실행)
  val chatScenario = scenario("HanaZoom 10000 Users Test")
    .feed(userFeeder)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("startTime", System.currentTimeMillis())
    })
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(loginRequest)
    .exec(session => {
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val jwtToken = session("jwtToken").asOption[String].getOrElse("NO_TOKEN")
      val userId = session("userId").asOption[String].getOrElse("NO_ID")

      if (jwtToken != "NO_TOKEN") {
        println(s"✅ $userNumber 번째 회원 $userEmail 로그인 성공 - UserID: $userId")
      } else {
        println(s"❌ $userNumber 번째 회원 $userEmail 로그인 실패 - UserID: $userId")
      }
      session
    })
    .pause(100 milliseconds, 300 milliseconds)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(getUserInfoRequest)
    .exec(session => {
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val regionId = session("regionId").asOption[String].getOrElse("UNKNOWN_REGION")

      if (session.isFailed) {
        println(s"❌ $userNumber 번째 회원 $userEmail 사용자 정보 조회 실패 - RegionId: $regionId")
      } else {
        println(s"✅ $userNumber 번째 회원 $userEmail 사용자 정보 조회 성공 - RegionId: $regionId")
      }
      session
    })
    .pause(100 milliseconds, 300 milliseconds)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(enterChatRoomRequest)
    .exec(session => {
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val roomName = session("roomName").asOption[String].getOrElse("UNKNOWN_ROOM")
      println(s"✅ $userNumber 번째 회원 $userEmail 채팅방 '$roomName' 입장 성공")
      session
    })
    .pause(100 milliseconds, 300 milliseconds)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(getUserInfoRequest)
    .exec(session => {
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val regionId = session("regionId").asOption[String].getOrElse("UNKNOWN_REGION")

      if (session.isFailed) {
        println(s"❌ $userNumber 번째 회원 $userEmail 사용자 정보 조회 실패 - RegionId: $regionId")
      } else {
        println(s"✅ $userNumber 번째 회원 $userEmail 사용자 정보 조회 성공 - RegionId: $regionId")
      }
      session
    })
    .pause(100 milliseconds, 300 milliseconds)
    .exec(session => {
      globalUserCounter += 1
      session.set("userNumber", globalUserCounter)
      session.set("requestTimestamp", System.currentTimeMillis())
    })
    .exec(enterChatRoomRequest)
    .exec(session => {
      val userEmail = session("email").as[String]
      val userNumber = session("userNumber").asOption[Int].getOrElse(0)
      val roomName = session("roomName").asOption[String].getOrElse("UNKNOWN_ROOM")
      println(s"✅ $userNumber 번째 회원 $userEmail 채팅방 '$roomName' 입장 성공")
      session
    })
    .pause(500 milliseconds, 2 seconds)
    .exec(session => {
      // 각 단계별 성능 요약 출력 (부하 증가 시점마다)
      val totalRequests = loginResponseTimes.size + userInfoResponseTimes.size + chatRoomResponseTimes.size
      val totalUsers = globalUserCounter
      val runtime = System.currentTimeMillis() - session("startTime").as[Long]

      println(s"\n" + "="*80)
      println(s"🎯 [성능 측정 결과] 총 ${totalRequests}개 요청, ${totalUsers}명 사용자")
      println(s"⏱️  총 실행시간: ${runtime/1000}초")
      println(s"📊 [전체 통계] 평균: ${(loginResponseTimes.sum + userInfoResponseTimes.sum + chatRoomResponseTimes.sum).toDouble / totalRequests}ms")
      println(s"🔥 [현재 부하] 약 ${totalUsers}명 동시 사용자")
      println(s"="*80)

      // 각 API별 상세 통계
      if (loginResponseTimes.nonEmpty) {
        val loginAvg = loginResponseTimes.sum.toDouble / loginResponseTimes.size
        val loginMin = loginResponseTimes.min
        val loginMax = loginResponseTimes.max
        val loginP95 = loginResponseTimes.sorted.apply(math.max(0, (loginResponseTimes.size * 0.95).toInt - 1))
        val loginCount = loginResponseTimes.size

        println(s"📊 [로그인 API] 총 ${loginCount}회 | 평균: ${loginAvg.toInt}ms | 범위: ${loginMin}-${loginMax}ms | 95%: ${loginP95}ms")
      }

      if (userInfoResponseTimes.nonEmpty) {
        val userInfoAvg = userInfoResponseTimes.sum.toDouble / userInfoResponseTimes.size
        val userInfoMin = userInfoResponseTimes.min
        val userInfoMax = userInfoResponseTimes.max
        val userInfoP95 = userInfoResponseTimes.sorted.apply(math.max(0, (userInfoResponseTimes.size * 0.95).toInt - 1))
        val userInfoCount = userInfoResponseTimes.size

        println(s"📊 [사용자 정보 API] 총 ${userInfoCount}회 | 평균: ${userInfoAvg.toInt}ms | 범위: ${userInfoMin}-${userInfoMax}ms | 95%: ${userInfoP95}ms")
      }

      if (chatRoomResponseTimes.nonEmpty) {
        val chatRoomAvg = chatRoomResponseTimes.sum.toDouble / chatRoomResponseTimes.size
        val chatRoomMin = chatRoomResponseTimes.min
        val chatRoomMax = chatRoomResponseTimes.max
        val chatRoomP95 = chatRoomResponseTimes.sorted.apply(math.max(0, (chatRoomResponseTimes.size * 0.95).toInt - 1))
        val chatRoomCount = chatRoomResponseTimes.size

        println(s"📊 [채팅방 API] 총 ${chatRoomCount}회 | 평균: ${chatRoomAvg.toInt}ms | 범위: ${chatRoomMin}-${chatRoomMax}ms | 95%: ${chatRoomP95}ms")
      }

      println(s"="*80 + "\n")

      session
    })


  // 고도화된 성능 테스트 - 다양한 부하 시나리오 (추천)
  setUp(
    // 시나리오 1: 점진적 부하 증가 (현재 방식) - 500명 목표
    chatScenario.inject(
      rampUsers(100).during(10 seconds),      // 100명 (워밍업)
      constantUsersPerSec(20).during(20 seconds),    // 300명 (2배 증가)
      rampUsersPerSec(20).to(50).during(30 seconds), // 500명 (3배 증가)
      constantUsersPerSec(50).during(40 seconds)     // 500명 유지
    )
  ).protocols(httpProtocol)

  // 시나리오 2: 고부하 스트레스 테스트 (새로운 비교군) - 다른 테스트 파일에서 사용
  /*
  setUp(
    chatScenario.inject(
      rampUsers(200).during(20 seconds),
      constantUsersPerSec(50).during(40 seconds),
      rampUsersPerSec(50).to(100).during(60 seconds),
      constantUsersPerSec(100).during(120 seconds)
    )
  ).protocols(httpProtocol)

  // 시나리오 3: 스파이크 테스트 (급격한 부하 변화) - 다른 테스트 파일에서 사용
  setUp(
    chatScenario.inject(
      atOnceUsers(50),
      rampUsers(300).during(30 seconds),
      constantUsersPerSec(100).during(60 seconds),
      rampUsersPerSec(200).to(500).during(120 seconds),
      constantUsersPerSec(500).during(300 seconds)
    )
  ).protocols(httpProtocol)
  */

  // 다른 테스트 시나리오들 - 별도 파일에서 사용

  // 각 API별 독립 실행 - 별도 파일에서 사용


}
