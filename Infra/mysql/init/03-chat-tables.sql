CREATE TABLE chat_messages (
    id BINARY(16) PRIMARY KEY,
    region_id BIGINT NOT NULL,
    member_id BINARY(16) NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_region_created (region_id, created_at),
    INDEX idx_member_id (member_id)
);
