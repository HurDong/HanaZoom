#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
청라1동(Region ID: 1229) 100명 사용자 계정 생성 스크립트
JMeter에서 사용할 수 있는 CSV 파일과 API 호출용 JSON 파일을 생성합니다.
또한 실제 데이터베이스에 사용자 데이터를 직접 삽입할 수 있습니다.
"""

import json
import csv
import random
import string
import mysql.connector
import uuid
from datetime import datetime

# 데이터베이스 설정
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'hanazoom_user',
    'password': 'hanazoom1234!',
    'database': 'hanazoom'
}

# 청라1동 정보
CHEONGRA_REGION_INFO = {
    "region_id": 1229,
    "name": "청라1동",
    "full_address": "인천광역시 서구 청라1동",
    "city": "인천광역시",
    "district": "서구",
    "neighborhood": "청라1동",
    "latitude": 37.5386,
    "longitude": 126.6626
}

# 청라1동의 실제 주소 샘플
CHEONGRA_ADDRESSES = [
    "인천광역시 서구 청라대로 123",
    "인천광역시 서구 청라대로 456",
    "인천광역시 서구 청라대로 789",
    "인천광역시 서구 청라대로 101",
    "인천광역시 서구 청라대로 202",
    "인천광역시 서구 청라대로 303",
    "인천광역시 서구 청라대로 404",
    "인천광역시 서구 청라대로 505",
    "인천광역시 서구 청라대로 606",
    "인천광역시 서구 청라대로 707",
    "인천광역시 서구 청라대로 808",
    "인천광역시 서구 청라대로 909",
    "인천광역시 서구 청라대로 111",
    "인천광역시 서구 청라대로 222",
    "인천광역시 서구 청라대로 333",
    "인천광역시 서구 청라대로 444",
    "인천광역시 서구 청라대로 555",
    "인천광역시 서구 청라대로 666",
    "인천광역시 서구 청라대로 777",
    "인천광역시 서구 청라대로 888",
    "인천광역시 서구 청라대로 999"
]

# 한국식 이름 생성을 위한 성과 이름 리스트
KOREAN_SURNAMES = [
    "김", "이", "박", "최", "정", "강", "조", "윤", "장", "임",
    "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍"
]

KOREAN_NAMES = [
    "민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "준우", "준서",
    "건우", "현우", "민재", "지훈", "선우", "유준", "정우", "시훈", "지안", "승우",
    "지우", "수호", "준혁", "도현", "민성", "재원", "시원", "재윤", "성훈", "재민",
    "서연", "지우", "서윤", "지민", "수아", "하은", "예은", "채원", "하윤", "지유",
    "윤서", "채은", "수빈", "지아", "소율", "예원", "예린", "은서", "민서", "서현"
]

def generate_random_email():
    """랜덤 이메일 생성"""
    domains = ["gmail.com", "naver.com", "daum.net", "hanmail.net", "hotmail.com"]
    username = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{username}@{random.choice(domains)}"

def generate_random_phone():
    """랜덤 전화번호 생성 (한국식)"""
    middle = str(random.randint(100, 9999)).zfill(4)
    last = str(random.randint(1000, 9999)).zfill(4)
    return f"010-{middle}-{last}"

def generate_random_password():
    """랜덤 비밀번호 생성 (8자 이상, 영문+숫자)"""
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    return password

def generate_korean_name():
    """랜덤 한국식 이름 생성"""
    surname = random.choice(KOREAN_SURNAMES)
    name = random.choice(KOREAN_NAMES)
    return surname + name

def generate_user_data(user_id):
    """사용자 데이터 생성"""
    name = generate_korean_name()
    email = generate_random_email()
    password = generate_random_password()
    phone = generate_random_phone()
    address = random.choice(CHEONGRA_ADDRESSES)
    detail_address = f"{random.randint(1, 30)}층 {random.randint(101, 999)}호"

    return {
        "user_id": user_id,
        "name": name,
        "email": email,
        "password": password,
        "phone": phone,
        "address": address,
        "detail_address": detail_address,
        "zonecode": "22743",  # 청라1동 우편번호
        "latitude": 37.5386,  # 청라1동 중심 좌표
        "longitude": 126.6626,
        "terms_agreed": True,
        "privacy_agreed": True,
        "marketing_agreed": random.choice([True, False])
    }

def create_jmeter_csv(users_data):
    """JMeter용 CSV 파일 생성"""
    with open('cheongra_users_jmeter.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['email', 'password', 'name', 'phone', 'address', 'detail_address', 'zonecode', 'latitude', 'longitude']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for user_data in users_data:
            writer.writerow({
                'email': user_data['email'],
                'password': user_data['password'],
                'name': user_data['name'],
                'phone': user_data['phone'],
                'address': user_data['address'],
                'detail_address': user_data['detail_address'],
                'zonecode': user_data['zonecode'],
                'latitude': user_data['latitude'],
                'longitude': user_data['longitude']
            })

def create_api_payloads(users_data):
    """API 호출용 JSON 파일들 생성"""
    payloads = []
    for user_data in users_data:
        payload = {
            "email": user_data['email'],
            "password": user_data['password'],
            "name": user_data['name'],
            "phone": user_data['phone'],
            "address": user_data['address'],
            "detailAddress": user_data['detail_address'],
            "zonecode": user_data['zonecode'],
            "latitude": user_data['latitude'],
            "longitude": user_data['longitude'],
            "termsAgreed": user_data['terms_agreed'],
            "privacyAgreed": user_data['privacy_agreed'],
            "marketingAgreed": user_data['marketing_agreed']
        }
        payloads.append(payload)

    # JSON 파일로 저장
    with open('cheongra_users_payloads.json', 'w', encoding='utf-8') as f:
        json.dump(payloads, f, ensure_ascii=False, indent=2)

def create_sql_insert_script(users_data):
    """SQL INSERT 스크립트 생성"""
    sql_statements = []

    for user_data in users_data:
        # UUID 생성 (하이픈 제거)
        user_uuid = str(uuid.uuid4()).replace('-', '')

        sql = f"""
INSERT INTO members (
    id, email, password, name, phone, address, detail_address, zonecode,
    latitude, longitude, region_id, terms_agreed, privacy_agreed, marketing_agreed,
    created_at, last_login_at, login_type
) VALUES (
    UNHEX('{user_uuid}'),  -- 16바이트 BINARY UUID
    '{user_data['email']}',
    '{user_data['password']}',  -- 실제로는 해시화 필요
    '{user_data['name']}',
    '{user_data['phone']}',
    '{user_data['address']}',
    '{user_data['detail_address']}',
    '{user_data['zonecode']}',
    {user_data['latitude']},
    {user_data['longitude']},
    {CHEONGRA_REGION_INFO['region_id']},
    {1 if user_data['terms_agreed'] else 0},
    {1 if user_data['privacy_agreed'] else 0},
    {1 if user_data['marketing_agreed'] else 0},
    NOW(),
    NOW(),
    'EMAIL'
);
"""
        sql_statements.append(sql)

    with open('cheongra_users_insert.sql', 'w', encoding='utf-8') as f:
        f.writelines(sql_statements)

def insert_users_to_database(users_data):
    """실제 데이터베이스에 사용자 데이터 삽입"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        print("✅ 데이터베이스 연결 성공!")

        for i, user_data in enumerate(users_data, 1):
            try:
                # UUID 생성
                user_uuid = str(uuid.uuid4()).replace('-', '')

                # 비밀번호는 해시화하지 않고 그대로 사용 (테스트용)
                sql = """
                INSERT INTO members (
                    id, email, password, name, phone, address, detail_address, zonecode,
                    latitude, longitude, region_id, terms_agreed, privacy_agreed, marketing_agreed,
                    login_type, is_pb
                ) VALUES (
                    UNHEX(%s), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """

                values = (
                    user_uuid,  # 16바이트 BINARY UUID
                    user_data['email'],
                    user_data['password'],  # 실제 서비스에서는 해시화 필요
                    user_data['name'],
                    user_data['phone'],
                    user_data['address'],
                    user_data['detail_address'],
                    user_data['zonecode'],
                    user_data['latitude'],
                    user_data['longitude'],
                    CHEONGRA_REGION_INFO['region_id'],
                    user_data['terms_agreed'],
                    user_data['privacy_agreed'],
                    user_data['marketing_agreed'],
                    'EMAIL',
                    False  # is_pb - 일반 사용자는 PB가 아님
                )

                cursor.execute(sql, values)
                print(f"✅ 사용자 {i}/100 삽입 완료: {user_data['name']} ({user_data['email']})")

            except mysql.connector.Error as e:
                if "Duplicate entry" in str(e):
                    print(f"⚠️  중복 이메일로 인한 건너뜀: {user_data['email']}")
                else:
                    print(f"❌ 사용자 {i} 삽입 실패: {e}")
                    continue

        conn.commit()
        print(f"\n🎉 {cursor.rowcount}명의 사용자가 성공적으로 데이터베이스에 삽입되었습니다!")

    except mysql.connector.Error as e:
        print(f"❌ 데이터베이스 오류: {e}")
        return False

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

    return True

def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='청라1동 사용자 생성 스크립트')
    parser.add_argument('--insert-db', action='store_true',
                       help='데이터베이스에 직접 사용자 데이터 삽입')
    parser.add_argument('--no-files', action='store_true',
                       help='파일 생성 없이 데이터베이스에만 삽입')

    args = parser.parse_args()

    print("청라1동 사용자 생성 스크립트 시작...")
    print(f"대상 지역: {CHEONGRA_REGION_INFO['name']} (ID: {CHEONGRA_REGION_INFO['region_id']})")
    print("생성할 사용자 수: 100명")

    # 사용자 데이터 생성
    users_data = []
    for i in range(1, 101):
        user_data = generate_user_data(i)
        users_data.append(user_data)
        print(f"사용자 {i}/100 생성 중... ({user_data['name']}, {user_data['email']})")

    # 파일 생성 (옵션)
    if not args.no_files:
        create_jmeter_csv(users_data)
        create_api_payloads(users_data)
        create_sql_insert_script(users_data)

        print("\n✅ 파일 생성 완료:")
        print("1. cheongra_users_jmeter.csv - JMeter용 CSV 파일")
        print("2. cheongra_users_payloads.json - API 호출용 JSON 파일")
        print("3. cheongra_users_insert.sql - SQL INSERT 스크립트")

    # 데이터베이스에 직접 삽입 (옵션)
    if args.insert_db:
        print("\n🔄 데이터베이스에 사용자 데이터 삽입 중...")
        success = insert_users_to_database(users_data)
        if success:
            print("✅ 데이터베이스 삽입 완료!")
        else:
            print("❌ 데이터베이스 삽입 실패!")
            return
    else:
        print("\n💡 데이터베이스에 직접 삽입하려면 --insert-db 옵션을 사용하세요")
        print("   python create_cheongra_users.py --insert-db")

    print("\n📊 생성된 사용자 통계:")
    print(f"총 사용자 수: {len(users_data)}")
    print(f"지역: {CHEONGRA_REGION_INFO['full_address']}")
    print(f"평균 좌표: 위도 {CHEONGRA_REGION_INFO['latitude']}, 경도 {CHEONGRA_REGION_INFO['longitude']}")

if __name__ == "__main__":
    main()
