package com.hanazoom.domain.stock.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_indexes")
public class StockIndexes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



}
