package com.hanazoom.global.service;

import com.hanazoom.global.config.KisConfig;
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
    private static final Path KEY_PATH = Paths.get("kis_keys.json");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @PostConstruct
    public void init() {
        loadKeysFromFile();
        if (!isAccessTokenValid()) {
            issueAccessToken();
        } else if (kisConfig.getApprovalKey() == null) {
            issueApprovalKey();
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
        log.info("Requesting KIS access token...");
        JSONObject body = new JSONObject();
        body.put("grant_type", "client_credentials");
        body.put("appkey", kisConfig.getAppKey());
        body.put("appsecret", kisConfig.getAppSecret());

        try {
            String response = webClient.post()
                    .uri(kisConfig.getTokenUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body.toString())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JSONObject responseJson = new JSONObject(response);
            String accessToken = responseJson.getString("access_token");
            kisConfig.setAccessToken(accessToken);
            log.info("KIS Access Token issued successfully.");

            issueApprovalKey();

        } catch (Exception e) {
            log.error("Failed to issue KIS access token", e);
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
     * @param stockCode 주식 종목코드 (6자리)
     * @param period 조회기간 (D=일, W=주, M=월)
     * @param adjustPrice 수정주가 반영여부 (0=수정주가반영안함, 1=수정주가반영)
     * @return 차트 데이터 JSON 응답
     */
    public String getDailyChartData(String stockCode, String period, String adjustPrice) {
        if (!isAccessTokenValid()) {
            log.warn("Access token is not valid. Issuing new token.");
            issueAccessToken();
        }

        try {
            String response = webClient.get()
                    .uri("https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
                            + "?FID_COND_MRKT_DIV_CODE=J"
                            + "&FID_INPUT_ISCD=" + stockCode
                            + "&FID_INPUT_DATE_1=" // 시작일 (YYYYMMDD)
                            + "&FID_INPUT_DATE_2=" // 종료일 (YYYYMMDD) 
                            + "&FID_PERIOD_DIV_CODE=" + period
                            + "&FID_ORG_ADJ_PRC=" + adjustPrice)
                    .header("authorization", "Bearer " + kisConfig.getAccessToken())
                    .header("appkey", kisConfig.getAppKey())
                    .header("appsecret", kisConfig.getAppSecret())
                    .header("tr_id", "FHKST03010100") // 거래ID (국내주식일봉차트조회)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Successfully fetched daily chart data for stock: {}", stockCode);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch daily chart data for code: {}", stockCode, e);
            throw new RuntimeException("일봉 차트 조회 실패: " + stockCode, e);
        }
    }

    /**
     * 국내주식 분봉차트 조회
     * 
     * @param stockCode 주식 종목코드 (6자리)
     * @param timeframe 분봉구분 (01=1분, 05=5분, 15=15분, 30=30분, 60=60분)
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

            log.info("Successfully fetched order book for stock: {}", stockCode);
            return response;

        } catch (Exception e) {
            log.error("Failed to fetch order book for code: {}", stockCode, e);
            throw new RuntimeException("호가창 정보 조회 실패: " + stockCode, e);
        }
    }
}