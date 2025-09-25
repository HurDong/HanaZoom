package com.hanazoom.domain.region.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "regions", indexes = {
    @Index(name = "idx_regions_parent_id", columnList = "parent_id"),
    @Index(name = "idx_regions_type", columnList = "type"),
    @Index(name = "idx_regions_parent_type", columnList = "parent_id, type"),
    @Index(name = "idx_regions_latitude_longitude", columnList = "latitude, longitude"),
    @Index(name = "idx_regions_type_latitude", columnList = "type, latitude")
})
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private RegionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Region parent;

    @OneToMany(mappedBy = "parent")
    private List<Region> children = new ArrayList<>();

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder
    public Region(String name, RegionType type, Region parent, BigDecimal latitude, BigDecimal longitude) {
        this.name = name;
        this.type = type;
        this.parent = parent;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}