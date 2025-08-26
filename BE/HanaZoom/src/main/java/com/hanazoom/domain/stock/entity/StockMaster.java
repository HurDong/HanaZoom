package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class StockMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol", nullable = false, unique = true, length = 20)
    private String symbol;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "market", length = 20)
    private String market;

    @Column(name = "sector", length = 50)
    private String sector;

    @Column(name = "has_daily_data")
    private Boolean hasDailyData = false;

    @Column(name = "has_weekly_data")
    private Boolean hasWeeklyData = false;

    @Column(name = "has_monthly_data")
    private Boolean hasMonthlyData = false;

    @Column(name = "has_minute_data")
    private Boolean hasMinuteData = false;

    @Column(name = "has_tick_data")
    private Boolean hasTickData = false;

    @Column(name = "daily_start_date")
    private LocalDate dailyStartDate;

    @Column(name = "daily_end_date")
    private LocalDate dailyEndDate;

    @Column(name = "weekly_start_date")
    private LocalDate weeklyStartDate;

    @Column(name = "weekly_end_date")
    private LocalDate weeklyEndDate;

    @Column(name = "monthly_start_date")
    private LocalDate monthlyStartDate;

    @Column(name = "monthly_end_date")
    private LocalDate monthlyEndDate;

    @Column(name = "minute_start_date")
    private LocalDate minuteStartDate;

    @Column(name = "minute_end_date")
    private LocalDate minuteEndDate;

    @Column(name = "tick_start_date")
    private LocalDate tickStartDate;

    @Column(name = "tick_end_date")
    private LocalDate tickEndDate;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
