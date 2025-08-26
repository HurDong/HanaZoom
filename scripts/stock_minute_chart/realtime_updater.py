#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
실시간 분봉 데이터 업데이트 스케줄러
KIS API에서 실시간 데이터를 주기적으로 수집하여 데이터베이스 업데이트
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
import schedule
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import threading

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('realtime_updater.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RealtimeMinuteUpdater:
    def __init__(self, db_config: Dict, kis_config: Dict):
        self.db_config = db_config
        self.kis_config = kis_config
        self.connection = None
        self.cursor = None
        self.access_token = None
        self.app_key = kis_config.get('approvalKey')
        self.app_secret = kis_config.get('accessToken')
        self.is_running = False
        
        # 활성 종목 리스트 (거래량 상위 30개)
        self.active_stocks = [
            '005930', '000660', '035420', '035720', '051910', '006400', '033780', '003550', '012330', '017670',
            '090430', '009830', '012450', '010140', '088350', '034020', '003490', '028260', '066570', '009150',
            '096770', '024110', '316140', '011200', '010130', '055550', '030200', '011170', '004990', '336260'
        ]
        
        # 분봉 타입별 설정
        self.interval_configs = {
            '1min': {'code': '1', 'name': '1분봉', 'update_interval': 1},
            '5min': {'code': '5', 'name': '5분봉', 'update_interval': 5},
            '15min': {'code': '15', 'name': '15분봉', 'update_interval': 15}
        }
        
        # API 엔드포인트
        self.base_url = "https://openapi.koreainvestment.com:9443"
        self.auth_url = f"{self.base_url}/oauth2/tokenP"
        self.minute_data_url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-series"
        
        # 실시간 캔들 데이터 저장소
        self.realtime_candles = {}
        
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
    
    def authenticate(self) -> bool:
        """KIS API 인증 토큰 발급"""
        try:
            headers = {"content-type": "application/json"}
            body = {
                "grant_type": "client_credentials",
                "appkey": self.app_key,
                "appsecret": self.app_secret
            }
            
            response = requests.post(self.auth_url, headers=headers, data=json.dumps(body))
            result = response.json()
            
            if 'access_token' in result:
                self.access_token = result['access_token']
                logger.info("✅ KIS API 인증 성공")
                return True
            else:
                logger.error(f"❌ KIS API 인증 실패: {result}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 인증 과정에서 오류 발생: {e}")
            return False
    
    def is_trading_time(self) -> bool:
        """현재가 거래 시간인지 확인"""
        now = datetime.now()
        
        # 주말 체크
        if now.weekday() >= 5:
            return False
        
        # 거래 시간 체크 (09:00 ~ 15:30)
        current_time = now.time()
        trading_start = datetime.strptime('09:00', '%H:%M').time()
        trading_end = datetime.strptime('15:30', '%H:%M').time()
        
        return trading_start <= current_time <= trading_end
    
    def get_current_minute_boundary(self, interval_type: str) -> datetime:
        """현재 분봉 경계 시간 계산"""
        now = datetime.now()
        
        if interval_type == '1min':
            return now.replace(second=0, microsecond=0)
        elif interval_type == '5min':
            minute = (now.minute // 5) * 5
            return now.replace(minute=minute, second=0, microsecond=0)
        elif interval_type == '15min':
            minute = (now.minute // 15) * 15
            return now.replace(minute=minute, second=0, microsecond=0)
        else:
            return now.replace(second=0, microsecond=0)
    
    def fetch_latest_minute_data(self, stock_code: str, interval_type: str) -> Optional[Dict]:
        """최신 분봉 데이터 조회"""
        if not self.access_token:
            if not self.authenticate():
                return None
        
        interval_config = self.interval_configs.get(interval_type)
        if not interval_config:
            return None
        
        try:
            headers = {
                "Content-Type": "application/json",
                "authorization": f"Bearer {self.access_token}",
                "appKey": self.app_key,
                "appSecret": self.app_secret,
                "tr_id": "FHKST01010100"
            }
            
            # 최근 1일 데이터만 조회 (실시간 업데이트용)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=1)
            
            params = {
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_COND_SCR_DIV_CODE": stock_code,
                "FID_INPUT_HOUR_1": interval_config['code'],
                "FID_INPUT_DATE_1": start_date.strftime("%Y%m%d"),
                "FID_INPUT_DATE_2": end_date.strftime("%Y%m%d")
            }
            
            response = requests.get(self.minute_data_url, headers=headers, params=params)
            data = response.json()
            
            if data.get('rt_cd') == '0':
                latest_data = data.get('output', [])
                if latest_data:
                    # 가장 최신 데이터 반환
                    return self.parse_latest_minute_data(latest_data[-1], interval_type)
            
            return None
                
        except Exception as e:
            logger.error(f"❌ 최신 분봉 데이터 조회 실패 {stock_code} {interval_type}: {e}")
            return None
    
    def parse_latest_minute_data(self, raw_data: Dict, interval_type: str) -> Optional[Dict]:
        """API 응답 데이터를 파싱"""
        try:
            time_str = raw_data.get('stck_cntg_hour', '')
            if len(time_str) == 12:
                timestamp = datetime.strptime(time_str, '%Y%m%d%H%M')
            else:
                return None
            
            return {
                'timestamp': timestamp,
                'open_price': float(raw_data.get('stck_oprc', 0)),
                'high_price': float(raw_data.get('stck_hgpr', 0)),
                'low_price': float(raw_data.get('stck_lwpr', 0)),
                'close_price': float(raw_data.get('stck_prpr', 0)),
                'volume': int(raw_data.get('cntg_vol', 0))
            }
            
        except (ValueError, TypeError) as e:
            logger.warning(f"⚠️ 데이터 파싱 실패: {raw_data}, 오류: {e}")
            return None
    
    def update_realtime_candle(self, stock_code: str, interval_type: str, new_data: Dict):
        """실시간 캔들 데이터 업데이트"""
        candle_key = f"{stock_code}_{interval_type}"
        
        if candle_key not in self.realtime_candles:
            # 새로운 캔들 시작
            self.realtime_candles[candle_key] = {
                'stock_code': stock_code,
                'interval_type': interval_type,
                'start_time': self.get_current_minute_boundary(interval_type),
                'open_price': new_data['open_price'],
                'high_price': new_data['high_price'],
                'low_price': new_data['low_price'],
                'close_price': new_data['close_price'],
                'volume': new_data['volume'],
                'last_update': datetime.now()
            }
        else:
            # 기존 캔들 업데이트
            candle = self.realtime_candles[candle_key]
            candle['high_price'] = max(candle['high_price'], new_data['high_price'])
            candle['low_price'] = min(candle['low_price'], new_data['low_price'])
            candle['close_price'] = new_data['close_price']
            candle['volume'] += new_data['volume']
            candle['last_update'] = datetime.now()
    
    def save_completed_candle(self, stock_code: str, interval_type: str):
        """완성된 캔들을 데이터베이스에 저장"""
        candle_key = f"{stock_code}_{interval_type}"
        
        if candle_key not in self.realtime_candles:
            return 0
        
        candle = self.realtime_candles[candle_key]
        
        try:
            # 완성된 캔들 데이터베이스에 저장
            insert_query = """
            INSERT INTO stock_minute_prices 
            (stock_symbol, timestamp, interval_type, open_price, high_price, low_price, close_price, volume, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            open_price = VALUES(open_price),
            high_price = VALUES(high_price),
            low_price = VALUES(low_price),
            close_price = VALUES(close_price),
            volume = VALUES(volume),
            updated_at = NOW()
            """
            
            values = (
                stock_code,
                candle['start_time'],
                interval_type,
                candle['open_price'],
                candle['high_price'],
                candle['low_price'],
                candle['close_price'],
                candle['volume']
            )
            
            self.cursor.execute(insert_query, values)
            self.connection.commit()
            
            logger.info(f"✅ {stock_code} {interval_type} 캔들 저장 완료: {candle['start_time']}")
            
            # 실시간 캔들 초기화
            del self.realtime_candles[candle_key]
            
            return 1
            
        except Exception as e:
            logger.error(f"❌ 캔들 저장 실패 {stock_code} {interval_type}: {e}")
            self.connection.rollback()
            return 0
    
    def update_1min_data(self):
        """1분봉 데이터 업데이트"""
        if not self.is_trading_time():
            logger.info("📅 거래 시간이 아닙니다. 1분봉 업데이트 건너뜀")
            return
        
        logger.info("⏰ 1분봉 데이터 업데이트 시작")
        
        for stock_code in self.active_stocks:
            try:
                # 최신 1분봉 데이터 조회
                latest_data = self.fetch_latest_minute_data(stock_code, '1min')
                if latest_data:
                    # 실시간 캔들 업데이트
                    self.update_realtime_candle(stock_code, '1min', latest_data)
                    
                    # 1분 경계가 지났으면 완성된 캔들 저장
                    current_boundary = self.get_current_minute_boundary('1min')
                    candle_key = f"{stock_code}_1min"
                    
                    if candle_key in self.realtime_candles:
                        candle = self.realtime_candles[candle_key]
                        if current_boundary > candle['start_time']:
                            self.save_completed_candle(stock_code, '1min')
                
                time.sleep(0.1)  # API 호출 간격 조절
                
            except Exception as e:
                logger.error(f"❌ {stock_code} 1분봉 업데이트 실패: {e}")
                continue
    
    def update_5min_data(self):
        """5분봉 데이터 업데이트"""
        if not self.is_trading_time():
            return
        
        logger.info("⏰ 5분봉 데이터 업데이트 시작")
        
        for stock_code in self.active_stocks:
            try:
                latest_data = self.fetch_latest_minute_data(stock_code, '5min')
                if latest_data:
                    self.update_realtime_candle(stock_code, '5min', latest_data)
                    
                    # 5분 경계 체크
                    current_boundary = self.get_current_minute_boundary('5min')
                    candle_key = f"{stock_code}_5min"
                    
                    if candle_key in self.realtime_candles:
                        candle = self.realtime_candles[candle_key]
                        if current_boundary > candle['start_time']:
                            self.save_completed_candle(stock_code, '5min')
                
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ {stock_code} 5분봉 업데이트 실패: {e}")
                continue
    
    def update_15min_data(self):
        """15분봉 데이터 업데이트"""
        if not self.is_trading_time():
            return
        
        logger.info("⏰ 15분봉 데이터 업데이트 시작")
        
        for stock_code in self.active_stocks:
            try:
                latest_data = self.fetch_latest_minute_data(stock_code, '15min')
                if latest_data:
                    self.update_realtime_candle(stock_code, '15min', latest_data)
                    
                    # 15분 경계 체크
                    current_boundary = self.get_current_minute_boundary('15min')
                    candle_key = f"{stock_code}_15min"
                    
                    if candle_key in self.realtime_candles:
                        candle = self.realtime_candles[candle_key]
                        if current_boundary > candle['start_time']:
                            self.save_completed_candle(stock_code, '15min')
                
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"❌ {stock_code} 15분봉 업데이트 실패: {e}")
                continue
    
    def start_scheduler(self):
        """스케줄러 시작"""
        self.is_running = True
        
        # 1분봉: 매 1분마다 업데이트
        schedule.every(1).minutes.do(self.update_1min_data)
        
        # 5분봉: 매 5분마다 업데이트
        schedule.every(5).minutes.do(self.update_5min_data)
        
        # 15분봉: 매 15분마다 업데이트
        schedule.every(15).minutes.do(self.update_15min_data)
        
        logger.info("🚀 실시간 분봉 업데이트 스케줄러 시작!")
        logger.info("📊 활성 종목: 30개")
        logger.info("⏰ 업데이트 주기: 1분봉(1분), 5분봉(5분), 15분봉(15분)")
        
        while self.is_running:
            schedule.run_pending()
            time.sleep(1)
    
    def stop_scheduler(self):
        """스케줄러 중지"""
        self.is_running = False
        logger.info("🛑 실시간 분봉 업데이트 스케줄러 중지")

def main():
    """메인 함수"""
    # 설정 파일 로드
    try:
        with open('../../kis_keys.json', 'r', encoding='utf-8') as f:
            kis_config = json.load(f)
    except FileNotFoundError:
        logger.error("❌ kis_keys.json 파일을 찾을 수 없습니다.")
        return
    except json.JSONDecodeError:
        logger.error("❌ kis_keys.json 파일 형식이 올바르지 않습니다.")
        return
    
    # 데이터베이스 연결 설정
    db_config = {
        'host': 'localhost',
        'user': 'hanazoom_user',
        'password': 'hanazoom1234!',
        'database': 'hanazoom',
        'charset': 'utf8mb4',
        'autocommit': False
    }
    
    # 실시간 업데이터 생성
    updater = RealtimeMinuteUpdater(db_config, kis_config)
    
    # 데이터베이스 연결
    if not updater.connect_db():
        logger.error("❌ 데이터베이스 연결 실패")
        return
    
    try:
        # KIS API 인증
        if not updater.authenticate():
            logger.error("❌ KIS API 인증 실패")
            return
        
        # 스케줄러 시작
        updater.start_scheduler()
        
    except KeyboardInterrupt:
        logger.info("🛑 사용자에 의해 중단됨")
    except Exception as e:
        logger.error(f"❌ 스케줄러 실행 중 오류 발생: {e}")
    finally:
        # 정리 작업
        updater.stop_scheduler()
        updater.disconnect_db()

if __name__ == "__main__":
    main()
