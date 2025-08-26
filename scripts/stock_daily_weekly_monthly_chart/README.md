# Stock Chart Scripts 실행 메뉴얼

이 디렉토리는 HanaZoom 프로젝트의 주식 데이터 처리 및 차트 생성을 위한 Python 스크립트들을 포함합니다.

## 📋 사전 요구사항

### 1. Python 환경 설정

```bash
# Python 3.8+ 설치 확인
python --version

# 가상환경 생성 및 활성화
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 필요한 패키지 설치

```bash
# 필수 패키지 설치
pip install pykrx pandas tqdm tenacity mysql-connector-python

# 패키지 설명:
# - pykrx: 한국투자증권 주식 데이터 수집
# - pandas: 데이터 처리 및 분석
# - tqdm: 진행률 바 표시
# - tenacity: 재시도 로직 구현
# - mysql-connector-python: MySQL 데이터베이스 연결
```

## 🚀 스크립트 실행 가이드

### 1. `month_week_day_stock.py` - 월/주/일 주식 데이터 수집

```bash
# 기본 실행
python month_week_day_stock.py
```

**주요 기능:**

- 100개 주요 종목의 일별/주별/월별 주식 데이터 수집
- pykrx API를 통한 한국투자증권 데이터 수집
- 2010년부터 현재까지의 데이터 수집
- 멀티스레딩을 통한 동시 처리 (8개 워커)
- 자동 재시도 로직 (최대 5회)
- 결과를 `./out_krx_parallel` 폴더에 CSV 형태로 저장

**처리 과정:**

1. 일별 데이터 수집 (OHLCV)
2. 월별 데이터 수집
3. 일별 데이터를 주별로 변환 (금요일 기준)
4. 데이터 정규화 및 CSV 저장

**출력 파일:**

- `{종목코드}_D.csv`: 일별 데이터
- `{종목코드}_W.csv`: 주별 데이터
- `{종목코드}_M.csv`: 월별 데이터

### 2. `process_stock_data.py` - 수집된 데이터를 데이터베이스에 저장

```bash
# 기본 실행 (데이터베이스 연결 필요)
python process_stock_data.py
```

**주요 기능:**

- `month_week_day_stock.py`에서 생성된 CSV 파일들을 MySQL 데이터베이스에 저장
- 멀티스레딩을 통한 고성능 데이터 처리
- 벌크 인서트를 통한 대용량 데이터 처리 (배치 크기: 1000)
- 100개 주요 종목의 상세 정보 포함
- 스레드 안전성을 위한 락(Lock) 구현

**데이터베이스 설정:**

- MySQL 연결 필요
- `db_config` 딕셔너리에서 연결 정보 설정
- 테이블 구조: 주식 코드, 날짜, 시가/고가/저가/종가/거래량

## 📊 실행 결과 확인

### 1. 로그 파일 모니터링

```bash
# 데이터 수집 로그 (month_week_day_stock.py)
tail -f stock_data_collection.log

# 데이터 처리 로그 (process_stock_data.py)
tail -f stock_data_processing.log

# 에러 로그만 확인
grep "ERROR" stock_data_collection.log
grep "ERROR" stock_data_processing.log

# 특정 종목 로그 확인
grep "005930" stock_data_collection.log
```

### 2. 결과 파일 확인

```bash
# 생성된 CSV 파일들 확인
ls -la ./out_krx_parallel/

# 특정 종목의 데이터 확인
head -5 ./out_krx_parallel/005930_D.csv  # 삼성전자 일별 데이터

# 처리 결과 JSON 파일
cat processing_results.json
```

## ⚠️ 주의사항

### 1. 실행 전 체크리스트

- [ ] 가상환경이 활성화되어 있는지 확인
- [ ] 필요한 패키지가 설치되어 있는지 확인
- [ ] MySQL 데이터베이스가 실행 중인지 확인 (`docker-compose ps`)
- [ ] 데이터베이스 연결 정보가 올바른지 확인 (hanazoom_user/hanazoom1234!)
- [ ] 충분한 디스크 공간이 있는지 확인
- [ ] `./out_krx_parallel` 폴더가 존재하는지 확인

### 2. 에러 처리

```bash
# 메모리 부족 에러 시
export PYTHONOPTIMIZE=1

# 권한 에러 시
chmod +x *.py

# pykrx API 차단 시
# MAX_WORKERS 값을 6-8에서 3-4로 줄이기
```

## 🔧 설정 및 커스터마이징

### 1. 데이터베이스 설정

```python
# process_stock_data.py 파일에서 db_config 설정
db_config = {
    'host': 'localhost',
    'port': 3306,
    'database': 'hanazoom',
    'user': 'hanazoom_user',
    'password': 'hanazoom1234!'
}
```

**참고: application.properties의 설정값**

- 데이터베이스: `hanazoom`
- 사용자: `hanazoom_user`
- 비밀번호: `hanazoom1234!`
- 포트: `3306`

**Docker Compose 환경에서 실행 시:**

- 호스트: `localhost` (또는 Docker 컨테이너 IP)
- 데이터베이스가 실행 중인지 확인: `docker-compose ps`

### 2. 수집 대상 종목 변경

```python
# month_week_day_stock.py에서 CODES 리스트 수정
CODES = [
    "005930",  # 삼성전자
    "000660",  # SK하이닉스
    # ... 추가/제거할 종목들
]
```

### 3. 수집 기간 변경

```python
# month_week_day_stock.py에서 START, END 값 수정
START = "20200101"  # 2020년부터
END = "20241231"    # 2024년까지
```

## 📈 실행 순서 및 모니터링

### 1. 실행 순서

```bash
# 1단계: 주식 데이터 수집
python month_week_day_stock.py

# 2단계: 수집된 데이터를 데이터베이스에 저장
python process_stock_data.py
```

### 2. 실행 상태 확인

```bash
# 프로세스 상태 확인
ps aux | grep python

# 메모리 사용량 확인
top -p $(pgrep -f month_week_day_stock.py)

# 진행률 확인 (month_week_day_stock.py 실행 시)
# tqdm을 통한 진행률 바 표시
```

### 2. 로그 레벨 조정

```python
# month_week_day_stock.py에서 로그 레벨 변경
logging.basicConfig(
    level=logging.DEBUG,  # INFO → DEBUG로 변경
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_data_collection.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
```

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. pykrx API 차단/오류

```python
# month_week_day_stock.py에서 MAX_WORKERS 값 줄이기
MAX_WORKERS = 4  # 8에서 4로 줄이기

# 재시도 간격 늘리기
sleep(0.1)  # 0.05에서 0.1로 늘리기

# tenacity 재시도 설정 조정
@retry(wait=wait_exponential(multiplier=1, min=1, max=10), stop=stop_after_attempt(3))
```

#### 2. 데이터베이스 연결 실패

```bash
# 연결 테스트
python -c "import mysql.connector; print('DB 연결 성공')"

# 연결 정보 확인
# process_stock_data.py의 db_config 딕셔너리 확인

# Docker 환경에서 데이터베이스 상태 확인
docker-compose ps mysql
docker-compose logs mysql

# MySQL 클라이언트로 직접 연결 테스트
mysql -h localhost -P 3306 -u hanazoom_user -p hanazoom
```

#### 3. 파일 권한 문제

```bash
# 실행 권한 부여
chmod +x *.py

# 파일 소유권 확인
ls -la *.py
```

#### 4. 메모리 부족

```python
# process_stock_data.py에서 배치 크기 줄이기
self.batch_size = 500  # 1000에서 500으로 줄이기
```

## 📞 지원 및 문의

문제가 발생하거나 추가 도움이 필요한 경우:

1. 로그 파일을 확인하여 에러 메시지 파악
2. 실행 환경 및 설정 정보 확인
3. 개발팀에 이슈 리포트 작성

## 📚 추가 정보

### 파일 구조

```
scripts/stock_chart/
├── month_week_day_stock.py      # 주식 데이터 수집 스크립트
├── process_stock_data.py        # 데이터베이스 저장 스크립트
├── stock_data_collection.log    # 데이터 수집 로그
├── stock_data_processing.log    # 데이터 처리 로그
├── processing_results.json       # 처리 결과 요약
├── out_krx_parallel/            # 생성된 CSV 파일들
└── venv/                        # Python 가상환경
```

### 주요 특징

- **자동화**: 100개 종목의 대량 데이터 자동 수집
- **안정성**: 재시도 로직과 에러 처리
- **성능**: 멀티스레딩을 통한 병렬 처리
- **모니터링**: 상세한 로깅과 진행률 표시

---

**마지막 업데이트:** 2024년 12월
**버전:** 1.0.0
