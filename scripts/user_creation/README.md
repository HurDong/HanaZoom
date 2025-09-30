# 청라1동(Region ID: 1229) 100명 사용자 생성 스크립트

이 스크립트는 HanaZoom 서비스의 Region ID 1229(청라1동)에 100명의 테스트 사용자 계정을 생성하는 데 사용됩니다.

## 📁 생성된 파일들

1. **`cheongra_users_jmeter.csv`** - JMeter에서 사용할 CSV 데이터 파일
2. **`cheongra_users_payloads.json`** - API 호출용 JSON 페이로드 파일
3. **`cheongra_users_insert.sql`** - 직접 SQL INSERT용 스크립트

## 🚀 사용 방법

### 1. Python 스크립트 실행

```bash
cd scripts/user_creation
python create_cheongra_users.py
```

### 2. JMeter를 사용한 성능 테스트

#### 사전 준비

- JMeter 설치
- HanaZoom 백엔드 서버 실행 (포트 8080)

#### JMeter 테스트 실행

1. JMeter GUI 실행
2. `cheongra_users_jmeter_test.jmx` 파일 열기
3. **BASE_URL** 변수 확인 및 수정
   - 현재: `http://localhost:8080`
   - 필요시 실제 서버 URL로 변경
4. **CSV_FILE_PATH** 변수 확인
   - 현재: `cheongra_users_jmeter.csv`
5. 테스트 실행 (Ctrl + R)

#### 테스트 설정

- **스레드 수**: 10개
- **Ramp-up 시간**: 30초
- **루프 수**: 100회 (총 100명 사용자 생성)
- **동시성**: 10명의 사용자가 동시에 API 호출

### 3. 직접 SQL INSERT 사용

데이터베이스에 직접 사용자 데이터를 삽입하려면:

```sql
-- cheongra_users_insert.sql 파일의 내용을 실행
-- 주의: 비밀번호는 해시화되어야 합니다
```

### 4. API 호출 스크립트 사용

```bash
# curl을 사용한 단일 API 호출 예시
curl -X POST http://localhost:8080/api/v1/members/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "테스트사용자",
    "phone": "010-1234-5678",
    "address": "인천광역시 서구 청라대로 123",
    "detailAddress": "1층 101호",
    "zonecode": "22743",
    "latitude": 37.5386,
    "longitude": 126.6626,
    "termsAgreed": true,
    "privacyAgreed": true,
    "marketingAgreed": false
  }'
```

## 📊 생성된 사용자 데이터

### 지역 정보

- **Region ID**: 1229
- **지역명**: 인천광역시 서구 청라1동
- **총 사용자 수**: 100명

### 사용자 패턴

- **이름**: 한국식 이름 (김, 이, 박 등의 성 + 민준, 서연 등의 이름)
- **이메일**: 랜덤 생성 (gmail.com, naver.com, daum.net 등)
- **전화번호**: 010-xxxx-xxxx 형식
- **주소**: 청라1동 내 실제 주소
- **좌표**: 청라1동 중심 좌표 (37.5386, 126.6626)

## ⚙️ 기술적 세부사항

### API 엔드포인트

```
POST /api/v1/members/signup
```

### 요청 본문 예시

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "address": "인천광역시 서구 청라대로 123",
  "detailAddress": "1층 101호",
  "zonecode": "22743",
  "latitude": 37.5386,
  "longitude": 126.6626,
  "termsAgreed": true,
  "privacyAgreed": true,
  "marketingAgreed": false
}
```

### 응답 예시

```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": null
}
```

## 🔧 커스터마이징

### 사용자 수 변경

`create_cheongra_users.py`에서 다음 부분 수정:

```python
for i in range(1, 101):  # 100명을 원하면 101로 변경
```

### 다른 지역 사용

`CHEONGRA_REGION_INFO` 딕셔너리 수정:

```python
CHEONGRA_REGION_INFO = {
    "region_id": 1234,  # 원하는 지역 ID
    "name": "다른동",
    "full_address": "다른 주소",
    "city": "다른시",
    "district": "다른구",
    "neighborhood": "다른동",
    "latitude": 37.XXXX,
    "longitude": 126.XXXX
}
```

## ⚠️ 주의사항

1. **중복 이메일**: 이미 존재하는 이메일로는 회원가입이 불가능합니다
2. **비밀번호 보안**: 실제 서비스에서는 생성된 비밀번호를 해시화해야 합니다
3. **서버 부하**: 100명의 동시 회원가입은 서버에 부하를 줄 수 있습니다
4. **데이터 정리**: 테스트 후 생성된 사용자 데이터를 정리하는 것을 권장합니다

## 🐛 문제 해결

### JMeter 실행 오류

- CSV 파일 경로 확인
- 서버 URL 확인
- 방화벽 설정 확인

### API 호출 실패

- 백엔드 서버가 실행 중인지 확인
- 데이터베이스 연결 확인
- 로그에서 상세 오류 메시지 확인

### 중복 이메일 오류

- 다른 이메일 도메인 사용
- 이미 생성된 사용자 정리

## 🌐 WebSocket 채팅 테스트

### 생성된 파일들

4. **`cheongra_login_only_test.jmx`** - 로그인 + 사용자 정보 조회 테스트 (WebSocket 없음, 플러그인 불필요)
5. **`cheongra_login_test_final.jmx`** - 로그인 + 사용자 정보 조회 테스트 (WebSocket 없음)
6. **`cheongra_websocket_chat_test.jmx`** - Peter Doornbosch WebSocket 플러그인용 채팅 테스트 (로그인 + 채팅)

### WebSocket 테스트 플러그인 설치

**Peter Doornbosch WebSocket 플러그인**을 사용합니다.

#### 방법 1: JMeter Plugins Manager (권장)

1. JMeter 실행
2. `Options` → `Plugins Manager` 메뉴 선택
3. "Available Plugins" 탭에서 "WebSocket Samplers by Peter Doornbosch" 검색
4. 체크박스 선택 후 "Apply Changes and Restart JMeter" 클릭

#### 방법 2: 수동 설치

1. 플러그인 다운로드: https://jmeter-plugins.org/files/packages/jpgc-wsc-2.4.zip
2. 압축 해제 후 `lib/ext/WebSocketSamplers-2.4.jar` 파일을
3. JMeter의 `lib/ext/` 폴더에 복사
4. JMeter 재시작

### WebSocket 테스트 시나리오

1. **로그인**: CSV 파일의 사용자 정보로 로그인
2. **JWT 토큰 추출**: 로그인 응답에서 JWT 토큰을 변수로 저장
3. **WebSocket 연결**: `/ws/chat` 엔드포인트에 연결
4. **채팅방 입장**: ENTER 타입 메시지 전송
5. **메시지 전송**: TALK 타입 메시지 전송

### 빠른 테스트 (플러그인 불필요)

**`cheongra_login_only_test.jmx`** 또는 **`cheongra_login_test_final.jmx`** 사용:

- **동시 사용자**: 1명 (테스트하기 쉽게 조정)
- **반복 횟수**: 1회 (테스트하기 쉽게 조정)
- **채팅방 ID**: 1229 (청라1동 Region ID)
- **지역 이름**: 청라1동

### WebSocket 테스트 (플러그인 필요)

**`cheongra_websocket_chat_test.jmx`** 사용:

- WebSocket 플러그인 설치 후 사용 가능
- 실제 WebSocket 연결 및 채팅 기능 테스트

### 실행 결과

- 로그인 성공/실패 확인 (`"success":true` 확인)
- JWT 토큰 추출 및 저장
- WebSocket 연결 상태 확인
- 채팅방 입장/메시지 전송 응답 확인
- 실시간 성능 지표 수집

## 📊 테스트 결과 해석

### 성공 케이스

- 모든 로그인 시도 성공 (200 OK)
- 응답에 `"success":true` 포함
- JWT 토큰 정상 추출 (`$.data.accessToken`)
- WebSocket 연결 성공
- 채팅방 입장 및 메시지 전송 성공

### 실패 케이스

- **401 Unauthorized**: JWT 토큰 문제 또는 인증 실패
- **Assertion Error**: 응답 데이터에 `"success":true` 없음
- **WebSocket 연결 실패**: 서버 WebSocket 엔드포인트 확인 필요
- **Connection Timeout**: 서버가 WebSocket 연결을 허용하는지 확인

## 🔧 고급 설정

### User Defined Variables

- `CHAT_ROOM_ID`: 테스트할 채팅방 ID (기본값: 1229 - 청라1동)
- `REGION_NAME`: 지역 이름 (기본값: 청라1동)
- `WS_PROTOCOL`: WebSocket 프로토콜 (ws/wss)
- `BASE_URL`: 서버 호스트 (기본값: localhost)
- `SERVER_PORT`: 서버 포트 (기본값: 8080)
- `CSV_FILE_PATH`: CSV 파일명 (상대 경로)
- `DEFAULT_JWT_TOKEN`: JWT 토큰 추출 실패 시 사용할 기본값

### 사용 방법

JMX 파일을 사용하려면:

1. **CSV 파일과 JMX 파일을 같은 디렉토리에 배치**
2. **JMeter에서 JMX 파일 열기**
3. **Ctrl + R**로 실행

#### 다른 환경에서 사용하기:

- **CSV 파일(`cheongra_users_jmeter.csv`)과 JMX 파일을 같은 디렉토리에 배치**
- **User Defined Variables에서 서버 설정 변경** (BASE_URL, SERVER_PORT 등)

### WebSocket 메시지 형식

#### 채팅방 입장:

```json
{
  "type": "ENTER",
  "roomId": "1229",
  "sender": "사용자명",
  "message": "청라1동 채팅방에 입장했습니다",
  "regionId": "1229",
  "regionName": "청라1동"
}
```

#### 메시지 전송:

```json
{
  "type": "TALK",
  "roomId": "1229",
  "sender": "사용자명",
  "message": "청라1동에서 보내는 테스트 메시지입니다.",
  "regionId": "1229",
  "regionName": "청라1동"
}
```
