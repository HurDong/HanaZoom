-- Stock 테이블에서 emoji 컬럼 제거
-- logoUrl 컬럼은 이미 존재하므로 emoji 컬럼만 제거

ALTER TABLE stocks DROP COLUMN IF EXISTS emoji;
