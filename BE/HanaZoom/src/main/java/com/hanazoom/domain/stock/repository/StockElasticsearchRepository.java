package com.hanazoom.domain.stock.repository;

import com.hanazoom.domain.stock.document.StockDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockElasticsearchRepository extends ElasticsearchRepository<StockDocument, Long> {

    List<StockDocument> findByName(String name);

    Optional<StockDocument> findBySymbol(String symbol);

    List<StockDocument> findByNameContaining(String name);

    List<StockDocument> findBySector(String sector);
}
