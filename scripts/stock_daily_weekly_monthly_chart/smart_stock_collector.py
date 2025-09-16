#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
스마트 주식 데이터 수집 스크립트
DB의 마지막 날짜를 확인하고 누락된 데이터만 효율적으로 수집
"""

from pykrx import stock
import pandas as pd
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from tenacity import retry, wait_exponential, stop_after_attempt
from time import sleep
import os
from tqdm import tqdm
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('smart_stock_collection.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SmartStockCollector:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        self.out_dir = "./out_krx_smart"
        
        # 종목 리스트
        self.stock_codes = [
            "005930","000660","207940","373220","105560","051910","006400","033780","003550","012330",
            "017670","090430","009830","012450","010140","088350","034020","003490","028260","066570",
            "009150","096770","024110","316140","011200","010130","055550","030200","011170","004990",
            "336260","029780","000120","000720","086280","002380","004020","011790","006360","036570",
            "035250","402340","018260","023530","008770","069960","035760","139480","010950","456040",
            "375500","064350","018880","007070","120110","011210","000880","006650","001450","180640",
            "004000","282330","112610","009240","047040","161390","089860","008930","251270","032830",
            "028670","051900","016360","071050","047810","035720","086790","005940","078930","097950",
            "036460","005830","034730","128940","035420","011780","069500","005380","005490","015760",
            "204320","000150","010120","010620","009540","000810","326030"
        ]
        
        # API 호출 제한 설정
        self.api_daily_limit = 1000  # 일일 API 호출 제한
        self.api_calls_made = 0
        self.max_workers = 4  # API 제한 고려하여 워커 수 조정
        
        os.makedirs(self.out_dir, exist_ok=True)

    def connect_db(self):
        """데이터베이스 연결"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            logger.info("✅ 데이터베이스 연결 성공")
            
            # DB 연결 테스트 및 테이블 존재 확인
            if not self.test_db_connection():
                logger.error("❌ 데이터베이스 테이블 확인 실패")
                return False
                
            return True
        except Error as e:
            logger.error(f"❌ 데이터베이스 연결 실패: {e}")
            return False

    def test_db_connection(self):
        """DB 연결 테스트 및 테이블 존재 확인"""
        try:
            # 테이블 존재 확인
            tables = ['stock_daily_prices', 'stock_weekly_prices', 'stock_monthly_prices']
            for table in tables:
                query = f"SELECT COUNT(*) FROM {table} LIMIT 1"
                self.cursor.execute(query)
                result = self.cursor.fetchone()
                logger.info(f"✅ {table} 테이블 확인 완료 (레코드 수: {result[0]})")
            
            # 샘플 데이터로 가장 오래된 날짜 조회 테스트
            test_query = "SELECT MIN(trade_date) FROM stock_daily_prices LIMIT 1"
            self.cursor.execute(test_query)
            result = self.cursor.fetchone()
            if result and result[0]:
                logger.info(f"📅 DB에서 확인된 가장 오래된 일별 데이터 날짜: {result[0]}")
            else:
                logger.info("📅 DB에 일별 데이터가 없습니다 - 10년 전부터 수집합니다")
            
            return True
        except Exception as e:
            logger.error(f"❌ DB 테스트 실패: {e}")
            return False

    def disconnect_db(self):
        """데이터베이스 연결 해제"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("🔌 데이터베이스 연결 해제")

    def get_oldest_date_from_db(self, stock_code, table_name):
        """DB에서 해당 종목의 가장 오래된 날짜 조회"""
        try:
            if table_name == 'stock_daily_prices':
                query = """
                SELECT MIN(trade_date) as oldest_date 
                FROM stock_daily_prices 
                WHERE stock_symbol = %s
                """
            elif table_name == 'stock_weekly_prices':
                query = """
                SELECT MIN(week_start_date) as oldest_date 
                FROM stock_weekly_prices 
                WHERE stock_symbol = %s
                """
            elif table_name == 'stock_monthly_prices':
                query = """
                SELECT MIN(year_month_period) as oldest_date 
                FROM stock_monthly_prices 
                WHERE stock_symbol = %s
                """
            else:
                return None
                
            self.cursor.execute(query, (stock_code,))
            result = self.cursor.fetchone()
            
            if result and result[0]:
                logger.info(f"📅 {stock_code} {table_name} 가장 오래된 날짜: {result[0]}")
                return result[0]
            else:
                logger.info(f"📅 {stock_code} {table_name} 데이터 없음 - 처음부터 수집")
                return None
                
        except Exception as e:
            logger.error(f"❌ {stock_code} {table_name} 가장 오래된 날짜 조회 실패: {e}")
            return None

    def check_api_limit(self):
        """API 호출 제한 확인"""
        if self.api_calls_made >= self.api_daily_limit:
            logger.warning(f"⚠️ API 호출 제한 도달: {self.api_calls_made}/{self.api_daily_limit}")
            return False
        return True

    def increment_api_calls(self):
        """API 호출 횟수 증가"""
        self.api_calls_made += 1
        if self.api_calls_made % 100 == 0:
            logger.info(f"📊 API 호출 현황: {self.api_calls_made}/{self.api_daily_limit}")

    def normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        """데이터 정규화"""
        m = {"시가":"open","고가":"high","저가":"low","종가":"close","거래량":"volume"}
        df = df.rename(columns=m).sort_index()
        keep = [c for c in ["open","high","low","close","volume"] if c in df.columns]
        return df[keep].astype("float64")

    def to_weekly(self, df_daily: pd.DataFrame) -> pd.DataFrame:
        """일별 데이터를 주별로 변환"""
        return (df_daily
                .resample("W-FRI")
                .agg({"open":"first","high":"max","low":"min","close":"last","volume":"sum"})
                .dropna())

    @retry(wait=wait_exponential(multiplier=0.5, min=0.5, max=8), stop=stop_after_attempt(5))
    def fetch_stock_data_smart(self, stock_code: str):
        """스마트 데이터 수집 - 최신부터 10년 전까지 역순 수집"""
        try:
            # API 호출 제한 확인
            if not self.check_api_limit():
                logger.warning(f"⚠️ {stock_code} API 제한으로 건너뜀")
                return None

            logger.info(f"📊 {stock_code} 스마트 데이터 수집 시작...")
            
            # 1. DB에서 가장 오래된 날짜 확인
            oldest_daily_date = self.get_oldest_date_from_db(stock_code, 'stock_daily_prices')
            
            # 2. 수집 범위 결정 (최신 → 10년 전)
            current_date = datetime.now().strftime("%Y%m%d")
            
            if oldest_daily_date:
                # 가장 오래된 날짜가 있으면 그 날짜부터 현재까지
                if isinstance(oldest_daily_date, str):
                    oldest_date = datetime.strptime(oldest_daily_date, '%Y-%m-%d').date()
                else:
                    oldest_date = oldest_daily_date
                start_date = oldest_date.strftime("%Y%m%d")
            else:
                # 데이터가 없으면 10년 전부터 현재까지
                ten_years_ago = datetime.now() - timedelta(days=365*10)
                start_date = ten_years_ago.strftime("%Y%m%d")
            
            end_date = current_date
            
            # 3. API 제한 고려
            remaining_api_calls = self.api_daily_limit - self.api_calls_made
            if remaining_api_calls < 2:  # 최소 2회 호출 필요 (일별, 월별)
                logger.warning(f"⚠️ {stock_code} API 호출 제한으로 건너뜀 (남은 호출: {remaining_api_calls})")
                return None
            
            # 4. 수집할 데이터가 있는지 확인
            if start_date >= end_date:
                logger.info(f"✅ {stock_code} 데이터 범위 확인 (시작일: {start_date}, 종료일: {end_date})")
                return None
            
            logger.info(f"🔄 {stock_code} 10년치 데이터 수집: {start_date} ~ {end_date}")
            
            # 5. 일별 데이터 수집 (기존 pykrx 방식)
            logger.info(f"  └─ {stock_code} 일별 데이터 수집 중...")
            day = stock.get_market_ohlcv_by_date(start_date, end_date, stock_code, freq="d")
            self.increment_api_calls()
            
            if day.empty:
                logger.warning(f"⚠️ {stock_code} 일별 데이터 없음")
                return None
                
            logger.info(f"  └─ {stock_code} 일별 데이터 완료 ({len(day)}개 행)")
            
            # 6. 월별 데이터 수집 (기존 pykrx 방식)
            logger.info(f"  └─ {stock_code} 월별 데이터 수집 중...")
            mon = stock.get_market_ohlcv_by_date(start_date, end_date, stock_code, freq="m")
            self.increment_api_calls()
            logger.info(f"  └─ {stock_code} 월별 데이터 완료 ({len(mon)}개 행)")
            
            # 7. 데이터 정규화 (기존 방식과 동일)
            day, mon = self.normalize(day), self.normalize(mon)
            wk = self.to_weekly(day)
            logger.info(f"  └─ {stock_code} 주별 데이터 생성 완료 ({len(wk)}개 행)")
            
            logger.info(f"✅ {stock_code} 스마트 데이터 수집 완료!")
            return stock_code, day, wk, mon
            
        except Exception as e:
            logger.error(f"❌ {stock_code} 스마트 데이터 수집 실패: {str(e)}")
            return None

    def save_to_csv(self, stock_code, day, wk, mon):
        """CSV 파일로 저장"""
        try:
            for frame, suf in [(day,"D"), (wk,"W"), (mon,"M")]:
                if not frame.empty:
                    p = f"{self.out_dir}/{stock_code}_{suf}.csv"
                    frame.index.name = "date"
                    frame.to_csv(p, encoding="utf-8")
            logger.info(f"💾 {stock_code} CSV 파일 저장 완료")
        except Exception as e:
            logger.error(f"❌ {stock_code} CSV 파일 저장 실패: {str(e)}")

    def collect_all_stocks_smart(self):
        """모든 종목의 스마트 데이터 수집"""
        start_time = datetime.now()
        
        logger.info("🚀 스마트 주식 데이터 수집 시작!")
        logger.info(f"📈 대상 종목 수: {len(self.stock_codes)}개")
        logger.info(f"🔧 최대 워커 수: {self.max_workers}개")
        logger.info(f"📊 API 호출 제한: {self.api_daily_limit}회")
        
        completed_count = 0
        skipped_count = 0
        error_count = 0
        total_data_count = 0
        data_date_range = {"start": None, "end": None}
        
        # 진행률 바 생성
        pbar = tqdm(total=len(self.stock_codes), desc="📊 스마트 데이터 수집", unit="종목")
        
        futures = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as ex:
            # 작업 제출
            for stock_code in self.stock_codes:
                futures.append(ex.submit(self.fetch_stock_data_smart, stock_code))
                sleep(0.1)  # API 호출 간격
            
            logger.info("📤 모든 작업 제출 완료, 결과 처리 시작...")
            
            # 결과 처리
            for fut in as_completed(futures):
                try:
                    result = fut.result()
                    if result is None:
                        skipped_count += 1
                    else:
                        stock_code, day, wk, mon = result
                        self.save_to_csv(stock_code, day, wk, mon)
                        completed_count += 1
                        
                        # 데이터 수량 및 날짜 범위 계산
                        daily_count = len(day) if not day.empty else 0
                        weekly_count = len(wk) if not wk.empty else 0
                        monthly_count = len(mon) if not mon.empty else 0
                        total_data_count += daily_count + weekly_count + monthly_count
                        
                        # 날짜 범위 업데이트
                        if not day.empty:
                            day_start = day.index.min().strftime('%Y-%m-%d')
                            day_end = day.index.max().strftime('%Y-%m-%d')
                            if data_date_range["start"] is None or day_start < data_date_range["start"]:
                                data_date_range["start"] = day_start
                            if data_date_range["end"] is None or day_end > data_date_range["end"]:
                                data_date_range["end"] = day_end
                        
                        logger.info(f"🎯 {stock_code} 완료 - 일:{daily_count}개, 주:{weekly_count}개, 월:{monthly_count}개")
                    
                except Exception as e:
                    error_count += 1
                    logger.error(f"💥 처리 실패: {str(e)}")
                
                pbar.update(1)
                pbar.set_postfix({
                    '완료': f'{completed_count}/{len(self.stock_codes)}',
                    '건너뜀': skipped_count,
                    '실패': error_count,
                    'API호출': f'{self.api_calls_made}/{self.api_daily_limit}',
                    '총데이터': total_data_count
                })
        
        pbar.close()
        
        # 최종 결과 요약
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        logger.info("=" * 60)
        logger.info("🏁 스마트 데이터 수집 완료!")
        logger.info(f"⏱️  총 처리 시간: {processing_time:.2f}초")
        logger.info(f"✅ 성공: {completed_count}개 종목")
        logger.info(f"⏭️  건너뜀: {skipped_count}개 종목 (이미 최신)")
        logger.info(f"❌ 실패: {error_count}개 종목")
        logger.info(f"📊 총 수집 데이터: {total_data_count}개 (일+주+월)")
        if data_date_range["start"] and data_date_range["end"]:
            logger.info(f"📅 데이터 기간: {data_date_range['start']} ~ {data_date_range['end']}")
        logger.info(f"📊 API 호출: {self.api_calls_made}/{self.api_daily_limit}회")
        logger.info(f"📁 결과 저장 위치: {os.path.abspath(self.out_dir)}")
        logger.info("=" * 60)

def main():
    """메인 함수"""
    # 데이터베이스 연결 설정
    db_config = {
        'host': 'localhost',
        'user': 'hanazoom_user',
        'password': 'hanazoom1234!',
        'database': 'hanazoom',
        'charset': 'utf8mb4',
        'autocommit': False
    }
    
    # 스마트 수집기 생성
    collector = SmartStockCollector(db_config)
    
    # 데이터베이스 연결 및 테스트
    logger.info("🔍 데이터베이스 연결 및 테스트 시작...")
    if not collector.connect_db():
        logger.error("❌ 데이터베이스 연결 실패 - 스크립트를 중단합니다")
        logger.error("❌ 불필요한 API 호출을 방지하기 위해 스크립트를 종료합니다")
        return
    
    logger.info("✅ 데이터베이스 연결 및 테스트 완료 - 스마트 데이터 수집을 시작합니다")
    
    try:
        # 스마트 데이터 수집 실행
        collector.collect_all_stocks_smart()
        
    except Exception as e:
        logger.error(f"❌ 전체 수집 실패: {e}")
    
    finally:
        # 데이터베이스 연결 해제
        collector.disconnect_db()

if __name__ == "__main__":
    main()
