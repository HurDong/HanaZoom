package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.document.StockDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Elasticsearch용 주식 검색 Repository
 */
@Repository
public interface StockElasticsearchRepository extends ElasticsearchRepository<StockDocument, Long> {

    /**
     * 종목명으로 검색
     */
    List<StockDocument> findByName(String name);

    /**
     * 심볼로 검색
     */
    Optional<StockDocument> findBySymbol(String symbol);

    /**
     * 종목명에 포함된 텍스트로 검색
     */
    List<StockDocument> findByNameContaining(String name);

    /**
     * 섹터로 필터링
     */
    List<StockDocument> findBySector(String sector);
}
