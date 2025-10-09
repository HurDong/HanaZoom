package com.hanazoom.global.service;

import com.hanazoom.global.config.KisConfig;
import com.hanazoom.domain.stock.service.KafkaStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.json.JSONException;

@Slf4j
@Service
@RequiredArgsConstructor
public class KisApiService {

    private final KisConfig kisConfig;
    private final WebClient webClient;
    private final KafkaStockService kafkaStockService;
    private static final Path KEY_PATH = Paths.get("kis_keys.json");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @PostConstruct
    public void init() {
        log.info("🏗️ KisApiService Bean 생성됨 - kisConfig: {}, webClient: {}",
                kisConfig != null ? "설정됨" : "NULL",
                webClient != null ? "설정됨" : "NULL");
        log.info("✅ KisApiService Bean 생성 완료");

        log.info("🎯 KisApiService 초기화 시작");
        try {
            loadKeysFromFile();
            log.info("📁 토큰 파일 로드 완료");

            if (!isAccessTokenValid()) {
                log.info("🔄 토큰이 유효하지 않아 새 토큰 발급 시도");
                issueAccessToken();
            } else if (kisConfig.getApprovalKey() == null) {
                log.info("🔑 승인키가 없어 승인키 발급 시도");
                issueApprovalKey();
            } else {
                log.info("✅ 모든 토큰이 유효합니다");
            }
        } catch (Exception e) {
            log.error("❌ KisApiService 초기화 실패", e);
        }
    }

    private void loadKeysFromFile() {
        if (Files.exists(KEY_PATH)) {
            try {
                String content = new String(Files.readAllBytes(KEY_PATH));
                JSONObject keys = new JSONObject(content);
                if (keys.has("accessToken") && keys.has("approvalKey") && keys.has("issuedAt")) {
                    kisConfig.setAccessToken(keys.getString("accessToken"));
                    kisConfig.setApprovalKey(keys.getString("approvalKey"));
                    log.info("API keys loaded from file.");
                }
            } catch (IOException | JSONException e) {
                log.error("Failed to load API keys from file.", e);
            }
        }
    }

    private void saveKeysToFile() {
        try {
            JSONObject keys = new JSONObject();
            keys.put("accessToken", kisConfig.getAccessToken());
            keys.put("approvalKey", kisConfig.getApprovalKey());
            keys.put("issuedAt", LocalDateTime.now().format(FORMATTER));
            Files.write(KEY_PATH, keys.toString(4).getBytes());
            log.info("API keys saved to file.");
        } catch (IOException e) {
            log.error("Failed to save API keys to file.", e);
        }
    }

    private boolean isAccessTokenValid() {
        if (kisConfig.getAccessToken() == null || !Files.exists(KEY_PATH)) {
            return false;
        }
        try {
            String content = new String(Files.readAllBytes(KEY_PATH));
            JSONObject keys = new JSONObject(content);
            if (keys.has("issuedAt")) {
                LocalDateTime issuedAt = LocalDateTime.parse(keys.getString("issuedAt"), FORMATTER);
                // 유효기간을 23시간으로 보수적으로 설정
                return issuedAt.plusHours(23).isAfter(LocalDateTime.now());
            }
        } catch (Exception e) {
            log.error("Failed to validate access token from file.", e);
        }
        return false;
    }

    @Scheduled(cron = "0 0 2 * * *") // 매일 새벽 2시에 실행
    public void issueAccessToken() {
        log.info("🔑 KIS Access Token 발급 시작");
        log.info("📝 요청 정보 - URL: {}, AppKey: {}", kisConfig.getTokenUrl(), kisConfig.getAppKey() != null ? "설정됨" : "NULL");

        JSONObject body = new JSONObject();
        body.put("grant_type", "client_credentials");
        body.put("appkey", kisConfig.getAppKey());
        body.put("appsecret", kisConfig.getAppSecret());

        try {
            log.info("🌐 WebClient 호출 시작: {}", kisConfig.getTokenUrl());
            String response = webClient.post()
                    .uri(kisConfig.getTokenUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            log.info("📥 WebClient 응답 수신: {} bytes", response != null ? response.length() : 0);

            JSONObject responseJson = new JSONObject(response);
            String accessToken = responseJson.getString("access_token");
            kisConfig.setAccessToken(accessToken);
            log.info("✅ KIS Access Token 발급 성공!");

            issueApprovalKey();

        } catch (Exception e) {
            log.error("❌ KIS Access Token 발급 실패", e);
            log.error("🔍 실패 원인: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("🔍 근본 원인: {}", e.getCause().getMessage());
            }
        }
    }

    public void issueApprovalKey() {
        if (kisConfig.getAccessToken() == null) {
            log.warn("Access token is not available. Cannot issue approval key.");
            return;
        }

        log.info("Requesting KIS approval key...");
        JSONObject body = new JSONObject();
        body.put("grant_type", "approval_key");
        body.put("appkey", kisConfig.getAppKey());
        body.put("secretkey", kisConfig.getAppSecret());

        try {
            String response = webClient.post()
                    .uri(kisConfig.getApprovalUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JSONObject responseJson = new JSONObject(response);
            String approvalKey = responseJson.getString("approval_key");
            kisConfig.setApprovalKey(approvalKey);
            log.info("KIS Approval Key issued successfully.");

            // 키 발급 성공 시 파일에 저장
            saveKeysToFile();

        } catch (Exception e) {
            log.error("Failed to issue KIS approval key", e);
        }
    }

    public String getRealtimeApprovalKey() {
        if (!isAccessTokenValid() || kisConfig.getApprovalKey() == null) {
            log.warn("Approval key is not available or expired. Trying to issue a new one.");
            issueAccessToken();
        }
        return kisConfig.getApprovalKey();
    }

    /**
     * 국내주식 현재가 시세 조회
     * 
     * @param stockCode 주식 종목코드 (6자리)
     * @return 현재가 정보 JSON 응답
     */
    public String getCurrentStockPrice(String stockCode) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price"
                            +
                            "?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=" + stockCode)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "FHKST01010100") // 거래ID (국내주식현재가)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Successfully fetched current price for stock: {}", stockCode);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch current stock price for code: {}", stockCode, e);
            throw new RuntimeException("주식 현재가 조회 실패: " + stockCode, e);
        }
    }

    /**
     * 종목 기본 정보 조회
     * 
     * @param stockCode 주식 종목코드 (6자리)
     * @return 종목 기본 정보 JSON 응답
     */
    public String getStockBasicInfo(String stockCode) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/search-stock-info"
                            +
                            "?PRDT_TYPE_CD=300&PDNO=" + stockCode)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "CTPF1002R") // 거래ID (종목정보조회)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Successfully fetched basic info for stock: {}", stockCode);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch basic stock info for code: {}", stockCode, e);
            throw new RuntimeException("종목 기본 정보 조회 실패: " + stockCode, e);
        }
    }

    /**
     * 국내주식 일봉차트 조회
     * 
     * @param stockCode   주식 종목코드 (6자리)
     * @param period      조회기간 (D=일, W=주, M=월)
     * @param adjustPrice 수정주가 반영여부 (0=수정주가반영안함, 1=수정주가반영)
     * @return 차트 데이터 JSON 응답
     */
    public String getDailyChartData(String stockCode, String period, String adjustPrice) {
        return getDailyChartDataWithDateRange(stockCode, period, adjustPrice, null, null);
    }

    /**
     * 국내주식 일봉차트 조회 (날짜 범위 지정)
     * 
     * @param stockCode   주식 종목코드
     * @param period      조회기간 (D=일, W=주, M=월)
     * @param adjustPrice 수정주가 반영여부
     * @param startDate   시작일 (YYYYMMDD, null이면 기본값)
     * @param endDate     종료일 (YYYYMMDD, null이면 오늘)
     * @return 차트 데이터 JSON 응답
     */
    public String getDailyChartDataWithDateRange(String stockCode, String period, String adjustPrice, String startDate,
            String endDate) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        // 날짜 설정 - 기본값: 3년치 데이터
        if (endDate == null) {
            endDate = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        }
        if (startDate == null) {
            // 3년 전 날짜 (약 1000 영업일)
            startDate = java.time.LocalDate.now().minusYears(3)
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
                            + "?FID_COND_MRKT_DIV_CODE=J"
                            + "&FID_INPUT_ISCD=" + stockCode
                            + "&FID_INPUT_DATE_1=" + startDate // 시작일 (YYYYMMDD)
                            + "&FID_INPUT_DATE_2=" + endDate // 종료일 (YYYYMMDD)
                            + "&FID_PERIOD_DIV_CODE=" + period
                            + "&FID_ORG_ADJ_PRC=" + adjustPrice)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "FHKST03010100") // 거래ID (국내주식일봉차트조회)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Successfully fetched daily chart data for stock: {} ({} ~ {})", stockCode, startDate, endDate);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch daily chart data for code: {}", stockCode, e);
            throw new RuntimeException("일봉 차트 조회 실패: " + stockCode, e);
        }
    }

    /**
     * 국내주식 분봉차트 조회
     * 
     * @param stockCode   주식 종목코드 (6자리)
     * @param timeframe   분봉구분 (01=1분, 05=5분, 15=15분, 30=30분, 60=60분)
     * @param adjustPrice 수정주가 반영여부
     * @return 분봉 차트 데이터 JSON 응답
     */
    public String getMinuteChartData(String stockCode, String timeframe, String adjustPrice) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
                            + "?FID_COND_MRKT_DIV_CODE=J"
                            + "&FID_INPUT_ISCD=" + stockCode
                            + "&FID_INPUT_HOUR_1=" // 시작시간 (HHMMSS)
                            + "&FID_PW_DATA_INCU_YN=Y" // 과거데이터포함여부
                            + "&FID_ETC_CLS_CODE=" + timeframe) // 분봉구분
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "FHKST03010200") // 거래ID (국내주식분봉차트조회)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Successfully fetched minute chart data for stock: {} ({}분봉)", stockCode, timeframe);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch minute chart data for code: {}", stockCode, e);
            throw new RuntimeException("분봉 차트 조회 실패: " + stockCode, e);
        }
    }

    /**
     * 주식 호가창 정보 조회
     * 
     * @param stockCode 주식 종목코드 (6자리)
     * @return 호가창 정보 JSON 응답
     */
    public String getOrderBook(String stockCode) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn"
                            +
                            "?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=" + stockCode)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "FHKST01010200") // 거래ID (국내주식호가)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // 로그 제거 - 너무 많이 찍힘
            return response;

        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            if (e.getStatusCode().is5xxServerError()) {
                log.warn("KIS API 서버 에러 (5xx) - 종목: {}, 상태코드: {}, 응답: {}", 
                        stockCode, e.getStatusCode(), e.getResponseBodyAsString());
                // 서버 에러 시 빈 호가창 데이터 반환
                return createEmptyOrderBookResponse(stockCode);
            } else {
                log.error("KIS API 클라이언트 에러 - 종목: {}, 상태코드: {}", stockCode, e.getStatusCode(), e);
                throw new RuntimeException("호가창 정보 조회 실패: " + stockCode, e);
            }
        } catch (Exception e) {
            log.error("Failed to fetch order book for code: {}", stockCode, e);
            // 기타 에러 시에도 빈 호가창 데이터 반환
            return createEmptyOrderBookResponse(stockCode);
        }
    }

    /**
     * 빈 호가창 응답 생성 (API 에러 시 사용)
     */
    private String createEmptyOrderBookResponse(String stockCode) {
        return String.format("""
            {
                "rt_cd": "0",
                "msg_cd": "MCA00000",
                "msg1": "정상처리",
                "output": {
                    "hts_kor_isnm": "종목명",
                    "stck_prpr": "0",
                    "prdy_vrss": "0",
                    "prdy_ctrt": "0.00",
                    "prdy_vrss_sign": "3",
                    "askp1": "0", "bidp1": "0",
                    "askp2": "0", "bidp2": "0",
                    "askp3": "0", "bidp3": "0",
                    "askp4": "0", "bidp4": "0",
                    "askp5": "0", "bidp5": "0",
                    "askp_rsqn1": "0", "bidp_rsqn1": "0",
                    "askp_rsqn2": "0", "bidp_rsqn2": "0",
                    "askp_rsqn3": "0", "bidp_rsqn3": "0",
                    "askp_rsqn4": "0", "bidp_rsqn4": "0",
                    "askp_rsqn5": "0", "bidp_rsqn5": "0"
                }
            }
            """);
    }
}