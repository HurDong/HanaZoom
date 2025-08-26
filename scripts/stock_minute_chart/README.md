# 주식 분봉 데이터 수집 시스템

KIS REST API를 활용하여 주식의 1분봉, 5분봉, 15분봉 데이터를 수집하고 MySQL 데이터베이스에 저장하는 시스템입니다.

## 📁 파일 구조

```
stock_minute_chart/
├── fetch_minute_data.py      # 초기 분봉 데이터 수집 (1회성)
├── realtime_updater.py       # 실시간 분봉 데이터 업데이트 스케줄러
├── README.md                 # 이 파일
└── requirements.txt          # 필요한 Python 패키지
```

## 🚀 주요 기능

### 1. 초기 데이터 수집 (`fetch_minute_data.py`)

- **97개 주요 종목**의 분봉 데이터 수집
- **1분봉, 5분봉, 15분봉** 모두 지원
- **최근 30일** 데이터 수집
- **진행률 표시** 및 상세 로깅
- **KIS REST API 토큰 자동 관리** (24시간 재사용)

### 2. 실시간 업데이트 (`realtime_updater.py`)

- **거래시간 자동 감지** (09:00~15:30)
- **스케줄러 기반** 자동 업데이트
- **실시간 캔들** 구성 및 저장
- **활성 종목 30개** 우선 처리

## 📋 사전 요구사항

### 1. KIS API 키 설정

**BE 폴더에 `.env` 파일 생성:**

```bash
# BE/.env
KIS_APP_KEY=your_kis_rest_api_key
KIS_APP_SECRET=your_kis_rest_api_secret
KIS_ACCOUNT_CODE=your_account_code
KIS_PRODUCT_CODE=your_product_code
```

### 2. 데이터베이스 설정

- **Docker MySQL** 실행 중
- **`hanazoom`** 데이터베이스 존재
- **`stock_minute_prices`** 테이블 생성됨 (Spring Boot JPA로 자동 생성)

### 3. Python 환경

- Python 3.8+
- **가상환경 (venv)** 사용 권장

## 🛠️ 설치 및 설정

### 1. 가상환경 생성 및 활성화

```bash
# scripts 폴더에서 가상환경 생성
cd scripts
python -m venv venv

# 가상환경 활성화 (Git Bash)
source venv/Scripts/activate

# 가상환경 활성화 (Windows CMD)
venv\Scripts\activate

# 가상환경 활성화 (PowerShell)
venv\Scripts\Activate.ps1
```

### 2. 패키지 설치

```bash
# 가상환경 활성화 후
cd stock_minute_chart
pip install -r requirements.txt

# 또는 개별 설치
pip install requests pandas mysql-connector-python tqdm schedule
```

### 3. 데이터베이스 테이블 생성

**Spring Boot 서버 실행으로 자동 생성:**

```bash
# IntelliJ에서 Spring Boot 서버 실행
# application.properties 설정:
# spring.jpa.hibernate.ddl-auto=update
```

**테이블 구조:**

```sql
CREATE TABLE stock_minute_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    stock_symbol VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL,
    minute_interval ENUM('ONE_MINUTE','FIVE_MINUTES','FIFTEEN_MINUTES') NOT NULL,
    open_price DECIMAL(15,2) NOT NULL,
    high_price DECIMAL(15,2) NOT NULL,
    low_price DECIMAL(15,2) NOT NULL,
    close_price DECIMAL(15,2) NOT NULL,
    volume BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_stock_interval (stock_symbol, minute_interval),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;
```

## 📊 사용 방법

### 1. 초기 데이터 수집 (1회성)

```bash
# 가상환경 활성화 확인
source venv/Scripts/activate  # Git Bash
# 또는
venv\Scripts\activate         # Windows CMD

# 97개 종목의 30일치 분봉 데이터 수집
python fetch_minute_data.py
```

**예상 소요 시간**: 2-3시간  
**수집 데이터**: 약 300만 건 (97종목 × 30일 × 3분봉 × 26건)

**주요 로그:**

```
✅ 데이터베이스 연결 성공
✅ KIS 환경변수 로드 완료
✅ BE 폴더에서 기존 토큰 로드: 만료시간 2024-08-27 23:00:00
📊 97개 종목 분봉 데이터 수집 시작!
📊 종목별 분봉 데이터 수집: 100%|██████████| 97/97 [02:30<00:00]
✅ 005930 1분봉 데이터 780건 저장 완료
```

### 2. 실시간 업데이트 시작

```bash
# 가상환경 활성화 후
python realtime_updater.py
```

**업데이트 주기:**

- 1분봉: 매 1분마다
- 5분봉: 매 5분마다
- 15분봉: 매 15분마다

### 3. 백그라운드 실행

```bash
# 백그라운드에서 실행
nohup python realtime_updater.py > updater.log 2>&1 &

# 로그 확인
tail -f updater.log

# 프로세스 종료
pkill -f realtime_updater.py
```

## 📈 데이터 구조

### 1. 수집되는 데이터

```python
{
    'stock_symbol': '005930',           # 종목코드
    'timestamp': '2024-08-27 15:30:00', # 시간
    'minute_interval': 'ONE_MINUTE',    # 분봉 타입 (ENUM)
    'open_price': 75000.0,             # 시가
    'high_price': 75200.0,             # 고가
    'low_price': 74800.0,              # 저가
    'close_price': 75100.0,            # 종가
    'volume': 1250000                  # 거래량
}
```

### 2. 분봉 타입별 특징

- **1분봉 (ONE_MINUTE)**: 가장 세밀한 가격 변동, 실시간 차트용
- **5분봉 (FIVE_MINUTES)**: 중기 트렌드 분석, 스윙 트레이딩용
- **15분봉 (FIFTEEN_MINUTES)**: 장기 트렌드 분석, 포지션 트레이딩용

## 🔧 설정 옵션

### 1. 종목 리스트 수정

```python
# fetch_minute_data.py에서 수정
self.stock_list = [
    '005930', '000660', '035420',  # 삼성전자, SK하이닉스, NAVER
    # ... 더 많은 종목 추가 가능
]
```

### 2. 업데이트 주기 조정

```python
# realtime_updater.py에서 수정
schedule.every(2).minutes.do(self.update_1min_data)    # 2분마다
schedule.every(10).minutes.do(self.update_5min_data)   # 10분마다
schedule.every(30).minutes.do(self.update_15min_data)  # 30분마다
```

### 3. 데이터베이스 설정

```python
# fetch_minute_data.py의 main() 함수에서 수정
db_config = {
    'host': 'localhost',           # Docker MySQL
    'user': 'hanazoom_user',      # application.properties와 동일
    'password': 'hanazoom1234!',  # application.properties와 동일
    'database': 'hanazoom',
    'charset': 'utf8mb4',
    'autocommit': False
}
```

## 📊 모니터링 및 로그

### 1. 로그 파일

- `minute_data_collection.log`: 초기 수집 로그
- `realtime_updater.log`: 실시간 업데이트 로그

### 2. 결과 파일

- `minute_data_collection_results.json`: 초기 수집 결과 요약
- `../../BE/kis_rest_token.json`: KIS REST API 토큰 (자동 생성)

### 3. 주요 로그 메시지

```
✅ 데이터베이스 연결 성공
✅ stock_minute_prices 테이블이 존재합니다.
✅ KIS 환경변수 로드 완료
✅ BE 폴더에서 기존 토큰 로드: 만료시간 2024-08-27 23:00:00
📊 005930 1분봉 데이터 780건 처리 완료
💾 005930 1min 데이터 780건 저장 완료
✅ 데이터 검증 성공: 005930 1min - 예상 780건, 실제 780건
```

## ⚠️ 주의사항

### 1. API 할당량

- **일 100만 건** 할당량 고려
- **초기 수집**: 291회 API 호출 (97종목 × 3분봉)
- **실시간 업데이트**: 시간당 약 100회 API 호출

### 2. 거래시간

- **거래시간**: 09:00 ~ 15:30 (평일)
- **비거래시간**: 자동으로 업데이트 중단
- **주말**: 업데이트 중단

### 3. 토큰 관리

- **REST API 토큰**: 24시간 유효, 자동 재사용
- **토큰 파일**: `../../BE/kis_rest_token.json`에 저장
- **토큰 갱신**: 만료 1시간 전에 자동 발급

## 🚨 문제 해결

### 1. 가상환경 문제

```bash
# 가상환경 경로 확인
ls -la venv/Scripts/

# 가상환경 재생성
rm -rf venv
python -m venv venv
source venv/Scripts/activate
```

### 2. KIS API 인증 실패

```bash
# BE/.env 파일 확인
cat ../../BE/.env

# 토큰 파일 확인
cat ../../BE/kis_rest_token.json

# 수동 토큰 발급 테스트
curl -X POST "https://openapivts.koreainvestment.com:29443/oauth2/tokenP" \
  -H "content-type: application/json" \
  -d '{"grant_type":"client_credentials","appkey":"YOUR_KEY","appsecret":"YOUR_SECRET"}'
```

### 3. 데이터베이스 연결 실패

```bash
# Docker MySQL 상태 확인
docker ps | grep mysql

# 연결 테스트
docker exec -it [mysql_container] mysql -u hanazoom_user -phanazoom1234! -e "USE hanazoom; SELECT 1;"

# 테이블 존재 확인
docker exec -it [mysql_container] mysql -u hanazoom_user -phanazoom1234! -e "USE hanazoom; DESCRIBE stock_minute_prices;"
```

### 4. 메모리 부족

```bash
# Python 프로세스 메모리 사용량 확인
ps aux | grep python

# 시스템 메모리 확인
free -h
```

## 📈 성능 최적화

### 1. 배치 처리

- **벌크 인서트**: 여러 건을 한 번에 저장
- **커넥션 풀링**: DB 연결 재사용
- **인덱스 최적화**: 쿼리 성능 향상

### 2. 캐싱 전략

- **Redis 캐시**: 실시간 데이터 빠른 접근
- **메모리 캐시**: 자주 사용되는 데이터
- **디스크 캐시**: 대용량 히스토리 데이터

### 3. 비동기 처리

- **멀티스레딩**: 여러 종목 동시 처리
- **비동기 I/O**: 네트워크 대기 시간 최소화
- **큐 시스템**: 작업 우선순위 관리

## 🔮 향후 확장 계획

### 1. 실시간 웹소켓

- **Spring Boot WebSocket** 연동
- **프론트엔드 실시간 차트** 업데이트
- **사용자별 구독** 관리

### 2. 고급 분석

- **기술적 지표** 계산 (RSI, MACD, 이동평균)
- **패턴 인식** 알고리즘
- **예측 모델** 구축

### 3. 알림 시스템

- **가격 변동** 알림
- **거래량 급증** 알림
- **기술적 신호** 알림

## 📞 지원 및 문의

문제가 발생하거나 추가 기능이 필요한 경우:

1. **로그 파일 확인**: `minute_data_collection.log`
2. **설정 파일 검증**: `../../BE/.env`, `../../BE/kis_rest_token.json`
3. **시스템 리소스 점검**: 메모리, 디스크, 네트워크
4. **데이터베이스 상태 확인**: Docker MySQL, 테이블 구조
5. **개발팀에 문의**

---

**Happy Trading! 📈💰**
