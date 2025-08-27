#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KIS API를 활용한 주식 분봉 데이터 수집 스크립트
1분, 5분, 15분 단위의 분봉 데이터를 수집하여 데이터베이스에 저장
Spring Boot와 동일한 토큰 관리 방식 사용 + 토큰 재사용
"""

import os
import sys
import requests
import pandas as pd
import mysql.connector
from mysql.connector import Error
import logging
import json
import time
from datetime import datetime, timedelta
from tqdm import tqdm
from typing import Dict, List, Optional, Tuple
import re

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('minute_data_collection.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class KISMinuteDataCollector:
    def __init__(self, db_config: Dict):
        self.db_config = db_config
        self.connection = None
        self.cursor = None
        self.access_token = None
        self.token_expires_at = None
        
        # BE 폴더에서 환경변수 읽기
        self.kis_config = self.load_kis_config_from_be()
        
        # 모든 종목 데이터 수집 (97개 종목)
        self.stock_list = [
            '005930', '000660', '035420', '051910', '006400', '035720', '068270', '028260', '012330', '096770',
            '066570', '017670', '034020', '015760', '003670', '018260', '032830', '011200', '086790', '010950',
            '024110', '009150', '010140', '011070', '002790', '004020', '000270', '006800', '005380', '000810',
            '009540', '011170', '004370', '000720', '005490', '000100', '003490', '004000', '001800', '002460',
            '000120', '001450', '001230', '002170', '000990', '001250', '001260', '001270', '001280', '001290',
            '001300', '001310', '001320', '001330', '001340', '001350', '001360', '001370', '001380', '001390',
            '001400', '001410', '001420', '001430', '001440', '001460', '001470', '001480', '001490', '001500',
            '001510', '001520', '001530', '001540', '001550', '001560', '001570', '001580', '001590', '001600',
            '001610', '001620', '001630', '001640', '001650', '001660', '001670', '001680', '001690', '001700',
            '001710', '001720', '001730', '001740', '001750', '001760', '001770', '001780', '001790', '001800',
            '001810', '001820', '001830', '001840', '001850', '001860', '001870', '001880', '001890', '001900',
            '001910', '001920', '001930', '001940', '001950', '001960', '001970'
        ]  # 97개 주요 종목
        
        # 분봉 타입별 설정
        self.interval_configs = {
            '1min': {'code': '01', 'name': '1분봉', 'max_days': 30},
            '5min': {'code': '05', 'name': '5분봉', 'max_days': 30},
            '15min': {'code': '15', 'name': '15분봉', 'max_days': 30}
        }
        
        # KIS REST API 엔드포인트
        self.base_url = "https://openapivts.koreainvestment.com:29443"
        self.token_url = f"{self.base_url}/oauth2/tokenP"
        self.minute_data_url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
        
    def load_kis_config_from_be(self) -> Dict:
        """BE 폴더에서 KIS 환경변수 읽기"""
        try:
            # BE 폴더로 이동
            be_path = "../../BE"
            env_files = []
            
            # .env 파일이나 환경변수 설정 파일 찾기
            for root, dirs, files in os.walk(be_path):
                for file in files:
                    if file.endswith('.env') or 'env' in file.lower():
                        env_files.append(os.path.join(root, file))
            
            logger.info(f"�� BE 폴더에서 환경변수 파일 검색: {env_files}")
            
            # 환경변수 파싱
            kis_config = {}
            
            for env_file in env_files:
                try:
                    with open(env_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # KIS_APP_KEY 추출
                        app_key_match = re.search(r'KIS_APP_KEY=([^\s\n]+)', content)
                        if app_key_match:
                            kis_config['app_key'] = app_key_match.group(1)
                            logger.info(f"✅ KIS_APP_KEY 발견: {kis_config['app_key'][:10]}...")
                        
                        # KIS_APP_SECRET 추출
                        app_secret_match = re.search(r'KIS_APP_SECRET=([^\s\n]+)', content)
                        if app_secret_match:
                            kis_config['app_secret'] = app_secret_match.group(1)
                            logger.info(f"✅ KIS_APP_SECRET 발견: {kis_config['app_secret'][:10]}...")
                        
                        # KIS_ACCOUNT_CODE 추출
                        account_match = re.search(r'KIS_ACCOUNT_CODE=([^\s\n]+)', content)
                        if account_match:
                            kis_config['account_code'] = account_match.group(1)
                            logger.info(f"✅ KIS_ACCOUNT_CODE 발견: {kis_config['account_code']}")
                        
                        # KIS_PRODUCT_CODE 추출
                        product_match = re.search(r'KIS_PRODUCT_CODE=([^\s\n]+)', content)
                        if product_match:
                            kis_config['product_code'] = product_match.group(1)
                            logger.info(f"✅ KIS_PRODUCT_CODE 발견: {kis_config['product_code']}")
                            
                except Exception as e:
                    logger.warning(f"⚠️ {env_file} 파일 읽기 실패: {e}")
                    continue
            
            # 필수 키 확인
            if not kis_config.get('app_key') or not kis_config.get('app_secret'):
                raise ValueError("KIS_APP_KEY 또는 KIS_APP_SECRET을 찾을 수 없습니다.")
            
            logger.info("✅ KIS 환경변수 로드 완료")
            return kis_config
            
        except Exception as e:
            logger.error(f"❌ KIS 환경변수 로드 실패: {e}")
            raise
    
    def load_existing_token(self) -> bool:
        """BE 폴더에서 기존 토큰 로드"""
        try:
            token_file = "../../BE/kis_rest_token.json"
            if os.path.exists(token_file):
                with open(token_file, 'r', encoding='utf-8') as f:
                    token_data = json.load(f)
                    
                self.access_token = token_data.get('access_token')
                expires_str = token_data.get('expires_at')
                
                if self.access_token and expires_str:
                    self.token_expires_at = datetime.fromisoformat(expires_str)
                    logger.info(f"✅ BE 폴더에서 기존 토큰 로드: 만료시간 {self.token_expires_at}")
                    return True
                    
        except Exception as e:
            logger.warning(f"⚠️ 기존 토큰 로드 실패: {e}")
        
        return False
    
    def save_token_to_file(self):
        """토큰을 BE 폴더에 저장"""
        try:
            token_data = {
                'access_token': self.access_token,
                'expires_at': self.token_expires_at.isoformat(),
                'created_at': datetime.now().isoformat()
            }
            
            # BE 폴더에 저장
            token_file = "../../BE/kis_rest_token.json"
            
            with open(token_file, 'w', encoding='utf-8') as f:
                json.dump(token_data, f, ensure_ascii=False, indent=2)
                
            logger.info(f"💾 토큰이 {token_file}에 저장되었습니다.")
            
        except Exception as e:
            logger.error(f"❌ 토큰 저장 실패: {e}")
    
    def authenticate(self) -> bool:
        """KIS REST API 인증 (토큰 재사용)"""
        try:
            # 1. 기존 토큰이 유효한지 확인
            if self.is_access_token_valid():
                logger.info("✅ 기존 토큰이 유효합니다. 재사용합니다.")
                return True
            
            # 2. BE 폴더에서 기존 토큰 확인
            if self.load_existing_token():
                if self.is_access_token_valid():
                    logger.info("✅ 파일에서 로드한 토큰이 유효합니다.")
                    return True
            
            # 3. 새 토큰 발급 (필요시에만)
            logger.info("�� 새로운 access token 발급이 필요합니다...")
            
            # 토큰 발급 요청
            headers = {"Content-Type": "application/json"}
            body = {
                "grant_type": "client_credentials",
                "appkey": self.kis_config['app_key'],
                "appsecret": self.kis_config['app_secret']
            }
            
            response = requests.post(self.token_url, headers=headers, json=body)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                expires_in = data.get('expires_in', 86400)
                
                # 토큰 만료 시간 설정 (23시간으로 보수적 설정)
                self.token_expires_at = datetime.now() + timedelta(hours=23)
                
                # 토큰을 BE 폴더에 저장
                self.save_token_to_file()
                
                logger.info("✅ 새로운 KIS access token 발급 및 저장 완료")
                logger.info(f"⏰ 토큰 만료 시간: {self.token_expires_at}")
                return True
            else:
                logger.error(f"❌ 토큰 발급 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 인증 실패: {e}")
            return False
    
    def is_access_token_valid(self) -> bool:
        """access token 유효성 검사 (더 보수적)"""
        if not self.access_token or not self.token_expires_at:
            return False
        
        # 만료 시간 1시간 전에 갱신 (더 보수적)
        return datetime.now() < (self.token_expires_at - timedelta(hours=1))
    
    def connect_db(self) -> bool:
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
    
    def fetch_minute_data(self, stock_code: str, interval_type: str, days: int = 30) -> Optional[pd.DataFrame]:
        """KIS REST API로 분봉 데이터 조회"""
        interval_config = self.interval_configs.get(interval_type)
        if not interval_config:
            logger.error(f"❌ 지원하지 않는 분봉 타입: {interval_type}")
            return None
        
        try:
            # 토큰 유효성 확인 및 갱신
            if not self.is_access_token_valid():
                if not self.authenticate():
                    logger.error("❌ 인증 실패로 분봉 데이터 조회 불가")
                    return None
            
            # KIS REST API 헤더 구성
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.access_token}",
                "appkey": self.kis_config['app_key'],
                "appsecret": self.kis_config['app_secret'],
                "tr_id": "FHKST03010200"  # 거래ID (국내주식분봉차트조회)
            }
            
            # 파라미터 구성
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",  # 주식
                "FID_INPUT_ISCD": stock_code,  # 종목코드
                "FID_INPUT_HOUR_1": "",  # 시작시간 (HHMMSS) - 빈 값으로 설정
                "FID_PW_DATA_INCU_YN": "Y",  # 과거데이터포함여부
                "FID_ETC_CLS_CODE": interval_config['code']  # 분봉구분 (01, 05, 15)
            }
            
            logger.info(f"🔍 {stock_code} {interval_type} 데이터 요청 중...")
            logger.info(f"📅 분봉구분: {interval_config['code']}")
            logger.info(f"�� API URL: {self.minute_data_url}")
            logger.info(f"📋 파라미터: {params}")
            
            response = requests.get(self.minute_data_url, headers=headers, params=params)
            logger.info(f"📡 API 응답 상태: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"📊 API 응답: {data}")
                
                if data.get('rt_cd') == '0':
                    return self.parse_minute_data(data.get('output2', []), interval_type)
                else:
                    logger.error(f"❌ API 호출 실패 {stock_code} {interval_type}: {data}")
                    return None
            else:
                logger.error(f"❌ HTTP 오류 {stock_code} {interval_type}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ 분봉 데이터 조회 실패 {stock_code} {interval_type}: {e}")
            return None
    
    def parse_minute_data(self, raw_data: List[Dict], interval_type: str) -> pd.DataFrame:
        """API 응답 데이터를 DataFrame으로 변환 (수정된 시간 파싱)"""
        logger.debug(f"🔍 파싱 시작: {interval_type}, 원본 데이터 {len(raw_data)}건")
        
        if not raw_data:
            logger.warning(f"⚠️ {interval_type}: 원본 데이터가 비어있습니다.")
            return pd.DataFrame()
        
        records = []
        for idx, item in enumerate(raw_data):
            try:
                logger.debug(f"🔍 {idx+1}/{len(raw_data)} 데이터 파싱: {item}")
                
                # 날짜와 시간 파싱 (수정된 로직)
                date_str = item.get('stck_bsop_date', '')  # 20250826
                time_str = item.get('stck_cntg_hour', '')  # 153000
                
                logger.debug(f"�� 날짜: {date_str}, 시간: {time_str}")
                
                if len(date_str) == 8 and len(time_str) == 6:
                    # 20250826 + 153000 → 2025-08-26 15:30:00
                    datetime_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]} {time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}"
                    timestamp = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
                    logger.debug(f"✅ 시간 파싱 성공: {timestamp}")
                else:
                    logger.warning(f"⚠️ 날짜/시간 형식 불일치: date={date_str}, time={time_str}")
                    continue
                
                # 가격 데이터 파싱
                open_price = float(item.get('stck_oprc', 0))
                high_price = float(item.get('stck_hgpr', 0))
                low_price = float(item.get('stck_lwpr', 0))
                close_price = float(item.get('stck_prpr', 0))
                volume = int(item.get('cntg_vol', 0))
                
                logger.debug(f"💰 가격 데이터: O={open_price}, H={high_price}, L={low_price}, C={close_price}, V={volume}")
                
                record = {
                    'timestamp': timestamp,
                    'open_price': open_price,
                    'high_price': high_price,
                    'low_price': low_price,
                    'close_price': close_price,
                    'volume': volume
                }
                records.append(record)
                
            except (ValueError, TypeError) as e:
                logger.error(f"❌ 데이터 파싱 실패 {idx+1}/{len(raw_data)}: {item}, 오류: {e}")
                continue
        
        df = pd.DataFrame(records)
        logger.info(f"�� {interval_type} 파싱 완료: {len(records)}건 → DataFrame {len(df)}건")
        
        if not df.empty:
            df = df.sort_values('timestamp').reset_index(drop=True)
            logger.debug(f"📈 정렬된 데이터 샘플: {df.head()}")
        
        return df
    
    def save_minute_data(self, stock_code: str, df: pd.DataFrame, interval_type: str) -> int:
        """분봉 데이터를 데이터베이스에 저장"""
        if df.empty:
            logger.warning(f"⚠️ {stock_code} {interval_type}: 저장할 데이터가 없습니다.")
            return 0
        
        try:
            logger.info(f"💾 {stock_code} {interval_type} 데이터 저장 시작 - {len(df)}건")
            
            # interval_type을 minute_interval enum 값으로 변환
            interval_mapping = {
                '1min': 'ONE_MINUTE',
                '5min': 'FIVE_MINUTES', 
                '15min': 'FIFTEEN_MINUTES'
            }
            minute_interval = interval_mapping.get(interval_type, 'FIFTEEN_MINUTES')
            
            # 기존 데이터 삭제
            delete_query = """
            DELETE FROM stock_minute_prices 
            WHERE stock_symbol = %s AND minute_interval = %s
            """
            logger.info(f"🗑️ 기존 데이터 삭제 쿼리: {delete_query}")
            logger.info(f"🗑️ 삭제 파라미터: stock_symbol={stock_code}, minute_interval={minute_interval}")
            
            self.cursor.execute(delete_query, (stock_code, minute_interval))
            deleted_count = self.cursor.rowcount
            logger.info(f"🗑️ 삭제된 기존 데이터: {deleted_count}건")
            
            # 새 데이터 삽입 (테이블 구조에 맞게)
            insert_query = """
            INSERT INTO stock_minute_prices 
            (stock_symbol, timestamp, minute_interval, open_price, high_price, low_price, close_price, volume, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            logger.info(f"💾 삽입 쿼리: {insert_query}")
            
            inserted_count = 0
            failed_count = 0
            
            for idx, (_, row) in enumerate(df.iterrows()):
                try:
                    values = (
                        stock_code,
                        row['timestamp'],
                        minute_interval,
                        row['open_price'],
                        row['high_price'],
                        row['low_price'],
                        row['close_price'],
                        row['volume']
                    )
                    
                    logger.debug(f"💾 {idx+1}/{len(df)} 데이터 삽입: {values}")
                    self.cursor.execute(insert_query, values)
                    inserted_count += 1
                    
                    # 100건마다 중간 커밋
                    if inserted_count % 100 == 0:
                        self.connection.commit()
                        logger.info(f"💾 중간 커밋 완료: {inserted_count}건")
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(f"❌ 데이터 삽입 실패 {stock_code} {row['timestamp']}: {e}")
                    continue
            
            # 최종 커밋
            logger.info(f"💾 최종 커밋 시작: 총 {inserted_count}건, 실패 {failed_count}건")
            self.connection.commit()
            logger.info(f"✅ {stock_code} {interval_type} 데이터 {inserted_count}건 저장 완료")
            
            # 저장된 데이터 즉시 확인
            self.verify_saved_data(stock_code, interval_type, inserted_count)
            
            return inserted_count
            
        except Exception as e:
            logger.error(f"❌ DB 저장 실패 {stock_code} {interval_type}: {e}")
            self.connection.rollback()
            return 0
    
    def verify_saved_data(self, stock_code: str, interval_type: str, expected_count: int):
        """저장된 데이터 즉시 확인"""
        try:
            # interval_type을 minute_interval enum 값으로 변환
            interval_mapping = {
                '1min': 'ONE_MINUTE',
                '5min': 'FIVE_MINUTES', 
                '15min': 'FIFTEEN_MINUTES'
            }
            minute_interval = interval_mapping.get(interval_type, 'FIFTEEN_MINUTES')
            
            verify_query = """
            SELECT COUNT(*) as saved_count 
            FROM stock_minute_prices 
            WHERE stock_symbol = %s AND minute_interval = %s
            """
            
            self.cursor.execute(verify_query, (stock_code, minute_interval))
            result = self.cursor.fetchone()
            actual_count = result[0] if result else 0
            
            if actual_count == expected_count:
                logger.info(f"✅ 데이터 검증 성공: {stock_code} {interval_type} - 예상 {expected_count}건, 실제 {actual_count}건")
            else:
                logger.warning(f"⚠️ 데이터 검증 불일치: {stock_code} {interval_type} - 예상 {expected_count}건, 실제 {actual_count}건")
                
                # 상세 데이터 확인
                detail_query = """
                SELECT timestamp, open_price, close_price, volume 
                FROM stock_minute_prices 
                WHERE stock_symbol = %s AND minute_interval = %s 
                ORDER BY timestamp DESC 
                LIMIT 5
                """
                
                self.cursor.execute(detail_query, (stock_code, minute_interval))
                recent_data = self.cursor.fetchall()
                logger.info(f"�� 최근 저장된 데이터 샘플: {recent_data}")
                
        except Exception as e:
            logger.error(f"❌ 데이터 검증 실패: {e}")
    
    def check_table_exists(self):
        """테이블 존재 여부 확인"""
        try:
            check_query = """
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = %s AND table_name = 'stock_minute_prices'
            """
            
            self.cursor.execute(check_query, (self.db_config['database'],))
            result = self.cursor.fetchone()
            table_exists = result[0] > 0 if result else False
            
            if table_exists:
                logger.info("✅ stock_minute_prices 테이블이 존재합니다.")
                
                # 테이블 구조 확인
                desc_query = "DESCRIBE stock_minute_prices"
                self.cursor.execute(desc_query)
                columns = self.cursor.fetchall()
                logger.info(f"📋 테이블 구조: {columns}")
                
            else:
                logger.error("❌ stock_minute_prices 테이블이 존재하지 않습니다!")
                logger.error("❌ Spring Boot 서버를 실행하여 테이블을 생성해주세요.")
                
            return table_exists
            
        except Exception as e:
            logger.error(f"❌ 테이블 확인 실패: {e}")
            return False
    
    def collect_single_stock_data(self, stock_code: str) -> Dict:
        """단일 종목의 모든 분봉 데이터 수집"""
        result = {
            'stock_code': stock_code,
            '1min_inserted': 0,
            '5min_inserted': 0,
            '15min_inserted': 0,
            'errors': []
        }
        
        try:
            # 1분봉 데이터 수집
            df_1min = self.fetch_minute_data(stock_code, '1min', 30)
            if df_1min is not None and not df_1min.empty:
                result['1min_inserted'] = self.save_minute_data(stock_code, df_1min, '1min')
                logger.info(f"�� {stock_code} 1분봉 {result['1min_inserted']}건 처리 완료")
            
            time.sleep(0.5)  # API 호출 간격
            
            # 5분봉 데이터 수집
            df_5min = self.fetch_minute_data(stock_code, '5min', 30)
            if df_5min is not None and not df_5min.empty:
                result['5min_inserted'] = self.save_minute_data(stock_code, df_5min, '5min')
                logger.info(f"�� {stock_code} 5분봉 {result['5min_inserted']}건 처리 완료")
            
            time.sleep(0.5)
            
            # 15분봉 데이터 수집
            df_15min = self.fetch_minute_data(stock_code, '15min', 30)
            if df_15min is not None and not df_15min.empty:
                result['15min_inserted'] = self.save_minute_data(stock_code, df_15min, '15min')
                logger.info(f"📅 {stock_code} 15분봉 {result['15min_inserted']}건 처리 완료")
            
            time.sleep(0.5)
            
        except Exception as e:
            error_msg = f"❌ {stock_code} 처리 실패: {e}"
            logger.error(error_msg)
            result['errors'].append(error_msg)
        
        return result
    
    def collect_all_stock_data(self) -> List[Dict]:
        """모든 종목의 분봉 데이터 수집"""
        start_time = time.time()
        
        logger.info("�� 1개 종목 분봉 데이터 수집 시작!")
        logger.info(f"�� 수집할 분봉: 1분봉, 5분봉, 15분봉")
        logger.info(f"📅 수집 기간: 최근 30일")
        logger.info(f"🔑 REST API 키: {self.kis_config['app_key'][:10]}...")
        logger.info(f"🌐 API URL: {self.base_url}")
        
        total_results = []
        
        # 진행률 표시와 함께 수집
        for stock_code in tqdm(self.stock_list, desc="📊 종목별 분봉 데이터 수집"):
            try:
                result = self.collect_single_stock_data(stock_code)
                total_results.append(result)
                
                # API 할당량 고려하여 대기
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ {stock_code} 처리 중 예외 발생: {e}")
                continue
        
        # 최종 결과 요약
        end_time = time.time()
        processing_time = end_time - start_time
        
        total_1min = sum(r['1min_inserted'] for r in total_results)
        total_5min = sum(r['5min_inserted'] for r in total_results)
        total_15min = sum(r['15min_inserted'] for r in total_results)
        total_errors = sum(len(r['errors']) for r in total_results)
        
        logger.info("=" * 60)
        logger.info("🏁 분봉 데이터 수집 완료!")
        logger.info(f"⏱️  총 처리 시간: {processing_time:.2f}초")
        logger.info(f"�� 처리된 종목: {len(total_results)}개")
        logger.info(f"📈 1분봉 데이터: {total_1min:,}건")
        logger.info(f"📊 5분봉 데이터: {total_5min:,}건")
        logger.info(f"📅 15분봉 데이터: {total_15min:,}건")
        logger.info(f"❌ 에러: {total_errors}건")
        logger.info("=" * 60)
        
        return total_results

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
    
    # 데이터 수집기 생성
    collector = KISMinuteDataCollector(db_config)
    
    # 데이터베이스 연결
    if not collector.connect_db():
        logger.error("❌ 데이터베이스 연결 실패")
        return
    
    try:
        # 테이블 존재 여부 확인
        if not collector.check_table_exists():
            logger.error("❌ stock_minute_prices 테이블이 존재하지 않습니다.")
            logger.error("❌ Spring Boot 서버를 실행하여 테이블을 생성해주세요.")
            return
        
        # KIS REST API 인증
        if not collector.authenticate():
            logger.error("❌ KIS REST API 인증 실패")
            return
        
        # 모든 종목의 분봉 데이터 수집
        results = collector.collect_all_stock_data()
        
        # 결과를 JSON 파일로 저장
        with open('minute_data_collection_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2, default=str)
        
        logger.info("�� 수집 결과가 minute_data_collection_results.json 파일에 저장되었습니다.")
        
    except Exception as e:
        logger.error(f"❌ 전체 수집 실패: {e}")
    
    finally:
        # 데이터베이스 연결 해제
        collector.disconnect_db()

if __name__ == "__main__":
    main()