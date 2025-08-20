-- 댓글 테이블에 대댓글 구조를 위한 컬럼 추가
ALTER TABLE comments
ADD COLUMN parent_comment_id BIGINT NULL,
ADD COLUMN depth INT DEFAULT 0,
ADD CONSTRAINT fk_comments_parent_comment
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_post_id_depth_created_at ON comments(post_id, depth, created_at DESC);

-- 기존 댓글들의 depth를 0으로 설정 (최상위 댓글)
UPDATE comments SET depth = 0 WHERE depth IS NULL;
