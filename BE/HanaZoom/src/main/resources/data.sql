-- 테스트용 Member 생성 (알림 테스트를 위해)
INSERT INTO members (id, email, password, name, phone, address, detail_address, zonecode, terms_agreed, privacy_agreed, marketing_agreed, created_at) VALUES
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'test@hanazoom.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '테스트사용자', '010-1234-5678', '서울특별시 강남구', '테스트동 123-45', '06123', TRUE, TRUE, TRUE, NOW())
ON DUPLICATE KEY UPDATE id = id;

-- 사용자 설정 테이블 생성
CREATE TABLE IF NOT EXISTS user_settings (
    id BINARY(16) PRIMARY KEY,
    member_id BINARY(16) NOT NULL UNIQUE,
    theme VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    custom_cursor_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    emoji_animation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_map_zoom INT NOT NULL DEFAULT 8,
    map_style VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    chart_theme VARCHAR(20) NOT NULL DEFAULT 'GREEN',
    chart_animation_speed INT NOT NULL DEFAULT 300,
    auto_refresh_interval INT NOT NULL DEFAULT 300,
    ui_density VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id)
);

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BINARY(16) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    target_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    stock_symbol VARCHAR(20),
    stock_name VARCHAR(100),
    price_change_percent DOUBLE,
    current_price BIGINT,
    post_id BIGINT,
    comment_id BIGINT,
    mentioned_by VARCHAR(100),
    INDEX idx_member_id (member_id),
    INDEX idx_created_at (created_at),
    INDEX idx_stock_symbol (stock_symbol),
    INDEX idx_post_id (post_id)
);

-- 테스트용 알림 데이터 삽입
-- 주식 가격 변동 알림
INSERT INTO notifications (member_id, type, title, content, target_url, stock_symbol, stock_name, price_change_percent, current_price, is_read, created_at) VALUES
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_UP_10', '🚀 급등주 알림', '삼성전자가 12.5% 상승했습니다!', '/stocks/005930', '005930', '삼성전자', 12.5, 85000, FALSE, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_UP_5', '📈 상승 알림', 'SK하이닉스가 7.2% 상승했습니다', '/stocks/000660', '000660', 'SK하이닉스', 7.2, 125000, FALSE, DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_DOWN_5', '📉 하락 알림', 'LG화학이 6.8% 하락했습니다', '/stocks/051910', '051910', 'LG화학', -6.8, 450000, FALSE, DATE_SUB(NOW(), INTERVAL 40 MINUTE)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_DOWN_10', '💥 급락주 알림', '현대차가 15.3% 하락했습니다!', '/stocks/005380', '005380', '현대차', -15.3, 180000, FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_UP_5', '📈 상승 알림', 'NAVER가 5.8% 상승했습니다', '/stocks/035420', '035420', 'NAVER', 5.8, 220000, FALSE, DATE_SUB(NOW(), INTERVAL 2 HOUR));

-- 커뮤니티 알림
INSERT INTO notifications (member_id, type, title, content, target_url, post_id, comment_id, mentioned_by, is_read, created_at) VALUES
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'NEW_COMMENT', '💬 새 댓글', '김철수님이 회원님의 게시글에 댓글을 남겼습니다', '/community/123', 123, 456, '김철수', FALSE, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'NEW_LIKE', '❤️ 새 좋아요', '이영희님이 회원님의 게시글에 좋아요를 눌렀습니다', '/community/123', 123, NULL, '이영희', FALSE, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'MENTION', '👤 멘션', '박민수님이 게시글에서 회원님을 언급했습니다', '/community/456', 456, NULL, '박민수', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'POST_REPLY', '↩️ 게시글 답글', '최지영님이 회원님의 게시글에 답글을 작성했습니다', '/community/789', 789, NULL, '최지영', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- 읽지 않은 알림 (최근)
-- 주식 알림
INSERT INTO notifications (member_id, type, title, content, target_url, stock_symbol, stock_name, price_change_percent, current_price, is_read, created_at) VALUES
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'STOCK_PRICE_UP_5', '📈 상승 알림', '카카오가 5.2% 상승했습니다', '/stocks/035720', '035720', '카카오', 5.2, 45000, FALSE, NOW());

-- 커뮤니티 알림
INSERT INTO notifications (member_id, type, title, content, target_url, post_id, comment_id, mentioned_by, is_read, created_at) VALUES
(UUID_TO_BIN('1d0ad5a2-a350-48b3-b467-96b465de5378'), 'NEW_COMMENT', '💬 새 댓글', '정수민님이 회원님의 게시글에 댓글을 남겼습니다', '/community/999', 999, 888, '정수민', FALSE, NOW());
