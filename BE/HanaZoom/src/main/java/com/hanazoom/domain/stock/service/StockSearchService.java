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

@Slf4j
@Service
@RequiredArgsConstructor
public class StockSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public List<StockSearchResult> searchStocks(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new ArrayList<>();
        }

        final String searchKeyword = keyword.trim();

        try {

            List<StockSearchResult> exactResults = performExactSearch(searchKeyword);


            if (exactResults.size() >= 3) {
                log.info("🔍 정확 검색: '{}', 결과: {}건", searchKeyword, exactResults.size());
                return exactResults;
            }


            List<StockSearchResult> fuzzyResults = performFuzzySearch(searchKeyword);


            List<StockSearchResult> combinedResults = new ArrayList<>(exactResults);
            fuzzyResults.stream()
                    .filter(fuzzy -> exactResults.stream()
                            .noneMatch(exact -> exact.getSymbol().equals(fuzzy.getSymbol())))
                    .limit(5 - exactResults.size()) 
                    .forEach(combinedResults::add);

            log.info("🔍 통합 검색: '{}', 정확: {}건, Fuzzy: {}건, 총: {}건",
                    searchKeyword, exactResults.size(), fuzzyResults.size(), combinedResults.size());

            return combinedResults;

        } catch (Exception e) {
            log.error("❌ Elasticsearch 검색 실패: {}", searchKeyword, e);
            return new ArrayList<>();
        }
    }

    private List<StockSearchResult> performExactSearch(String keyword) {
        try {

            Query symbolQuery = TermQuery.of(t -> t
                    .field("symbol")
                    .value(keyword)
                    .boost(10.0f))._toQuery();


            Query exactMatchQuery = MatchQuery.of(m -> m
                    .field("name.keyword")
                    .query(keyword)
                    .boost(8.0f))._toQuery();


            Query noriMatchQuery = MatchQuery.of(m -> m
                    .field("name")
                    .query(keyword)
                    .analyzer("nori_analyzer")
                    .boost(5.0f))._toQuery();


            Query boolQuery = BoolQuery.of(b -> b
                    .should(symbolQuery)
                    .should(exactMatchQuery)
                    .should(noriMatchQuery)
                    .minimumShouldMatch("1"))._toQuery();


            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(boolQuery)
                    .withMaxResults(20)
                    .withMinScore(3.0f) 
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

    private List<StockSearchResult> performFuzzySearch(String keyword) {
        try {

            Query fuzzyQuery = FuzzyQuery.of(f -> f
                    .field("name")
                    .value(keyword)
                    .fuzziness("1") 
                    .maxExpansions(5)
                    .prefixLength(2) 
                    .boost(2.0f))._toQuery();


            NativeQuery searchQuery = NativeQuery.builder()
                    .withQuery(fuzzyQuery)
                    .withMaxResults(5)
                    .withMinScore(1.5f) 
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

    public List<String> getSuggestions(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return new ArrayList<>();
        }

        final String searchPrefix = prefix.trim();

        try {

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

    public List<StockSearchResult> searchByKeywordAndSector(String keyword, String sector) {
        try {

            Query keywordQuery = MatchQuery.of(m -> m
                    .field("name")
                    .query(keyword)
                    .analyzer("nori_analyzer"))._toQuery();


            Query sectorQuery = TermQuery.of(t -> t
                    .field("sector.keyword")
                    .value(sector))._toQuery();


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

    private StockSearchResult convertToSearchResult(SearchHit<StockDocument> hit, String keyword) {
        StockDocument doc = hit.getContent();
        float score = hit.getScore();


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


        result.setCompatibilityFields();

        return result;
    }

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
