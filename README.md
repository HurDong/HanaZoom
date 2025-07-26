# 🗺️ HanaZoom - 우리 동네 주식 맛집 지도

## 📝 프로젝트 소개

HanaZoom은 지도 기반으로 지역별 주식 투자 트렌드를 시각화하는 서비스입니다. 사용자들은 자신의 동네나 관심 있는 지역의 인기 주식을 확인하고, 지역 특성에 맞는 투자 정보를 얻을 수 있습니다.

## 🌟 주요 기능

- **지도 기반 시각화**: 카카오맵 기반으로 시/구/동 단위의 행정구역별 주식 정보 표시
- **확대/축소 기능**: 줌 레벨에 따라 행정구역 단위(시→구→동) 변경 및 데이터 표시
- **실시간 데이터**: 주식 정보 5분 주기 갱신
- **지역별 특성**: 강남구(부자동네), 판교 정자동(개발자/IT) 등 지역 특성 기반 주식 추천
- **커뮤니티**: 지역별 주식 관련 토론 및 정보 공유

## 🛠 기술 스택

### Frontend

- Next.js
- TypeScript
- TailwindCSS
- KakaoMap API
- WebSocket (실시간 데이터)

### Backend

- Spring Boot
- JPA/Hibernate
- MySQL

## 📦 프로젝트 구조

```
HanaZoom/
├── FE/                # 프론트엔드
│   ├── app/          # Next.js 페이지
│   ├── components/   # 재사용 컴포넌트
│   └── public/       # 정적 파일
├── BE/               # 백엔드
│   └── HanaZoom/    # Spring Boot 프로젝트
└── Infra/           # 인프라 설정
    └── mysql/       # DB 초기화 스크립트
```

## 🚀 시작하기

### Frontend 실행

```bash
cd FE
npm install
npm run dev
```

### Backend 실행

```bash
cd BE/HanaZoom
./gradlew bootRun
```

## 📊 데이터베이스 구조

- **regions**: 지역 정보 (시/구/동 계층구조)
- **stocks**: 주식 종목 정보
- **region_stocks**: 지역별 주식 인기도
- **posts/comments**: 커뮤니티 기능

## 🎨 UI/UX 가이드라인

- **색상**: 녹색 계열 (green-50 to emerald-100)
- **다크모드** 지원
- **반응형** 디자인

## 📝 API 구조

- `/api/regions`: 지역 정보
- `/api/stocks`: 주식 정보
- `/api/region-stocks`: 지역별 주식 데이터
- `/api/community`: 커뮤니티 기능

## 🔒 환경 변수

프로젝트 실행을 위해 다음 환경 변수가 필요합니다:

- `KAKAO_MAP_API_KEY`: 카카오맵 API 키
- `DB_URL`: 데이터베이스 URL
- `DB_USERNAME`: 데이터베이스 사용자명
- `DB_PASSWORD`: 데이터베이스 비밀번호

## 👥 팀원

- Frontend 개발자
- Backend 개발자
- UI/UX 디자이너
- 프로젝트 매니저

## 📄 라이선스

This project is licensed under the MIT License
