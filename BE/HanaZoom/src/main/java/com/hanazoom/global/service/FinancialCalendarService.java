package com.hanazoom.global.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanazoom.global.dto.FinancialCalendarDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 금융 캘린더 서비스
 * ECOS API 기반 주간 경제지표 캘린더 제공
 */
@Slf4j
@Service
public class FinancialCalendarService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ecos.api.key}")
    private String ecosApiKey;

    // ECOS API 기본 설정
    private static final String ECOS_BASE_URL = "https://ecos.bok.or.kr/api";
    private static final String SERVICE_NAME = "StatisticSearch";
    private static final String REQUEST_TYPE = "xml";
    private static final String LANGUAGE = "kr";
    private static final String TIMEZONE = "Asia/Seoul";

    // 인메모리 캐시 (TTL 5분)
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MINUTES = 5;

    // 지표 정의 (확인된 실제 통계표코드 사용)
    private static final Map<String, IndicatorDefinition> INDICATORS = Map.of(
            "CPI_M", new IndicatorDefinition(
                    "901Y009", "0", "소비자물가지수", "Consumer Price Index",
                    "M", "2020=100", "매월 2일"),
            "IP_M", new IndicatorDefinition(
                    "901Y015", "0", "산업생산지수", "Industrial Production Index",
                    "M", "2020=100", "매월 말일"),
            "GDP_Q_ADV", new IndicatorDefinition(
                    "200Y001", "10101", "GDP성장률(전기대비)", "GDP Growth Rate",
                    "Q", "%", "분기 종료 후 45일"),
            "UNEMPLOYMENT", new IndicatorDefinition(
                    "901Y086", "0", "실업률", "Unemployment Rate",
                    "M", "%", "매월 말일"),
            "CURRENT_ACCOUNT", new IndicatorDefinition(
                    "903Y001", "0", "경상수지", "Current Account Balance",
                    "M", "백만달러", "익월 말일"));

    public FinancialCalendarService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 주간 금융 캘린더 조회
     */
    public FinancialCalendarDto getWeeklyCalendar(LocalDate baseDate, boolean includeAll) {
        // baseDate가 null이면 현재일 사용 (한국 시간대 기준)
        LocalDate targetDate = baseDate != null ? baseDate : LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
        log.info("현재 한국 날짜: {} (서버 Instant: {})", targetDate, java.time.Instant.now());

        // 올바른 주간 계산 (현재 날짜가 속한 주의 월요일~일요일)
        LocalDate weekStart = targetDate.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = targetDate.with(DayOfWeek.SUNDAY);

        // 2025-09-29의 경우 weekStart는 2025-09-22, weekEnd는 2025-09-28
        // 하지만 2025-09-29는 화요일이므로 다음 주간으로 조정
        if (targetDate.getDayOfWeek() == DayOfWeek.MONDAY) {
            // 월요일인 경우 현재 주간
            log.info("📅 {} - 월요일, 현재 주간 사용: {} ~ {}", targetDate, weekStart, weekEnd);
        } else {
            // 화요일 이후인 경우 다음 주간으로 조정
            weekStart = weekStart.plusWeeks(1);
            weekEnd = weekEnd.plusWeeks(1);
            log.info("📅 {} - {}, 다음 주간 사용: {} ~ {}", targetDate, targetDate.getDayOfWeek(), weekStart, weekEnd);
        }

        log.info("주간 금융 캘린더 계산 - 기준일: {}, 주간: {} ~ {}",
                targetDate, weekStart, weekEnd);
        log.info("최근 발표 데이터 기준일 계산 시작 - 현재기준: {}", targetDate);

        // 주간 정보 생성
        FinancialCalendarDto.WeekInfo weekInfo = new FinancialCalendarDto.WeekInfo(
                targetDate.toString(),
                weekStart.toString(),
                weekEnd.toString(),
                TIMEZONE);

        // 지표 수집
        List<FinancialCalendarDto.FinancialScheduleItem> items = new ArrayList<>();

        // 캐시 초기화 (테스트용)
        cache.clear();
        log.info("캐시 초기화 완료");

        for (Map.Entry<String, IndicatorDefinition> entry : INDICATORS.entrySet()) {
            String indicatorCode = entry.getKey();
            IndicatorDefinition definition = entry.getValue();

            try {
                log.info("📊 {} 처리 시작", definition.getNameKo());

                // 발표 예정일 계산
                LocalDate scheduledDate = calculateScheduledDate(definition, targetDate);
                log.debug("발표 예정일: {}", scheduledDate);

                // 해당 주차에 포함되는지 확인 (발표 예정)
                boolean inRange = isInWeekRange(scheduledDate, weekStart, weekEnd, includeAll);

                FinancialCalendarDto.FinancialScheduleItem item = null;

                if (inRange) {
                    // 발표 예정 지표 처리 - 현재 주간에 발표되는 지표
                    log.info("📅 {} - 이번 주 발표 예정", definition.getNameKo());

                    // 아직 발표되지 않았으므로 이전 발표 데이터를 조회
                    item = processRecentIndicator(definition, targetDate);

                    if (item != null) {
                        log.info("📅 {} - 발표 예정 (최근 데이터 표시)", definition.getNameKo());
                    } else {
                        log.warn("📅 {} - 발표 예정 데이터 없음", definition.getNameKo());
                        item = null;
                    }
                } else {
                    // 발표 예정이 아니면 실제 발표된 최근 데이터 확인
                    log.info("📈 {} - 최근 발표 데이터 조회", definition.getNameKo());
                    item = processRecentIndicator(definition, targetDate);
                }

                if (item != null) {
                    log.info("✅ {} 완료: {}", definition.getNameKo(), item.getActual());
                    items.add(item);
                } else {
                    log.warn("❌ {} 실패", definition.getNameKo());
                }

            } catch (Exception e) {
                log.error("💥 {} 처리 중 오류: {}", definition.getNameKo(), e.getMessage());
            }
        }

        log.info("총 {}개 지표 수집 완료", items.size());
        return new FinancialCalendarDto(weekInfo, items.toArray(new FinancialCalendarDto.FinancialScheduleItem[0]));
    }

    /**
     * 발표 예정 지표 처리
     */
    private FinancialCalendarDto.FinancialScheduleItem processScheduledIndicator(
            IndicatorDefinition definition, LocalDate scheduledDate, LocalDate targetDate) {

        // 캐시 키 생성
        String cacheKey = generateCacheKey(definition, targetDate);

        // 캐시 확인
        FinancialCalendarDto.FinancialScheduleItem item = getFromCache(cacheKey);

        if (item == null) {
            log.debug("📡 {} API 호출", definition.getNameKo());
            // ECOS API에서 데이터 조회
            item = fetchFromEcos(definition, scheduledDate);
            if (item == null || item.getActual() == null) {
                log.warn("❌ {} API 데이터 없음", definition.getNameKo());
                item = null;
            } else {
                log.debug("✅ {} API 성공: {}", definition.getNameKo(), item.getActual());
            }
            // 실제 데이터만 캐시에 저장
            if (item != null) {
                cache.put(cacheKey, new CacheEntry(item, LocalDateTime.now().plusMinutes(CACHE_TTL_MINUTES)));
            }
        }

        return item;
    }

    /**
     * 최근 발표 지표 처리
     */
    private FinancialCalendarDto.FinancialScheduleItem processRecentIndicator(
            IndicatorDefinition definition, LocalDate targetDate) {

        try {
            // 최근 발표 데이터 조회를 위해 조회 기간을 현재 월/분기 기준으로 설정
            LocalDate recentDate = calculateRecentPublishedDate(definition, targetDate);
            log.debug("📅 최근 발표 기준일: {}", recentDate);

            // 캐시 키 생성 (최근 데이터용)
            String recentCacheKey = generateRecentCacheKey(definition, targetDate);

            // 캐시 확인
            FinancialCalendarDto.FinancialScheduleItem item = getFromCache(recentCacheKey);

            if (item == null) {
                log.debug("📡 {} 최근 데이터 API 호출", definition.getNameKo());
                // 최근 발표 데이터를 조회
                item = fetchRecentFromEcos(definition, recentDate);
                if (item == null || item.getActual() == null) {
                    log.warn("❌ {} 최근 데이터 없음", definition.getNameKo());
                    item = null;
                } else {
                    log.debug("✅ {} 최근 데이터 성공: {}", definition.getNameKo(), item.getActual());
                }
                // 실제 데이터만 캐시에 저장
                if (item != null) {
                    cache.put(recentCacheKey, new CacheEntry(item, LocalDateTime.now().plusMinutes(CACHE_TTL_MINUTES)));
                }
            }

            return item;

        } catch (Exception e) {
            log.error("💥 {} 최근 데이터 처리 오류: {}", definition.getNameKo(), e.getMessage());
            return null;
        }
    }

    /**
     * 발표일 계산 (주말 보정 포함)
     */
    private LocalDate calculateScheduledDate(IndicatorDefinition definition, LocalDate baseDate) {
        String rule = definition.getRule();
        LocalDate scheduledDate;

        if (rule.equals("매월 2일")) {
            // 매월 2일 (다음달 2일)
            LocalDate nextMonth = baseDate.plusMonths(1);
            scheduledDate = nextMonth.withDayOfMonth(2);

        } else if (rule.equals("매월 말일")) {
            // 매월 말일 (이번달 말일)
            scheduledDate = baseDate.withDayOfMonth(
                    baseDate.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth());

        } else if (rule.equals("익월 말일")) {
            // 익월 말일 (다음달 말일)
            LocalDate nextMonth = baseDate.plusMonths(1);
            scheduledDate = nextMonth.withDayOfMonth(
                    nextMonth.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth());

        } else if (rule.startsWith("분기 종료 후 ")) {
            // 분기 종료 후 D일
            int daysAfter = Integer.parseInt(rule.replace("분기 종료 후 ", "").replace("일", ""));

            // 해당 분기 계산 (기준일의 월요일이 속한 달의 분기)
            LocalDate mondayOfWeek = baseDate.with(DayOfWeek.MONDAY);
            int month = mondayOfWeek.getMonthValue();
            int quarter = (month - 1) / 3 + 1;
            int quarterStartMonth = (quarter - 1) * 3 + 1;
            int quarterEndMonth = quarterStartMonth + 2;

            LocalDate quarterEnd = LocalDate.of(baseDate.getYear(), quarterEndMonth, 1)
                    .withDayOfMonth(1).plusMonths(1).minusDays(1);

            scheduledDate = quarterEnd.plusDays(daysAfter);

        } else {
            throw new IllegalArgumentException("알 수 없는 규칙: " + rule);
        }

        // 주말 보정 (토/일이면 월요일로 이월)
        if (scheduledDate.getDayOfWeek() == DayOfWeek.SATURDAY) {
            scheduledDate = scheduledDate.plusDays(2); // 토요일 → 월요일
        } else if (scheduledDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
            scheduledDate = scheduledDate.plusDays(1); // 일요일 → 월요일
        }

        return scheduledDate;
    }

    /**
     * 최근 발표일 계산 (실제 발표된 데이터 조회용)
     */
    private LocalDate calculateRecentPublishedDate(IndicatorDefinition definition, LocalDate baseDate) {
        String rule = definition.getRule();
        LocalDate recentDate;

        if (rule.equals("매월 2일")) {
            // 매월 2일 발표 → 실제 발표된 데이터는 3개월 전 (2024년 데이터)
            LocalDate prevMonth = baseDate.minusMonths(3);
            recentDate = prevMonth.withDayOfMonth(2);

        } else if (rule.equals("매월 말일")) {
            // 매월 말일 발표 → 실제 발표된 데이터는 3개월 전
            LocalDate prevMonth = baseDate.minusMonths(3);
            recentDate = prevMonth.withDayOfMonth(
                    prevMonth.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth());

        } else if (rule.equals("익월 말일")) {
            // 익월 말일 발표 → 실제 발표된 데이터는 3개월 전
            LocalDate prevMonth = baseDate.minusMonths(3);
            recentDate = prevMonth.withDayOfMonth(
                    prevMonth.withDayOfMonth(1).plusMonths(1).minusDays(1).getDayOfMonth());

        } else if (rule.startsWith("분기 종료 후 ")) {
            // 분기 종료 후 D일 발표 → 실제 발표된 데이터는 2분기 전
            int daysAfter = Integer.parseInt(rule.replace("분기 종료 후 ", "").replace("일", ""));

            // 2분기 전 분기 계산 (실제 발표된 데이터 조회)
            LocalDate mondayOfWeek = baseDate.with(DayOfWeek.MONDAY);
            int month = mondayOfWeek.getMonthValue();
            int quarter = (month - 1) / 3 + 1;
            int prevQuarter = quarter - 2; // 2분기 전
            if (prevQuarter < 1) {
                prevQuarter = prevQuarter + 4;
            }

            int prevQuarterStartMonth = (prevQuarter - 1) * 3 + 1;
            int prevQuarterEndMonth = prevQuarterStartMonth + 2;

            int year = baseDate.getYear();
            if (quarter <= 2) {
                year = year - 1; // 2분기 전이 작년인 경우
            }

            LocalDate prevQuarterEnd = LocalDate.of(year, prevQuarterEndMonth, 1)
                    .withDayOfMonth(1).plusMonths(1).minusDays(1);

            recentDate = prevQuarterEnd.plusDays(daysAfter);

        } else {
            throw new IllegalArgumentException("알 수 없는 규칙: " + rule);
        }

        // 주말 보정 (토/일이면 월요일로 이월)
        if (recentDate.getDayOfWeek() == DayOfWeek.SATURDAY) {
            recentDate = recentDate.plusDays(2); // 토요일 → 월요일
        } else if (recentDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
            recentDate = recentDate.plusDays(1); // 일요일 → 월요일
        }

        return recentDate;
    }

    /**
     * 주차 범위 포함 확인
     */
    private boolean isInWeekRange(LocalDate scheduledDate, LocalDate weekStart, LocalDate weekEnd, boolean includeAll) {
        log.debug("isInWeekRange 호출 - scheduledDate: {}, weekStart: {}, weekEnd: {}, includeAll: {}",
                scheduledDate, weekStart, weekEnd, includeAll);

        if (includeAll) {
            log.debug("includeAll이 true이므로 모든 지표 포함");
            return true; // 모든 지표 포함
        }

        boolean result = !scheduledDate.isBefore(weekStart) && !scheduledDate.isAfter(weekEnd);
        log.debug("범위 체크 결과: {}", result);
        return result;
    }

    /**
     * ECOS API에서 데이터 조회
     */
    private FinancialCalendarDto.FinancialScheduleItem fetchFromEcos(IndicatorDefinition definition,
            LocalDate scheduledDate) {
        try {
            // 조회 기간 설정 (발표월/분기의 이전/현재)
            String startDate, endDate;

            if (definition.getCycle().equals("M")) {
                // scheduledDate 기준으로 실제 발표된 데이터 조회
                LocalDate currentMonth = scheduledDate.withDayOfMonth(1);
                LocalDate prevMonth = currentMonth.minusMonths(1);
                startDate = prevMonth.format(DateTimeFormatter.ofPattern("yyyyMM"));
                endDate = currentMonth.format(DateTimeFormatter.ofPattern("yyyyMM"));
            } else { // 분기
                LocalDate publishedQuarter = getQuarterStart(scheduledDate);
                LocalDate prevQuarter = publishedQuarter.minusMonths(3);
                startDate = prevQuarter.format(DateTimeFormatter.ofPattern("yyyyMM"));
                endDate = publishedQuarter.format(DateTimeFormatter.ofPattern("yyyyMM"));
            }

            // API URL 구성 (StatisticSearch 형식)
            String url = String.format("%s/%s/%s/%s/%s/1/100/%s/%s/%s/%s/%s",
                    ECOS_BASE_URL, SERVICE_NAME, ecosApiKey, REQUEST_TYPE, LANGUAGE,
                    definition.getStatCode(), definition.getCycle(),
                    startDate, endDate,
                    definition.getItem1());

            log.debug("🔗 API URL: {}", url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseEcosResponse(definition, scheduledDate, response.getBody());
            } else {
                log.warn("❌ API 응답 오류: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("💥 API 호출 실패: {}", e.getMessage());
        }

        // 실패 시 null actual로 반환
        return createEmptyItem(definition, scheduledDate);
    }

    /**
     * 최근 발표 데이터를 위한 ECOS API 조회
     */
    private FinancialCalendarDto.FinancialScheduleItem fetchRecentFromEcos(IndicatorDefinition definition,
            LocalDate recentDate) {
        try {
            // 최근 발표 데이터를 조회하기 위해 조회 기간 설정 (발표월/분기의 이전/현재)
            String startDate, endDate;

            if (definition.getCycle().equals("M")) {
                // recentDate 기준으로 실제 발표된 데이터 조회
                LocalDate currentMonth = recentDate.withDayOfMonth(1);
                LocalDate prevMonth = currentMonth.minusMonths(1);
                startDate = prevMonth.format(DateTimeFormatter.ofPattern("yyyyMM"));
                endDate = currentMonth.format(DateTimeFormatter.ofPattern("yyyyMM"));
            } else { // 분기
                LocalDate publishedQuarter = getQuarterStart(recentDate);
                LocalDate prevQuarter = publishedQuarter.minusMonths(3);
                startDate = prevQuarter.format(DateTimeFormatter.ofPattern("yyyyMM"));
                endDate = publishedQuarter.format(DateTimeFormatter.ofPattern("yyyyMM"));
            }

            // API URL 구성 (StatisticSearch 형식)
            String url = String.format("%s/%s/%s/%s/%s/1/100/%s/%s/%s/%s/%s",
                    ECOS_BASE_URL, SERVICE_NAME, ecosApiKey, REQUEST_TYPE, LANGUAGE,
                    definition.getStatCode(), definition.getCycle(),
                    startDate, endDate,
                    definition.getItem1());

            log.debug("🔗 최근 데이터 API URL: {}", url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseEcosResponse(definition, recentDate, response.getBody());
            } else {
                log.warn("❌ 최근 데이터 API 응답 오류: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("💥 최근 데이터 API 호출 실패: {}", e.getMessage());
        }

        // 실패 시 null actual로 반환
        return createEmptyItem(definition, recentDate);
    }

    /**
     * ECOS 응답 파싱 (StatisticSearch XML)
     */
    private FinancialCalendarDto.FinancialScheduleItem parseEcosResponse(
            IndicatorDefinition definition, LocalDate scheduledDate, String responseBody) {

        try {
            log.debug("📄 XML 응답 파싱 중...");

            // StatisticSearch 응답에서 DATA_VALUE 추출
            String actual = extractStatisticSearchValue(responseBody);

            if (actual != null) {
                log.debug("✅ {} 데이터 추출: {}", definition.getNameKo(), actual);
                return createTestItem(definition, scheduledDate, actual);
            } else {
                log.debug("❌ {} 데이터 없음", definition.getNameKo());
                return null;
            }

        } catch (Exception e) {
            log.error("💥 응답 파싱 실패: {}", e.getMessage());
        }

        return createEmptyItem(definition, scheduledDate);
    }

    /**
     * 테스트용 아이템 생성
     */
    private FinancialCalendarDto.FinancialScheduleItem createTestItem(
            IndicatorDefinition definition, LocalDate scheduledDate, String actual) {

        String status = determineStatus(actual, scheduledDate);

        return new FinancialCalendarDto.FinancialScheduleItem(
                definition.getCode(),
                definition.getNameKo(),
                definition.getNameEn(),
                definition.getCycle(),
                definition.getUnitHint(),
                scheduledDate.toString(),
                status.equals("RELEASED")
                        ? scheduledDate.atTime(8, 0, 0).toInstant(java.time.ZoneOffset.ofHours(9)).toString()
                        : null,
                definition.getRule(),
                "전월: 2.3", // 이전값
                actual, // 실제값
                status,
                "ECOS");
    }

    /**
     * 빈 아이템 생성 (API 실패 시)
     */
    private FinancialCalendarDto.FinancialScheduleItem createEmptyItem(
            IndicatorDefinition definition, LocalDate scheduledDate) {

        String status = determineStatus(null, scheduledDate);

        return new FinancialCalendarDto.FinancialScheduleItem(
                definition.getCode(),
                definition.getNameKo(),
                definition.getNameEn(),
                definition.getCycle(),
                definition.getUnitHint(),
                scheduledDate.toString(),
                null,
                definition.getRule(),
                null,
                null,
                status,
                "ECOS");
    }

    /**
     * 상태 결정
     */
    private String determineStatus(String actual, LocalDate scheduledDate) {
        LocalDate today = LocalDate.now();

        if (actual != null && !actual.isEmpty()) {
            return "RELEASED";
        } else if (today.isAfter(scheduledDate)) {
            return "DELAYED";
        } else {
            return "SCHEDULED";
        }
    }

    /**
     * 분기 시작일 계산
     */
    private LocalDate getQuarterStart(LocalDate date) {
        int month = date.getMonthValue();
        int quarter = (month - 1) / 3 + 1;
        int quarterStartMonth = (quarter - 1) * 3 + 1;
        return LocalDate.of(date.getYear(), quarterStartMonth, 1);
    }

    /**
     * 캐시에서 조회
     */
    private FinancialCalendarDto.FinancialScheduleItem getFromCache(String cacheKey) {
        CacheEntry entry = cache.get(cacheKey);
        if (entry != null && entry.isValid()) {
            return entry.getItem();
        }
        return null;
    }

    /**
     * 캐시 키 생성
     */
    private String generateCacheKey(IndicatorDefinition definition, LocalDate baseDate) {
        return String.format("%s|%s|%s|%s|%s",
                definition.getStatCode(),
                definition.getCycle(),
                baseDate.getYear(),
                baseDate.getMonthValue(),
                definition.getItem1());
    }

    /**
     * 최근 데이터용 캐시 키 생성
     */
    private String generateRecentCacheKey(IndicatorDefinition definition, LocalDate baseDate) {
        return String.format("RECENT|%s|%s|%s|%s|%s",
                definition.getStatCode(),
                definition.getCycle(),
                baseDate.getYear(),
                baseDate.getMonthValue(),
                definition.getItem1());
    }

    /**
     * JSON 텍스트 값 추출 헬퍼
     */
    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asText() : null;
    }

    /**
     * StatisticSearch XML에서 DATA_VALUE 추출
     */
    private String extractStatisticSearchValue(String xmlResponse) {
        try {
            // 첫 번째 <row>의 <DATA_VALUE>를 찾기
            int rowStart = xmlResponse.indexOf("<row>");
            if (rowStart == -1) {
                return null;
            }

            int rowEnd = xmlResponse.indexOf("</row>", rowStart) + 6;
            if (rowEnd == -1) {
                return null;
            }

            String rowContent = xmlResponse.substring(rowStart, rowEnd);

            // DATA_VALUE 추출
            int dataStart = rowContent.indexOf("<DATA_VALUE>");
            int dataEnd = rowContent.indexOf("</DATA_VALUE>");

            if (dataStart == -1 || dataEnd == -1) {
                return null;
            }

            String dataValue = rowContent.substring(dataStart + 12, dataEnd);
            return dataValue;

        } catch (Exception e) {
            log.error("XML 파싱 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 지표 정의 클래스
     */
    private static class IndicatorDefinition {
        private final String statCode;
        private final String item1;
        private final String nameKo;
        private final String nameEn;
        private final String cycle;
        private final String unitHint;
        private final String rule;

        public IndicatorDefinition(String statCode, String item1, String nameKo, String nameEn,
                String cycle, String unitHint, String rule) {
            this.statCode = statCode;
            this.item1 = item1;
            this.nameKo = nameKo;
            this.nameEn = nameEn;
            this.cycle = cycle;
            this.unitHint = unitHint;
            this.rule = rule;
        }

        // Getters
        public String getStatCode() {
            return statCode;
        }

        public String getItem1() {
            return item1;
        }

        public String getNameKo() {
            return nameKo;
        }

        public String getNameEn() {
            return nameEn;
        }

        public String getCycle() {
            return cycle;
        }

        public String getUnitHint() {
            return unitHint;
        }

        public String getRule() {
            return rule;
        }

        public String getCode() {
            return this.getClass().getEnclosingClass().getSimpleName() + "_" + statCode;
        }
    }

    /**
     * 캐시 엔트리
     */
    private static class CacheEntry {
        private final FinancialCalendarDto.FinancialScheduleItem item;
        private final LocalDateTime expiryTime;

        public CacheEntry(FinancialCalendarDto.FinancialScheduleItem item, LocalDateTime expiryTime) {
            this.item = item;
            this.expiryTime = expiryTime;
        }

        public boolean isValid() {
            return LocalDateTime.now().isBefore(expiryTime);
        }

        public FinancialCalendarDto.FinancialScheduleItem getItem() {
            return item;
        }
    }
}
