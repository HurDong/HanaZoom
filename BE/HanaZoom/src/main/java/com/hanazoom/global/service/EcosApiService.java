package com.hanazoom.global.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.global.dto.FinancialScheduleItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

/**
 * 한국은행 ECOS API 서비스
 * 실제 경제지표 데이터를 제공하는 공식 API 연동
 */
@Slf4j
@Service
public class EcosApiService {

    @Value("${ecos.api.key}")
    private String bokApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String ECOS_API_BASE_URL = "https://ecos.bok.or.kr/api";
    private static final String SERVICE_NAME = "StatisticSearch";
    private static final String REQUEST_TYPE = "json";
    private static final String LANGUAGE = "kr";

    /**
     * 이번 주 금융 일정 조회
     */
    public List<FinancialScheduleItem> getWeeklySchedule() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(DayOfWeek.FRIDAY);

        // 테스트용 통계코드 (소비자물가지수: 901Y014 같은 실제 코드 필요)
        String statCode = "901Y014";

        String url = String.format(
            "%s/%s/%s/%s/%s/%d/%d/%s/M/%s/%s",
            ECOS_API_BASE_URL,
            SERVICE_NAME,
            bokApiKey,
            REQUEST_TYPE,
            LANGUAGE,
            1, 100, // startCount, endCount
            statCode,
            weekStart.format(DateTimeFormatter.ofPattern("yyyyMM")),
            weekEnd.format(DateTimeFormatter.ofPattern("yyyyMM"))
        );

        log.info("ECOS API 호출 URL: {}", url);

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("ECOS API 호출 실패: {}", response.getStatusCode());
            return Collections.emptyList();
        }

        return parseResponse(response.getBody());
    }

    private List<FinancialScheduleItem> parseResponse(String body) {
        List<FinancialScheduleItem> items = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(body);

            if (root.has("RESULT")) {
                log.error("ECOS API 에러: {}", root.get("RESULT").toString());
                return items;
            }

            if (root.has("StatisticSearch")) {
                JsonNode rows = root.get("StatisticSearch").get("row");
                if (rows.isArray()) {
                    for (JsonNode row : rows) {
                        String time = row.get("TIME").asText();
                        LocalDate date = LocalDate.parse(time + "01", DateTimeFormatter.ofPattern("yyyyMMdd"));

                        FinancialScheduleItem item = FinancialScheduleItem.builder()
                                .indicator(row.get("ITEM_NAME").asText())
                                .time("08:00")
                                .date(date.toString())
                                .dayOfWeek(date.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN))
                                .importance("중간")
                                .country("한국")
                                .forecast(row.get("DATA_VALUE").asText())
                                .build();

                        items.add(item);
                    }
                }
            }
        } catch (Exception e) {
            log.error("ECOS 응답 파싱 실패", e);
        }
        return items;
    }
}
