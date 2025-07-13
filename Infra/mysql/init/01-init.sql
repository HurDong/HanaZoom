-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS hanazoom;
USE hanazoom;

-- 1. 지역 테이블 (regions)
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

-- 2. 주식 테이블 (stocks)
CREATE TABLE stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT '종목코드 (예: 005930)',
    name VARCHAR(100) NOT NULL COMMENT '종목명 (예: 삼성전자)',
    market VARCHAR(20) NOT NULL COMMENT '시장 (KOSPI, KOSDAQ, KONEX)',
    sector VARCHAR(50) NULL COMMENT '섹터 (전자, 화학, 서비스업 등)',
    emoji VARCHAR(10) NULL COMMENT '종목 이모지',

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

-- 3. 회원 테이블 (members)
CREATE TABLE members (
    id BINARY(16) PRIMARY KEY COMMENT 'UUID',
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    region_id BIGINT NULL COMMENT '관심 지역 ID',
    terms_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,

    INDEX idx_email (email),
    INDEX idx_region_id (region_id)
);

-- 4. 지역별 주식 관심도 테이블 (region_stocks)
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

-- 5-1. 게시글 테이블 (posts)
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

-- 5-2. 투표 테이블 (polls)
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

-- 5-3. 투표 응답 테이블 (poll_responses)
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

-- 5-4. 댓글 테이블 (comments)
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

-- 5-5. 좋아요 테이블 (likes)
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

-- 5-6. 첨부파일 테이블 (attachments)
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

-- 초기 데이터 삽입

-- 지역 데이터
INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES
-- 시 레벨
('서울특별시', 'CITY', NULL, 37.5665, 126.9780),
('인천광역시', 'CITY', NULL, 37.4563, 126.7052),
('경기도', 'CITY', NULL, 37.4138, 127.5183);

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

-- 주식 데이터
INSERT INTO stocks (symbol, name, market, sector, emoji, current_price, price_change, price_change_percent, volume, market_cap, is_active) VALUES
('005930', '삼성전자', 'KOSPI', '전자', '📱', 71500.00, 1500.00, 2.14, 12345678, 4270000000000000, TRUE),
('035420', 'NAVER', 'KOSPI', '서비스업', '🔍', 185000.00, -2300.00, -1.23, 1234567, 30400000000000, TRUE),
('035720', '카카오', 'KOSPI', '서비스업', '💬', 52300.00, 2100.00, 4.18, 3456789, 23200000000000, TRUE),
('000660', 'SK하이닉스', 'KOSPI', '전자', '💾', 128000.00, 2300.00, 1.83, 2345678, 93100000000000, TRUE),
('051910', 'LG화학', 'KOSPI', '화학', '🧪', 425000.00, -2100.00, -0.49, 345678, 30000000000000, TRUE);

-- 지역별 주식 인기도 데이터 (예시)
INSERT INTO region_stocks (region_id, stock_id, data_date, popularity_score, regional_ranking, post_count, comment_count, vote_count, view_count) VALUES
-- 강남구 2024-01-15 기준 인기 주식
(4, 1, '2024-01-15', 95.50, 1, 25, 48, 120, 2500),  -- 강남구 - 삼성전자 (1위)
(4, 2, '2024-01-15', 87.20, 2, 18, 35, 95, 1800),   -- 강남구 - NAVER (2위)
(4, 3, '2024-01-15', 78.90, 3, 22, 41, 110, 2200),  -- 강남구 - 카카오 (3위)
(4, 4, '2024-01-15', 72.15, 4, 15, 28, 75, 1500),   -- 강남구 - SK하이닉스 (4위)
(4, 5, '2024-01-15', 68.30, 5, 12, 22, 60, 1200),   -- 강남구 - LG화학 (5위)

-- 서초구 2024-01-15 기준 인기 주식
(5, 2, '2024-01-15', 92.80, 1, 30, 55, 140, 2800),  -- 서초구 - NAVER (1위)
(5, 1, '2024-01-15', 88.70, 2, 20, 38, 100, 2000),  -- 서초구 - 삼성전자 (2위)
(5, 3, '2024-01-15', 81.40, 3, 25, 45, 115, 2300);  -- 서초구 - 카카오 (3위) 