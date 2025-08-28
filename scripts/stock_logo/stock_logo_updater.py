#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HanaZoom 종목 로고 업데이트 독립 스크립트
Spring Boot 없이 직접 데이터베이스에 접근하여 로고를 업데이트합니다.
"""

import requests
import mysql.connector
import os
import time
import argparse
from urllib.parse import urlparse
import logging

# 로깅 설정 - DEBUG 레벨로 자세한 정보 출력
logging.basicConfig(
    level=logging.INFO,  # DEBUG -> INFO로 변경 (깔끔한 출력)
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class StockLogoUpdater:
    def __init__(self, db_config):
        """
        데이터베이스 설정을 받아 초기화합니다.
        
        db_config 예시:
        {
            'host': 'localhost',
            'port': 3306,
            'database': 'hanazoom',
            'user': 'root',
            'password': 'your_password'
        }
        """
        self.db_config = db_config
        self.logo_url_pattern = (
            "https://thumb.tossinvest.com/image/resized/48x0/"
            "https%3A%2F%2Fstatic.toss.im%2Fpng-icons%2Fsecurities%2F"
            "icn-sec-fill-{}.png"
        )
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': 'https://www.tossinvest.com/',
        })
    
    def get_db_connection(self):
        """데이터베이스 연결을 생성합니다."""
        try:
            connection = mysql.connector.connect(**self.db_config)
            return connection
        except mysql.connector.Error as e:
            logger.error(f"데이터베이스 연결 실패: {e}")
            return None
    
    def get_all_stocks(self):
        """모든 종목 정보를 가져옵니다."""
        connection = self.get_db_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id, symbol, name, logo_url FROM stocks WHERE (is_active = TRUE OR is_active IS NULL)")
            stocks = cursor.fetchall()
            logger.info(f"총 {len(stocks)}개 종목을 조회했습니다.")
            return stocks
        except mysql.connector.Error as e:
            logger.error(f"종목 조회 실패: {e}")
            return []
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def get_stocks_without_logo(self):
        """로고가 없는 종목들만 가져옵니다."""
        connection = self.get_db_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, symbol, name, logo_url 
                FROM stocks 
                WHERE (is_active = TRUE OR is_active IS NULL) AND (logo_url IS NULL OR logo_url = '')
            """)
            stocks = cursor.fetchall()
            logger.info(f"로고가 없는 종목: {len(stocks)}개")
            return stocks
        except mysql.connector.Error as e:
            logger.error(f"종목 조회 실패: {e}")
            return []
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def get_stocks_by_symbols(self, symbols):
        """특정 종목 코드들로 종목 정보를 가져옵니다."""
        connection = self.get_db_connection()
        if not connection:
            return []
        
        try:
            cursor = connection.cursor(dictionary=True)
            placeholders = ','.join(['%s'] * len(symbols))
            query = f"""
                SELECT id, symbol, name, logo_url 
                FROM stocks 
                WHERE (is_active = TRUE OR is_active IS NULL) AND symbol IN ({placeholders})
            """
            cursor.execute(query, symbols)
            stocks = cursor.fetchall()
            logger.info(f"지정된 종목: {len(stocks)}개 조회")
            return stocks
        except mysql.connector.Error as e:
            logger.error(f"종목 조회 실패: {e}")
            return []
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def generate_logo_url(self, symbol):
        """종목 코드를 기반으로 로고 URL을 생성합니다."""
        return self.logo_url_pattern.format(symbol)
    
    def is_logo_url_valid(self, logo_url):
        """로고 URL이 유효한지 확인합니다."""
        try:
            logger.debug(f"로고 URL 검증 중: {logo_url}")
            response = self.session.get(logo_url, timeout=10)
            content_length = len(response.content) if response.content else 0
            
            logger.debug(f"응답: {response.status_code}, 크기: {content_length}바이트")
            
            if response.status_code == 200 and content_length > 100:  # 500 -> 100으로 완화
                return True
            else:
                logger.debug(f"검증 실패: 상태코드={response.status_code}, 크기={content_length}바이트")
                return False
        except Exception as e:
            logger.debug(f"로고 URL 검증 실패: {logo_url} - {e}")
            return False
    
    def update_stock_logo(self, stock_id, logo_url):
        """종목의 로고 URL을 데이터베이스에 업데이트합니다."""
        connection = self.get_db_connection()
        if not connection:
            return False
        
        try:
            cursor = connection.cursor()
            cursor.execute(
                "UPDATE stocks SET logo_url = %s, updated_at = NOW() WHERE id = %s",
                (logo_url, stock_id)
            )
            connection.commit()
            return cursor.rowcount > 0
        except mysql.connector.Error as e:
            logger.error(f"로고 URL 업데이트 실패: {e}")
            connection.rollback()
            return False
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    def process_stocks(self, stocks, delay=0.5):
        """종목 리스트를 처리하여 로고를 업데이트합니다."""
        success_count = 0
        failed_stocks = []
        
        logger.info(f"=== {len(stocks)}개 종목 로고 업데이트 시작 ===")
        
        for i, stock in enumerate(stocks):
            try:
                symbol = stock['symbol']
                name = stock['name']
                stock_id = stock['id']
                
                # 로고 URL 생성
                logo_url = self.generate_logo_url(symbol)
                logger.debug(f"[{symbol}] 생성된 로고 URL: {logo_url}")
                
                # 로고 URL 유효성 검사
                if self.is_logo_url_valid(logo_url):
                    # 데이터베이스 업데이트
                    if self.update_stock_logo(stock_id, logo_url):
                        success_count += 1
                        logger.info(f"✅ [{symbol}] {name} - 로고 업데이트 성공")
                    else:
                        failed_stocks.append((symbol, name, "DB 업데이트 실패"))
                        logger.error(f"❌ [{symbol}] {name} - DB 업데이트 실패")
                else:
                    failed_stocks.append((symbol, name, "로고 없음"))
                    logger.warning(f"⚠️  [{symbol}] {name} - 로고를 찾을 수 없습니다")
                
                # 요청 간격 조절
                if i < len(stocks) - 1 and delay > 0:
                    time.sleep(delay)
                    
            except Exception as e:
                failed_stocks.append((stock['symbol'], stock['name'], str(e)))
                logger.error(f"❌ [{stock['symbol']}] {stock['name']} - 처리 실패: {e}")
        
        # 결과 요약
        logger.info(f"=== 로고 업데이트 완료 ===")
        logger.info(f"성공: {success_count}개")
        logger.info(f"실패: {len(failed_stocks)}개")
        
        if failed_stocks:
            logger.info("실패한 종목들:")
            for symbol, name, reason in failed_stocks:
                logger.info(f"  - [{symbol}] {name}: {reason}")
        
        return success_count, failed_stocks
    
    def update_all_stocks(self, delay=0.5):
        """모든 종목의 로고를 업데이트합니다."""
        stocks = self.get_all_stocks()
        if not stocks:
            logger.error("종목 데이터를 가져올 수 없습니다.")
            return False
        
        success_count, failed_stocks = self.process_stocks(stocks, delay)
        return len(failed_stocks) == 0
    
    def update_missing_logos(self, delay=0.5):
        """로고가 없는 종목들만 업데이트합니다."""
        stocks = self.get_stocks_without_logo()
        if not stocks:
            logger.info("로고가 없는 종목이 없습니다.")
            return True
        
        success_count, failed_stocks = self.process_stocks(stocks, delay)
        return len(failed_stocks) == 0
    
    def update_stocks_by_symbols(self, symbols, delay=0.5):
        """특정 종목들의 로고를 업데이트합니다."""
        stocks = self.get_stocks_by_symbols(symbols)
        if not stocks:
            logger.error(f"지정된 종목들을 찾을 수 없습니다: {symbols}")
            return False
        
        success_count, failed_stocks = self.process_stocks(stocks, delay)
        return len(failed_stocks) == 0

def load_db_config():
    """환경변수나 설정 파일에서 데이터베이스 설정을 로드합니다."""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '3306')),
        'database': os.getenv('DB_NAME', 'hanazoom'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', '')
    }

def main():
    parser = argparse.ArgumentParser(description="HanaZoom 종목 로고 업데이트")
    parser.add_argument('command', choices=['all', 'missing', 'symbols'], 
                       help='업데이트 모드: all(전체), missing(로고없는것만), symbols(특정종목)')
    parser.add_argument('--symbols', help='특정 종목 코드들 (쉼표로 구분)')
    parser.add_argument('--delay', type=float, default=0.5, help='요청 간 지연 시간 (초)')
    parser.add_argument('--host', default='localhost', help='데이터베이스 호스트')
    parser.add_argument('--port', type=int, default=3306, help='데이터베이스 포트')
    parser.add_argument('--database', default='hanazoom', help='데이터베이스 이름')
    parser.add_argument('--user', default='root', help='데이터베이스 사용자')
    parser.add_argument('--password', help='데이터베이스 비밀번호')
    
    args = parser.parse_args()
    
    # 데이터베이스 설정
    db_config = {
        'host': args.host,
        'port': args.port,
        'database': args.database,
        'user': args.user,
        'password': args.password or os.getenv('DB_PASSWORD', '')
    }
    
    if not db_config['password']:
        import getpass
        db_config['password'] = getpass.getpass("데이터베이스 비밀번호를 입력하세요: ")
    
    # 로고 업데이터 생성
    updater = StockLogoUpdater(db_config)
    
    # 명령어 실행
    try:
        if args.command == 'all':
            logger.info("전체 종목 로고 업데이트를 시작합니다...")
            success = updater.update_all_stocks(args.delay)
        elif args.command == 'missing':
            logger.info("로고가 없는 종목만 업데이트를 시작합니다...")
            success = updater.update_missing_logos(args.delay)
        elif args.command == 'symbols':
            if not args.symbols:
                logger.error("--symbols 파라미터가 필요합니다. 예: --symbols=005930,000660,035420")
                return False
            symbols = [s.strip() for s in args.symbols.split(',')]
            logger.info(f"지정된 종목들의 로고 업데이트를 시작합니다: {symbols}")
            success = updater.update_stocks_by_symbols(symbols, args.delay)
        
        return success
        
    except Exception as e:
        logger.error(f"로고 업데이트 중 오류 발생: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit_code = 0 if success else 1
    exit(exit_code)
