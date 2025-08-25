-- =====================================================
-- HanaZoom 데이터베이스 완전 초기화 스크립트
-- 모든 테이블과 데이터를 포함한 통합 버전
-- =====================================================

-- 개발 환경 초기화를 위해 기존 테이블이 있다면 삭제합니다.
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `likes`;
DROP TABLE IF EXISTS `attachments`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `region_stocks`;
DROP TABLE IF EXISTS `stocks`;
DROP TABLE IF EXISTS `social_accounts`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `regions`;

-- =====================================================
-- 1. REGIONS 테이블 생성 및 데이터 삽입
-- =====================================================

CREATE TABLE `regions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `parent_id` BIGINT,
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 데이터베이스 연결 및 이후 모든 통신에 사용할 문자 인코딩을 UTF-8로 설정합니다.
SET NAMES 'utf8mb4';

-- This data is based on https://github.com/vuski/admdongkor
-- Filtered for: 서울특별시, 경기도, 인천광역시
START TRANSACTION;

-- Inserting CITIES
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (1, '경기도', 'CITY', NULL, 37.46490746, 127.04160260);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (2, '서울특별시', 'CITY', NULL, 37.55177939, 126.99040614);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (3, '인천광역시', 'CITY', NULL, 37.50666054, 126.55382198);

-- Inserting DISTRICTS
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (4, '가평군', 'DISTRICT', 1, 37.80313763, 127.44130172);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (5, '고양시덕양구', 'DISTRICT', 1, 37.64226576, 126.85878281);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (6, '고양시일산동구', 'DISTRICT', 1, 37.66551892, 126.78834697);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (7, '고양시일산서구', 'DISTRICT', 1, 37.68389939, 126.75481807);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (8, '과천시', 'DISTRICT', 1, 37.42957736, 126.99766829);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (9, '광명시', 'DISTRICT', 1, 37.46555867, 126.86613369);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (10, '광주시', 'DISTRICT', 1, 37.39741997, 127.26069963);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (11, '구리시', 'DISTRICT', 1, 37.60142644, 127.13603175);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (12, '군포시', 'DISTRICT', 1, 37.35375439, 126.93060166);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (13, '김포시', 'DISTRICT', 1, 37.65248449, 126.65759923);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (14, '남양주시', 'DISTRICT', 1, 37.65169677, 127.21084081);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (15, '동두천시', 'DISTRICT', 1, 37.90931083, 127.06320104);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (16, '부천시소사구', 'DISTRICT', 1, 37.47542685, 126.79307954);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (17, '부천시오정구', 'DISTRICT', 1, 37.52776784, 126.79976344);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (18, '부천시원미구', 'DISTRICT', 1, 37.49748400, 126.77765670);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (19, '성남시분당구', 'DISTRICT', 1, 37.37901777, 127.11835674);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (20, '성남시수정구', 'DISTRICT', 1, 37.44675636, 127.13273415);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (21, '성남시중원구', 'DISTRICT', 1, 37.43988711, 127.16068724);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (22, '수원시권선구', 'DISTRICT', 1, 37.26061991, 126.98943872);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (23, '수원시영통구', 'DISTRICT', 1, 37.26316441, 127.05744779);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (24, '수원시장안구', 'DISTRICT', 1, 37.30332582, 127.00083433);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (25, '수원시팔달구', 'DISTRICT', 1, 37.27842374, 127.01642201);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (26, '시흥시', 'DISTRICT', 1, 37.38153831, 126.77067353);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (27, '안산시단원구', 'DISTRICT', 1, 37.32143086, 126.78984855);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (28, '안산시상록구', 'DISTRICT', 1, 37.31120648, 126.86262496);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (29, '안성시', 'DISTRICT', 1, 37.03106846, 127.28372165);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (30, '안양시동안구', 'DISTRICT', 1, 37.39120630, 126.95650769);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (31, '안양시만안구', 'DISTRICT', 1, 37.39907326, 126.91548587);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (32, '양주시', 'DISTRICT', 1, 37.82014217, 127.03445248);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (33, '양평군', 'DISTRICT', 1, 37.50577974, 127.54994131);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (34, '여주시', 'DISTRICT', 1, 37.30948309, 127.60590529);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (35, '연천군', 'DISTRICT', 1, 38.07176755, 127.01265636);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (36, '오산시', 'DISTRICT', 1, 37.15623051, 127.06130516);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (37, '용인시기흥구', 'DISTRICT', 1, 37.27131497, 127.12162372);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (38, '용인시수지구', 'DISTRICT', 1, 37.32351632, 127.08660925);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (39, '용인시처인구', 'DISTRICT', 1, 37.22060230, 127.23240568);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (40, '의왕시', 'DISTRICT', 1, 37.36406904, 126.98235225);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (41, '의정부시', 'DISTRICT', 1, 37.73595132, 127.06022114);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (42, '이천시', 'DISTRICT', 1, 37.23102470, 127.46970631);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (43, '파주시', 'DISTRICT', 1, 37.79113163, 126.78473320);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (44, '평택시', 'DISTRICT', 1, 37.03048310, 127.04596249);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (45, '포천시', 'DISTRICT', 1, 37.93977789, 127.23420793);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (46, '하남시', 'DISTRICT', 1, 37.53227722, 127.19305360);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (47, '화성시', 'DISTRICT', 1, 37.18892865, 126.96406978);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (48, '강남구', 'DISTRICT', 2, 37.49875462, 127.05840818);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (49, '강동구', 'DISTRICT', 2, 37.54634167, 127.14496074);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (50, '강북구', 'DISTRICT', 2, 37.63167552, 127.02208922);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (51, '강서구', 'DISTRICT', 2, 37.55365124, 126.84095993);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (52, '관악구', 'DISTRICT', 2, 37.47696310, 126.94005504);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (53, '광진구', 'DISTRICT', 2, 37.54767450, 127.08366470);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (54, '구로구', 'DISTRICT', 2, 37.49376231, 126.86315435);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (55, '금천구', 'DISTRICT', 2, 37.46052727, 126.90416368);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (56, '노원구', 'DISTRICT', 2, 37.64933791, 127.06895675);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (57, '도봉구', 'DISTRICT', 2, 37.65783267, 127.03653074);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (58, '동대문구', 'DISTRICT', 2, 37.58342910, 127.05627699);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (59, '동작구', 'DISTRICT', 2, 37.49612294, 126.94924141);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (60, '마포구', 'DISTRICT', 2, 37.55391727, 126.92591209);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (61, '서대문구', 'DISTRICT', 2, 37.57797585, 126.93848345);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (62, '서초구', 'DISTRICT', 2, 37.48793040, 127.01105624);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (63, '성동구', 'DISTRICT', 2, 37.55312975, 127.03826850);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (64, '성북구', 'DISTRICT', 2, 37.60340148, 127.02510784);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (65, '송파구', 'DISTRICT', 2, 37.50414676, 127.11766267);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (66, '양천구', 'DISTRICT', 2, 37.52616914, 126.85452624);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (67, '영등포구', 'DISTRICT', 2, 37.51243921, 126.90565578);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (68, '용산구', 'DISTRICT', 2, 37.53569300, 126.97630997);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (69, '은평구', 'DISTRICT', 2, 37.60625062, 126.91840966);
INSERT INTO regions (id, name, type, parent_id, latitude, longitude) VALUES (70, '종로구', 'DISTRICT', 2, 37.58152561, 126.99032305);

-- =====================================================
-- 2. MEMBERS 테이블 생성
-- =====================================================

CREATE TABLE `members` (
    `id` BINARY(16) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(100) NOT NULL,
    `profile_image_url` VARCHAR(500),
    `latitude` DECIMAL(10, 8),
    `longitude` DECIMAL(11, 8),
    `region_id` BIGINT NULL COMMENT '지역 ID',
    `login_type` VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`),
    UNIQUE KEY `uk_nickname` (`nickname`),
    INDEX `idx_members_region_id` (`region_id`),
    CONSTRAINT `fk_members_region_id` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. SOCIAL_ACCOUNTS 테이블 생성
-- =====================================================

CREATE TABLE `social_accounts` (
    `id` BINARY(16) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_provider_provider_id` (`provider`, `provider_id`),
    CONSTRAINT `fk_social_accounts_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. STOCKS 테이블 생성
-- =====================================================

CREATE TABLE `stocks` (
    `id` BINARY(16) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `market` VARCHAR(20) NOT NULL,
    `sector` VARCHAR(100),
    `logo_url` VARCHAR(500) COMMENT '종목 로고 URL',
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    INDEX `idx_market` (`market`),
    INDEX `idx_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. REGION_STOCKS 테이블 생성
-- =====================================================

CREATE TABLE `region_stocks` (
    `id` BINARY(16) NOT NULL,
    `region_id` BIGINT NOT NULL,
    `stock_id` BINARY(16) NOT NULL,
    `popularity_score` DECIMAL(5,2) DEFAULT 0.00,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_region_stock` (`region_id`, `stock_id`),
    INDEX `idx_region_id` (`region_id`),
    INDEX `idx_stock_id` (`stock_id`),
    INDEX `idx_popularity_score` (`popularity_score`),
    CONSTRAINT `fk_region_stocks_region_id` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
    CONSTRAINT `fk_region_stocks_stock_id` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. POSTS 테이블 생성
-- =====================================================

CREATE TABLE `posts` (
    `id` BINARY(16) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `region_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `post_type` VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    `view_count` INT DEFAULT 0,
    `like_count` INT DEFAULT 0,
    `comment_count` INT DEFAULT 0,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_region_id` (`region_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_post_type` (`post_type`),
    CONSTRAINT `fk_posts_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
    CONSTRAINT `fk_posts_region_id` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. COMMENTS 테이블 생성 (대댓글 구조 포함)
-- =====================================================

CREATE TABLE `comments` (
    `id` BINARY(16) NOT NULL,
    `post_id` BINARY(16) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `content` TEXT NOT NULL,
    `parent_comment_id` BIGINT NULL,
    `depth` INT DEFAULT 0,
    `is_deleted` BOOLEAN DEFAULT FALSE,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_parent_comment_id` (`parent_comment_id`),
    INDEX `idx_post_id_depth_created_at` (`post_id`, `depth`, `created_at` DESC),
    CONSTRAINT `fk_comments_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
    CONSTRAINT `fk_comments_parent_comment` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. LIKES 테이블 생성
-- =====================================================

CREATE TABLE `likes` (
    `id` BINARY(16) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `target_type` VARCHAR(20) NOT NULL,
    `target_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_member_target` (`member_id`, `target_type`, `target_id`),
    INDEX `idx_target` (`target_type`, `target_id`),
    CONSTRAINT `fk_likes_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. ATTACHMENTS 테이블 생성
-- =====================================================

CREATE TABLE `attachments` (
    `id` BINARY(16) NOT NULL,
    `post_id` BINARY(16) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_size` BIGINT,
    `mime_type` VARCHAR(100),
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_post_id` (`post_id`),
    CONSTRAINT `fk_attachments_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. CHAT_MESSAGES 테이블 생성
-- =====================================================

CREATE TABLE `chat_messages` (
    `id` BINARY(16) PRIMARY KEY,
    `region_id` BIGINT NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `member_name` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `message_type` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX `idx_region_created` (`region_id`, `created_at`),
    INDEX `idx_member_id` (`member_id`),
    CONSTRAINT `fk_chat_messages_region_id` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`),
    CONSTRAINT `fk_chat_messages_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. POLLS 테이블 생성
-- =====================================================

CREATE TABLE `polls` (
    `id` BINARY(16) NOT NULL,
    `post_id` BINARY(16) NOT NULL,
    `question` VARCHAR(255) NOT NULL,
    `end_date` DATETIME,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_post_id` (`post_id`),
    CONSTRAINT `fk_polls_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. POLL_OPTIONS 테이블 생성
-- =====================================================

CREATE TABLE `poll_options` (
    `id` BINARY(16) NOT NULL,
    `poll_id` BINARY(16) NOT NULL,
    `option_text` VARCHAR(255) NOT NULL,
    `vote_count` INT DEFAULT 0,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    INDEX `idx_poll_id` (`poll_id`),
    CONSTRAINT `fk_poll_options_poll_id` FOREIGN KEY (`poll_id`) REFERENCES `polls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. POLL_VOTES 테이블 생성
-- =====================================================

CREATE TABLE `poll_votes` (
    `id` BINARY(16) NOT NULL,
    `poll_id` BINARY(16) NOT NULL,
    `option_id` BINARY(16) NOT NULL,
    `member_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_poll_member` (`poll_id`, `member_id`),
    INDEX `idx_option_id` (`option_id`),
    INDEX `idx_member_id` (`member_id`),
    CONSTRAINT `fk_poll_votes_poll_id` FOREIGN KEY (`poll_id`) REFERENCES `polls` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_poll_votes_option_id` FOREIGN KEY (`option_id`) REFERENCES `poll_options` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_poll_votes_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

-- =====================================================
-- 초기화 완료 메시지
-- =====================================================
SELECT 'HanaZoom 데이터베이스 초기화가 완료되었습니다.' AS message;
