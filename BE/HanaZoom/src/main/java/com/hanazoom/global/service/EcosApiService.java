package com.hanazoom.global.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
public class EcosApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ecos.api.key}")
    private String bokApiKey;

    private static final String ECOS_API_BASE_URL = "https://ecos.bok.or.kr/api";
    private static final String SERVICE_NAME = "StatisticSearch";
    private static final String REQUEST_TYPE = "json";
    private static final String LANGUAGE = "kr";

    public EcosApiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public ResponseEntity<Map<String, Object>> getWeeklyFinancialCalendar() {
        try {
            Map<String, Object> result = new HashMap<>();


            LocalDate today = LocalDate.now();
            LocalDate weekStart = today.with(DayOfWeek.MONDAY);
            LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);

            log.info("금주 금융 캘린더 조회: {} ~ {}", weekStart, weekEnd);


            log.info("API 키 존재 여부: {}", bokApiKey != null ? "있음" : "없음");
            if (bokApiKey != null) {
                log.info("API 키 첫 10자: {}", bokApiKey.substring(0, Math.min(10, bokApiKey.length())));
            }


            List<Map<String, Object>> weeklySchedule = getKoreaBankFinancialCalendar(weekStart, weekEnd);


            boolean isRealData = isRealDataFromApi(weeklySchedule);

            log.info("조회된 데이터 개수: {}", weeklySchedule.size());
            log.info("실제 데이터 여부: {}", isRealData);

            result.put("success", true);
            result.put("data", weeklySchedule);
            result.put("isRealData", isRealData);
            result.put("message", isRealData ? "금주 실제 금융 캘린더를 조회했습니다." : "금주 금융 캘린더를 조회했습니다. (일부 데이터는 예상치입니다)");
            result.put("period", Map.of(
                    "start", weekStart.toString(),
                    "end", weekEnd.toString(),
                    "current", today.toString()));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("주간 금융 캘린더 조회 중 오류 발생", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("isRealData", false);
            errorResult.put("message", "금주 금융 캘린더 조회 중 오류가 발생했습니다: " + e.getMessage());
            errorResult.put("error", "한국은행 API 호출 실패 - API 키 또는 네트워크 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }

    private List<Map<String, Object>> getKoreaBankFinancialCalendar(LocalDate weekStart, LocalDate weekEnd) {
        List<Map<String, Object>> scheduleList = new ArrayList<>();

        try {

            if (bokApiKey == null || bokApiKey.isEmpty() || bokApiKey.equals("your_korean_bank_api_key_here")) {
                log.warn("한국은행 API 키가 설정되지 않았습니다. application.properties의 ecos.api.key를 확인하세요.");
                log.warn("API 키 값: '{}'", bokApiKey);
                return getEmptyFinancialCalendar();
            }


            Map<String, String> financialIndicators = Map.of(
                    "소비자물가지수", "901Y009",
                    "산업생산지수", "901Y015",
                    "실업률", "901Y086",
                    "수출", "901Y013",
                    "수입", "901Y014",
                    "GDP", "901Y003",
                    "제조업PMI", "901Y081",
                    "주택가격지수", "901Y082");

            log.info("조회할 지표 목록:");
            financialIndicators.forEach((name, code) -> log.info("- {}: {}", name, code));


            for (Map.Entry<String, String> entry : financialIndicators.entrySet()) {
                String indicatorName = entry.getKey();
                String statCode = entry.getValue();

                log.info("지표 '{}' (코드: {}) 데이터 조회 시작", indicatorName, statCode);

                try {
                    List<Map<String, Object>> indicatorData = getKoreaBankIndicatorData(bokApiKey, statCode,
                            indicatorName, weekStart, weekEnd);

                    log.info("지표 '{}'에서 {}개의 데이터 조회됨", indicatorName, indicatorData.size());

                    scheduleList.addAll(indicatorData);
                } catch (Exception e) {
                    log.warn("지표 {} 데이터 조회 실패: {}", indicatorName, e.getMessage());
                    log.debug("지표 {} 조회 실패 상세: ", indicatorName, e);
                }
            }

            log.info("한국은행에서 총 {}개의 금융 일정을 조회했습니다.", scheduleList.size());

        } catch (Exception e) {
            log.error("한국은행 API 호출 실패", e);
            return getEmptyFinancialCalendar();
        }

        return scheduleList.isEmpty() ? getEmptyFinancialCalendar() : scheduleList;
    }

    private List<Map<String, Object>> getKoreaBankIndicatorData(String apiKey, String statCode, String indicatorName,
            LocalDate weekStart, LocalDate weekEnd) {
        List<Map<String, Object>> indicatorData = new ArrayList<>();

        try {

            String dataUrl = String.format(
                    "%s/%s/%s/%s/1/1000/%s/D/%s/%s",
                    ECOS_API_BASE_URL, SERVICE_NAME, apiKey, REQUEST_TYPE, LANGUAGE, statCode,
                    weekStart.format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                    weekEnd.format(DateTimeFormatter.ofPattern("yyyyMMdd")));

            log.info("한국은행 API URL: {}", dataUrl);

            ResponseEntity<String> response = restTemplate.getForEntity(dataUrl, String.class);

            log.info("API 응답 상태 코드: {}", response.getStatusCode());
            log.info("API 응답 본문: {}", response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseKoreaBankResponse(response.getBody(), indicatorName);
            } else {
                log.warn("한국은행 통계 데이터 응답 오류: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("한국은행 통계 데이터 조회 실패: {}", indicatorName, e);
        }

        return indicatorData;
    }

    private List<Map<String, Object>> parseKoreaBankResponse(String responseBody, String indicatorName) {
        List<Map<String, Object>> scheduleList = new ArrayList<>();

        try {
            log.info("파싱할 응답 본문: {}", responseBody);

            JsonNode rootNode = objectMapper.readTree(responseBody);

            if (rootNode.has("StatisticSearch") && rootNode.get("StatisticSearch").has("row")) {
                JsonNode rows = rootNode.get("StatisticSearch").get("row");

                if (rows.isArray()) {
                    log.info("응답에서 {}개의 행 발견", rows.size());

                    for (JsonNode row : rows) {
                        try {
                            log.info("파싱할 행: {}", row.toString());

                            Map<String, Object> schedule = new HashMap<>();


                            String itemName = getTextValue(row, "ITEM_NAME");
                            String unitName = getTextValue(row, "UNIT_NAME");

                            if (itemName != null) {
                                schedule.put("indicator", itemName + (unitName != null ? " (" + unitName + ")" : ""));


                                schedule.put("time", "08:00");


                                String timeValue = getTextValue(row, "TIME");
                                if (timeValue != null && timeValue.length() >= 8) {
                                    String dateStr = timeValue.substring(0, 8);
                                    LocalDate eventDate = LocalDate.of(
                                            Integer.parseInt(dateStr.substring(0, 4)),
                                            Integer.parseInt(dateStr.substring(4, 6)),
                                            Integer.parseInt(dateStr.substring(6, 8)));

                                    schedule.put("date", eventDate.toString());


                                    String dayOfWeek = eventDate.getDayOfWeek().getDisplayName(TextStyle.FULL,
                                            Locale.KOREAN);
                                    schedule.put("dayOfWeek", dayOfWeek);
                                }


                                schedule.put("importance", "high");
                                schedule.put("country", "한국");


                                String dataValue = getTextValue(row, "DATA_VALUE");
                                if (dataValue != null) {
                                    schedule.put("forecast", dataValue);
                                }

                                scheduleList.add(schedule);
                                log.info("한국은행 지표 추가: {} - {} ({})", schedule.get("date"), schedule.get("time"),
                                        itemName);
                            } else {
                                log.warn("ITEM_NAME이 null인 행 발견: {}", row.toString());
                            }

                        } catch (Exception e) {
                            log.warn("개별 한국은행 데이터 파싱 실패", e);
                        }
                    }
                } else {
                    log.warn("응답의 row가 배열이 아님: {}", rows.getNodeType());
                }
            } else {
                log.warn("응답에서 StatisticSearch 또는 row를 찾을 수 없음");
                log.info("전체 응답 구조: {}", rootNode.toString());
            }

        } catch (Exception e) {
            log.error("한국은행 응답 파싱 실패", e);
        }

        return scheduleList;
    }

    private List<Map<String, Object>> getEmptyFinancialCalendar() {
        log.warn("❌ 한국은행 API 호출 실패 - 빈 데이터 반환 (사용자에게 데이터 없음 표시)");
        return new ArrayList<>();
    }

    private boolean isRealDataFromApi(List<Map<String, Object>> scheduleList) {
        if (scheduleList == null || scheduleList.isEmpty()) {
            log.info("데이터 리스트가 비어있거나 null임 - 실제 데이터 아님");
            return false;
        }


        boolean hasRealData = scheduleList.stream()
                .anyMatch(item -> "한국".equals(item.get("country")));

        log.info("실제 데이터 확인 결과: {}", hasRealData);
        return hasRealData;
    }

    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asText() : null;
    }
}
