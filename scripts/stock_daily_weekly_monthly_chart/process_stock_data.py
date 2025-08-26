#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
주식 시계열 데이터 처리 스크립트 (고성능 버전)
out_krx_parallel 폴더의 CSV 파일들을 멀티스레딩 및 벌크 인서트로 빠르게 저장
"""

import os
import pandas as pd
import mysql.connector
from mysql.connector import Error
import logging
import glob
from tqdm import tqdm
import time
from datetime import datetime
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_data_processing.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class StockDataProcessor:
    def __init__(self, db_config):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        self.csv_dir = "./out_krx_parallel"
        self.batch_size = 1000  # 벌크 인서트 배치 크기
        self.lock = threading.Lock()  # 스레드 안전성을 위한 락
        
        # 종목 정보 (주요 종목들)
        self.stock_info = {
            '005930': '삼성전자', '000660': 'SK하이닉스', '035420': 'NAVER',
            '035720': '카카오', '051910': 'LG화학', '006400': '삼성SDI',
            '033780': 'KT&G', '003550': 'LG', '012330': '현대모비스',
            '017670': 'SK텔레콤', '090430': '아모레퍼시픽', '009830': '한화솔루션',
            '012450': '한화에어로스페이스', '010140': '삼성중공업', '088350': '한화시스템',
            '034020': '두산에너빌리티', '003490': '대한항공', '028260': '삼성물산',
            '066570': 'LG전자', '009150': '삼성생명', '096770': 'SK이노베이션',
            '024110': '기업은행', '316140': '우리금융지주', '011200': 'HMM',
            '010130': '고려아연', '055550': '신한지주', '030200': 'KT',
            '011170': '오뚜기', '004990': '롯데지주', '336260': '두산로보틱스',
            '029780': '삼성카드', '000120': 'CJ대한통운', '000720': '현대건설',
            '086280': '현대글로비스', '002380': '한국공항공사', '004020': '현대제철',
            '011790': 'SKC', '006360': 'GS건설', '036570': '엔씨소프트',
            '035250': '강원랜드', '402340': 'SK스퀘어', '018260': '삼성에스디에스',
            '023530': '롯데쇼핑', '008770': '호텔신라', '069960': '현대백화점',
            '035760': 'CJ ENM', '139480': '이마트', '010950': 'S-Oil',
            '456040': '한화에어로스페이스', '375500': 'DL이앤씨', '064350': '현대로템',
            '018880': '한온시스템', '007070': 'GS리테일', '120110': '코오롱인더',
            '011210': '현대위아', '000880': '한화', '006650': '대한뉴팜',
            '001450': '현대해상', '180640': '한진칼', '004000': '롯데정밀화학',
            '282330': 'BGF리테일', '112610': '씨에스윈드', '009240': '한샘',
            '047040': '대우건설', '161390': '한국타이어앤테크놀로지', '089860': '롯데렌탈',
            '008930': '한미사이언스', '251270': '넷마블', '032830': '삼성생명',
            '028670': '팬오션', '051900': 'LG생활건강', '016360': '삼성증권',
            '071050': '한국금융지주', '047810': '한국항공우주', '035720': '카카오',
            '086790': '하나금융지주', '005940': 'NH투자증권', '078930': 'GS',
            '097950': 'CJ제일제당', '036460': '한국가스공사', '005830': 'DB손해보험',
            '034730': 'SK', '128940': '한미약품', '035420': 'NAVER',
            '011780': '금호석유', '069500': 'KODEX 200', '005380': '현대차',
            '005490': '포스코홀딩스', '015760': '한국전력', '204320': '만도',
            '000150': '두산', '010120': 'LS ELECTRIC', '010620': '현대미포조선',
            '009540': '한국조선해양', '000810': '삼성화재', '326030': 'SK바이오팜'
        }

    def connect_db(self):
        """데이터베이스 연결"""
        try:
            self.connection = mysql.connector.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            logger.info("✅ 데이터베이스 연결 성공")
            return True
        except Error as e:
            logger.error(f"❌ 데이터베이스 연결 실패: {e}")
            return False

    def disconnect_db(self):
        """데이터베이스 연결 해제"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        logger.info("🔌 데이터베이스 연결 해제")

    def get_csv_files(self):
        """CSV 파일 목록 조회"""
        pattern = os.path.join(self.csv_dir, "*.csv")
        csv_files = glob.glob(pattern)
        logger.info(f"📁 CSV 파일 {len(csv_files)}개 발견")
        return csv_files

    def parse_stock_code_from_filename(self, filename):
        """파일명에서 종목코드와 데이터 타입 추출"""
        basename = os.path.basename(filename)
        match = re.match(r'(\d{6})_([DWM])\.csv', basename)
        if match:
            return match.group(1), match.group(2)
        return None, None

    def load_csv_data(self, filepath):
        """CSV 파일 로드 및 전처리 (벌크 처리용)"""
        try:
            df = pd.read_csv(filepath, encoding='utf-8')
            
            # 컬럼명 정규화
            column_mapping = {
                'date': 'date',
                'open': 'open',
                'high': 'high', 
                'low': 'low',
                'close': 'close',
                'volume': 'volume'
            }
            
            df = df.rename(columns=column_mapping)
            df['date'] = pd.to_datetime(df['date'])
            
            # 숫자 컬럼 변환
            numeric_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in numeric_columns:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            df = df.dropna()
            df = df.sort_values('date')
            
            return df
            
        except Exception as e:
            logger.error(f"❌ CSV 파일 로드 실패 {filepath}: {e}")
            return None

    def bulk_insert_daily_data(self, stock_code, df):
        """일별 데이터 벌크 삽입"""
        if df.empty:
            return 0
            
        try:
            # 데이터를 배치로 나누기
            total_rows = len(df)
            inserted_count = 0
            
            for i in range(0, total_rows, self.batch_size):
                batch_df = df.iloc[i:i+self.batch_size]
                
                # 벌크 인서트 쿼리 생성
                placeholders = ', '.join(['(%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())'] * len(batch_df))
                query = f"""
                INSERT INTO stock_daily_prices 
                (stock_symbol, trade_date, open_price, high_price, low_price, close_price, volume, created_at, updated_at)
                VALUES {placeholders}
                ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                volume = VALUES(volume),
                updated_at = NOW()
                """
                
                # 배치 데이터 준비
                values = []
                for _, row in batch_df.iterrows():
                    values.extend([
                        stock_code,
                        row['date'].date(),
                        float(row['open']),
                        float(row['high']),
                        float(row['low']),
                        float(row['close']),
                        int(row['volume'])
                    ])
                
                with self.lock:  # 스레드 안전성 보장
                    self.cursor.execute(query, values)
                    inserted_count += len(batch_df)
            
            return inserted_count
            
        except Exception as e:
            logger.error(f"❌ 일별 데이터 벌크 삽입 실패 {stock_code}: {e}")
            return 0

    def bulk_insert_weekly_data(self, stock_code, df):
        """주별 데이터 벌크 삽입"""
        if df.empty:
            return 0
            
        try:
            # 데이터를 배치로 나누기
            total_rows = len(df)
            inserted_count = 0
            
            for i in range(0, total_rows, self.batch_size):
                batch_df = df.iloc[i:i+self.batch_size]
                
                # 벌크 인서트 쿼리 생성
                placeholders = ', '.join(['(%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())'] * len(batch_df))
                query = f"""
                INSERT INTO stock_weekly_prices 
                (stock_symbol, week_start_date, week_end_date, open_price, high_price, low_price, close_price, volume, created_at, updated_at)
                VALUES {placeholders}
                ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                volume = VALUES(volume),
                updated_at = NOW()
                """
                
                # 배치 데이터 준비
                values = []
                for _, row in batch_df.iterrows():
                    week_start = row['date'].date()
                    week_end = week_start + pd.Timedelta(days=4)
                    
                    values.extend([
                        stock_code,
                        week_start,
                        week_end,
                        float(row['open']),
                        float(row['high']),
                        float(row['low']),
                        float(row['close']),
                        int(row['volume'])
                    ])
                
                with self.lock:  # 스레드 안전성 보장
                    self.cursor.execute(query, values)
                    inserted_count += len(batch_df)
            
            return inserted_count
            
        except Exception as e:
            logger.error(f"❌ 주별 데이터 벌크 삽입 실패 {stock_code}: {e}")
            return 0

    def bulk_insert_monthly_data(self, stock_code, df):
        """월별 데이터 벌크 삽입"""
        if df.empty:
            return 0
            
        try:
            # 데이터를 배치로 나누기
            total_rows = len(df)
            inserted_count = 0
            
            for i in range(0, total_rows, self.batch_size):
                batch_df = df.iloc[i:i+self.batch_size]
                
                # 벌크 인서트 쿼리 생성
                placeholders = ', '.join(['(%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())'] * len(batch_df))
                query = f"""
                INSERT INTO stock_monthly_prices 
                (stock_symbol, year_month_period, open_price, high_price, low_price, close_price, volume, created_at, updated_at)
                VALUES {placeholders}
                ON DUPLICATE KEY UPDATE
                open_price = VALUES(open_price),
                high_price = VALUES(high_price),
                low_price = VALUES(low_price),
                close_price = VALUES(close_price),
                volume = VALUES(volume),
                updated_at = NOW()
                """
                
                # 배치 데이터 준비
                values = []
                for _, row in batch_df.iterrows():
                    year_month = row['date'].strftime('%Y-%m')
                    
                    values.extend([
                        stock_code,
                        year_month,
                        float(row['open']),
                        float(row['high']),
                        float(row['low']),
                        float(row['close']),
                        int(row['volume'])
                    ])
                
                with self.lock:  # 스레드 안전성 보장
                    self.cursor.execute(query, values)
                    inserted_count += len(batch_df)
            
            return inserted_count
            
        except Exception as e:
            logger.error(f"❌ 월별 데이터 벌크 삽입 실패 {stock_code}: {e}")
            return 0

    def update_stock_master(self, stock_code, has_daily=False, has_weekly=False, has_monthly=False):
        """주식 마스터 정보 업데이트"""
        try:
            check_query = "SELECT id FROM stock_master WHERE symbol = %s"
            with self.lock:  # 스레드 안전성 보장
                self.cursor.execute(check_query, (stock_code,))
                exists = self.cursor.fetchone()
            
            if not exists:
                insert_query = """
                INSERT INTO stock_master (symbol, name, market, sector, has_daily_data, has_weekly_data, has_monthly_data, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                
                values = (
                    stock_code,
                    self.stock_info.get(stock_code, f'종목{stock_code}'),
                    'KOSPI',
                    '기타',
                    has_daily,
                    has_weekly,
                    has_monthly
                )
                
                with self.lock:  # 스레드 안전성 보장
                    self.cursor.execute(insert_query, values)
                    logger.info(f"✅ 새 종목 추가: {stock_code}")
            else:
                # 기존 데이터 업데이트
                update_query = """
                UPDATE stock_master 
                SET has_daily_data = %s, has_weekly_data = %s, has_monthly_data = %s, updated_at = NOW()
                WHERE symbol = %s
                """
                
                values = (has_daily, has_weekly, has_monthly, stock_code)
                with self.lock:  # 스레드 안전성 보장
                    self.cursor.execute(update_query, values)
                
        except Exception as e:
            logger.error(f"❌ 주식 마스터 업데이트 실패 {stock_code}: {e}")

    def process_single_stock(self, stock_code):
        """단일 종목 데이터 처리 (벌크 처리)"""
        result = {
            'stock_code': stock_code,
            'daily_inserted': 0,
            'weekly_inserted': 0,
            'monthly_inserted': 0,
            'errors': []
        }
        
        try:
            # 일별 데이터 처리
            daily_file = os.path.join(self.csv_dir, f"{stock_code}_D.csv")
            if os.path.exists(daily_file):
                df_daily = self.load_csv_data(daily_file)
                if df_daily is not None:
                    result['daily_inserted'] = self.bulk_insert_daily_data(stock_code, df_daily)
                    logger.info(f"📊 {stock_code} 일별 데이터 {result['daily_inserted']}건 벌크 처리 완료")
            
            # 주별 데이터 처리
            weekly_file = os.path.join(self.csv_dir, f"{stock_code}_W.csv")
            if os.path.exists(weekly_file):
                df_weekly = self.load_csv_data(weekly_file)
                if df_weekly is not None:
                    result['weekly_inserted'] = self.bulk_insert_weekly_data(stock_code, df_weekly)
                    logger.info(f"📈 {stock_code} 주별 데이터 {result['weekly_inserted']}건 벌크 처리 완료")
            
            # 월별 데이터 처리
            monthly_file = os.path.join(self.csv_dir, f"{stock_code}_M.csv")
            if os.path.exists(monthly_file):
                df_monthly = self.load_csv_data(monthly_file)
                if df_monthly is not None:
                    result['monthly_inserted'] = self.bulk_insert_monthly_data(stock_code, df_monthly)
                    logger.info(f"📅 {stock_code} 월별 데이터 {result['monthly_inserted']}건 벌크 처리 완료")
            
            # 마스터 정보 업데이트
            has_daily = result['daily_inserted'] > 0
            has_weekly = result['weekly_inserted'] > 0
            has_monthly = result['monthly_inserted'] > 0
            
            self.update_stock_master(stock_code, has_daily, has_weekly, has_monthly)
            
            # 커밋
            with self.lock:  # 스레드 안전성 보장
                self.connection.commit()
            
        except Exception as e:
            error_msg = f"❌ {stock_code} 처리 실패: {e}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
            with self.lock:  # 스레드 안전성 보장
                self.connection.rollback()
        
        return result

    def process_all_data_parallel(self, max_workers=None):
        """멀티스레딩으로 전체 데이터 처리"""
        start_time = time.time()
        
        logger.info("🚀 주식 시계열 데이터 멀티스레딩 처리 시작!")
        
        # CSV 파일 목록 조회
        csv_files = self.get_csv_files()
        
        # 종목코드별로 그룹화
        stock_groups = {}
        for csv_file in csv_files:
            stock_code, data_type = self.parse_stock_code_from_filename(csv_file)
            if stock_code:
                if stock_code not in stock_groups:
                    stock_groups[stock_code] = []
                stock_groups[stock_code].append(data_type)
        
        all_stocks = list(stock_groups.keys())
        logger.info(f"📈 처리할 종목 수: {len(all_stocks)}개")
        
        # 스레드 수 결정 (CPU 코어 수의 2배까지)
        if max_workers is None:
            max_workers = min(16, len(all_stocks))  # 최대 16개 스레드
        
        logger.info(f"⚡ 멀티스레딩 워커 수: {max_workers}개")
        
        total_results = []
        
        # 멀티스레딩 처리 실행
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 종목별로 병렬 처리
            future_to_stock = {executor.submit(self.process_single_stock, stock_code): stock_code for stock_code in all_stocks}
            
            # 진행률 표시
            with tqdm(total=len(all_stocks), desc="🚀 멀티스레딩 처리 진행률") as pbar:
                for future in as_completed(future_to_stock):
                    stock_code = future_to_stock[future]
                    try:
                        result = future.result()
                        total_results.append(result)
                        pbar.update(1)
                        
                        # 개별 종목 완료 로그
                        if result['errors']:
                            logger.warning(f"⚠️ {stock_code} 처리 완료 (에러 있음)")
                        else:
                            logger.info(f"✅ {stock_code} 처리 완료")
                            
                    except Exception as e:
                        logger.error(f"❌ {stock_code} 처리 중 예외 발생: {e}")
                        pbar.update(1)
        
        # 최종 결과 요약
        end_time = time.time()
        processing_time = end_time - start_time
        
        total_daily = sum(r['daily_inserted'] for r in total_results)
        total_weekly = sum(r['weekly_inserted'] for r in total_results)
        total_monthly = sum(r['monthly_inserted'] for r in total_results)
        total_errors = sum(len(r['errors']) for r in total_results)
        
        logger.info("=" * 60)
        logger.info("🏁 멀티스레딩 데이터 처리 완료!")
        logger.info(f"⏱️  총 처리 시간: {processing_time:.2f}초")
        logger.info(f"⚡ 스레드 워커: {max_workers}개")
        logger.info(f"📊 처리된 종목: {len(all_stocks)}개")
        logger.info(f"📈 일별 데이터: {total_daily:,}건")
        logger.info(f"📊 주별 데이터: {total_weekly:,}건")
        logger.info(f"📅 월별 데이터: {total_monthly:,}건")
        logger.info(f"❌ 에러: {total_errors}건")
        logger.info(f"🚀 성능 향상: 예상 {max_workers:.1f}배 빠름")
        logger.info("=" * 60)
        
        return total_results

    def process_all_data(self):
        """기존 순차 처리 방식 (호환성 유지)"""
        return self.process_all_data_parallel()

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
    
    # 데이터베이스 연결
    processor = StockDataProcessor(db_config)
    if not processor.connect_db():
        return
    
    try:
        # 멀티스레딩 데이터 처리 실행
        results = processor.process_all_data_parallel()
        
        # 결과를 JSON 파일로 저장
        import json
        with open('processing_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2, default=str)
        
        logger.info("💾 처리 결과가 processing_results.json 파일에 저장되었습니다.")
        
    except Exception as e:
        logger.error(f"❌ 전체 처리 실패: {e}")
    
    finally:
        # 데이터베이스 연결 해제
        processor.disconnect_db()

if __name__ == "__main__":
    main()
