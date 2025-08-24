-- 소셜 계정 테이블 생성
CREATE TABLE social_accounts (
    id BINARY(16) PRIMARY KEY,
    provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    profile_image_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    member_id BINARY(16) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_user_id (provider, provider_user_id)
);

-- members 테이블에 login_type 컬럼 추가
ALTER TABLE members ADD COLUMN login_type VARCHAR(20) NOT NULL DEFAULT 'EMAIL';

-- 인덱스 추가
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
CREATE INDEX idx_social_accounts_email ON social_accounts(email);
CREATE INDEX idx_social_accounts_member_id ON social_accounts(member_id);
