package com.hanazoom.domain.stock.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.math.BigDecimal;

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

    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "nori_analyzer"), otherFields = {
            @InnerField(suffix = "keyword", type = FieldType.Keyword),
            @InnerField(suffix = "ngram", type = FieldType.Text, analyzer = "ngram_analyzer"),
            @InnerField(suffix = "initial", type = FieldType.Text, analyzer = "initial_analyzer")
    })
    private String name;

    @MultiField(mainField = @Field(type = FieldType.Keyword), otherFields = {
            @InnerField(suffix = "text", type = FieldType.Text)
    })
    private String symbol;

    @MultiField(mainField = @Field(type = FieldType.Text, analyzer = "nori_analyzer"), otherFields = {
            @InnerField(suffix = "keyword", type = FieldType.Keyword)
    })
    private String sector;

    @Field(type = FieldType.Double)
    private BigDecimal currentPrice;

    @Field(type = FieldType.Double)
    private BigDecimal priceChangePercent;

    @Field(type = FieldType.Keyword, index = false)
    private String logoUrl;

}
