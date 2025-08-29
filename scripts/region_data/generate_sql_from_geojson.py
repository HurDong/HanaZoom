import json
import os
import mysql.connector
from statistics import mean
from typing import Dict, Set, Tuple

# --- Configuration ---
INPUT_GEOJSON_FILE = 'HangJeongDong.geojson'
# 데이터베이스 연결 설정
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'hanazoom_user',
    'password': 'hanazoom1234!',
    'database': 'hanazoom'
}
# 추가: 원하는 지역(시/도)을 여기에 정의합니다.
TARGET_REGIONS = ['서울특별시', '경기도', '인천광역시']

def get_polygon_center(coordinates_list):
    """
    Calculates the center of a polygon or multipolygon by averaging its coordinates.
    This is a simplified approach and may not be perfectly accurate for complex shapes.
    """
    all_points = []
    
    # Handle both Polygon and MultiPolygon
    for polygon in coordinates_list:
        # If the polygon has holes, we only consider the outer boundary
        if isinstance(polygon[0][0], list):
             all_points.extend(polygon[0])
        else:
             all_points.extend(polygon)

    if not all_points:
        return 0, 0
    
    longitudes = [p[0] for p in all_points]
    latitudes = [p[1] for p in all_points]
    
    # Check for MultiPolygon case where coordinates might be nested one level deeper
    if isinstance(longitudes[0], list):
        longitudes = [item for sublist in longitudes for item in sublist]
        latitudes = [item for sublist in latitudes for item in sublist]

    return mean(latitudes), mean(longitudes)

def connect_to_database():
    """데이터베이스에 연결합니다."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ 데이터베이스 연결 성공")
        return connection
    except mysql.connector.Error as err:
        print(f"❌ 데이터베이스 연결 실패: {err}")
        return None

def insert_regions_to_db(connection, regions: Dict):
    """지역 데이터를 데이터베이스에 삽입합니다."""
    cursor = connection.cursor()
    
    try:
        # 외래키 제약조건 비활성화
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        print("🔓 외래키 제약조건 비활성화 완료")
        
        # 기존 데이터 삽입 (DELETE 대신 TRUNCATE 사용)
        cursor.execute("TRUNCATE TABLE regions")
        print("🗑️ 기존 지역 데이터 삭제 완료")
        
        # 외래키 제약조건 다시 활성화
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        print("🔒 외래키 제약조건 활성화 완료")
        
        # City 레벨 삽입 (좌표는 나중에 계산)
        city_ids = {}
        for city_name in regions['CITY'].keys():
            cursor.execute(
                "INSERT INTO regions (name, type, parent_id) VALUES (%s, %s, %s)",
                (city_name, 'CITY', None)
            )
            city_ids[city_name] = cursor.lastrowid
        
        # District 레벨 삽입 (좌표는 나중에 계산)
        district_ids = {}
        for district_key, district_data in regions['DISTRICT'].items():
            city_name = district_data['parent']
            district_name = district_key.split('_', 1)[1]
            city_id = city_ids[city_name]
            
            cursor.execute(
                "INSERT INTO regions (name, type, parent_id) VALUES (%s, %s, %s)",
                (district_name, 'DISTRICT', city_id)
            )
            district_ids[district_key] = cursor.lastrowid
        
        # Neighborhood 레벨 삽입 (좌표 저장)
        neighborhood_count = 0
        neighborhood_coordinates = {}  # 구/군별 좌표 수집용
        
        for neighborhood_key, neighborhood_data in regions['NEIGHBORHOOD'].items():
            district_key = neighborhood_data['parent']
            neighborhood_name = neighborhood_key.split('_', 2)[2]
            district_id = district_ids[district_key]
            
            # 좌표 정보가 있는 경우 추가
            if 'coordinates' in neighborhood_data:
                lat, lng = neighborhood_data['coordinates']
                cursor.execute(
                    "INSERT INTO regions (name, type, parent_id, latitude, longitude) VALUES (%s, %s, %s, %s, %s)",
                    (neighborhood_name, 'NEIGHBORHOOD', district_id, lat, lng)
                )
                
                # 구/군별 좌표 수집
                if district_key not in neighborhood_coordinates:
                    neighborhood_coordinates[district_key] = []
                neighborhood_coordinates[district_key].append((lat, lng))
            else:
                cursor.execute(
                    "INSERT INTO regions (name, type, parent_id) VALUES (%s, %s, %s)",
                    (neighborhood_name, 'NEIGHBORHOOD', district_id)
                )
            neighborhood_count += 1
        
        # 구/군 레벨 좌표 업데이트 (하위 동/읍/면의 평균 좌표)
        print("📍 구/군 레벨 좌표 계산 중...")
        for district_key, coordinates_list in neighborhood_coordinates.items():
            if coordinates_list:
                avg_lat = sum(coord[0] for coord in coordinates_list) / len(coordinates_list)
                avg_lng = sum(coord[1] for coord in coordinates_list) / len(coordinates_list)
                
                district_id = district_ids[district_key]
                cursor.execute(
                    "UPDATE regions SET latitude = %s, longitude = %s WHERE id = %s",
                    (avg_lat, avg_lng, district_id)
                )
        
        # 시/도 레벨 좌표 업데이트 (하위 구/군의 평균 좌표)
        print("📍 시/도 레벨 좌표 계산 중...")
        for city_name, city_data in regions['CITY'].items():
            city_coordinates = []
            for district_key in city_data['children']:
                if district_key in neighborhood_coordinates and neighborhood_coordinates[district_key]:
                    # 구/군의 평균 좌표 계산
                    district_coords = neighborhood_coordinates[district_key]
                    avg_lat = sum(coord[0] for coord in district_coords) / len(district_coords)
                    avg_lng = sum(coord[1] for coord in district_coords) / len(district_coords)
                    city_coordinates.append((avg_lat, avg_lng))
            
            if city_coordinates:
                avg_lat = sum(coord[0] for coord in city_coordinates) / len(city_coordinates)
                avg_lng = sum(coord[1] for coord in city_coordinates) / len(city_coordinates)
                
                city_id = city_ids[city_name]
                cursor.execute(
                    "UPDATE regions SET latitude = %s, longitude = %s WHERE id = %s",
                    (avg_lat, avg_lng, city_id)
                )
        
        connection.commit()
        print(f"✅ 지역 데이터 삽입 완료:")
        print(f"   - 시/도: {len(city_ids)}개")
        print(f"   - 구/군: {len(district_ids)}개")
        print(f"   - 동/읍/면: {neighborhood_count}개")
        print(f"   - 좌표가 저장된 동/읍/면: {len([c for c in neighborhood_coordinates.values() if c])}개")
        
    except mysql.connector.Error as err:
        print(f"❌ 데이터 삽입 실패: {err}")
        connection.rollback()
    finally:
        cursor.close()

def main():
    # --- File path setup ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_GEOJSON_FILE)

    # --- Check for input file ---
    if not os.path.exists(input_path):
        print(f"Error: '{INPUT_GEOJSON_FILE}' not found in '{script_dir}'.")
        print("Please download it from https://github.com/vuski/admdongkor and place it here.")
        return

    # --- Load GeoJSON data ---
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data['features'])} features from GeoJSON.")

    regions = {
        'CITY': {},
        'DISTRICT': {},
        'NEIGHBORHOOD': {}
    }

    # --- Process each feature (neighborhood level) ---
    # 수정: 지정된 지역의 데이터만 필터링합니다.
    filtered_features = [
        f for f in data['features']
        if f['properties'].get('adm_nm') and f['properties'].get('adm_nm').startswith(tuple(TARGET_REGIONS))
    ]
    
    print(f"Filtered down to {len(filtered_features)} features for the target regions: {', '.join(TARGET_REGIONS)}")

    for feature in filtered_features:
        props = feature['properties']
        full_name = props.get('adm_nm')
        
        if not full_name:
            continue

        parts = full_name.split(' ')
        if len(parts) < 2:
            continue

        # 1. City/Province
        city_name = parts[0]
        if city_name not in regions['CITY']:
            regions['CITY'][city_name] = {'children': set()}

        # 2. District
        district_name = parts[1]
        district_key = f"{city_name}_{district_name}"
        if district_key not in regions['DISTRICT']:
            regions['DISTRICT'][district_key] = {'parent': city_name, 'children': set()}
        regions['CITY'][city_name]['children'].add(district_key)

        # 3. Neighborhood (can be a single part or multiple)
        if len(parts) >= 3:
            neighborhood_name = ' '.join(parts[2:])
            neighborhood_key = f"{city_name}_{district_name}_{neighborhood_name}"
            
            if neighborhood_key not in regions['NEIGHBORHOOD']:
                # 좌표 계산
                coordinates = None
                if feature['geometry'] and feature['geometry']['type'] in ['Polygon', 'MultiPolygon']:
                    try:
                        coordinates = get_polygon_center(feature['geometry']['coordinates'])
                    except:
                        pass
                
                regions['NEIGHBORHOOD'][neighborhood_key] = {
                    'parent': district_key,
                    'coordinates': coordinates
                }
            regions['DISTRICT'][district_key]['children'].add(neighborhood_key)

    print("Processed and structured all filtered regions.")
    
    # 좌표가 계산된 동/읍/면 개수 출력
    coordinates_count = sum(1 for n in regions['NEIGHBORHOOD'].values() if n.get('coordinates'))
    print(f"Calculated center coordinates for {coordinates_count} neighborhoods.")

    # 데이터베이스에 직접 삽입
    connection = connect_to_database()
    if connection:
        try:
            insert_regions_to_db(connection, regions)
            print(f"\n🎉 총 {len(regions['CITY']) + len(regions['DISTRICT']) + len(regions['NEIGHBORHOOD'])}개 지역이 데이터베이스에 성공적으로 삽입되었습니다.")
        finally:
            connection.close()
            print("🔌 데이터베이스 연결 종료")
    else:
        print("❌ 데이터베이스 연결 실패로 인해 데이터 삽입을 건너뜁니다.")

if __name__ == "__main__":
    main() 