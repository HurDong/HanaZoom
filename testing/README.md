# HanaZoom Testing Suite

HanaZoom 프로젝트의 부하테스트 및 성능 분석을 위한 통합 도구 모음입니다.

## 📁 폴더 구조

```
testing/
├── gatling-charts-highcharts-bundle-3.10.5/  # Gatling 부하테스트 도구
│   ├── bin/                      # 실행 파일들
│   ├── conf/                     # 설정 파일들
│   ├── lib/                      # 라이브러리
│   ├── results/                  # 테스트 결과 (자동 생성)
│   └── user-files/               # 사용자 정의 시뮬레이션
├── scripts/                          # 부하테스트 스크립트
│   ├── run_test.bat                  # 부하테스트 실행 (자동 결과 추적)
│   └── tracker.py                    # 성능 테스트 결과 추적기
├── logs/                             # 로그 및 결과 분석
│   ├── performance_history.json      # 테스트 결과 히스토리
│   ├── analyze_logs.py               # 로그 분석 도구
│   ├── performance_monitor.py        # 실시간 성능 모니터링
│   └── monitor_backend.py            # 백엔드 모니터링
└── docs/                             # 문서
    └── TIL-2025-09-24.md             # 부하테스트 TIL
```

## 🚀 사용법

### 1. 기본 부하테스트 실행
```bash
# testing 폴더로 이동
cd testing

# 자동 추적 기능이 포함된 테스트 실행
./scripts/run_test.bat
```

### 2. 수동으로 테스트 결과 분석
```bash
# Python 스크립트 직접 실행 (JSON 기반 데이터 추출)
python scripts/tracker.py save
python scripts/tracker.py compare
python scripts/tracker.py history
```

### 3. 로그 분석
```bash
# 로그 분석 도구 실행
python logs/analyze_logs.py
```

## 🛠️ 주요 기능

### 자동 결과 추적
- 테스트 완료 시 자동으로 결과를 저장
- 이전 결과와 자동 비교
- 개선율 자동 계산
- JSON 형태로 히스토리 관리

### 성능 모니터링
- 실시간 백엔드 성능 모니터링
- 로그 자동 분석
- 성능 지표 추출 및 시각화

### 히스토리 관리
- 모든 테스트 결과 자동 저장
- 테스트별 개선 추이 추적
- 데이터 기반 성능 분석

## 📊 테스트 결과

테스트 결과는 다음과 같은 형식으로 저장됩니다:

```json
{
  "HanaZoomChatSimulation": [
    {
      "total_requests": 200,
      "response_distribution": {
        "fast_responses": 107,
        "fast_percent": 54,
        "medium_responses": 14,
        "medium_percent": 7,
        "slow_responses": 79,
        "slow_percent": 40
      },
      "timestamp": "2025-09-24T14:55:57.934581",
      "source_file": "gatling-charts-highcharts-bundle-3.10.5/results/..."
    }
  ]
}
```

## 🔧 설정

### Gatling 시뮬레이션 수정
1. `gatling/user-files/simulations/hanazoom/` 폴더에 시뮬레이션 파일 생성
2. `HanaZoomChatSimulation.scala` 파일 수정
3. 테스트 시나리오 및 파라미터 조정

### 성능 추적기 설정
- 결과 저장 경로: `logs/performance_history.json`
- 결과 파일 패턴: `../gatling/gatling-charts-highcharts-bundle-3.10.5/results/**/index.html`
- 히스토리 보관 개수: 최근 10개

## 📈 성능 개선 추적

### Phase 1: 엔티티 인덱스 설정
- Member.java와 Region.java에 @Index 어노테이션 추가
- 커넥션 풀 증설 (50개)
- 배치 사이즈 최적화 (25)

### Phase 2: 캐싱 및 비동기 처리
- Redis 캐싱 도입
- 비동기 처리 적용
- 응답 시간 50% 개선 목표

### Phase 3: 인프라 최적화
- 서버 스펙 업그레이드
- 데이터베이스 분리
- 모니터링 시스템 구축

## 📋 테스트 체크리스트

- [ ] 테스트 시나리오 정의
- [ ] 사용자 데이터 준비 (CSV)
- [ ] 테스트 실행
- [ ] 결과 자동 저장 확인
- [ ] 이전 결과와 비교
- [ ] 개선율 분석
- [ ] 병목점 파악
- [ ] 최적화 적용
- [ ] 재테스트

## 🎯 목표 성능 지표

- **평균 응답 시간**: 500ms 미만
- **95% 응답 시간**: 1,000ms 미만
- **처리량**: 100 req/sec 이상
- **실패율**: 1% 미만
- **사용자 만족도**: 90% 이상

## 🔍 문제 해결

### Gatling 테스트 실행 오류
1. Java 8 이상 설치 확인
2. 메모리 설정 확인 (-Xms1g -Xmx2g)
3. 시뮬레이션 파일 컴파일 확인

### 결과 저장 오류
1. Python 3.7 이상 설치 확인
2. 필요한 라이브러리 설치: `pip install pandas`
3. 결과 파일 경로 확인

### 성능 추적기 오류
1. `logs/performance_history.json` 파일 권한 확인
2. Python 스크립트 실행 권한 확인
3. 상대 경로 확인

## 📞 지원

부하테스트 관련 문의사항이 있으시면:
- TIL 파일 확인: `docs/TIL-2025-09-24.md`
- 로그 분석: `logs/analyze_logs.py`
- 실시간 모니터링: `logs/monitor_backend.py`
