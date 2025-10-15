package com.hanazoom.domain.region_stock.entity;

import com.hanazoom.domain.region.entity.Region;
import com.hanazoom.domain.stock.entity.Stock;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "region_stocks")
public class RegionStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_id", nullable = false)
    private Stock stock;

    @Column(name = "data_date", nullable = false)
    private LocalDate dataDate;

    @Column(name = "popularity_score", nullable = false, precision = 10, scale = 2)
    private BigDecimal popularityScore;

    @Column(name = "regional_ranking", nullable = false)
    private int regionalRanking;

    @Column(name = "post_count")
    private int postCount = 0;

    @Column(name = "comment_count")
    private int commentCount = 0;

    @Column(name = "vote_count")
    private int voteCount = 0;

    @Column(name = "view_count")
    private int viewCount = 0;

    @Column(name = "search_count")
    private int searchCount = 0;

    @Column(name = "news_mention_count")
    private int newsMentionCount = 0;

    @Column(name = "trend_score", precision = 5, scale = 2)
    private BigDecimal trendScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public RegionStock(Region region, Stock stock, LocalDate dataDate, BigDecimal popularityScore,
            int regionalRanking, BigDecimal trendScore) {
        this.region = region;
        this.stock = stock;
        this.dataDate = dataDate;
        this.popularityScore = popularityScore;
        this.regionalRanking = regionalRanking;
        this.trendScore = trendScore;
    }

    public void increasePopularityScore() {
        if (this.popularityScore == null) {
            this.popularityScore = BigDecimal.ONE;
        } else {
            this.popularityScore = this.popularityScore.add(BigDecimal.ONE);
        }
    }

    public void updateRegionalRanking(int newRanking) {
        this.regionalRanking = newRanking;
    }
}