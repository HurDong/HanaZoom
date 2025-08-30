# HanaZoom 데이터베이스 설계

## 1. 지역 테이블 (regions)

### 테이블 구조

```sql
CREATE TABLE regions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '지역명',
    type ENUM('CITY', 'DISTRICT', 'NEIGHBORHOOD') NOT NULL COMMENT '지역 타입',
    parent_id BIGINT NULL COMMENT '상위 지역 ID',
    latitude DECIMAL(10, 8) NULL COMMENT '위도',
    longitude DECIMAL(11, 8) NULL COMMENT '경도',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_parent_id (parent_id),
    INDEX idx_type (type),
    INDEX idx_name (name)
);
```

### 데이터 예시

```sql
-- 시 레벨
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
('서울특별시', 'CITY', NULL, 37.5665, 126.9780),
('인천광역시', 'CITY', NULL, 37.4563, 126.7052),
('경기도', 'CITY', NULL, 37.4138, 127.5183); -- 광명시를 위한 상위 지역

-- 구 레벨 (서울시)
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
('강남구', 'DISTRICT', 1, 37.5172, 127.0473),
('서초구', 'DISTRICT', 1, 37.4837, 127.0324),
('종로구', 'DISTRICT', 1, 37.5735, 126.9788),
('중구', 'DISTRICT', 1, 37.5640, 126.9979);

-- 구 레벨 (인천시)
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
('남동구', 'DISTRICT', 2, 37.4468, 126.7317),
('부평구', 'DISTRICT', 2, 37.5073, 126.7218),
('연수구', 'DISTRICT', 2, 37.4096, 126.6784);

-- 시 레벨 (광명시)
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
('광명시', 'DISTRICT', 3, 37.4781, 126.8644);

-- 동 레벨 (강남구 예시)
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
('삼성동', 'NEIGHBORHOOD', 4, 37.5145, 127.0597),
('역삼동', 'NEIGHBORHOOD', 4, 37.5000, 127.0366),
('대치동', 'NEIGHBORHOOD', 4, 37.4951, 127.0619);
```

### 특징

- **계층형 구조**: 시 → 구 → 동의 3단계 구조
- **자기참조**: parent_id로 상위 지역 참조
- **좌표 정보**: 카카오맵 연동을 위한 위도/경도
- **확장성**: 나중에 다른 지역 추가 가능

---

## 2. 주식 테이블 (stocks)

### 테이블 구조

```sql
CREATE TABLE stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '종목코드 (예: 005930)',
    name VARCHAR(100) NOT NULL COMMENT '종목명 (예: 삼성전자)',
    market VARCHAR(20) NOT NULL COMMENT '시장 (KOSPI, KOSDAQ, KONEX)',
    sector VARCHAR(50) NULL COMMENT '섹터 (전자, 화학, 서비스업 등)',
    logo_url VARCHAR(500) NULL COMMENT '종목 로고 URL',

    -- 실시간 정보 (API에서 업데이트)
    current_price DECIMAL(15, 2) NULL COMMENT '현재가',
    price_change DECIMAL(15, 2) NULL COMMENT '전일 대비 변동가',
    price_change_percent DECIMAL(5, 2) NULL COMMENT '전일 대비 변동률 (%)',
    volume BIGINT NULL COMMENT '거래량',
    market_cap BIGINT NULL COMMENT '시가총액',
    high_price DECIMAL(15, 2) NULL COMMENT '고가',
    low_price DECIMAL(15, 2) NULL COMMENT '저가',
    open_price DECIMAL(15, 2) NULL COMMENT '시가',

    -- 메타 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    last_updated TIMESTAMP NULL COMMENT '마지막 업데이트 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_symbol (symbol),
    INDEX idx_market (market),
    INDEX idx_sector (sector),
    INDEX idx_active (is_active),
    INDEX idx_last_updated (last_updated)
);
```

---

## 3. 관심종목 테이블 (watchlist)

### 테이블 구조

```sql
CREATE TABLE watchlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BINARY(16) NOT NULL COMMENT '회원 ID',
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드',

    -- 관심종목 설정 정보
    alert_price DECIMAL(15, 2) NULL COMMENT '알림 설정 가격',
    alert_type ENUM('ABOVE', 'BELOW', 'Bf 여부',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 한 회원이 같은 종목을 중복으로 관심종목에 추가할 수 없음
    UNIQUE KEY uk_member_stock (member_id, stock_symbol),

    -- 외래키 제약조건
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,

    INDEX idx_member_id (member_id),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_is_active (is_active),
    INDEX idx_alert_price (alert_price)
);
```

### 데이터 예시

```sql
-- 사용자 A의 관심종목 설정
INSERT INTO watchlist (member_id, stock_symbol, alert_price, alert_type, is_active) VALUES
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000'), '005930', 70000.00, 'BELOW', TRUE),   -- 삼성전자 7만원 이하 알림
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000'), '035420', 180000.00, 'ABOVE', TRUE),  -- NAVER 18만원 이상 알림
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000'), '035720', 50000.00, 'BOTH', TRUE);    -- 카카오 5만원 정확히 알림

-- 사용자 B의 관심종목 설정
INSERT INTO watchlist (member_id, stock_symbol, alert_price, alert_type, is_active) VALUES
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440001'), '000660', 130000.00, 'ABOVE', TRUE),  -- SK하이닉스 13만원 이상 알림
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440001'), '051910', 400000.00, 'BELOW', TRUE);  -- LG화학 40만원 이하 알림
```

### 특징

- **개인화**: 회원별로 독립적인 관심종목 관리
- **알림 설정**: 가격 알림을 위한 다양한 옵션 제공
- **중복 방지**: 한 회원이 같은 종목을 중복 추가할 수 없음
- **유연한 알림**: ABOVE(이상), BELOW(이하), BOTH(정확히) 알림 타입 지원
- **활성화 관리**: 관심종목을 비활성화할 수 있어 임시 제외 가능

### 알림 타입 설명

- **ABOVE**: 설정한 가격 이상일 때 알림 (예: 7만원 이상일 때)
- **BELOW**: 설정한 가격 이하일 때 알림 (예: 7만원 이하일 때)
- **BOTH**: 설정한 가격과 정확히 일치할 때 알림 (예: 7만원 정확히)

---

## 4. 주식 시계열 데이터 테이블들

### 3-1. 일별 주가 데이터 테이블 (stock_daily_prices)

```sql
CREATE TABLE stock_daily_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드 (예: 005930)',
    trade_date DATE NOT NULL COMMENT '거래일',

    -- OHLCV 데이터
    open_price DECIMAL(15, 2) NOT NULL COMMENT '시가',
    high_price DECIMAL(15, 2) NOT NULL COMMENT '고가',
    low_price DECIMAL(15, 2) NOT NULL COMMENT '저가',
    close_price DECIMAL(15, 2) NOT NULL COMMENT '종가',
    volume BIGINT NOT NULL COMMENT '거래량',

    -- 기술적 지표 (선택사항)
    price_change DECIMAL(15, 2) NULL COMMENT '전일 대비 변동가',
    price_change_percent DECIMAL(5, 2) NULL COMMENT '전일 대비 변동률 (%)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 종목-날짜 조합은 하나만 존재
    UNIQUE KEY uk_stock_date (stock_symbol, trade_date),

    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_trade_date (trade_date),
    INDEX idx_stock_date (stock_symbol, trade_date),
    INDEX idx_date_range (trade_date),
    INDEX idx_daily_price_range (stock_symbol, trade_date, close_price)
);
```

### 3-2. 주별 주가 데이터 테이블 (stock_weekly_prices)

```sql
CREATE TABLE stock_weekly_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드',
    week_start_date DATE NOT NULL COMMENT '주 시작일 (월요일)',
    week_end_date DATE NOT NULL COMMENT '주 종료일 (금요일)',

    -- OHLCV 데이터
    open_price DECIMAL(15, 2) NOT NULL COMMENT '주 시작가 (월요일 시가)',
    high_price DECIMAL(15, 2) NOT NULL COMMENT '주 중 최고가',
    low_price DECIMAL(15, 2) NOT NULL COMMENT '주 중 최저가',
    close_price DECIMAL(15, 2) NOT NULL COMMENT '주 종가 (금요일 종가)',
    volume BIGINT NOT NULL COMMENT '주간 총 거래량',

    -- 주간 통계
    avg_price DECIMAL(15, 2) NULL COMMENT '주간 평균가',
    price_change DECIMAL(15, 2) NULL COMMENT '전주 대비 변동가',
    price_change_percent DECIMAL(5, 2) NULL COMMENT '전주 대비 변동률 (%)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 종목-주 시작일 조합은 하나만 존재
    UNIQUE KEY uk_stock_week (stock_symbol, week_start_date),

    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_week_start_date (week_start_date),
    INDEX idx_week_end_date (week_end_date),
    INDEX idx_stock_week (stock_symbol, week_start_date),
    INDEX idx_weekly_price_range (stock_symbol, week_start_date, close_price)
);
```

### 3-3. 월별 주가 데이터 테이블 (stock_monthly_prices)

```sql
CREATE TABLE stock_monthly_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드',
    year_month VARCHAR(7) NOT NULL COMMENT '년월 (예: 2024-01)',

    -- OHLCV 데이터
    open_price DECIMAL(15, 2) NOT NULL COMMENT '월 시작가 (월 첫 거래일 시가)',
    high_price DECIMAL(15, 2) NOT NULL COMMENT '월 중 최고가',
    low_price DECIMAL(15, 2) NOT NULL COMMENT '월 중 최저가',
    close_price DECIMAL(15, 2) NOT NULL COMMENT '월 종가 (월 마지막 거래일 종가)',
    volume BIGINT NOT NULL COMMENT '월간 총 거래량',

    -- 월간 통계
    avg_price DECIMAL(15, 2) NULL COMMENT '월간 평균가',
    price_change DECIMAL(15, 2) NULL COMMENT '전월 대비 변동가',
    price_change_percent DECIMAL(5, 2) NULL COMMENT '전월 대비 변동률 (%)',

    -- 월간 거래일 수
    trading_days INT NULL COMMENT '월간 거래일 수',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 종목-년월 조합은 하나만 존재
    UNIQUE KEY uk_stock_month (stock_symbol, year_month),

    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_year_month (year_month),
    INDEX idx_stock_month (stock_symbol, year_month),
    INDEX idx_monthly_price_range (stock_symbol, year_month, close_price)
);
```

### 3-4. 주식 종목 마스터 테이블 (stock_master)

```sql
CREATE TABLE stock_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '종목코드',
    name VARCHAR(100) NOT NULL COMMENT '종목명',
    market VARCHAR(20) NULL COMMENT '시장 (KOSPI, KOSDAQ, KONEX)',
    sector VARCHAR(50) NULL COMMENT '섹터',

    -- 데이터 상태
    has_daily_data BOOLEAN DEFAULT FALSE COMMENT '일별 데이터 보유 여부',
    has_weekly_data BOOLEAN DEFAULT FALSE COMMENT '주별 데이터 보유 여부',
    has_monthly_data BOOLEAN DEFAULT FALSE COMMENT '월별 데이터 보유 여부',

    -- 데이터 범위
    daily_start_date DATE NULL COMMENT '일별 데이터 시작일',
    daily_end_date DATE NULL COMMENT '일별 데이터 종료일',
    weekly_start_date DATE NULL COMMENT '주별 데이터 시작일',
    weekly_end_date DATE NULL COMMENT '주별 데이터 종료일',
    monthly_start_date DATE NULL COMMENT '월별 데이터 시작일',
    monthly_end_date DATE NULL COMMENT '월별 데이터 종료일',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_symbol (symbol),
    INDEX idx_market (market),
    INDEX idx_sector (sector),
    INDEX idx_has_data (has_daily_data, has_weekly_data, has_monthly_data)
);
```

### 3-5. 데이터 처리 로그 테이블 (data_processing_logs)

```sql
CREATE TABLE data_processing_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    process_type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ALL') NOT NULL COMMENT '처리 타입',
    stock_symbol VARCHAR(20) NULL COMMENT '처리된 종목코드 (NULL이면 전체)',

    -- 처리 결과
    records_processed INT DEFAULT 0 COMMENT '처리된 레코드 수',
    records_inserted INT DEFAULT 0 COMMENT '새로 삽입된 레코드 수',
    records_updated INT DEFAULT 0 COMMENT '업데이트된 레코드 수',
    records_failed INT DEFAULT 0 COMMENT '실패한 레코드 수',

    -- 처리 시간
    start_time TIMESTAMP NULL COMMENT '처리 시작 시간',
    end_time TIMESTAMP NULL COMMENT '처리 종료 시간',
    processing_duration_seconds INT NULL COMMENT '처리 소요 시간 (초)',

    -- 상태 및 메시지
    status ENUM('SUCCESS', 'PARTIAL_SUCCESS', 'FAILED') NOT NULL COMMENT '처리 상태',
    error_message TEXT NULL COMMENT '에러 메시지',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_process_type (process_type),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### 3-6. 편의를 위한 뷰 (stock_price_summary)

```sql
CREATE VIEW stock_price_summary AS
SELECT
    sm.symbol,
    sm.name,
    sm.market,
    sm.sector,
    sm.has_daily_data,
    sm.has_weekly_data,
    sm.has_monthly_data,
    sm.daily_start_date,
    sm.daily_end_date,
    sm.weekly_start_date,
    sm.weekly_end_date,
    sm.monthly_start_date,
    sm.monthly_end_date,

    -- 최신 가격 정보
    (SELECT close_price FROM stock_daily_prices sdp
     WHERE sdp.stock_symbol = sm.symbol
     ORDER BY trade_date DESC LIMIT 1) as latest_close_price,

    -- 최신 거래일
    (SELECT trade_date FROM stock_daily_prices sdp
     WHERE sdp.stock_symbol = sm.symbol
     ORDER BY trade_date DESC LIMIT 1) as latest_trade_date,

    -- 데이터 건수
    (SELECT COUNT(*) FROM stock_daily_prices sdp WHERE sdp.stock_symbol = sm.symbol) as daily_count,
    (SELECT COUNT(*) FROM stock_weekly_prices swp WHERE swp.stock_symbol = sm.symbol) as weekly_count,
    (SELECT COUNT(*) FROM stock_monthly_prices smp WHERE smp.stock_symbol = sm.symbol) as monthly_count

FROM stock_master sm;
```

### 시계열 데이터 테이블 특징

- **다단계 시계열**: 일별 → 주별 → 월별 데이터 계층 구조
- **성능 최적화**: 필요한 조회 패턴에 맞는 인덱스 설정
- **데이터 무결성**: 복합 유니크 키로 중복 데이터 방지
- **확장성**: 새로운 종목이나 기간 추가 시 유연한 대응
- **모니터링**: 데이터 처리 과정 추적 및 로깅
- **편의성**: 뷰를 통한 통합 정보 조회

### 데이터 예시

```sql
INSERT INTO stocks (symbol, name, market, sector, logo_url, current_price, price_change, price_change_percent, volume, market_cap, is_active) VALUES
('005930', '삼성전자', 'KOSPI', '전자', 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/005930.png', 71500.00, 1500.00, 2.14, 12345678, 4270000000000000, TRUE),
('035420', 'NAVER', 'KOSPI', '서비스업', 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/035420.png', 185000.00, -2300.00, -1.23, 1234567, 30400000000000, TRUE),
('035720', '카카오', 'KOSPI', '서비스업', 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/035720.png', 52300.00, 2100.00, 4.18, 3456789, 23200000000000, TRUE),
('000660', 'SK하이닉스', 'KOSPI', '전자', 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/000660.png', 128000.00, 2300.00, 1.83, 2345678, 93100000000000, TRUE),
('051910', 'LG화학', 'KOSPI', '화학', 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/051910.png', 425000.00, -2100.00, -0.49, 345678, 30000000000000, TRUE);
```

### 특징

- **종목 기본정보**: 종목코드, 종목명, 시장, 섹터
- **실시간 데이터**: 현재가, 변동률, 거래량 등 (API 업데이트)
- **UI 지원**: 이모지 필드로 직관적인 UI 제공
- **성능 최적화**: 필요한 필드에 인덱스 설정

---

## 4. 지역별 주식 관심도 테이블 (region_stocks)

### 테이블 구조

```sql
CREATE TABLE region_stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    region_id BIGINT NOT NULL COMMENT '지역 ID',
    stock_id BIGINT NOT NULL COMMENT '주식 ID',
    data_date DATE NOT NULL COMMENT '데이터 기준일',

    -- 인기도 지표
    popularity_score DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '종합 인기도 점수',
    regional_ranking INT NOT NULL COMMENT '해당 지역 내 순위',

    -- 세부 통계 (인기도 점수 산정 근거)
    post_count INT DEFAULT 0 COMMENT '게시글 수',
    comment_count INT DEFAULT 0 COMMENT '댓글 수',
    vote_count INT DEFAULT 0 COMMENT '투표 참여 수',
    view_count INT DEFAULT 0 COMMENT '조회 수',
    search_count INT DEFAULT 0 COMMENT '검색 수',

    -- 외부 지표
    news_mention_count INT DEFAULT 0 COMMENT '뉴스 언급 수',
    trend_score DECIMAL(5, 2) DEFAULT 0 COMMENT '트렌드 점수',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 지역-주식-날짜 조합은 하나만 존재
    UNIQUE KEY uk_region_stock_date (region_id, stock_id, data_date),

    INDEX idx_region_id (region_id),
    INDEX idx_stock_id (stock_id),
    INDEX idx_data_date (data_date),
    INDEX idx_popularity_score (popularity_score),
    INDEX idx_regional_ranking (regional_ranking),
    INDEX idx_region_date (region_id, data_date),
    INDEX idx_region_ranking (region_id, regional_ranking)
);
```

### 데이터 예시

```sql
-- 강남구 2024-01-15 기준 인기 주식
INSERT INTO region_stocks (region_id, stock_id, data_date, popularity_score, regional_ranking, post_count, comment_count, vote_count, view_count) VALUES
(4, 1, '2024-01-15', 95.50, 1, 25, 48, 120, 2500),  -- 강남구 - 삼성전자 (1위)
(4, 2, '2024-01-15', 87.20, 2, 18, 35, 95, 1800),   -- 강남구 - NAVER (2위)
(4, 3, '2024-01-15', 78.90, 3, 22, 41, 110, 2200),  -- 강남구 - 카카오 (3위)
(4, 4, '2024-01-15', 72.15, 4, 15, 28, 75, 1500),   -- 강남구 - SK하이닉스 (4위)
(4, 5, '2024-01-15', 68.30, 5, 12, 22, 60, 1200);   -- 강남구 - LG화학 (5위)

-- 서초구 2024-01-15 기준 인기 주식
INSERT INTO region_stocks (region_id, stock_id, data_date, popularity_score, regional_ranking, post_count, comment_count, vote_count, view_count) VALUES
(5, 2, '2024-01-15', 92.80, 1, 30, 55, 140, 2800),  -- 서초구 - NAVER (1위)
(5, 1, '2024-01-15', 88.70, 2, 20, 38, 100, 2000),  -- 서초구 - 삼성전자 (2위)
(5, 3, '2024-01-15', 81.40, 3, 25, 45, 115, 2300);  -- 서초구 - 카카오 (3위)
```

### 특징

- **시계열 데이터**: 일자별 데이터 저장으로 트렌드 분석 가능
- **복합 점수**: 여러 지표를 종합한 인기도 점수 산정
- **지역별 순위**: 각 지역 내에서의 상대적 순위 관리
- **통계 기반**: 실제 사용자 활동 데이터를 기반으로 점수 산정
- **배치 처리**: 주기적으로 일괄 업데이트 (예: 매일 새벽 3시)

### 인기도 점수 산정 예시

```sql
-- 인기도 점수 계산 로직 (가중치 적용)
UPDATE region_stocks SET
    popularity_score = (
        post_count * 2.0 +           -- 게시글 가중치 2.0
        comment_count * 1.5 +        -- 댓글 가중치 1.5
        vote_count * 1.0 +           -- 투표 가중치 1.0
        view_count * 0.01 +          -- 조회 가중치 0.01
        search_count * 0.05 +        -- 검색 가중치 0.05
        news_mention_count * 3.0 +   -- 뉴스 언급 가중치 3.0
        trend_score * 5.0            -- 트렌드 점수 가중치 5.0
    )
WHERE data_date = CURRENT_DATE;
```

---

## 6. 회원 테이블 (members)

```sql
CREATE TABLE members (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID',
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NULL COMMENT '주소',
    detail_address VARCHAR(255) NULL COMMENT '상세주소',
    zonecode VARCHAR(10) NULL COMMENT '우편번호',
    latitude DECIMAL(10, 8) NULL COMMENT '위도',
    longitude DECIMAL(11, 8) NULL COMMENT '경도',
    terms_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,

    INDEX idx_email (email)
);
```

### 특징

- **UUID 사용**: 회원의 실제 ID를 예측할 수 없도록 UUID 사용
- **주소 및 좌표 저장**: 주소 정보와 함께 변환된 위도/경도 좌표를 저장하여 빠른 지도 로딩 지원
- **개인정보**: 필수 동의 항목과 마케팅 동의 항목 분리

---

## 7. 커뮤니티 테이블들

### 5-1. 게시글 테이블 (posts)

```sql
CREATE TABLE posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BINARY(16) NOT NULL COMMENT '작성자 ID',
    stock_id BIGINT NOT NULL COMMENT '주식 ID',
    title VARCHAR(200) NULL COMMENT '제목 (선택사항)',
    content TEXT NOT NULL COMMENT '내용',
    post_type ENUM('TEXT', 'POLL') NOT NULL DEFAULT 'TEXT' COMMENT '게시글 타입',
    sentiment ENUM('BULLISH', 'BEARISH', 'NEUTRAL') NULL COMMENT '투자 성향',

    -- 통계 정보
    view_count INT DEFAULT 0 COMMENT '조회 수',
    like_count INT DEFAULT 0 COMMENT '좋아요 수',
    comment_count INT DEFAULT 0 COMMENT '댓글 수',

    -- 메타 정보
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member_id (member_id),
    INDEX idx_stock_id (stock_id),
    INDEX idx_post_type (post_type),
    INDEX idx_sentiment (sentiment),
    INDEX idx_created_at (created_at),
    INDEX idx_like_count (like_count),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_stock_created (stock_id, created_at)
);
```

### 5-2. 투표 테이블 (polls)

```sql
CREATE TABLE polls (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL COMMENT '게시글 ID',
    question VARCHAR(500) NOT NULL COMMENT '투표 질문',

    -- 투표 옵션 (간단한 상승/하락 투표)
    option_up VARCHAR(100) DEFAULT '오를 것 같다 📈' COMMENT '상승 옵션',
    option_down VARCHAR(100) DEFAULT '떨어질 것 같다 📉' COMMENT '하락 옵션',

    -- 투표 결과
    vote_up_count INT DEFAULT 0 COMMENT '상승 투표 수',
    vote_down_count INT DEFAULT 0 COMMENT '하락 투표 수',
    total_vote_count INT DEFAULT 0 COMMENT '총 투표 수',

    -- 투표 기간
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '투표 시작일',
    end_date TIMESTAMP NULL COMMENT '투표 종료일 (NULL이면 무제한)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_post_id (post_id),
    INDEX idx_end_date (end_date),
    INDEX idx_total_vote_count (total_vote_count)
);
```

### 5-3. 투표 응답 테이블 (poll_responses)

```sql
CREATE TABLE poll_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    poll_id BIGINT NOT NULL COMMENT '투표 ID',
    member_id BINARY(16) NOT NULL COMMENT '투표자 ID',
    vote_option ENUM('UP', 'DOWN') NOT NULL COMMENT '투표 선택 (UP: 상승, DOWN: 하락)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 한 투표에 한 명의 사용자는 하나의 응답만 가능
    UNIQUE KEY uk_poll_member (poll_id, member_id),

    INDEX idx_poll_id (poll_id),
    INDEX idx_member_id (member_id),
    INDEX idx_vote_option (vote_option),
    INDEX idx_created_at (created_at)
);
```

### 5-4. 댓글 테이블 (comments)

```sql
CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL COMMENT '게시글 ID',
    member_id BINARY(16) NOT NULL COMMENT '작성자 ID',
    content TEXT NOT NULL COMMENT '댓글 내용',

    -- 통계 정보
    like_count INT DEFAULT 0 COMMENT '좋아요 수',

    -- 메타 정보
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_post_id (post_id),
    INDEX idx_member_id (member_id),
    INDEX idx_created_at (created_at),
    INDEX idx_like_count (like_count),
    INDEX idx_is_deleted (is_deleted)
);
```

### 5-5. 좋아요 테이블 (likes)

```sql
CREATE TABLE likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BINARY(16) NOT NULL COMMENT '좋아요 누른 사용자 ID',
    target_type ENUM('POST', 'COMMENT') NOT NULL COMMENT '좋아요 대상 타입',
    target_id BIGINT NOT NULL COMMENT '대상 ID (게시글 또는 댓글)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 한 사용자가 같은 대상에 중복 좋아요 방지
    UNIQUE KEY uk_member_target (member_id, target_type, target_id),

    INDEX idx_member_id (member_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);
```

### 5-6. 첨부파일 테이블 (attachments)

```sql
CREATE TABLE attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL COMMENT '게시글 ID',
    file_name VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    file_path VARCHAR(500) NOT NULL COMMENT '저장된 파일 경로',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (바이트)',
    file_type VARCHAR(50) NOT NULL COMMENT '파일 타입 (image/jpeg, image/png 등)',

    -- 이미지 정보
    width INT NULL COMMENT '이미지 너비',
    height INT NULL COMMENT '이미지 높이',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_post_id (post_id),
    INDEX idx_file_type (file_type),
    INDEX idx_created_at (created_at)
);
```

### 커뮤니티 테이블 특징

- **게시글 중심**: 텍스트 게시글과 투표 게시글 통합 관리
- **투표 시스템**: 간단한 상승/하락 투표 기능
- **댓글 시스템**: 대댓글 없는 1단계 댓글 구조
- **좋아요 시스템**: 게시글/댓글에 대한 좋아요 관리
- **파일 첨부**: 이미지 파일 업로드 및 관리
- **성능 최적화**: 필요한 조회 패턴에 맞는 인덱스 설정

---

## 8. 기획 요구사항 검증 결과

### ✅ 요구사항 1: 동/구/시 별 주식 데이터 주기적 일괄저장

**해결방안**:

- `regions` 테이블: 서울시/인천시/광명시의 시→구→동 계층형 구조
- `region_stocks` 테이블: 지역별 주식 인기도 데이터 일자별 저장
- **배치 처리**: 매일 새벽 3시 크론잡으로 인기도 점수 계산 및 순위 업데이트

```sql
-- 배치 처리 예시 (매일 실행)
INSERT INTO region_stocks (region_id, stock_id, data_date, popularity_score, regional_ranking, post_count, comment_count, vote_count, view_count)
SELECT
    r.id as region_id,
    s.id as stock_id,
    CURRENT_DATE as data_date,
    (COALESCE(post_stats.post_count, 0) * 2.0 +
     COALESCE(comment_stats.comment_count, 0) * 1.5 +
     COALESCE(vote_stats.vote_count, 0) * 1.0) as popularity_score,
    ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY popularity_score DESC) as regional_ranking,
    COALESCE(post_stats.post_count, 0),
    COALESCE(comment_stats.comment_count, 0),
    COALESCE(vote_stats.vote_count, 0),
    COALESCE(view_stats.view_count, 0)
FROM regions r
CROSS JOIN stocks s
LEFT JOIN (실제 통계 서브쿼리들...)
WHERE r.type IN ('DISTRICT', 'NEIGHBORHOOD')
ON DUPLICATE KEY UPDATE
    popularity_score = VALUES(popularity_score),
    regional_ranking = VALUES(regional_ranking);
```

### ✅ 요구사항 2: 커뮤니티 기능 (종목별 의견, 투표, 텍스트/사진 게시, 댓글)

**해결방안**:

- `posts` 테이블: 텍스트 게시글과 투표 게시글 통합 관리
- `polls` + `poll_responses` 테이블: "오를까? 떨어질까?" 투표 시스템
- `comments` 테이블: 1단계 댓글 (대댓글 없음)
- `attachments` 테이블: 사진 첨부 기능
- `likes` 테이블: 게시글/댓글 좋아요 시스템

```sql
-- 투표 게시글 작성 예시
INSERT INTO posts (member_id, stock_id, content, post_type, sentiment) VALUES
(UUID(), 1, '삼성전자 주가 어떻게 보시나요?', 'POLL', 'NEUTRAL');

INSERT INTO polls (post_id, question) VALUES
(LAST_INSERT_ID(), '삼성전자 주가가 다음주에 어떻게 될까요?');
```

### ✅ 요구사항 3: 실시간 주식 데이터 API 연동

**해결방안**:

- `stocks` 테이블: 한국투자증권 API 데이터 저장 필드 준비
- `last_updated` 필드: API 호출 시점 추적
- **실시간 업데이트**: 5분마다 API 호출하여 주식 데이터 갱신

```sql
-- API 데이터 업데이트 예시
UPDATE stocks SET
    current_price = ?,
    price_change = ?,
    price_change_percent = ?,
    volume = ?,
    market_cap = ?,
    high_price = ?,
    low_price = ?,
    last_updated = CURRENT_TIMESTAMP
WHERE symbol = ?;
```

### ✅ 요구사항 4: 주식 시계열 데이터 저장 및 분석

**해결방안**:

- **시계열 테이블 구조**: `stock_daily_prices`, `stock_weekly_prices`, `stock_monthly_prices`
- **데이터 전처리**: CSV 파일 → 정규화된 데이터베이스 구조
- **성능 최적화**: 필요한 조회 패턴에 맞는 인덱스 설정
- **데이터 무결성**: 복합 유니크 키로 중복 방지

```sql
-- 시계열 데이터 조회 예시 (일별)
SELECT
    trade_date,
    open_price, high_price, low_price, close_price, volume,
    price_change, price_change_percent
FROM stock_daily_prices
WHERE stock_symbol = '005930'
  AND trade_date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY trade_date;

-- 주별 데이터 조회 예시
SELECT
    week_start_date, week_end_date,
    open_price, high_price, low_price, close_price, volume
FROM stock_weekly_prices
WHERE stock_symbol = '005930'
  AND week_start_date >= '2024-01-01'
ORDER BY week_start_date;

-- 월별 데이터 조회 예시
SELECT
    year_month,
    open_price, high_price, low_price, close_price, volume,
    trading_days
FROM stock_monthly_prices
WHERE stock_symbol = '005930'
  AND year_month >= '2024-01'
ORDER BY year_month;
```

**데이터 처리 파이프라인**:

1. **CSV 파일 스캔**: `out_krx_parallel` 폴더의 파일들 자동 감지
2. **데이터 전처리**: 컬럼명 정규화, 데이터 타입 변환, NaN 처리
3. **데이터베이스 저장**: 일별/주별/월별 데이터 각각 저장
4. **마스터 정보 업데이트**: 종목별 데이터 보유 상태 관리
5. **처리 로그 기록**: 성공/실패 건수, 처리 시간 추적

### ✅ 요구사항 5: 지역 범위 제한 (서울시/인천시/광명시)

**해결방안**:

- `regions` 테이블에 해당 지역 데이터만 입력
- **확장성**: 나중에 다른 지역 추가 시 데이터만 추가하면 됨
- **비용 효율성**: 필요한 지역만 관리하여 데이터 볼륨 최적화

```sql
-- 지역 제한 조회 예시
SELECT * FROM regions
WHERE name IN ('서울특별시', '인천광역시', '광명시')
   OR parent_id IN (SELECT id FROM regions WHERE name IN ('서울특별시', '인천광역시', '경기도'));
```

### 🎯 추가 고려사항

**1. 성능 최적화**

- 필요한 조회 패턴에 맞는 인덱스 설정
- 지역별 순위 조회 최적화: `idx_region_ranking`
- 주식별 게시글 조회 최적화: `idx_stock_created`

**2. 데이터 정합성**

- 외래키 제약조건으로 참조 무결성 보장
- 유니크 제약조건으로 중복 방지
- 트리거 활용한 통계 수치 자동 업데이트

**3. 확장성**

- 지역 추가 시 regions 테이블에 데이터만 추가
- 새로운 주식 추가 시 stocks 테이블에 데이터만 추가
- 커뮤니티 기능 확장 시 테이블 구조 변경 최소화

**4. 보안**

- 회원 정보 암호화 (비밀번호 해시화)
- 파일 업로드 시 보안 검증
- SQL 인젝션 방지를 위한 파라미터 바인딩

---

## 9. 결론

설계한 데이터베이스는 **모든 기획 요구사항을 만족**하며, 다음과 같은 특징을 가집니다:

### 🎯 **핵심 강점**

- **요구사항 100% 만족**: 모든 기획 요구사항 충족
- **성능 최적화**: 필요한 조회 패턴에 맞는 인덱스 설계
- **확장성**: 지역/주식 추가 시 유연한 대응 가능
- **데이터 정합성**: 외래키 제약조건으로 데이터 무결성 보장

### 🚀 **구현 우선순위**

1. **1단계**: 기본 테이블 생성 (members, regions, stocks)
2. **2단계**: 주식 시계열 데이터 시스템 구현 (stock_daily_prices, stock_weekly_prices, stock_monthly_prices)
3. **3단계**: 커뮤니티 기능 구현 (posts, comments, likes)
4. **4단계**: 투표 시스템 구현 (polls, poll_responses)
5. **5단계**: 지역별 통계 시스템 구현 (region_stocks)
6. **6단계**: 파일 첨부 기능 구현 (attachments)

이제 **데이터베이스 기획이 완료**되었으니, 다음 단계로 백엔드 API 개발을 진행할 수 있습니다! 🎉

---

## 10. 포트폴리오 관리 테이블들

### 10-1. 계좌 테이블 (accounts)

```sql
CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BINARY(16) NOT NULL COMMENT '회원 ID',
    account_number VARCHAR(20) NOT NULL COMMENT '계좌번호',
    account_name VARCHAR(100) NOT NULL COMMENT '계좌명',
    account_type ENUM('STOCK', 'FUND', 'MIXED') NOT NULL DEFAULT 'STOCK' COMMENT '계좌 타입',

    -- 계좌 상태
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    is_main_account BOOLEAN DEFAULT FALSE COMMENT '주계좌 여부',

    -- 계좌 정보
    broker VARCHAR(50) NULL COMMENT '증권사명',
    created_date DATE NULL COMMENT '계좌 개설일',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 한 회원이 같은 계좌번호를 중복으로 가질 수 없음
    UNIQUE KEY uk_member_account (member_id, account_number),

    -- 외래키 제약조건
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,

    INDEX idx_member_id (member_id),
    INDEX idx_account_number (account_number),
    INDEX idx_is_active (is_active),
    INDEX idx_is_main_account (is_main_account)
);
```

### 10-2. 계좌 잔고 테이블 (account_balances)

```sql
CREATE TABLE account_balances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',
    balance_date DATE NOT NULL COMMENT '잔고 기준일',

    -- 현금 잔고
    cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '현금 잔고',
    available_cash DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '사용 가능 현금',
    frozen_cash DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '동결 현금',

    -- 주식 평가 정보
    total_stock_value DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 주식 평가금액',
    total_profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 손익',
    total_profit_loss_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '총 손익률 (%)',

    -- 계좌 총액
    total_balance DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '계좌 총액 (현금 + 주식)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 계좌-날짜 조합은 하나만 존재
    UNIQUE KEY uk_account_date (account_id, balance_date),

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,

    INDEX idx_account_id (account_id),
    INDEX idx_balance_date (balance_date),
    INDEX idx_account_date (account_id, balance_date)
);
```

### 10-3. 포트폴리오 보유 주식 테이블 (portfolio_stocks)

```sql
CREATE TABLE portfolio_stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드',

    -- 보유 수량
    quantity INT NOT NULL DEFAULT 0 COMMENT '보유 수량',
    available_quantity INT NOT NULL DEFAULT 0 COMMENT '매도 가능 수량',
    frozen_quantity INT NOT NULL DEFAULT 0 COMMENT '동결 수량',

    -- 평균 매수가
    avg_purchase_price DECIMAL(15, 2) NOT NULL COMMENT '평균 매수가',
    total_purchase_amount DECIMAL(15, 2) NOT NULL COMMENT '총 매수 금액',

    -- 현재 평가 정보
    current_price DECIMAL(15, 2) NULL COMMENT '현재가',
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '현재 평가금액',
    profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '손익',
    profit_loss_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '손익률 (%)',

    -- 메타 정보
    first_purchase_date DATE NULL COMMENT '최초 매수일',
    last_purchase_date DATE NULL COMMENT '최근 매수일',
    last_sale_date DATE NULL COMMENT '최근 매도일',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 한 계좌에 같은 종목은 하나의 레코드로 관리
    UNIQUE KEY uk_account_stock (account_id, stock_symbol),

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,

    INDEX idx_account_id (account_id),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_account_stock (account_id, stock_symbol),
    INDEX idx_profit_loss (profit_loss),
    INDEX idx_profit_loss_rate (profit_loss_rate)
);
```

### 10-4. 거래 내역 테이블 (trade_history)

```sql
CREATE TABLE trade_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',
    stock_symbol VARCHAR(20) NOT NULL COMMENT '종목코드',

    -- 거래 정보
    trade_type ENUM('BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'MERGE') NOT NULL COMMENT '거래 타입',
    trade_date DATE NOT NULL COMMENT '거래일',
    trade_time TIME NULL COMMENT '거래 시간',

    -- 거래 수량 및 가격
    quantity INT NOT NULL COMMENT '거래 수량',
    price_per_share DECIMAL(15, 2) NOT NULL COMMENT '주당 가격',
    total_amount DECIMAL(15, 2) NOT NULL COMMENT '총 거래 금액',

    -- 수수료 및 세금
    commission DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '수수료',
    tax DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '세금',
    net_amount DECIMAL(15, 2) NOT NULL COMMENT '수수료/세금 제외 순금액',

    -- 거래 후 잔고
    balance_after_trade DECIMAL(15, 2) NULL COMMENT '거래 후 현금 잔고',
    stock_quantity_after_trade INT NULL COMMENT '거래 후 보유 수량',

    -- 메타 정보
    trade_memo TEXT NULL COMMENT '거래 메모',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_symbol) REFERENCES stocks(symbol) ON DELETE CASCADE,

    INDEX idx_account_id (account_id),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_trade_type (trade_type),
    INDEX idx_trade_date (trade_date),
    INDEX idx_account_trade_date (account_id, trade_date),
    INDEX idx_stock_trade_date (stock_symbol, trade_date)
);
```

### 10-5. 포트폴리오 성과 분석 테이블 (portfolio_performance)

```sql
CREATE TABLE portfolio_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',
    performance_date DATE NOT NULL COMMENT '성과 기준일',

    -- 일일 성과
    daily_return DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '일간 수익률 (%)',
    daily_profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '일간 손익',

    -- 누적 성과
    total_return DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '누적 수익률 (%)',
    total_profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '누적 손익',

    -- 위험 지표
    volatility DECIMAL(5, 2) NULL COMMENT '변동성 (%)',
    sharpe_ratio DECIMAL(5, 2) NULL COMMENT '샤프 비율',
    max_drawdown DECIMAL(5, 2) NULL COMMENT '최대 낙폭 (%)',

    -- 자산 구성
    stock_allocation_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '주식 비중 (%)',
    cash_allocation_rate DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT '현금 비중 (%)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 복합 유니크 키: 계좌-날짜 조합은 하나만 존재
    UNIQUE KEY uk_account_performance_date (account_id, performance_date),

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,

    INDEX idx_account_id (account_id),
    INDEX idx_performance_date (performance_date),
    INDEX idx_account_performance_date (account_id, performance_date),
    INDEX idx_daily_return (daily_return),
    INDEX idx_total_return (total_return)
);
```

### 10-6. 포트폴리오 알림 설정 테이블 (portfolio_alerts)

```sql
CREATE TABLE portfolio_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',
    stock_symbol VARCHAR(20) NULL COMMENT '종목코드 (NULL이면 전체 포트폴리오)',

    -- 알림 조건
    alert_type ENUM('PRICE', 'PROFIT_LOSS', 'QUANTITY', 'ALLOCATION') NOT NULL COMMENT '알림 타입',
    condition_type ENUM('ABOVE', 'BELOW', 'EQUAL', 'CHANGE') NOT NULL COMMENT '조건 타입',
    threshold_value DECIMAL(15, 2) NOT NULL COMMENT '임계값',

    -- 알림 설정
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    notification_method ENUM('EMAIL', 'SMS', 'PUSH', 'ALL') NOT NULL DEFAULT 'PUSH' COMMENT '알림 방법',

    -- 알림 메시지
    custom_message TEXT NULL COMMENT '사용자 정의 메시지',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_symbol) REFERENCES stocks(symbol) ON DELETE SET NULL,

    INDEX idx_account_id (account_id),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_alert_type (alert_type),
    INDEX idx_is_active (is_active)
);
```

### 10-7. 포트폴리오 리밸런싱 히스토리 테이블 (rebalancing_history)

```sql
CREATE TABLE rebalancing_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id BIGINT NOT NULL COMMENT '계좌 ID',

    -- 리밸런싱 정보
    rebalancing_date DATE NOT NULL COMMENT '리밸런싱 실행일',
    rebalancing_type ENUM('MANUAL', 'AUTOMATIC', 'SCHEDULED') NOT NULL COMMENT '리밸런싱 타입',

    -- 리밸런싱 전후 비교
    before_total_value DECIMAL(15, 2) NOT NULL COMMENT '리밸런싱 전 총 자산',
    after_total_value DECIMAL(15, 2) NOT NULL COMMENT '리밸런싱 후 총 자산',

    -- 거래 내역 요약
    trades_executed INT NOT NULL DEFAULT 0 COMMENT '실행된 거래 수',
    total_commission DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 수수료',

    -- 리밸런싱 결과
    target_allocation TEXT NOT NULL COMMENT '목표 자산 배분 (JSON)',
    actual_allocation TEXT NOT NULL COMMENT '실제 자산 배분 (JSON)',

    -- 메타 정보
    rebalancing_reason TEXT NULL COMMENT '리밸런싱 사유',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래키 제약조건
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,

    INDEX idx_account_id (account_id),
    INDEX idx_rebalancing_date (rebalancing_date),
    INDEX idx_rebalancing_type (rebalancing_type)
);
```

### 포트폴리오 테이블 특징

- **계좌 중심 설계**: 한 회원이 여러 계좌를 가질 수 있음
- **실시간 잔고 관리**: 계좌별 현금/주식 잔고 실시간 추적
- **거래 내역 추적**: 모든 매수/매도 내역 상세 기록
- **성과 분석**: 일일/누적 수익률 및 위험 지표 계산
- **알림 시스템**: 가격/손익/수량 기반 맞춤형 알림
- **리밸런싱 지원**: 자동/수동 자산 배분 조정

### 데이터 예시

```sql
-- 계좌 생성
INSERT INTO accounts (member_id, account_number, account_name, account_type, broker, is_main_account) VALUES
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000'), '1234567890', '주식계좌', 'STOCK', '한국투자증권', TRUE),
(UUID_TO_BIN('550e8400-e29b-41d4-a716-446655440000'), '0987654321', '펀드계좌', 'FUND', '한국투자증권', FALSE);

-- 포트폴리오 보유 주식
INSERT INTO portfolio_stocks (account_id, stock_symbol, quantity, avg_purchase_price, total_purchase_amount, current_value, profit_loss, profit_loss_rate) VALUES
(1, '005930', 100, 70000.00, 7000000.00, 7150000.00, 150000.00, 2.14),
(1, '035420', 50, 180000.00, 9000000.00, 9250000.00, 250000.00, 2.78);

-- 거래 내역
INSERT INTO trade_history (account_id, stock_symbol, trade_type, trade_date, quantity, price_per_share, total_amount, commission, net_amount) VALUES
(1, '005930', 'BUY', '2024-01-15', 100, 70000.00, 7000000.00, 1000.00, 7001000.00),
(1, '035420', 'BUY', '2024-01-15', 50, 180000.00, 9000000.00, 1000.00, 9001000.00);
```

---

## 11. 업데이트된 구현 우선순위

### 🚀 **새로운 구현 우선순위**

1. **1단계**: 기본 테이블 생성 (members, regions, stocks)
2. **2단계**: 주식 시계열 데이터 시스템 구현 (stock_daily_prices, stock_weekly_prices, stock_monthly_prices)
3. **3단계**: 포트폴리오 관리 시스템 구현 (accounts, portfolio_stocks, account_balances)
4. **4단계**: 거래 내역 시스템 구현 (trade_history, portfolio_performance)
5. **5단계**: 커뮤니티 기능 구현 (posts, comments, likes)
6. **6단계**: 투표 시스템 구현 (polls, poll_responses)
7. **7단계**: 지역별 통계 시스템 구현 (region_stocks)
8. **8단계**: 포트폴리오 고급 기능 구현 (portfolio_alerts, rebalancing_history)
9. **9단계**: 파일 첨부 기능 구현 (attachments)

이제 **포트폴리오 관리 기능이 포함된 완전한 데이터베이스 설계**가 완료되었습니다! 🎉

포트폴리오 관리를 통해 사용자는:

- **다중 계좌 관리**: 여러 증권사 계좌 통합 관리
- **실시간 잔고 추적**: 현금/주식 잔고 실시간 모니터링
- **수익률 분석**: 일일/누적 수익률 및 위험 지표 확인
- **거래 내역 관리**: 모든 매수/매도 내역 상세 기록
- **자동 알림**: 가격/손익 기반 맞춤형 알림 설정
- **포트폴리오 리밸런싱**: 자동/수동 자산 배분 조정

이 모든 기능을 통해 체계적이고 전문적인 주식 투자 관리가 가능합니다! 🚀
