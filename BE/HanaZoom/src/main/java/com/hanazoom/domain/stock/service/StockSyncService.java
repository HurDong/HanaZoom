package com.hanazoom.domain.stock.service;

import com.hanazoom.domain.stock.document.StockDocument;
import com.hanazoom.domain.stock.entity.Stock;
import com.hanazoom.domain.stock.repository.StockElasticsearchRepository;
import com.hanazoom.domain.stock.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockSyncService {

    private final StockRepository stockRepository;
    private final StockElasticsearchRepository esRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void onApplicationReady() {

        try {
            Thread.sleep(5000);
            log.info("🚀 Elasticsearch 동기화 시작...");
            syncAllStocksToElasticsearch();
        } catch (InterruptedException e) {
            log.error("❌ 동기화 대기 중 인터럽트 발생", e);
            Thread.currentThread().interrupt();
        }
    }

    @Transactional(readOnly = true)
    public void syncAllStocksToElasticsearch() {
        try {

            ensureIndexExists();


            List<Stock> stocks = stockRepository.findAll();

            if (stocks.isEmpty()) {
                log.warn("⚠️ MySQL에 주식 데이터가 없습니다. 동기화를 건너뜁니다.");
                return;
            }


            List<StockDocument> documents = stocks.stream()
                    .map(this::convertToDocument)
                    .collect(Collectors.toList());


            esRepository.saveAll(documents);

            log.info("✅ {}개 주식 데이터 Elasticsearch 동기화 완료", documents.size());


            printIndexStats();

        } catch (Exception e) {
            log.error("❌ Elasticsearch 동기화 실패", e);
        }
    }

    public void syncSingleStock(Long stockId) {
        try {
            Stock stock = stockRepository.findById(stockId)
                    .orElseThrow(() -> new IllegalArgumentException("주식을 찾을 수 없습니다: " + stockId));

            StockDocument document = convertToDocument(stock);
            esRepository.save(document);

            log.info("✅ 주식 동기화 완료: {} ({})", stock.getName(), stock.getSymbol());

        } catch (Exception e) {
            log.error("❌ 주식 동기화 실패: {}", stockId, e);
        }
    }

    public void deleteStock(Long stockId) {
        try {
            esRepository.deleteById(stockId);
            log.info("✅ Elasticsearch에서 주식 삭제: {}", stockId);
        } catch (Exception e) {
            log.error("❌ Elasticsearch 주식 삭제 실패: {}", stockId, e);
        }
    }

    public void deleteAllIndices() {
        try {
            esRepository.deleteAll();
            log.warn("⚠️ Elasticsearch 인덱스 전체 삭제 완료");
        } catch (Exception e) {
            log.error("❌ 인덱스 삭제 실패", e);
        }
    }

    private void ensureIndexExists() {
        try {
            IndexOperations indexOps = elasticsearchOperations.indexOps(StockDocument.class);

            if (!indexOps.exists()) {
                log.info("📝 Elasticsearch 인덱스 생성 중...");
                indexOps.create();
                indexOps.putMapping(indexOps.createMapping());
                log.info("✅ 인덱스 생성 완료");
            } else {
                log.info("✅ Elasticsearch 인덱스 이미 존재함");
            }
        } catch (Exception e) {
            log.error("❌ 인덱스 확인/생성 실패", e);
        }
    }

    private void printIndexStats() {
        try {
            long count = esRepository.count();
            log.info("📊 Elasticsearch 통계: 총 {}개 문서", count);
        } catch (Exception e) {
            log.error("❌ 통계 조회 실패", e);
        }
    }

    private StockDocument convertToDocument(Stock stock) {
        return StockDocument.builder()
                .id(stock.getId())
                .name(stock.getName())
                .symbol(stock.getSymbol())
                .sector(stock.getSector() != null ? stock.getSector() : "기타")
                .currentPrice(stock.getCurrentPrice())
                .priceChangePercent(stock.getPriceChangePercent())
                .logoUrl(stock.getLogoUrl())
                .build();
    }

    private String extractInitials(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        StringBuilder initials = new StringBuilder();
        for (char ch : text.toCharArray()) {
            if (ch >= 0xAC00 && ch <= 0xD7A3) {

                int unicode = ch - 0xAC00;
                int initialIndex = unicode / (21 * 28);
                char[] INITIALS = { 'ㄱ', 'ㄲ', 'ㄴ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
                        'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ' };
                initials.append(INITIALS[initialIndex]);
            }
        }
        return initials.toString();
    }
}
