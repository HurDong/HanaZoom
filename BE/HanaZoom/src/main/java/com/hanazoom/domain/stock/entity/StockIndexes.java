package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;

/**
 * 주식 관련 테이블들의 인덱스를 생성하기 위한 클래스
 * JPA에서 복잡한 인덱스를 생성할 때 사용
 */
@Entity
@Table(name = "stock_indexes")
public class StockIndexes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이 클래스는 인덱스 생성을 위한 용도로만 사용
    // 실제 데이터는 저장하지 않음
}
