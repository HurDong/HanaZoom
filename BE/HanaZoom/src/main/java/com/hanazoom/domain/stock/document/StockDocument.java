package com.hanazoom.domain.stock.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.math.BigDecimal;

/**
 * Elasticsearch용 주식 Document
 * 빠른 검색과 오타 교정, 형태소 분석을 위한 인덱스
 */
@Document(indexName = "stocks")
@Setting(settingPath = "/elasticsearch/stock-settings.json")
@Mapping(mappingPath = "/elasticsearch/stock-mappings.json")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockDocument {

    @Id
    private Long id;

    /**
     * 주식 종목명 (한국어 형태소 분석)
     * - nori_analyzer: 형태소 분석 + 동의어
     * - keyword: 정확한 매칭
     * - ngram: 부분 매칭
     */
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "nori_analyzer"), otherFields = {
            @InnerField(suffix = "keyword", type = FieldType.Keyword),
            @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "ngram_analyzer"),
            @InnerField(suffix = "initial", type = FieldType.Text, analyzer = "initial_analyzer")
    })
    private String name;

    /**
     * 주식 심볼/코드 (정확한 매칭용)
     */
    @MultiField(mainField = @Field(type = FieldType.Keyword), otherFields = {
            @InnerField(suffix = "text", type = FieldType.Text)
    })
    private String symbol;

    /**
     * 업종/섹터
     */
    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "nori_analyzer"), otherFields = {
            @InnerField(suffix = "keyword", type = FieldType.Keyword)
    })
    private String sector;

    /**
     * 현재가 (정렬/필터링용)
     */
    @Field(type = FieldType.Double)
    private BigDecimal currentPrice;

    /**
     * 등락률 (정렬/필터링용)
     */
    @Field(type = FieldType.Double)
    private BigDecimal priceChangePercent;

    /**
     * 로고 URL (검색 대상 아님)
     */
    @Field(type = FieldType.Keyword, index = false)
    private String logoUrl;

}
