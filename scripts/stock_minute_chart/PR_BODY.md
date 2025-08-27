# 주식 분봉 차트 기반 시스템 구축

## 주요 구현 내용

- KIS REST API 기반 분봉 데이터 수집 (1분/5분/15분)
- 97개 종목 30일치 데이터 수집 시스템
- 실시간 업데이트 스케줄러
- Spring Boot JPA 연동 데이터베이스 스키마

## 사용 방법

```bash
cd scripts
python -m venv venv
source venv/Scripts/activate
cd stock_minute_chart
pip install -r requirements.txt
python fetch_minute_data.py
```

## 기술 스택

- Python + KIS REST API
- MySQL (Docker)
- Spring Boot JPA
- 가상환경 (venv)
