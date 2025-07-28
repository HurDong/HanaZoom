-- Member 테이블에 region_id 컬럼 추가
ALTER TABLE members 
ADD COLUMN region_id BIGINT NULL COMMENT '지역 ID' AFTER longitude;

-- region_id에 인덱스 추가 (조회 성능 향상)
CREATE INDEX idx_members_region_id ON members(region_id);

-- 외래키 제약조건 추가 (regions 테이블이 있다면)
-- ALTER TABLE members 
-- ADD CONSTRAINT fk_members_region_id 
-- FOREIGN KEY (region_id) REFERENCES regions(id); 