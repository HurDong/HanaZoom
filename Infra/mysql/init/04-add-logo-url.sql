-- Stock 테이블에 logo_url 칼럼 추가
-- 작성일: 2025-01-28
-- 설명: 종목 로고 URL을 저장할 칼럼 추가

ALTER TABLE stocks 
ADD COLUMN logo_url VARCHAR(500) COMMENT '종목 로고 URL';
