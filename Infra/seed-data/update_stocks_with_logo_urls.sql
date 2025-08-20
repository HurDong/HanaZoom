-- Stock 테이블의 emoji 컬럼 데이터를 logo_url로 마이그레이션
-- 기존 emoji 컬럼을 제거하고 logo_url 컬럼을 사용하도록 업데이트

-- 주요 종목들의 로고 URL 업데이트
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/005930.png' WHERE symbol = '005930';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/000660.png' WHERE symbol = '000660';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/207940.png' WHERE symbol = '207940';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/373220.png' WHERE symbol = '373220';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/105560.png' WHERE symbol = '105560';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/051910.png' WHERE symbol = '051910';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/006400.png' WHERE symbol = '006400';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/033780.png' WHERE symbol = '033780';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/003550.png' WHERE symbol = '003550';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/012330.png' WHERE symbol = '012330';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/035420.png' WHERE symbol = '035420';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/035720.png' WHERE symbol = '035720';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/005380.png' WHERE symbol = '005380';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/066570.png' WHERE symbol = '066570';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/003670.png' WHERE symbol = '003670';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/000270.png' WHERE symbol = '000270';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/068270.png' WHERE symbol = '068270';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/005490.png' WHERE symbol = '005490';
UPDATE stocks SET logo_url = 'https://file.alphasquare.co.kr/media/images/stock_logo/kr/323410.png' WHERE symbol = '323410';

-- 나머지 종목들도 기본 패턴으로 업데이트 (실제 로고가 있는지는 확인 필요)
UPDATE stocks 
SET logo_url = CONCAT('https://file.alphasquare.co.kr/media/images/stock_logo/kr/', symbol, '.png')
WHERE logo_url IS NULL;
