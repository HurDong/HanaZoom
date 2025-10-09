package com.hanazoom.domain.stock.service;

import co.elastic.clients.elasticsearch._types.query_dsl.*;
import com.hanazoom.domain.stock.document.StockDocument;
import com.hanazoom.domain.stock.dto.StockSearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Elasticsearch 기반 주식 검색 서비스
 * - Fuzzy 검색: 오타 허용
 * - Nori 형태소 분석: 한국어 처리
 * - NGram: 부분 매칭
 * - 동의어 처리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    /**
     * 통합 검색 (오타 허용 + 형태소 분석 + 부분 매칭)
     * - 정확 매칭/포함 검색: 모든 결과 반환 (최대 20개)
     * - Fuzzy 매칭(오타): 최대 5개로 제한
     */
    public List<StockSearchResult> searchStocks(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new ArrayList<>();
        }

        final String searchKeyword = keyword.trim();

        try {
            // Step 1: 정확도 높은 검색 먼저 수행 (Symbol + Exact + Nori)
            List<StockSearchResult> exactResults = performExactSearch(searchKeyword);

            // 정확 매칭/포함 검색 결과가 충분하면 그것만 반환
            if (exactResults.size() >= 3) {
                log.info("🔍 정확 검색: '{}', 결과: {}건", searchKeyword, exactResults.size());
                return exactResults;
            }

            // Step 2: 결과가 적으면 Fuzzy 검색 추가 (오타 허용)
            List<StockSearchResult> fuzzyResults = performFuzzySearch(searchKeyword);

            // 정확 검색 결과 + Fuzzy 결과 병합 (중복 제거)
            List<StockSearchResult> combinedResults = new ArrayList<>(exactResults);
            fuzzyResults.stream()
                    .filter(fuzzy -> exactResults.stream()
                            .noneMatch(exact -> exact.getSymbol().equals(fuzzy.getSymbol())))
                    .limit(5 - exactResults.size()) // Fuzzy는 최대 5개까지만
                    .forEach(combinedResults::add);

            log.info("🔍 통합 검색: '{}', 정확: {}건, Fuzzy: {}건, 총: {}건",
                    searchKeyword, exactResults.size(), fuzzyResults.size(), combinedResults.size());

            return combinedResults;

        } catch (Exception e) {
            log.error("❌ Elasticsearch 검색 실패: {}", searchKeyword, e);
            return new ArrayList<>();
        }
    }

    /**
     * 정확도 높은 검색 (Symbol + Exact + Nori)
     */
    private List<StockSearchResult> performExactSearch(String keyword) {
        try {
            // 1. Symbol 정확 매칭 (최우선)
            Query symbolQuery = TermQuery.of(t -> t
                    .field("symbol")
                    .value(keyword)
                    .boost(10.0f))._toQuery();

            // 2. 종목명 정확 매칭 (높은 우선순위)
            Query exactMatchQuery = MatchQuery.of(m -> m
                    .field("name.keyword")
                    .query(keyword)
                    .boost(8.0f))._toQuery();

            // 3. Nori 형태소 분석 (한국어 처리 - "삼성" → 삼성전자, 삼성물산 등)
            Query noriMatchQuery = MatchQuery.of(m -> m
                    .field("name")
                    .query(keyword)
                    .analyzer("nori_analyzer")
                    .boost(5.0f))._toQuery();

            // Bool Query로 조합
            Query boolQuery = BoolQuery.of(b -> b
                    .should(symbolQuery)
                    .should(exactMatchQuery)
                    .should(noriMatchQuery)
                    .minimumShouldMatch("1"))._toQuery();

            // 정확 검색은 더 많은 결과 허용 (최대 20개)
            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(boolQuery)
                    .withMaxResults(20)
                    .withMinScore(3.0f) // 높은 스코어만
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(
                    searchQuery,
                    StockDocument.class);

            return searchHits.getSearchHits().stream()
                    .map(hit -> convertToSearchResult(hit, keyword))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("❌ 정확 검색 실패: {}", keyword, e);
            return new ArrayList<>();
        }
    }

    /**
     * Fuzzy 검색 (오타 허용 - 최대 5개)
     */
    private List<StockSearchResult> performFuzzySearch(String keyword) {
        try {
            // Fuzzy 검색 (오타 허용 - 매우 엄격)
            Query fuzzyQuery = FuzzyQuery.of(f -> f
                    .field("name")
                    .value(keyword)
                    .fuzziness("1") // 1글자 차이만
                    .maxExpansions(5)
                    .prefixLength(2) // 첫 2글자는 반드시 일치
                    .boost(2.0f))._toQuery();

            // Fuzzy 검색은 적은 결과만 (최대 5개)
            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(fuzzyQuery)
                    .withMaxResults(5)
                    .withMinScore(1.5f) // Fuzzy는 낮은 스코어도 허용
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(
                    searchQuery,
                    StockDocument.class);

            return searchHits.getSearchHits().stream()
                    .map(hit -> convertToSearchResult(hit, keyword))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("❌ Fuzzy 검색 실패: {}", keyword, e);
            return new ArrayList<>();
        }
    }

    /**
     * 자동완성 제안
     */
    public List<String> getSuggestions(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return new ArrayList<>();
        }

        final String searchPrefix = prefix.trim();

        try {
            // Prefix 검색
            Query prefixQuery = PrefixQuery.of(p -> p
                    .field("name")
                    .value(searchPrefix))._toQuery();

            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(prefixQuery)
                    .withMaxResults(10)
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(
                    searchQuery,
                    StockDocument.class);

            return searchHits.getSearchHits().stream()
                    .map(hit -> hit.getContent().getName())
                    .distinct()
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("❌ 자동완성 제안 실패: {}", searchPrefix, e);
            return new ArrayList<>();
        }
    }

    /**
     * 섹터별 검색
     */
    public List<StockSearchResult> searchByKeywordAndSector(String keyword, String sector) {
        try {
            // 키워드 검색 쿼리
            Query keywordQuery = MatchQuery.of(m -> m
                    .field("name")
                    .query(keyword)
                    .analyzer("nori_analyzer"))._toQuery();

            // 섹터 필터
            Query sectorQuery = TermQuery.of(t -> t
                    .field("sector.keyword")
                    .value(sector))._toQuery();

            // Bool Query로 조합
            Query boolQuery = BoolQuery.of(b -> b
                    .must(keywordQuery)
                    .filter(sectorQuery))._toQuery();

            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(boolQuery)
                    .withMaxResults(10)
                    .build();

            SearchHits<StockDocument> searchHits = elasticsearchOperations.search(
                    searchQuery,
                    StockDocument.class);

            return searchHits.getSearchHits().stream()
                    .map(hit -> convertToSearchResult(hit, keyword))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("❌ 섹터별 검색 실패: keyword={}, sector={}", keyword, sector, e);
            return new ArrayList<>();
        }
    }

    /**
     * SearchHit을 StockSearchResult로 변환
     */
    private StockSearchResult convertToSearchResult(SearchHit<StockDocument> hit, String keyword) {
        StockDocument doc = hit.getContent();
        float score = hit.getScore();

        // 매칭 타입 결정
        String matchType = determineMatchType(doc, keyword, score);

        StockSearchResult result = StockSearchResult.builder()
                .symbol(doc.getSymbol())
                .name(doc.getName())
                .sector(doc.getSector() != null ? doc.getSector() : "기타")
                .currentPrice(doc.getCurrentPrice() != null ? doc.getCurrentPrice().toString() : "0")
                .priceChangePercent(doc.getPriceChangePercent() != null ? doc.getPriceChangePercent().toString() : "0")
                .logoUrl(doc.getLogoUrl())
                .score(score)
                .matchType(matchType)
                .highlightedName(doc.getName())
                .build();

        // 프론트엔드 호환성 필드 설정
        result.setCompatibilityFields();

        return result;
    }

    /**
     * 매칭 타입 결정 (점수 기반)
     */
    private String determineMatchType(StockDocument doc, String keyword, float score) {
        if (doc.getSymbol().equalsIgnoreCase(keyword)) {
            return "SYMBOL_EXACT";
        } else if (doc.getName().equalsIgnoreCase(keyword)) {
            return "NAME_EXACT";
        } else if (doc.getName().contains(keyword)) {
            return "NAME_CONTAINS";
        } else if (score > 3.0f) {
            return "FUZZY_HIGH";
        } else if (score > 1.0f) {
            return "FUZZY_MEDIUM";
        } else {
            return "FUZZY_LOW";
        }
    }
}
